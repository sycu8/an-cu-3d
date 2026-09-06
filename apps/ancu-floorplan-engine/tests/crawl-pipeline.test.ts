import { describe, expect, it } from "vitest";
import {
  crawlChannelForHost,
  DEFAULT_ALLOWLIST_DOMAINS,
  validateAllowlistedUrl,
} from "../src/allowlist";
import { classifyAsset } from "../src/pipeline/classify";
import { extractPage } from "../src/pipeline/extractHtml";

describe("crawl allowlist extensions", () => {
  it("accepts Vinhomes and Ecopark developer domains", () => {
    expect(validateAllowlistedUrl("https://vinhomes.vn/vi/grand-park").ok).toBe(true);
    expect(validateAllowlistedUrl("https://ecopark.com.vn/").ok).toBe(true);
    expect(validateAllowlistedUrl("https://www.datxanh.com.vn/").ok).toBe(true);
  });

  it("accepts secondary-market listing domains", () => {
    expect(validateAllowlistedUrl("https://batdongsan.com.vn/ban-can-ho").ok).toBe(true);
    expect(validateAllowlistedUrl("https://www.mogi.vn/").ok).toBe(true);
    expect(validateAllowlistedUrl("https://homedy.com/").ok).toBe(true);
  });

  it("classifies crawl channel by host", () => {
    expect(crawlChannelForHost("vinhomes.vn")).toBe("developer");
    expect(crawlChannelForHost("www.batdongsan.com.vn")).toBe("secondary_market");
    expect(crawlChannelForHost("onehousing.vn")).toBe("secondary_market");
    expect(validateAllowlistedUrl("https://onehousing.vn/mua-ban").ok).toBe(true);
    expect(crawlChannelForHost("evil.example")).toBeNull();
  });

  it("keeps DEFAULT_ALLOWLIST_DOMAINS reachable over https", () => {
    for (const domain of DEFAULT_ALLOWLIST_DOMAINS) {
      expect(validateAllowlistedUrl(`https://${domain}/`).ok).toBe(true);
    }
  });
});

describe("classifyAsset", () => {
  it("detects atlas / masterplan assets", () => {
    const result = classifyAsset("tong-mat-bang-atlas.pdf", "Tổng mặt bằng quy hoạch");
    expect(result.label).toBe("atlas");
    expect(result.confidence).toBeGreaterThan(0.5);
  });

  it("detects floorplan assets", () => {
    const result = classifyAsset("mat-bang-can-2pn.png", "Mặt bằng căn hộ");
    expect(result.label).toBe("floorplan");
  });

  it("detects perspective renders", () => {
    const result = classifyAsset("phoi-canh-tong-the.jpg", "Phối cảnh tổng thể");
    expect(result.label).toBe("perspective");
  });
});

describe("extractPage", () => {
  it("extracts title, description, og:image and asset links", () => {
    const html = `<!doctype html><html><head>
      <title>Vinhomes Grand Park</title>
      <meta name="description" content="Đại đô thị tại TP. Thủ Đức" />
      <meta property="og:image" content="/images/masterplan-atlas.jpg" />
    </head><body>
      <img src="/media/phoi-canh.png" alt="Phối cảnh tổng thể" />
      <a href="/docs/tong-mat-bang.pdf">Tổng mặt bằng</a>
      <a href="/about">Giới thiệu</a>
    </body></html>`;

    const page = extractPage(html, "https://vinhomes.vn/vi/grand-park");
    expect(page.title).toContain("Vinhomes Grand Park");
    expect(page.description).toContain("Thủ Đức");
    expect(page.ogImage).toBe("https://vinhomes.vn/images/masterplan-atlas.jpg");
    expect(page.links.some((l) => l.kind === "image")).toBe(true);
    expect(page.links.some((l) => l.kind === "pdf")).toBe(true);
    expect(page.textSnippet.length).toBeGreaterThan(0);
  });
});
