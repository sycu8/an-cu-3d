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



export type ImageResult = {
  bytes?: Uint8Array;
  model: string;
  useCase: AiUseCase;
  latencyMs: number;
  source: "ai_gateway" | "workers_ai" | "fallback";
  note?: string;
};

/** Generate or edit an image through AI Gateway Workers AI path when configured. */
export async function imageViaGateway(
  config: AiGatewayConfig,
  useCase: "image_gen" | "image_edit",
  input: { prompt: string; imageBase64?: string },
  options?: { model?: string },
): Promise<ImageResult> {
  const started = Date.now();
  const model = options?.model ?? DEFAULT_MODELS[useCase];
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (config.token) headers.Authorization = `Bearer ${config.token}`;

  const body: Record<string, unknown> = { prompt: input.prompt };
  if (useCase === "image_edit" && input.imageBase64) {
    body.image = input.imageBase64;
    body.strength = 0.75;
  }

  const res = await fetch(gatewayChatUrl(config, model), {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`AI Gateway ${useCase} failed (${res.status}): ${errText.slice(0, 200)}`);
  }

  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("image/") || contentType.includes("octet-stream")) {
    return {
      bytes: new Uint8Array(await res.arrayBuffer()),
      model,
      useCase,
      latencyMs: Date.now() - started,
      source: "ai_gateway",
    };
  }

  const data = (await res.json()) as { result?: { image?: string }; image?: string };
  const b64 = data.result?.image ?? data.image;
  if (b64) {
    const binary = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    return {
      bytes: binary,
      model,
      useCase,
      latencyMs: Date.now() - started,
      source: "ai_gateway",
    };
  }

  return {
    model,
    useCase,
    latencyMs: Date.now() - started,
    source: "ai_gateway",
    note: "No image bytes in gateway response",
  };
}

/** Cheap factual QA — flag claims not grounded in provided sources. */
export async function factualQaViaGateway(
  config: AiGatewayConfig,
  claims: string,
  sources: string,
): Promise<ChatResult> {
  return chatViaGateway(config, "qa_factual", [
    {
      role: "system",
      content:
        "You are a factual QA checker for Vietnamese real-estate copy. Flag any price/area/handover claim not clearly supported by sources. Reply JSON {ok:boolean, issues:string[]}.",
    },
    {
      role: "user",
      content: `SOURCES:\n${sources}\n\nCLAIMS:\n${claims}`,
    },
  ]);
}
