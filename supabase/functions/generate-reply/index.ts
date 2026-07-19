// PULI OS — AI customer reply drafts.
// Called from the dashboard with the signed-in user's JWT; all database
// access runs through RLS as that user. Requires the OPENAI_API_KEY
// secret (`supabase secrets set OPENAI_API_KEY=...`).
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  createOpenAIResponse,
  getOutputText,
  getRefusal,
  OPENAI_MODEL,
} from "../_shared/openai.ts";

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

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return json(401, { error: "Missing Authorization header" });
  }

  // User-scoped client: every query below is subject to RLS.
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return json(401, { error: "Invalid or expired session" });
  }

  let inquiryId: string | undefined;
  try {
    const body = await req.json();
    inquiryId = body.inquiry_id;
  } catch {
    return json(400, { error: "Request body must be JSON" });
  }
  if (!inquiryId) {
    return json(400, { error: "inquiry_id is required" });
  }

  const { data: inquiry, error: inquiryError } = await supabase
    .from("inquiries")
    .select("*, contacts(full_name, email), companies(name, email, phone)")
    .eq("id", inquiryId)
    .maybeSingle();

  if (inquiryError) {
    return json(500, { error: `Failed to load inquiry: ${inquiryError.message}` });
  }
  if (!inquiry) {
    return json(404, { error: "Inquiry not found" });
  }

  const openAIKey = Deno.env.get("OPENAI_API_KEY");
  if (!openAIKey) {
    return json(503, {
      error:
        "AI is not configured. Set the OPENAI_API_KEY secret on your Supabase project (Dashboard → Edge Functions → Secrets).",
    });
  }

  const contactName = inquiry.contacts?.full_name ?? "customer";
  const companyName = inquiry.companies?.name ?? "our company";

  const context = [
    `Company: ${companyName}`,
    `Customer: ${contactName}`,
    `Inquiry subject: ${inquiry.subject}`,
    inquiry.raw_content ? `Original message:\n${inquiry.raw_content}` : null,
    inquiry.extracted_data
      ? `Extracted data:\n${JSON.stringify(inquiry.extracted_data, null, 2)}`
      : null,
  ]
    .filter(Boolean)
    .join("\n\n");

  try {
    const response = await createOpenAIResponse(openAIKey, {
      model: OPENAI_MODEL,
      max_output_tokens: 2048,
      reasoning: { effort: "low" },
      instructions: `You draft professional email replies on behalf of ${companyName}, a manufacturer of windows, doors and aluminium systems. Rules:
- Reply in the same language the customer wrote in.
- Greet the customer by name when known.
- Confirm what they asked for, referencing the extracted details.
- Ask specifically for any missing information needed to prepare a quote (dimensions, quantities, materials, location).
- Never invent prices, delivery dates or commitments.
- Close politely on behalf of ${companyName}.
- Output only the email body text — no subject line, no commentary.`,
      input: context,
    });

    if (getRefusal(response)) {
      return json(502, { error: "The AI declined to draft this reply." });
    }

    const draft = getOutputText(response);
    if (!draft) {
      return json(502, { error: "The AI returned an empty draft." });
    }

    const { error: updateError } = await supabase
      .from("inquiries")
      .update({ ai_reply_draft: draft })
      .eq("id", inquiryId);

    if (updateError) {
      return json(500, { error: `Failed to save draft: ${updateError.message}` });
    }

    return json(200, { ok: true, draft });
  } catch (error) {
    console.error("Reply generation failed:", error);
    return json(502, { error: "AI request failed. Try again." });
  }
});
