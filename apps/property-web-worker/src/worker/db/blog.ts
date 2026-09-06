import type { BlogPost } from "@ancu/shared";

type BlogRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body_markdown: string;
  cover_r2_key: string | null;
  cover_url: string | null;
  project_slugs_json: string;
  status: string;
  locale: string;
  seo_title: string | null;
  seo_description: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

function mapPost(row: BlogRow): BlogPost {
  let projectSlugs: string[] = [];
  try {
    projectSlugs = JSON.parse(row.project_slugs_json) as string[];
  } catch {
    projectSlugs = [];
  }
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    bodyMarkdown: row.body_markdown,
    coverR2Key: row.cover_r2_key,
    coverUrl: row.cover_url,
    projectSlugs,
    status: row.status as BlogPost["status"],
    locale: row.locale,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listPublishedPosts(db: D1Database): Promise<BlogPost[]> {
  const rows = await db
    .prepare(
      `SELECT * FROM blog_posts WHERE status = 'published' ORDER BY published_at DESC`,
    )
    .all<BlogRow>();
  return (rows.results ?? []).map(mapPost);
}

export async function listAllPosts(db: D1Database): Promise<BlogPost[]> {
  const rows = await db
    .prepare(`SELECT * FROM blog_posts ORDER BY updated_at DESC`)
    .all<BlogRow>();
  return (rows.results ?? []).map(mapPost);
}

export async function getPostBySlug(db: D1Database, slug: string): Promise<BlogPost | null> {
  const row = await db
    .prepare(`SELECT * FROM blog_posts WHERE slug = ?`)
    .bind(slug)
    .first<BlogRow>();
  return row ? mapPost(row) : null;
}

export async function upsertBlogPost(
  db: D1Database,
  post: {
    id: string;
    slug: string;
    title: string;
    excerpt: string;
    bodyMarkdown: string;
    projectSlugs: string[];
    status: string;
    locale?: string;
    seoTitle?: string;
    seoDescription?: string;
    coverUrl?: string | null;
    coverR2Key?: string | null;
    publish?: boolean;
  },
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO blog_posts (
         id, slug, title, excerpt, body_markdown, cover_r2_key, cover_url,
         project_slugs_json, status, locale, seo_title, seo_description, published_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CASE WHEN ? THEN datetime('now') ELSE NULL END, datetime('now'))
       ON CONFLICT(slug) DO UPDATE SET
         title = excluded.title,
         excerpt = excluded.excerpt,
         body_markdown = excluded.body_markdown,
         cover_r2_key = excluded.cover_r2_key,
         cover_url = excluded.cover_url,
         project_slugs_json = excluded.project_slugs_json,
         status = excluded.status,
         seo_title = excluded.seo_title,
         seo_description = excluded.seo_description,
         published_at = CASE WHEN excluded.status = 'published' THEN COALESCE(blog_posts.published_at, datetime('now')) ELSE blog_posts.published_at END,
         updated_at = datetime('now')`,
    )
    .bind(
      post.id,
      post.slug,
      post.title,
      post.excerpt,
      post.bodyMarkdown,
      post.coverR2Key ?? null,
      post.coverUrl ?? null,
      JSON.stringify(post.projectSlugs),
      post.status,
      post.locale ?? "vi",
      post.seoTitle ?? null,
      post.seoDescription ?? null,
      post.publish || post.status === "published" ? 1 : 0,
    )
    .run();
}
