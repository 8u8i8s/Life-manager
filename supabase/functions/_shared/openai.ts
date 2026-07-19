// Shared OpenAI Responses API helpers for PULI OS Edge Functions.

export const OPENAI_MODEL =
  Deno.env.get("OPENAI_MODEL")?.trim() || "gpt-5.6-sol";

export type OpenAIOutputItem = {
  type: string;
  id?: string;
  role?: string;
  name?: string;
  call_id?: string;
  arguments?: string;
  content?: Array<{
    type: string;
    text?: string;
    refusal?: string;
  }>;
  [key: string]: unknown;
};

export type OpenAIResponse = {
  id: string;
  status?: string;
  output: OpenAIOutputItem[];
};

export async function createOpenAIResponse(
  apiKey: string,
  body: Record<string, unknown>
): Promise<OpenAIResponse> {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ store: false, ...body }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`OpenAI API error ${response.status}: ${detail}`);
  }

  return (await response.json()) as OpenAIResponse;
}

export function getOutputText(response: OpenAIResponse): string {
  return response.output
    .filter((item) => item.type === "message")
    .flatMap((item) => item.content ?? [])
    .filter((content) => content.type === "output_text")
    .map((content) => content.text ?? "")
    .join("\n")
    .trim();
}

export function getRefusal(response: OpenAIResponse): string | null {
  const refusal = response.output
    .filter((item) => item.type === "message")
    .flatMap((item) => item.content ?? [])
    .find((content) => content.type === "refusal");

  return refusal?.refusal ?? null;
}
