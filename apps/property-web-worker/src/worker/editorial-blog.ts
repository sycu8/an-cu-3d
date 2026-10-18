import type { BlogPost } from "@ancu/shared";
import { EDITORIAL_BLOG_POSTS, mergePublishedBlogPosts } from "../data/blog-posts";
import { getPostBySlug, listAllPosts, upsertBlogPost } from "./db/blog";

/**
 * Insert curated posts once. Existing slugs — published, draft, or archived —
 * are not overwritten, so an admin unpublish sticks.
 */
export async function ensureEditorialBlogPosts(db: D1Database): Promise<void> {
  for (const post of EDITORIAL_BLOG_POSTS) {
    const existing = await getPostBySlug(db, post.slug);
    if (existing) continue;
    await upsertBlogPost(db, {
      id: post.id,
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      bodyMarkdown: post.bodyMarkdown,
      projectSlugs: post.projectSlugs,
      status: "published",
      locale: post.locale,
      seoTitle: post.seoTitle ?? undefined,
      seoDescription: post.seoDescription ?? undefined,
      coverR2Key: null,
      coverUrl: null,
      publish: true,
      publishedAt: post.publishedAt ?? undefined,
    });
  }
}

export async function loadPublishedBlogPosts(db: D1Database | undefined): Promise<BlogPost[]> {
  if (!db) return mergePublishedBlogPosts([]);
  try {
    await ensureEditorialBlogPosts(db);
    const all = await listAllPosts(db);
    return mergePublishedBlogPosts(all);
  } catch {
    return mergePublishedBlogPosts([]);
  }
}

export async function loadPublicBlogPost(
  db: D1Database | undefined,
  slug: string,
): Promise<BlogPost | null> {
  if (db) {
    try {
      await ensureEditorialBlogPosts(db);
      const row = await getPostBySlug(db, slug);
      if (row) return row.status === "published" ? row : null;
    } catch {
      /* D1 missing or unread — fall through to the catalog */
    }
  }
  const seed = EDITORIAL_BLOG_POSTS.find((post) => post.slug === slug);
  return seed?.status === "published" ? seed : null;
}
