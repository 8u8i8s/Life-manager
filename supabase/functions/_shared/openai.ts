// Shared OpenAI Responses API helpers for PULI OS Edge Functions.

export const OPENAI_MODEL =
  Deno.env.get("OPENAI_MODEL")?.trim() || "gpt-4.1-mini";

export class OpenAIAPIError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string | null
  ) {
    super(`OpenAI API request failed (${status}${code ? `, ${code}` : ""})`);
  }
}

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
    const detail = await response.json().catch(() => null);
    const code =
      typeof detail?.error?.code === "string" ? detail.error.code : null;
    throw new OpenAIAPIError(response.status, code);
  }

  return (await response.json()) as OpenAIResponse;
}

export function getOpenAIErrorMessage(error: unknown): string {
  if (!(error instanceof OpenAIAPIError)) {
    return "AI request failed. Try again.";
  }

  if (error.status === 401 || error.code === "invalid_api_key") {
    return "OpenAI rejected the API key. Check OPENAI_API_KEY in Supabase Secrets.";
  }
  if (error.code === "insufficient_quota") {
    return "OpenAI API quota is unavailable. Add API billing or credits in the OpenAI Platform.";
  }
  if (error.status === 429) {
    return "OpenAI rate limit reached. Wait briefly and try again.";
  }
  if (error.status === 403 || error.status === 404) {
    return "The configured OpenAI model is unavailable for this API project. Check OPENAI_MODEL in Supabase Secrets.";
  }

  return `OpenAI request failed (${error.status}${
    error.code ? `, ${error.code}` : ""
  }).`;
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
