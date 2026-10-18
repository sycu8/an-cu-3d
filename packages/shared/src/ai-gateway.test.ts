import { describe, expect, it } from "vitest";
import {
  DEFAULT_MODELS,
  gatewayChatUrl,
  parseJsonFromLlm,
  type AiGatewayConfig,
} from "./ai-gateway.js";

describe("ai-gateway helpers", () => {
  const config: AiGatewayConfig = {
    accountId: "acc",
    gatewayId: "gw",
    token: "tok",
  };

  it("routes models by use-case", () => {
    expect(DEFAULT_MODELS.research).toContain("llama");
    expect(DEFAULT_MODELS.blog).toContain("llama");
    expect(DEFAULT_MODELS.image_gen).toContain("flux");
    expect(DEFAULT_MODELS.vision_2d).toContain("vision");
    expect(DEFAULT_MODELS.qa_factual).toContain("llama");
  });

  it("builds Workers AI gateway URLs", () => {
    const url = gatewayChatUrl(config, DEFAULT_MODELS.research);
    expect(url).toContain("gateway.ai.cloudflare.com/v1/acc/gw/workers-ai/");
    expect(url).toContain(encodeURIComponent(DEFAULT_MODELS.research));
  });

  it("parses JSON from fenced LLM output", () => {
    const parsed = parseJsonFromLlm('Here:\n```json\n{"ok":true,"issues":[]}\n```');
    expect(parsed).toEqual({ ok: true, issues: [] });
  });

  it("parses raw JSON objects", () => {
    expect(parseJsonFromLlm('noise {"a":1} trailing')).toEqual({ a: 1 });
  });

  it("rejects Workers AI models retired on 2026-05-30", () => {
    // Exact ids from the Workers AI deprecation notice. Match the full id so
    // active suffixes such as -fast are not treated as retired.
    const retired = new Set([
      "@cf/moonshotai/kimi-k2.5",
      "@hf/meta-llama/meta-llama-3-8b-instruct",
      "@cf/meta/llama-3-8b-instruct",
      "@cf/meta/llama-3-8b-instruct-awq",
      "@cf/meta/llama-3.1-8b-instruct",
      "@cf/meta/llama-3.1-8b-instruct-awq",
      "@cf/meta/llama-3.1-70b-instruct",
      "@cf/meta/llama-2-7b-chat-int8",
      "@cf/meta/llama-2-7b-chat-fp16",
      "@cf/mistral/mistral-7b-instruct-v0.1",
      "@hf/mistral/mistral-7b-instruct-v0.2",
      "@hf/google/gemma-7b-it",
      "@cf/google/gemma-3-12b-it",
      "@hf/nousresearch/hermes-2-pro-mistral-7b",
      "@cf/microsoft/phi-2",
      "@cf/defog/sqlcoder-7b-2",
      "@cf/unum/uform-gen2-qwen-500m",
      "@cf/facebook/bart-large-cnn",
    ]);

    const hits = Object.entries(DEFAULT_MODELS).filter(([, model]) => retired.has(model));
    expect(hits).toEqual([]);
    expect(DEFAULT_MODELS.blog).toBe("@cf/meta/llama-3.1-8b-instruct-fast");
    expect(DEFAULT_MODELS.qa_factual).toBe("@cf/meta/llama-3.1-8b-instruct-fast");
  });
});
