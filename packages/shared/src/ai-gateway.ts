/** Cloudflare AI Gateway — multi-model routing by use-case. */

export type AiUseCase =
  | "research"
  | "blog"
  | "image_gen"
  | "image_edit"
  | "vision_2d"
  | "qa_factual";

export type AiGatewayConfig = {
  accountId: string;
  gatewayId: string;
  token?: string;
};

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type ChatResult = {
  text: string;
  model: string;
  useCase: AiUseCase;
  latencyMs: number;
  source: "ai_gateway" | "workers_ai" | "fallback";
};

export const DEFAULT_MODELS: Record<AiUseCase, string> = {
  research: "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
  blog: "@cf/meta/llama-3.1-8b-instruct",
  image_gen: "@cf/black-forest-labs/flux-1-schnell",
  image_edit: "@cf/runwayml/stable-diffusion-v1-5-img2img",
  vision_2d: "@cf/meta/llama-3.2-11b-vision-instruct",
  qa_factual: "@cf/meta/llama-3.1-8b-instruct",
};

export function gatewayChatUrl(config: AiGatewayConfig, model: string): string {
  return `https://gateway.ai.cloudflare.com/v1/${config.accountId}/${config.gatewayId}/workers-ai/${encodeURIComponent(model)}`;
}

export function gatewayOpenAiUrl(config: AiGatewayConfig): string {
  return `https://gateway.ai.cloudflare.com/v1/${config.accountId}/${config.gatewayId}/compat/chat/completions`;
}

export async function chatViaGateway(
  config: AiGatewayConfig,
  useCase: AiUseCase,
  messages: ChatMessage[],
  options?: { model?: string; maxTokens?: number },
): Promise<ChatResult> {
  const started = Date.now();
  const model = options?.model ?? DEFAULT_MODELS[useCase];
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (config.token) headers.Authorization = `Bearer ${config.token}`;

  const res = await fetch(gatewayChatUrl(config, model), {
    method: "POST",
    headers,
    body: JSON.stringify({ messages, max_tokens: options?.maxTokens ?? 2048 }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`AI Gateway ${useCase} failed (${res.status}): ${errText.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    result?: { response?: string };
    response?: string;
    choices?: { message?: { content?: string } }[];
  };

  const text =
    data.result?.response ??
    data.response ??
    data.choices?.[0]?.message?.content ??
    "";

  return {
    text: String(text).trim(),
    model,
    useCase,
    latencyMs: Date.now() - started,
    source: "ai_gateway",
  };
}

export async function chatViaWorkersAi(
  ai: { run: (model: string, input: Record<string, unknown>) => Promise<unknown> },
  useCase: AiUseCase,
  messages: ChatMessage[],
  options?: { model?: string },
): Promise<ChatResult> {
  const started = Date.now();
  const model = options?.model ?? DEFAULT_MODELS[useCase];
  const result = (await ai.run(model, { messages })) as { response?: string };
  return {
    text: String(result.response ?? "").trim(),
    model,
    useCase,
    latencyMs: Date.now() - started,
    source: "workers_ai",
  };
}

export function parseJsonFromLlm(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1] : text;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start >= 0 && end > start) return JSON.parse(raw.slice(start, end + 1));
  throw new Error("No JSON object in model response");
}
