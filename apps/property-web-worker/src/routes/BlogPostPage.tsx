import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { mediaUrl, type BlogPost } from "@ancu/shared";
import { BlogMarkdown } from "../components/BlogMarkdown";
import "./BlogPage.css";

export default function BlogPostPage() {
  const { slug } = useParams();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    void (async () => {
      try {
        const res = await fetch(`/api/blog/${slug}`);
        if (!res.ok) throw new Error("Không tìm thấy bài viết");
        const data = (await res.json()) as { post: BlogPost };
        setPost(data.post);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Load failed");
      }
    })();
  }, [slug]);

  useEffect(() => {
    if (!post) return;
    const previousTitle = document.title;
    const meta = document.querySelector('meta[name="description"]');
    const previousDescription = meta?.getAttribute("content") ?? null;
    document.title = post.seoTitle?.trim() || post.title;
    if (meta && post.seoDescription) meta.setAttribute("content", post.seoDescription);
    return () => {
      document.title = previousTitle;
      if (meta && previousDescription != null) meta.setAttribute("content", previousDescription);
    };
  }, [post]);

  if (error) {
    return (
      <div className="container blog-article">
        <p role="alert">{error}</p>
        <Link to="/blog">← Blog</Link>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container blog-article">
        <p>Đang tải…</p>
      </div>
    );
  }

  const coverSrc =
    post.coverUrl ??
    (post.coverR2Key
      ? mediaUrl(post.coverR2Key, { variant: "hero", format: "webp" })
      : null);

  return (
    <div className="container blog-article">
      <p>
        <Link to="/blog">← Blog</Link>
      </p>
      {coverSrc && <img className="blog-cover" src={coverSrc} alt="" />}
      <h1>{post.title}</h1>
      <p className="blog-excerpt">{post.excerpt}</p>
      <BlogMarkdown source={post.bodyMarkdown} />
    </div>
  );
}
