import { describe, expect, it } from "vitest";
import { getProjectBySlug } from "./gamuda-projects";
import { EDITORIAL_BLOG_POSTS, mergePublishedBlogPosts } from "./blog-posts";
import { parseBlogInline, parseBlogMarkdown, safeBlogHref } from "../lib/blog-markdown";
import type { BlogPost } from "@ancu/shared";

const SLUGS = [
  "cho-xac-minh-khong-phai-o-trong",
  "showroom-anh-sang-vat-lieu-diem-nong",
  "so-sanh-du-an-khong-bia-thoi-gian",
  "nhin-gan-du-an-dang-co-tren-ancu",
];

describe("editorial blog posts", () => {
  it("publishes four unique Vietnamese posts", () => {
    expect(EDITORIAL_BLOG_POSTS).toHaveLength(4);
    expect(new Set(EDITORIAL_BLOG_POSTS.map((post) => post.slug)).size).toBe(4);
    expect(EDITORIAL_BLOG_POSTS.map((post) => post.slug).sort()).toEqual([...SLUGS].sort());
    for (const post of EDITORIAL_BLOG_POSTS) {
      expect(post.status).toBe("published");
      expect(post.locale).toBe("vi");
      expect(post.title.length).toBeGreaterThan(12);
      expect(post.excerpt.length).toBeGreaterThan(40);
      expect(post.bodyMarkdown.length).toBeGreaterThan(400);
      expect(post.seoTitle?.length ?? 0).toBeGreaterThan(10);
      expect(post.seoTitle!.length).toBeLessThanOrEqual(70);
      expect(post.seoDescription!.length).toBeGreaterThan(70);
      expect(post.seoDescription!.length).toBeLessThanOrEqual(180);
      expect(post.bodyMarkdown.toLowerCase()).toMatch(/chờ xác minh|cho xac minh/);
      expect(post.bodyMarkdown).not.toMatch(/tỷ|triệu|tr\/m|%\/năm|\d+\s*phút/i);
      expect(post.publishedAt).toMatch(/^2026-10-\d{2} 09:00:00$/);
    }
  });

  it("only links to catalog projects and in-app routes", () => {
    for (const post of EDITORIAL_BLOG_POSTS) {
      for (const slug of post.projectSlugs) {
        expect(getProjectBySlug(slug), slug).toBeTruthy();
      }
      for (const match of post.bodyMarkdown.matchAll(/\]\(([^)]+)\)/g)) {
        const href = match[1]!;
        expect(safeBlogHref(href), href).toBe(href);
        const project = href.match(/^\/projects\/([^/]+)/);
        if (project) expect(getProjectBySlug(project[1]!), href).toBeTruthy();
      }
    }
  });

  it("lets an archived D1 row hide the curated copy", () => {
    const archived: BlogPost = {
      ...EDITORIAL_BLOG_POSTS[0]!,
      status: "archived",
    };
    const extra: BlogPost = {
      ...EDITORIAL_BLOG_POSTS[0]!,
      id: "blog_other",
      slug: "bai-khac",
      title: "Bài khác",
      status: "published",
      publishedAt: "2026-10-20 09:00:00",
    };
    const merged = mergePublishedBlogPosts([archived, extra]);
    expect(merged.map((post) => post.slug)).not.toContain(archived.slug);
    expect(merged[0]?.slug).toBe("bai-khac");
    expect(merged).toHaveLength(EDITORIAL_BLOG_POSTS.length);
  });
});

describe("blog markdown", () => {
  it("parses headings, lists, quotes, and drops external links", () => {
    const blocks = parseBlogMarkdown(
      ["## Tiêu đề", "", "Một đoạn.", "", "- một", "- hai", "", "> Ghi chú."].join("\n"),
    );
    expect(blocks.map((block) => block.type)).toEqual(["h2", "p", "ul", "quote"]);
    expect(safeBlogHref("https://example.com")).toBeNull();
    expect(safeBlogHref("//evil")).toBeNull();
    expect(parseBlogInline("Xem [Celadon](/projects/celadon-city) và [ngoài](https://x.test).")).toEqual([
      { type: "text", text: "Xem " },
      { type: "link", text: "Celadon", href: "/projects/celadon-city" },
      { type: "text", text: " và " },
      { type: "text", text: "ngoài" },
      { type: "text", text: "." },
    ]);
  });
});
