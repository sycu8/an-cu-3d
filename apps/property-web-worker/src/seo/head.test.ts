import { describe, expect, it } from "vitest";
import htmlSource from "../../index.html?raw";
import llmsTxt from "../../public/llms.txt?raw";
import robotsTxt from "../../public/robots.txt?raw";
import sitemapXml from "../../public/sitemap.xml?raw";
// @ts-expect-error node builtin is available under vitest
import { readFileSync } from "node:fs";
import layoutSource from "../components/Layout.tsx?raw";
import homeSource from "../routes/HomePage.tsx?raw";
import { llmsTxtBody, robotsTxtBody, sitemapXmlBody } from "../worker/seo-static";
import {
  FAQ,
  H1,
  HUB_LINKS,
  OG_IMAGE_ALT,
  OG_IMAGE_HEIGHT,
  OG_IMAGE_URL,
  OG_IMAGE_WIDTH,
  PERSON_ID,
  SITE_DESCRIPTION,
  SITE_TITLE,
} from "./site-copy";

function flat(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

describe("static head", () => {
  const html = flat(htmlSource);

  it("has title, description, canonical, Open Graph, an H1 and WebApplication JSON-LD", () => {
    expect(html).toContain(`<title>${SITE_TITLE}</title>`);
    expect(html).toContain(`content="${SITE_DESCRIPTION}"`);
    expect(html).toContain('rel="canonical" href="https://home.orangecloud.vn/"');
    expect(html).toContain('property="og:title"');
    expect(html).toContain('property="og:description"');
    expect(html).toContain('property="og:url" content="https://home.orangecloud.vn/"');
    expect(html).toContain(`<h1>${H1}</h1>`);
    expect(html).toContain('"@type": "WebApplication"');
    expect(html).toContain(`"author": { "@id": "${PERSON_ID}" }`);
    expect(html).toContain(`"publisher": { "@id": "${PERSON_ID}" }`);
    expect(html).toContain("https://orangecloud.vn/");
    const jsonLd = htmlSource.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    expect(jsonLd?.[1]).toBeTruthy();
    const graph = JSON.parse(jsonLd![1]!) as { "@graph": { "@type": string }[] };
    expect(graph["@graph"].map((node) => node["@type"])).toEqual([
      "Person",
      "WebApplication",
      "FAQPage",
    ]);
  });

  it("serves og:image from our own host", () => {
    const ownHost = "home.orangecloud.vn";
    expect(new URL(OG_IMAGE_URL).host).toBe(ownHost);
    expect(html).toContain(`property="og:image" content="${OG_IMAGE_URL}"`);
    expect(html).toContain(`name="twitter:image" content="${OG_IMAGE_URL}"`);
    expect(htmlSource).toContain(`property="og:image:alt" content="${OG_IMAGE_ALT}"`);
    expect(htmlSource).toContain(`property="og:image:width" content="${OG_IMAGE_WIDTH}"`);
    expect(htmlSource).toContain(`property="og:image:height" content="${OG_IMAGE_HEIGHT}"`);

    const imageUrls: string[] = [];
    for (const tag of htmlSource.match(/<meta\b[^>]*>/gis) ?? []) {
      const content = tag.match(/\bcontent="([^"]*)"/i)?.[1] ?? "";
      expect(content).not.toMatch(/celadoncityhcm\.com/i);
      if (/^https?:\/\//i.test(content) && /\.(?:png|jpe?g|webp|gif|svg)(?:$|\?)/i.test(content)) {
        imageUrls.push(content);
        const url = new URL(content);
        expect(url.protocol).toBe("https:");
        expect(url.host).toBe(ownHost);
      }
    }
    expect(imageUrls).toEqual([OG_IMAGE_URL, OG_IMAGE_URL]);

    const png = readFileSync(new URL("../../public/og-image.png", import.meta.url));
    expect(png.subarray(12, 16).toString("ascii")).toBe("IHDR");
    expect(png.readUInt32BE(16)).toBe(OG_IMAGE_WIDTH);
    expect(png.readUInt32BE(20)).toBe(OG_IMAGE_HEIGHT);
  });

  it("includes the Vietnamese and English FAQ with FAQPage JSON-LD", () => {
    expect(html).toContain('"@type": "FAQPage"');
    for (const item of FAQ) {
      expect(html).toContain(item.qVi);
      expect(html).toContain(item.aVi);
      expect(html).toContain(item.qEn);
      expect(html).toContain(item.aEn);
    }
  });

  it("links the hub and sibling projects from the footer", () => {
    expect(layoutSource).toContain("HUB_LINKS");
    expect(homeSource).toContain("faq-heading");
    expect(HUB_LINKS[0]?.href).toBe("https://orangecloud.vn/");
    expect(HUB_LINKS.length).toBeGreaterThanOrEqual(3);
    for (const link of HUB_LINKS) {
      expect(link.href.startsWith("https://")).toBe(true);
    }
  });

  it("keeps public robots, sitemap and llms identical to the worker bodies", () => {
    expect(robotsTxt).toBe(robotsTxtBody());
    expect(sitemapXml).toBe(sitemapXmlBody());
    expect(llmsTxt).toBe(llmsTxtBody());
  });
});
