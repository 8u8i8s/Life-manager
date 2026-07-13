// PULI OS — AI chat over company data.
// Runs under the caller's JWT: every tool query goes through RLS, so the
// assistant can only ever see the caller's own company. Requires the
// ANTHROPIC_API_KEY secret.
import { createClient, SupabaseClient } from "npm:@supabase/supabase-js@2";
import Anthropic from "npm:@anthropic-ai/sdk";

const MAX_TOOL_ITERATIONS = 6;

// The function is called directly from the browser, so CORS is required.
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const TOOLS: Anthropic.Tool[] = [
  {
    name: "search_inquiries",
    description:
      "Search the company's customer inquiries. Call this when the question concerns inquiries, dopyty, incoming emails or customer requests.",
    input_schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        query: {
          type: "string",
          description: "Text matched against subject and content. Omit to list recent.",
        },
        status: {
          type: "string",
          enum: ["new", "processing", "extracted", "quoted", "replied", "closed"],
        },
        limit: { type: "integer", description: "Max rows, default 10, max 25" },
      },
      required: [],
    },
  },
  {
    name: "search_quotes",
    description:
      "Search the company's price quotes (cenové ponuky) including item totals.",
    input_schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        status: {
          type: "string",
          enum: ["draft", "sent", "accepted", "rejected", "expired"],
        },
        limit: { type: "integer", description: "Max rows, default 10, max 25" },
      },
      required: [],
    },
  },
  {
    name: "search_orders",
    description:
      "Search the company's orders (objednávky) with totals and delivery dates.",
    input_schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        status: {
          type: "string",
          enum: ["confirmed", "in_production", "ready", "delivered", "cancelled"],
        },
        limit: { type: "integer", description: "Max rows, default 10, max 25" },
      },
      required: [],
    },
  },
  {
    name: "search_contacts",
    description: "Search the company's contacts (customers and partners).",
    input_schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        query: {
          type: "string",
          description: "Matched against name, email and organization. Omit to list recent.",
        },
        limit: { type: "integer", description: "Max rows, default 10, max 25" },
      },
      required: [],
    },
  },
  {
    name: "get_company_stats",
    description:
      "Get aggregate counts: inquiries, quotes and orders per status, and total contacts. Call this for overview or 'how many' questions.",
    input_schema: {
      type: "object",
      additionalProperties: false,
      properties: {},
      required: [],
    },
  },
];

function clampLimit(limit: unknown): number {
  const value = typeof limit === "number" ? limit : 10;
  return Math.min(Math.max(Math.trunc(value), 1), 25);
}

async function runTool(
  supabase: SupabaseClient,
  name: string,
  input: Record<string, unknown>
): Promise<string> {
  switch (name) {
    case "search_inquiries": {
      let query = supabase
        .from("inquiries")
        .select("id, subject, status, source, received_at, ai_summary, contacts(full_name, email)")
        .order("received_at", { ascending: false })
        .limit(clampLimit(input.limit));
      if (typeof input.status === "string") query = query.eq("status", input.status);
      if (typeof input.query === "string" && input.query.trim()) {
        const term = input.query.trim().replaceAll("%", "").replaceAll(",", " ");
        query = query.or(`subject.ilike.%${term}%,raw_content.ilike.%${term}%`);
      }
      const { data, error } = await query;
      if (error) return `Error: ${error.message}`;
      return JSON.stringify(data);
    }
    case "search_quotes": {
      let query = supabase
        .from("quotes")
        .select("id, quote_number, status, vat_rate, valid_until, created_at, contacts(full_name), quote_items(quantity, unit_price)")
        .order("created_at", { ascending: false })
        .limit(clampLimit(input.limit));
      if (typeof input.status === "string") query = query.eq("status", input.status);
      const { data, error } = await query;
      if (error) return `Error: ${error.message}`;
      const rows = (data ?? []).map(({ quote_items, ...rest }) => {
        const subtotal = (quote_items ?? []).reduce(
          (sum: number, item: { quantity: number; unit_price: number }) =>
            sum + item.quantity * item.unit_price,
          0
        );
        return { ...rest, subtotal_excl_vat: Math.round(subtotal * 100) / 100 };
      });
      return JSON.stringify(rows);
    }
    case "search_orders": {
      let query = supabase
        .from("orders")
        .select("id, order_number, status, total, currency, delivery_date, created_at, contacts(full_name)")
        .order("created_at", { ascending: false })
        .limit(clampLimit(input.limit));
      if (typeof input.status === "string") query = query.eq("status", input.status);
      const { data, error } = await query;
      if (error) return `Error: ${error.message}`;
      return JSON.stringify(data);
    }
    case "search_contacts": {
      let query = supabase
        .from("contacts")
        .select("id, full_name, email, phone, organization, created_at")
        .order("created_at", { ascending: false })
        .limit(clampLimit(input.limit));
      if (typeof input.query === "string" && input.query.trim()) {
        const term = input.query.trim().replaceAll("%", "").replaceAll(",", " ");
        query = query.or(
          `full_name.ilike.%${term}%,email.ilike.%${term}%,organization.ilike.%${term}%`
        );
      }
      const { data, error } = await query;
      if (error) return `Error: ${error.message}`;
      return JSON.stringify(data);
    }
    case "get_company_stats": {
      const [inquiries, quotes, orders, contacts] = await Promise.all([
        supabase.from("inquiries").select("status"),
        supabase.from("quotes").select("status"),
        supabase.from("orders").select("status, total"),
        supabase.from("contacts").select("id", { count: "exact", head: true }),
      ]);
      const countBy = (rows: { status: string }[] | null) =>
        (rows ?? []).reduce<Record<string, number>>((acc, row) => {
          acc[row.status] = (acc[row.status] ?? 0) + 1;
          return acc;
        }, {});
      return JSON.stringify({
        inquiries_by_status: countBy(inquiries.data),
        quotes_by_status: countBy(quotes.data),
        orders_by_status: countBy(orders.data),
        orders_total_value: (orders.data ?? []).reduce(
          (sum, row) => sum + Number(row.total ?? 0),
          0
        ),
        total_contacts: contacts.count ?? 0,
      });
    }
    default:
      return `Unknown tool: ${name}`;
  }
}

function json(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return json(401, { error: "Missing Authorization header" });
  }

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

  const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!anthropicKey) {
    return json(503, {
      error:
        "AI is not configured. Set the ANTHROPIC_API_KEY secret on your Supabase project (Dashboard → Edge Functions → Secrets).",
    });
  }

  let incoming: { messages?: { role: string; content: string }[] };
  try {
    incoming = await req.json();
  } catch {
    return json(400, { error: "Request body must be JSON" });
  }

  const history = (incoming.messages ?? [])
    .filter(
      (message) =>
        (message.role === "user" || message.role === "assistant") &&
        typeof message.content === "string" &&
        message.content.trim() !== ""
    )
    .slice(-20);

  if (history.length === 0 || history[history.length - 1].role !== "user") {
    return json(400, { error: "messages must end with a user message" });
  }

  const anthropic = new Anthropic({ apiKey: anthropicKey });
  const messages: Anthropic.MessageParam[] = history.map((message) => ({
    role: message.role as "user" | "assistant",
    content: message.content,
  }));

  try {
    for (let iteration = 0; iteration < MAX_TOOL_ITERATIONS; iteration++) {
      const response = await anthropic.messages.create({
        model: "claude-opus-4-8",
        max_tokens: 4096,
        system:
          "You are the PULI OS assistant for a manufacturer of windows, doors and aluminium systems. Answer questions about the company's inquiries, quotes, orders and contacts using the tools — never invent data. Reply in the language the user writes in. Amounts are in EUR unless stated otherwise. Be concise and lead with the answer.",
        tools: TOOLS,
        messages,
      });

      if (response.stop_reason === "refusal") {
        return json(200, { reply: "I can't help with that request." });
      }

      if (response.stop_reason !== "tool_use") {
        const text = response.content
          .filter((block) => block.type === "text")
          .map((block) => (block as Anthropic.TextBlock).text)
          .join("\n");
        return json(200, { reply: text });
      }

      messages.push({ role: "assistant", content: response.content });
      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const block of response.content) {
        if (block.type === "tool_use") {
          const result = await runTool(
            supabase,
            block.name,
            block.input as Record<string, unknown>
          );
          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: result,
          });
        }
      }
      messages.push({ role: "user", content: toolResults });
    }

    return json(200, {
      reply:
        "I couldn't finish answering within the allowed number of data lookups. Try a more specific question.",
    });
  } catch (error) {
    console.error("AI chat failed:", error);
    return json(502, { error: "AI request failed. Try again." });
  }
});
