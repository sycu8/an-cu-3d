/**
 * Lightweight HTML extractors for allowlisted CĐT / listing pages.
 * No DOM dependency — Workers-friendly regex parsing.
 */

export type ExtractedLink = {
  url: string;
  text: string;
  kind: "image" | "pdf" | "page";
};

export type ExtractedPage = {
  title: string;
  description: string;
  textSnippet: string;
  ogImage?: string;
  links: ExtractedLink[];
};

function decodeBasicEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}

function absoluteUrl(base: string, href: string): string | null {
  try {
    return new URL(href, base).toString();
  } catch {
    return null;
  }
}

function metaContent(html: string, propertyOrName: string): string {
  const propRe = new RegExp(
    `<meta[^>]+(?:property|name)=["']${propertyOrName}["'][^>]+content=["']([^"']+)["']`,
    "i",
  );
  const contentFirst = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${propertyOrName}["']`,
    "i",
  );
  return html.match(propRe)?.[1] ?? html.match(contentFirst)?.[1] ?? "";
}

export function extractPage(html: string, pageUrl: string): ExtractedPage {
  const title =
    decodeBasicEntities(
      html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() ?? "",
    ) || metaContent(html, "og:title");

  const description =
    metaContent(html, "description") || metaContent(html, "og:description");

  const ogImageRaw = metaContent(html, "og:image");
  const ogImage = ogImageRaw ? absoluteUrl(pageUrl, ogImageRaw) ?? undefined : undefined;

  const textSnippet = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 4000);

  const links: ExtractedLink[] = [];
  const seen = new Set<string>();

  const push = (url: string | null, text: string, kind: ExtractedLink["kind"]) => {
    if (!url || seen.has(url)) return;
    seen.add(url);
    links.push({
      url,
      text: decodeBasicEntities(text).trim().slice(0, 200),
      kind,
    });
  };

  if (ogImage) push(ogImage, "og:image", "image");

  for (const match of html.matchAll(/<img\b[^>]*>/gi)) {
    const tag = match[0];
    const src = tag.match(/\bsrc=["']([^"']+)["']/i)?.[1];
    const alt = tag.match(/\balt=["']([^"']*)["']/i)?.[1] ?? "";
    push(src ? absoluteUrl(pageUrl, src) : null, alt || src || "image", "image");
  }

  for (const match of html.matchAll(
    /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi,
  )) {
    const href = match[1] ?? "";
    const inner = (match[2] ?? "").replace(/<[^>]+>/g, " ").trim();
    const abs = absoluteUrl(pageUrl, href);
    if (!abs) continue;
    const lower = abs.toLowerCase();
    if (lower.endsWith(".pdf") || lower.includes(".pdf?")) {
      push(abs, inner || "pdf", "pdf");
    } else if (/\.(png|jpe?g|webp|gif)(\?|$)/i.test(lower)) {
      push(abs, inner || "image", "image");
    } else {
      push(abs, inner || href, "page");
    }
  }

  return {
    title: title.slice(0, 300),
    description: decodeBasicEntities(description).slice(0, 500),
    textSnippet,
    ogImage,
    links: links.slice(0, 80),
  };
}
