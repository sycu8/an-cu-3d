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
});
