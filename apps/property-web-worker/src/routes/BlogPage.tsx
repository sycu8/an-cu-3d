import { useEffect, useState } from "react";
import { Link } from "react-router";
import { mediaUrl, type BlogPost } from "@ancu/shared";
import "./BlogPage.css";

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/blog");
        if (!res.ok) throw new Error("Không tải được blog");
        const data = (await res.json()) as { posts: BlogPost[] };
        setPosts(data.posts);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Không tải được blog");
      }
    })();
  }, []);

  return (
    <div className="container blog-page">
      <header className="blog-header">
        <h1>Blog AnCư</h1>
        <p>Góc nhìn nhà mẫu — hiểu không gian trước khi gọi là nhà.</p>
      </header>
      {error && (
        <p className="blog-error" role="alert">
          {error}
        </p>
      )}
      <ul className="blog-list">
        {posts.map((post) => (
          <li key={post.id}>
            <Link to={`/blog/${post.slug}`} className="blog-card">
              {(post.coverUrl || post.coverR2Key) && (
                <img
                  className="blog-card-cover"
                  src={post.coverUrl ?? mediaUrl(post.coverR2Key!, { variant: "blog", format: "webp" })}
                  alt=""
                  loading="lazy"
                />
              )}
              <h2>{post.title}</h2>
              <p>{post.excerpt}</p>
              <span className="blog-card-cta">Đọc bài</span>
            </Link>
          </li>
        ))}
        {posts.length === 0 && !error && (
          <li className="blog-empty">Chưa có bài viết công khai.</li>
        )}
      </ul>
    </div>
  );
}
