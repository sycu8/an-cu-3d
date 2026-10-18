/** Minimal blog markdown: headings, lists, quotes, bold, in-app links. No raw HTML. */

export type BlogBlock =
  | { type: "h2" | "h3"; text: string }
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "quote"; text: string };

export function parseBlogMarkdown(source: string): BlogBlock[] {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: BlogBlock[] = [];
  let paragraph: string[] = [];
  let list: string[] | null = null;
  let quote: string[] | null = null;

  const flushParagraph = () => {
    if (!paragraph.length) return;
    blocks.push({ type: "p", text: paragraph.join(" ").trim() });
    paragraph = [];
  };
  const flushList = () => {
    if (!list) return;
    blocks.push({ type: "ul", items: list });
    list = null;
  };
  const flushQuote = () => {
    if (!quote) return;
    blocks.push({ type: "quote", text: quote.join(" ").trim() });
    quote = null;
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flushParagraph();
      flushList();
      flushQuote();
      continue;
    }
    if (line.startsWith("### ")) {
      flushParagraph();
      flushList();
      flushQuote();
      blocks.push({ type: "h3", text: line.slice(4).trim() });
      continue;
    }
    if (line.startsWith("## ")) {
      flushParagraph();
      flushList();
      flushQuote();
      blocks.push({ type: "h2", text: line.slice(3).trim() });
      continue;
    }
    if (line.startsWith("> ")) {
      flushParagraph();
      flushList();
      quote ??= [];
      quote.push(line.slice(2).trim());
      continue;
    }
    if (line.startsWith("- ")) {
      flushParagraph();
      flushQuote();
      list ??= [];
      list.push(line.slice(2).trim());
      continue;
    }
    flushList();
    flushQuote();
    paragraph.push(line);
  }

  flushParagraph();
  flushList();
  flushQuote();
  return blocks;
}

/** In-app paths only. Reject protocol-relative and external URLs. */
export function safeBlogHref(href: string): string | null {
  const trimmed = href.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return null;
  if (trimmed.includes("\\") || /\s/.test(trimmed)) return null;
  return trimmed;
}

export type BlogInline =
  | { type: "text"; text: string }
  | { type: "strong"; text: string }
  | { type: "link"; text: string; href: string };

const INLINE = /(\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)]+)\))/g;

export function parseBlogInline(source: string): BlogInline[] {
  const parts: BlogInline[] = [];
  let cursor = 0;
  for (const match of source.matchAll(INLINE)) {
    const index = match.index ?? 0;
    if (index > cursor) {
      parts.push({ type: "text", text: source.slice(cursor, index) });
    }
    if (match[2]) {
      parts.push({ type: "strong", text: match[2] });
    } else if (match[3] && match[4]) {
      const href = safeBlogHref(match[4]);
      if (href) parts.push({ type: "link", text: match[3], href });
      else parts.push({ type: "text", text: match[3] });
    }
    cursor = index + match[0].length;
  }
  if (cursor < source.length) {
    parts.push({ type: "text", text: source.slice(cursor) });
  }
  return parts;
}
