import { useEffect, useState } from "react";
import { Link } from "react-router";
import type { BlogPost } from "@ancu/shared";
import "./BlogPage.css";

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/blog");
        if (!res.ok) throw new Error("Failed to load blog");
        const data = (await res.json()) as { posts: BlogPost[] };
        setPosts(data.posts);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load blog");
      }
    })();
  }, []);

  return (
    <div className="container blog-page">
      <header className="blog-header">
        <h1>Blog AnCư</h1>
        <p>Góc nhìn nhà mẫu hàng tuần — hiểu không gian trước khi gọi là nhà.</p>
      </header>
      {error && <p role="alert">{error}</p>}
      <ul className="blog-list">
        {posts.map((post) => (
          <li key={post.id}>
            <Link to={`/blog/${post.slug}`}>
              <h2>{post.title}</h2>
              <p>{post.excerpt}</p>
            </Link>
          </li>
        ))}
        {posts.length === 0 && !error && <li>Chưa có bài viết công khai.</li>}
      </ul>
    </div>
  );
}
