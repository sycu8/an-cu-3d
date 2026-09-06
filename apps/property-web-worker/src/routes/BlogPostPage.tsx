import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import type { BlogPost } from "@ancu/shared";
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

  return (
    <article className="container blog-article">
      <p>
        <Link to="/blog">← Blog</Link>
      </p>
      <h1>{post.title}</h1>
      <p>{post.excerpt}</p>
      <div className="prose">{post.bodyMarkdown}</div>
    </article>
  );
}
