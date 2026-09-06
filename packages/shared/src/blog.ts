/** Blog types for weekly project digests. */

export type BlogPostStatus = "draft" | "published" | "archived";

export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  bodyMarkdown: string;
  coverR2Key?: string | null;
  coverUrl?: string | null;
  projectSlugs: string[];
  status: BlogPostStatus;
  locale: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BlogMedia = {
  id: string;
  postId: string;
  kind: "cover" | "inline" | "generated" | "edited";
  r2Key: string;
  altText?: string | null;
  prompt?: string | null;
  createdAt: string;
};
