// PULI OS — inbound inquiry ingestion.
// Called by automation (n8n) with a per-company ingest token. Upserts the
// contact, stores the inquiry and runs AI extraction when an OpenAI API
// key is configured (`supabase secrets set OPENAI_API_KEY=...`).
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  createOpenAIResponse,
  getOutputText,
  OPENAI_MODEL,
} from "../_shared/openai.ts";

type IngestPayload = {
  from_email?: string;
  from_name?: string;
  subject?: string;
  body?: string;
  received_at?: string;
};

const EXTRACTION_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "summary",
    "language",
    "customer_name",
    "customer_phone",
    "customer_organization",
    "product_type",
    "location",
    "deadline",
    "items",
    "missing_information",
  ],
  properties: {
    summary: {
      type: "string",
      description:
        "Two-sentence summary of what the customer wants, in English.",
    },
    language: {
      type: "string",
      description: "ISO 639-1 code of the language the customer wrote in.",
    },
    customer_name: { type: ["string", "null"] },
    customer_phone: { type: ["string", "null"] },
    customer_organization: { type: ["string", "null"] },
    product_type: {
      type: ["string", "null"],
      description: "e.g. PVC windows, aluminium doors, facade system",
    },
    location: {
      type: ["string", "null"],
      description: "Delivery or installation location if mentioned.",
    },
    deadline: {
      type: ["string", "null"],
      description: "Requested deadline or timeframe if mentioned.",
    },
    items: {
      type: "array",
      description: "Individual products or positions requested.",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["description", "quantity", "width_mm", "height_mm"],
        properties: {
          description: { type: "string" },
          quantity: { type: ["integer", "null"] },
          width_mm: { type: ["integer", "null"] },
          height_mm: { type: ["integer", "null"] },
        },
      },
    },
    missing_information: {
      type: "array",
      items: { type: "string" },
      description:
        "Details the company must ask the customer for before quoting.",
    },
  },
} as const;

function json(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  const ingestToken = req.headers.get("x-ingest-token");
  if (!ingestToken) {
    return json(401, { error: "Missing x-ingest-token header" });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select("id, name")
    .eq("ingest_token", ingestToken)
    .maybeSingle();

  if (companyError) {
    return json(500, { error: `Company lookup failed: ${companyError.message}` });
  }
  if (!company) {
    return json(401, { error: "Invalid ingest token" });
  }

  let payload: IngestPayload;
  try {
    payload = await req.json();
  } catch {
    return json(400, { error: "Request body must be JSON" });
  }

  const fromEmail = payload.from_email?.trim().toLowerCase() || null;
  const fromName = payload.from_name?.trim() || null;
  const subject = payload.subject?.trim() || "(no subject)";
  const body = payload.body?.trim() || null;
  const receivedAt = payload.received_at ?? new Date().toISOString();

  if (!fromEmail && !body) {
    return json(400, {
      error: "Payload must contain at least from_email or body",
    });
  }

  // Upsert the contact by email within the company.
  let contactId: string | null = null;
  if (fromEmail) {
    const { data: existing } = await supabase
      .from("contacts")
      .select("id")
      .eq("company_id", company.id)
      .eq("email", fromEmail)
      .maybeSingle();

    if (existing) {
      contactId = existing.id;
    } else {
      const { data: created, error: contactError } = await supabase
        .from("contacts")
        .insert({
          company_id: company.id,
          full_name: fromName ?? fromEmail,
          email: fromEmail,
        })
        .select("id")
        .single();

      if (contactError) {
        return json(500, {
          error: `Failed to create contact: ${contactError.message}`,
        });
      }
      contactId = created.id;
    }
  }

  const { data: inquiry, error: inquiryError } = await supabase
    .from("inquiries")
    .insert({
      company_id: company.id,
      contact_id: contactId,
      source: "email",
      status: "new",
      subject,
      raw_content: body,
      received_at: receivedAt,
    })
    .select("id")
    .single();

  if (inquiryError) {
    return json(500, {
      error: `Failed to create inquiry: ${inquiryError.message}`,
    });
  }

  // AI extraction — optional: the inquiry is already stored; extraction
  // failures must never lose the email.
  let extracted = false;
  const openAIKey = Deno.env.get("OPENAI_API_KEY");
  if (openAIKey && body) {
    try {
      const response = await createOpenAIResponse(openAIKey, {
        model: OPENAI_MODEL,
        max_output_tokens: 4096,
        instructions:
          "You extract structured data from customer inquiries sent to a manufacturer of windows, doors and aluminium systems. Extract only what is actually stated; use null for anything not mentioned.",
        text: {
          format: {
            type: "json_schema",
            name: "inquiry_extraction",
            strict: true,
            schema: EXTRACTION_SCHEMA,
          },
        },
        input: `Subject: ${subject}\n\nEmail body:\n${body}`,
      });

      const output = getOutputText(response);
      if (output) {
        const data = JSON.parse(output);
        const { error: updateError } = await supabase
          .from("inquiries")
          .update({
            extracted_data: data,
            ai_summary: data.summary ?? null,
            status: "extracted",
          })
          .eq("id", inquiry.id);
        extracted = !updateError;
      }
    } catch (error) {
      console.error("AI extraction failed:", error);
    }
  }

  return json(200, {
    ok: true,
    inquiry_id: inquiry.id,
    contact_id: contactId,
    extracted,
  });
});
