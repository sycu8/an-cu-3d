import { describe, expect, it } from "vitest";
import htmlSource from "../../index.html?raw";
import llmsTxt from "../../public/llms.txt?raw";
import robotsTxt from "../../public/robots.txt?raw";
import sitemapXml from "../../public/sitemap.xml?raw";
import layoutSource from "../components/Layout.tsx?raw";
import visualsSource from "../lib/projectVisuals.ts?raw";
import homeSource from "../routes/HomePage.tsx?raw";
import { llmsTxtBody, robotsTxtBody, sitemapXmlBody } from "../worker/seo-static";
import { FAQ, H1, HUB_LINKS, PERSON_ID, SITE_DESCRIPTION, SITE_TITLE } from "./site-copy";

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
    const hero = visualsSource.match(/HERO_IMAGE =\s*"([^"]+)"/);
    expect(hero?.[1]).toBeTruthy();
    expect(html).toContain(`property="og:image" content="${hero![1]}"`);
    expect(htmlSource).toContain('property="og:image:alt" content="Không gian nhà mẫu hiện đại"');
    expect(htmlSource).toContain('property="og:image:width" content="2048"');
    expect(htmlSource).toContain('property="og:image:height" content="1152"');
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
