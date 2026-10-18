import { describe, expect, it } from "vitest";
import type { Env } from "../types";
import { activeAiPath, generateBlogDraft, runFactualQa } from "./pipeline";

const FP8 = "@cf/meta/llama-3.1-8b-instruct-fp8";
const projects = [{ name: "Celadon City", slug: "celadon-city", description: "Đô thị xanh" }];

const blogJson = JSON.stringify({
  title: "Tiêu đề từ model",
  excerpt: "Tóm tắt",
  bodyMarkdown: "## Bài viết đủ dài",
  seoTitle: "SEO",
  seoDescription: "Mô tả",
  coverPrompt: "ánh sáng tự nhiên",
});

type RunCall = { model: string; input: Record<string, unknown> };

function binding(handler: (model: string, input: Record<string, unknown>) => Promise<unknown>) {
  const calls: RunCall[] = [];
  const ai = {
    run: async (model: string, input: Record<string, unknown>) => {
      calls.push({ model, input });
      return handler(model, input);
    },
  };
  return { ai, calls };
}

describe("blog and fact-check AI routing", () => {
  it("calls Workers AI directly when gateway vars are unset", async () => {
    const { ai, calls } = binding(async () => ({ response: blogJson }));
    const env = { AI: ai } as unknown as Env;

    const draft = await generateBlogDraft(env, projects);

    expect(activeAiPath(env)).toBe("workers_ai");
    expect(calls).toHaveLength(1);
    expect(calls[0]?.model).toBe(FP8);
    expect(calls[0]?.input.max_tokens).toBe(2048);
    expect(draft.title).toBe("Tiêu đề từ model");
    expect(draft.chat?.source).toBe("workers_ai");

    calls.length = 0;
    const qaAi = binding(async () => ({
      response: JSON.stringify({ ok: false, issues: ["giá chưa có nguồn"] }),
    }));
    const qa = await runFactualQa({ AI: qaAi.ai } as unknown as Env, "giá 5 tỷ", "không có giá");
    expect(qaAi.calls[0]?.model).toBe(FP8);
    expect(qaAi.calls[0]?.input.max_tokens).toBe(2048);
    expect(qa).toMatchObject({ ok: false, source: "workers_ai", issues: ["giá chưa có nguồn"] });
  });

  it("uses AI Gateway when it is configured and does not call the binding", async () => {
    const { ai, calls } = binding(async () => ({ response: "should not run" }));
    const env = {
      AI: ai,
      AI_GATEWAY_ACCOUNT_ID: "acc",
      AI_GATEWAY_ID: "gw",
    } as unknown as Env;
    const originalFetch = globalThis.fetch;
    const urls: string[] = [];
    const bodies: { max_tokens?: number }[] = [];
    globalThis.fetch = async (input, init) => {
      urls.push(String(input));
      bodies.push(JSON.parse(String(init?.body)) as { max_tokens?: number });
      const blog = urls.length === 1;
      const response = blog
        ? blogJson
        : JSON.stringify({ ok: true, issues: [] });
      return new Response(JSON.stringify({ result: { response } }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    };

    try {
      const draft = await generateBlogDraft(env, projects);
      const qa = await runFactualQa(env, "diện tích 70m2", "nguồn không nêu diện tích");
      expect(draft.title).toBe("Tiêu đề từ model");
      expect(draft.chat?.source).toBe("ai_gateway");
      expect(qa).toMatchObject({ ok: true, source: "ai_gateway", issues: [] });
    } finally {
      globalThis.fetch = originalFetch;
    }

    expect(activeAiPath(env)).toBe("ai_gateway");
    expect(calls).toHaveLength(0);
    expect(urls).toHaveLength(2);
    for (const url of urls) {
      expect(url).toContain("gateway.ai.cloudflare.com/v1/acc/gw/workers-ai/");
      expect(url).toContain(encodeURIComponent(FP8));
    }
    expect(bodies.every((body) => body.max_tokens === 2048)).toBe(true);
  });

  it("returns a generic fact-check error with no model id", async () => {
    const leaked = `inference failed for ${FP8}`;
    const direct = await runFactualQa(
      {
        AI: {
          run: async () => {
            throw new Error(leaked);
          },
        },
      } as unknown as Env,
      "bàn giao 2026",
      "không có lịch",
    );
    expect(direct).toEqual({ ok: false, issues: ["AI request failed"], source: "error" });
    expect(JSON.stringify(direct)).not.toContain(FP8);
    expect(JSON.stringify(direct)).not.toContain("@cf/");

    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => new Response(leaked, { status: 502 });
    try {
      const viaGateway = await runFactualQa(
        { AI_GATEWAY_ACCOUNT_ID: "acc", AI_GATEWAY_ID: "gw" } as unknown as Env,
        "bàn giao 2026",
        "không có lịch",
      );
      expect(viaGateway).toEqual({ ok: false, issues: ["AI request failed"], source: "error" });
      expect(JSON.stringify(viaGateway)).not.toContain(FP8);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("keeps the template and skip message when no AI path is configured", async () => {
    const draft = await generateBlogDraft({} as unknown as Env, projects);
    expect(draft.title).toContain("Celadon City");
    expect(draft.chat).toBeUndefined();

    const qa = await runFactualQa({} as unknown as Env, "claim", "source");
    expect(qa).toMatchObject({
      ok: true,
      source: "fallback",
      raw: "AI not configured — skipped factual QA",
    });
  });
});
