import {
  chatViaGateway,
  factualQaViaGateway,
  imageViaGateway,
  parseJsonFromLlm,
  slugifyProjectName,
  type AiGatewayConfig,
  type ChatResult,
} from "@ancu/shared";
import { crawlSeedForSlug, PROJECT_CRAWL_SEEDS } from "../../data/project-crawl-seeds";
import type { Env } from "../types";
import type { SynthesizedProject } from "../db/projects";

const KNOWN_SOURCES: Record<
  string,
  { urls: { label: string; url: string }[]; hints: Partial<SynthesizedProject> }
> = {
  "eaton-park": {
    urls: [
      { label: "Gamuda Land VN", url: "https://www.gamudaland.com.vn" },
      { label: "Eaton Park (public listings)", url: "https://www.gamudaland.com.vn" },
    ],
    hints: {
      city: "TP. Hồ Chí Minh",
      district: "TP. Thủ Đức",
      latitude: 10.8411,
      longitude: 106.8098,
      tagline: "Khu đô thị tích hợp tại TP. Thủ Đức",
    },
  },
  elysian: {
    urls: [{ label: "Gamuda Land VN", url: "https://www.gamudaland.com.vn" }],
    hints: {
      city: "TP. Hồ Chí Minh",
      district: "TP. Thủ Đức",
      latitude: 10.835,
      longitude: 106.815,
      tagline: "Căn hộ cao cấp Gamuda Land tại TP. Thủ Đức",
    },
  },
  "celadon-city": {
    urls: [{ label: "Gamuda Land VN", url: "https://www.gamudaland.com.vn" }],
    hints: {
      city: "TP. Hồ Chí Minh",
      district: "Quận Tân Phú",
      latitude: 10.809,
      longitude: 106.617,
      tagline: "Đô thị xanh Celadon City",
    },
  },
};

/** Merge hardcoded Gamuda hints with CĐT crawl seeds (Vinhomes / Ecopark / Đất Xanh…). */
function sourcesForSlug(slug: string): { label: string; url: string }[] {
  const known = KNOWN_SOURCES[slug]?.urls ?? [];
  const crawlSeed = crawlSeedForSlug(slug);
  const seed = crawlSeed?.officialUrls ?? [];
  const secondary = crawlSeed?.secondaryMarketUrls ?? [];
  const seen = new Set<string>();
  const out: { label: string; url: string }[] = [];
  for (const s of [...seed, ...secondary, ...known]) {
    if (seen.has(s.url)) continue;
    seen.add(s.url);
    out.push(s);
  }
  return out;
}

export function getAiGatewayConfig(env: Env): AiGatewayConfig | null {
  if (!env.AI_GATEWAY_ACCOUNT_ID || !env.AI_GATEWAY_ID) return null;
  return {
    accountId: env.AI_GATEWAY_ACCOUNT_ID,
    gatewayId: env.AI_GATEWAY_ID,
    token: env.AI_GATEWAY_TOKEN,
  };
}

async function fetchSourceSnippet(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "AnCu3D-ResearchBot/1.0 (+https://ancu.local)",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });
    if (!res.ok) return `Fetch failed ${res.status} for ${url}`;
    const html = await res.text();
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 4000);
    return text || `Empty body for ${url}`;
  } catch (err) {
    return `Error fetching ${url}: ${err instanceof Error ? err.message : "unknown"}`;
  }
}

function fallbackSynthesis(name: string, slug: string, snippets: string[]): {
  project: SynthesizedProject;
  chat?: ChatResult;
} {
  const known = KNOWN_SOURCES[slug];
  const pending = "Chờ xác minh";
  const project: SynthesizedProject = {
    name,
    slug,
    tagline: known?.hints.tagline ?? `Dự án ${name} — thông tin đang tổng hợp`,
    description: `Tổng hợp sơ bộ về dự án ${name} từ các nguồn công khai. Giá, diện tích và lịch bàn giao chưa xác minh được ghi rõ "${pending}". ${snippets[0]?.slice(0, 280) ?? ""}`,
    city: known?.hints.city ?? "TP. Hồ Chí Minh",
    district: known?.hints.district ?? pending,
    address: pending,
    latitude: known?.hints.latitude,
    longitude: known?.hints.longitude,
    handover: pending,
    priceRange: pending,
    totalUnits: pending,
    amenities: [
      { category: "park", name: "Tiện ích xanh nội khu (theo thiết kế — chờ xác minh)" },
      { category: "community", name: "Không gian cộng đồng (ước lượng)" },
    ],
    apartmentTypes: [
      {
        slug: "studio-a",
        name: "Studio A",
        bedrooms: 0,
        bathrooms: 1,
        areaSqm: pending,
        floorplanKey: "studio",
      },
      {
        slug: "1br-b",
        name: "1 Bedroom B",
        bedrooms: 1,
        bathrooms: 1,
        areaSqm: pending,
        floorplanKey: "one-bedroom",
      },
      {
        slug: "2br-c",
        name: "2 Bedroom C",
        bedrooms: 2,
        bathrooms: 2,
        areaSqm: pending,
        floorplanKey: "two-bedroom",
      },
    ],
    nearbyPlaces: [
      { category: "transport", name: "Đầu mối giao thông khu vực (chờ xác minh)" },
    ],
    sources: known?.urls ?? [
      { label: "Gamuda Land VN", url: "https://www.gamudaland.com.vn" },
    ],
    researchNotes:
      "Synthesized without AI Gateway credentials or after model failure. No fabricated prices/areas/handover dates.",
    showroom: {
      lightingDefault: "day",
      materialPaletteLabel: "Ivory ấm",
      hotspots: [
        { roomHint: "living", label: "Phòng khách", order: 1 },
        { roomHint: "kitchen", label: "Bếp", order: 2 },
        { roomHint: "bedroom", label: "Phòng ngủ", order: 3 },
      ],
    },
  };
  return { project };
}

export async function discoverSources(name: string, slug: string) {
  const seed = crawlSeedForSlug(slug);
  const sources = sourcesForSlug(slug);
  const fallback =
    sources.length > 0
      ? sources
      : PROJECT_CRAWL_SEEDS[0]
        ? PROJECT_CRAWL_SEEDS[0].officialUrls
        : [{ label: "Gamuda Land VN", url: "https://www.gamudaland.com.vn" }];

  return {
    sources: sources.length ? sources : fallback,
    queryHints: [
      `${name} chủ đầu tư`,
      `${name} tổng mặt bằng atlas`,
      ...(seed?.atlasHints.map((h) => `${name} ${h}`) ?? []),
      `${name} giá thị trường thứ cấp`,
      `${name} site:batdongsan.com.vn OR site:onehousing.vn`,
    ],
    channel: "developer" as const,
    atlasHints: seed?.atlasHints ?? [],
  };
}

export async function crawlSources(
  sources: { label: string; url: string }[],
): Promise<{ label: string; url: string; snippet: string }[]> {
  const out: { label: string; url: string; snippet: string }[] = [];
  for (const s of sources) {
    const snippet = await fetchSourceSnippet(s.url);
    out.push({ ...s, snippet });
  }
  return out;
}

export async function synthesizeProject(
  env: Env,
  name: string,
  crawled: { label: string; url: string; snippet: string }[],
): Promise<{ project: SynthesizedProject; chat?: ChatResult }> {
  const slug = slugifyProjectName(name);
  const gateway = getAiGatewayConfig(env);

  if (!gateway) {
    return fallbackSynthesis(
      name,
      slug,
      crawled.map((c) => c.snippet),
    );
  }

  const system = `Bạn là biên tập viên bất động sản AnCư 3D. Tổng hợp thông tin dự án tiếng Việt từ nguồn cung cấp.
QUAN TRỌNG: Không bịa giá, diện tích, số căn, hoặc thời gian bàn giao. Nếu thiếu, dùng đúng chuỗi "Chờ xác minh".
Trả về DUY NHẤT một JSON object với các khóa:
name, tagline, description, city, district, address, latitude, longitude, handover, priceRange, totalUnits,
amenities (array {category,name}), apartmentTypes (array {slug,name,bedrooms,bathrooms,areaSqm,floorplanKey}),
nearbyPlaces (array {category,name}), researchNotes, showroom {lightingDefault, materialPaletteLabel, hotspots:[{roomHint,label,order}]}.
floorplanKey chỉ dùng: studio | one-bedroom | two-bedroom.`;

  const user = `Tên dự án: ${name}\nNguồn:\n${crawled
    .map((c) => `### ${c.label} (${c.url})\n${c.snippet}`)
    .join("\n\n")}`;

  try {
    const chat = await chatViaGateway(gateway, "research", [
      { role: "system", content: system },
      { role: "user", content: user },
    ]);
    const parsed = parseJsonFromLlm(chat.text) as Partial<SynthesizedProject>;
    const base = fallbackSynthesis(name, slug, crawled.map((c) => c.snippet)).project;
    const project: SynthesizedProject = {
      ...base,
      ...parsed,
      name: parsed.name ?? name,
      slug,
      sources: crawled.map(({ label, url }) => ({ label, url })),
      handover: parsed.handover || "Chờ xác minh",
      priceRange: parsed.priceRange || "Chờ xác minh",
      totalUnits: parsed.totalUnits || "Chờ xác minh",
      address: parsed.address || "Chờ xác minh",
      amenities: parsed.amenities?.length ? parsed.amenities : base.amenities,
      apartmentTypes: parsed.apartmentTypes?.length
        ? parsed.apartmentTypes
        : base.apartmentTypes,
      nearbyPlaces: parsed.nearbyPlaces?.length ? parsed.nearbyPlaces : base.nearbyPlaces,
      showroom: parsed.showroom ?? base.showroom,
      researchNotes: parsed.researchNotes ?? chat.text.slice(0, 500),
    };
    return { project, chat };
  } catch {
    return fallbackSynthesis(
      name,
      slug,
      crawled.map((c) => c.snippet),
    );
  }
}

export async function generateBlogDraft(
  env: Env,
  projects: { name: string; slug: string; description?: string }[],
): Promise<{
  title: string;
  excerpt: string;
  bodyMarkdown: string;
  seoTitle: string;
  seoDescription: string;
  coverPrompt: string;
  chat?: ChatResult;
}> {
  const names = projects.map((p) => p.name).join(", ");
  const fallback = {
    title: `Nhịp sống tuần này: nhìn gần ${names || "các dự án Gamuda Land"}`,
    excerpt:
      "Tóm tắt trực quan các dự án đang có trên AnCư 3D — tập trung trải nghiệm không gian, không phải bảng giá.",
    bodyMarkdown: [
      `## Góc nhìn nhà mẫu`,
      ``,
      `Tuần này AnCư 3D điểm lại ${projects.length || "các"} dự án để bạn hiểu căn nhà trước khi gọi là nhà.`,
      ``,
      ...projects.flatMap((p) => [
        `### ${p.name}`,
        p.description?.slice(0, 400) || "Thông tin chi tiết đang được xác minh từ nguồn công khai.",
        `[Xem showroom](/projects/${p.slug}/showroom)`,
        ``,
      ]),
      `> Giá / diện tích / bàn giao chưa xác minh được ghi rõ "Chờ xác minh".`,
    ].join("\n"),
    seoTitle: `Blog AnCư — ${names || "dự án"}`,
    seoDescription: "Tổng hợp hàng tuần về trải nghiệm không gian dự án trên AnCư 3D.",
    coverPrompt: `Warm architectural interior photography of a modern HCMC apartment showroom, deep teal and warm clay accents, natural daylight, no text`,
  };

  const gateway = getAiGatewayConfig(env);
  if (!gateway) return fallback;

  try {
    const chat = await chatViaGateway(gateway, "blog", [
      {
        role: "system",
        content: `Viết bài blog tiếng Việt cho AnCư 3D (showroom trực quan, không rao bán). Không bịa số liệu. Trả JSON: title, excerpt, bodyMarkdown, seoTitle, seoDescription, coverPrompt.`,
      },
      {
        role: "user",
        content: JSON.stringify(projects),
      },
    ]);
    const parsed = parseJsonFromLlm(chat.text) as Partial<typeof fallback>;
    return { ...fallback, ...parsed, chat };
  } catch {
    return fallback;
  }
}

/** Image generation via AI Gateway first, Workers AI fallback, else prompt sidecar. */
/** Image generation via AI Gateway first, Workers AI fallback, else prompt sidecar. */
export async function generateImageAsset(
  env: Env,
  prompt: string,
  key: string,
): Promise<{ r2Key: string; note: string; bytes?: number }> {
  const gateway = getAiGatewayConfig(env);

  if (gateway) {
    try {
      const img = await imageViaGateway(gateway, "image_gen", { prompt });
      if (img.bytes?.length) {
        await env.ASSETS.put(key, img.bytes, {
          httpMetadata: { contentType: "image/jpeg" },
          customMetadata: { prompt: prompt.slice(0, 500), model: img.model },
        });
        return {
          r2Key: key,
          note: `generated_via_ai_gateway:${img.model}`,
          bytes: img.bytes.byteLength,
        };
      }
    } catch {
      // try Workers AI next
    }
  }

  if (env.AI) {
    try {
      const result = (await env.AI.run("@cf/black-forest-labs/flux-1-schnell", {
        prompt,
      })) as { image?: string } | ArrayBuffer | ReadableStream;

      if (result && typeof result === "object" && "image" in result && result.image) {
        const binary = Uint8Array.from(atob(result.image), (c) => c.charCodeAt(0));
        await env.ASSETS.put(key, binary, {
          httpMetadata: { contentType: "image/jpeg" },
          customMetadata: { prompt: prompt.slice(0, 500) },
        });
        return { r2Key: key, note: "generated_via_workers_ai", bytes: binary.byteLength };
      }
    } catch {
      // fall through
    }
  }

  const meta = new TextEncoder().encode(
    JSON.stringify({ prompt, createdAt: new Date().toISOString(), status: "prompt_only" }),
  );
  await env.ASSETS.put(`${key}.json`, meta, {
    httpMetadata: { contentType: "application/json" },
  });
  return {
    r2Key: `${key}.json`,
    note: "Image model unavailable — stored prompt sidecar for later generation",
  };
}

/** Image edit via AI Gateway (img2img). Falls back to prompt sidecar. */
export async function editImageAsset(
  env: Env,
  prompt: string,
  imageBase64: string,
  key: string,
): Promise<{ r2Key: string; note: string; bytes?: number }> {
  const gateway = getAiGatewayConfig(env);
  if (gateway) {
    try {
      const img = await imageViaGateway(gateway, "image_edit", {
        prompt,
        imageBase64,
      });
      if (img.bytes?.length) {
        await env.ASSETS.put(key, img.bytes, {
          httpMetadata: { contentType: "image/jpeg" },
          customMetadata: { prompt: prompt.slice(0, 500), model: img.model },
        });
        return {
          r2Key: key,
          note: `edited_via_ai_gateway:${img.model}`,
          bytes: img.bytes.byteLength,
        };
      }
    } catch {
      // fall through
    }
  }

  const meta = new TextEncoder().encode(
    JSON.stringify({
      prompt,
      createdAt: new Date().toISOString(),
      status: "edit_prompt_only",
      hasSourceImage: Boolean(imageBase64),
    }),
  );
  await env.ASSETS.put(`${key}.json`, meta, {
    httpMetadata: { contentType: "application/json" },
  });
  return {
    r2Key: `${key}.json`,
    note: "Image edit model unavailable — stored edit prompt sidecar",
  };
}

/** Factual QA against source snippets — flags unsupported claims. */
export async function runFactualQa(
  env: Env,
  claims: string,
  sources: string,
): Promise<{ ok: boolean; issues: string[]; raw?: string; source: string }> {
  const gateway = getAiGatewayConfig(env);
  if (!gateway) {
    return {
      ok: true,
      issues: [],
      source: "fallback",
      raw: "AI Gateway not configured — skipped factual QA",
    };
  }
  try {
    const chat = await factualQaViaGateway(gateway, claims, sources);
    try {
      const parsed = parseJsonFromLlm(chat.text) as { ok?: boolean; issues?: string[] };
      return {
        ok: Boolean(parsed.ok),
        issues: parsed.issues ?? [],
        raw: chat.text.slice(0, 1000),
        source: chat.source,
      };
    } catch {
      return {
        ok: false,
        issues: ["Unparseable QA response"],
        raw: chat.text.slice(0, 1000),
        source: chat.source,
      };
    }
  } catch (err) {
    return {
      ok: false,
      issues: [err instanceof Error ? err.message : "QA failed"],
      source: "error",
    };
  }
}

export async function assist2dTo3d(
  env: Env,
  projectSlug: string,
  imageDescription: string,
): Promise<{ assistJsonKey: string; materials: Record<string, string>; notes: string }> {
  const materials = {
    floor: "#d9cbb8",
    wall: "#f4efe8",
    cabinet: "#8b7355",
    accent: "#285A52",
  };
  let notes =
    "2D→3D assist: material/lighting hints only — does not replace metric FloorPlanDocument.";

  const gateway = getAiGatewayConfig(env);
  if (gateway) {
    try {
      const chat = await chatViaGateway(gateway, "vision_2d", [
        {
          role: "system",
          content: `Từ mô tả ảnh mặt đứng/phối cảnh 2D, đề xuất palette vật liệu JSON {floor,wall,cabinet,accent,notes}. Màu hex.`,
        },
        { role: "user", content: imageDescription },
      ]);
      try {
        const parsed = parseJsonFromLlm(chat.text) as Record<string, string>;
        Object.assign(materials, {
          floor: parsed.floor ?? materials.floor,
          wall: parsed.wall ?? materials.wall,
          cabinet: parsed.cabinet ?? materials.cabinet,
          accent: parsed.accent ?? materials.accent,
        });
        notes = parsed.notes ?? notes;
      } catch {
        notes = chat.text.slice(0, 400) || notes;
      }
    } catch {
      // keep defaults
    }
  }

  const key = `projects/${projectSlug}/assist/2d3d-${Date.now()}.json`;
  const payload = {
    projectSlug,
    materials,
    notes,
    imageDescription: imageDescription.slice(0, 1000),
    kind: "visual_assist",
  };
  await env.ASSETS.put(key, JSON.stringify(payload, null, 2), {
    httpMetadata: { contentType: "application/json" },
  });
  return { assistJsonKey: key, materials, notes };
}
