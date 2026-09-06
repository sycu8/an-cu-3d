import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import type { BlogPost, ProjectBuildJob } from "@ancu/shared";
import type { ProjectSummary } from "../types";
import "./AdminPage.css";

const SECRET_KEY = "ancu-admin-secret";

function formatElapsed(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const rem = s % 60;
  if (m <= 0) return `${rem}s`;
  return `${m}m ${rem}s`;
}

export default function AdminPage() {
  const [secret, setSecret] = useState(() => localStorage.getItem(SECRET_KEY) ?? "");
  const [authed, setAuthed] = useState(false);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [jobs, setJobs] = useState<ProjectBuildJob[]>([]);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [name, setName] = useState("");
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [activeJob, setActiveJob] = useState<ProjectBuildJob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(Date.now());

  const headers = useMemo(
    () => ({
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    }),
    [secret],
  );

  const load = useCallback(async () => {
    setError(null);
    const res = await fetch("/api/admin/projects", { headers });
    if (res.status === 401) {
      setAuthed(false);
      setError("Unauthorized — check ADMIN_SECRET");
      return;
    }
    if (!res.ok) throw new Error("Failed to load admin data");
    const data = (await res.json()) as {
      projects: ProjectSummary[];
      jobs: ProjectBuildJob[];
    };
    setProjects(data.projects);
    setJobs(data.jobs);
    setAuthed(true);
    localStorage.setItem(SECRET_KEY, secret);

    const blogRes = await fetch("/api/admin/blog", { headers });
    if (blogRes.ok) {
      const blogData = (await blogRes.json()) as { posts: BlogPost[] };
      setPosts(blogData.posts);
    }
  }, [headers, secret]);

  useEffect(() => {
    if (!secret) return;
    void load().catch((e) => setError(e instanceof Error ? e.message : "Load failed"));
  }, [load, secret]);

  useEffect(() => {
    if (!activeJobId) return;
    const tick = window.setInterval(() => setNow(Date.now()), 500);
    const poll = window.setInterval(() => {
      void (async () => {
        const res = await fetch(`/api/admin/jobs/${activeJobId}`, { headers });
        if (!res.ok) return;
        const data = (await res.json()) as { job: ProjectBuildJob };
        setActiveJob(data.job);
        if (data.job.status === "completed" || data.job.status === "failed") {
          void load();
        }
      })();
    }, 1500);
    return () => {
      window.clearInterval(tick);
      window.clearInterval(poll);
    };
  }, [activeJobId, headers, load]);

  async function onCreateProject(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/projects", {
        method: "POST",
        headers,
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error ?? "Create failed");
      }
      const data = (await res.json()) as { job: ProjectBuildJob };
      setActiveJobId(data.job.id);
      setActiveJob(data.job);
      setName("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setBusy(false);
    }
  }

  async function onGenerateBlog() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/blog/generate", {
        method: "POST",
        headers,
        body: JSON.stringify({
          projectSlugs: projects.slice(0, 5).map((p) => p.slug),
          publish: false,
        }),
      });
      if (!res.ok) throw new Error("Blog generate failed");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Blog generate failed");
    } finally {
      setBusy(false);
    }
  }

  const elapsedMs = (() => {
    if (!activeJob) return 0;
    if (activeJob.startedAt && (activeJob.status === "running" || activeJob.status === "queued")) {
      return Math.max(0, now - new Date(activeJob.startedAt).getTime());
    }
    return activeJob.events?.at(-1)?.elapsedMs ?? 0;
  })();

  return (
    <div className="container admin-page">
      <header className="admin-header">
        <h1>Admin AnCư</h1>
        <p>Tổng hợp dự án, crawl &amp; build trang, blog AI — không giới hạn thời gian cho build.</p>
      </header>

      <section className="admin-auth">
        <label htmlFor="admin-secret">ADMIN_SECRET</label>
        <input
          id="admin-secret"
          type="password"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          placeholder="Bearer secret"
        />
        <button type="button" className="btn btn-primary" onClick={() => void load()} disabled={!secret}>
          Kết nối
        </button>
      </section>

      {error && (
        <p className="admin-error" role="alert">
          {error}
        </p>
      )}

      {authed && (
        <>
          <section className="admin-section">
            <h2>Thêm dự án</h2>
            <form className="admin-form" onSubmit={(e) => void onCreateProject(e)}>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tên dự án (vd: Eaton Park)"
                required
                minLength={2}
              />
              <button type="submit" className="btn btn-primary" disabled={busy || !name.trim()}>
                Crawl &amp; build
              </button>
            </form>
            {activeJob && (
              <div className="admin-job">
                <div className="admin-job-meta">
                  <strong>{activeJob.name}</strong>
                  <span>{activeJob.status}</span>
                  <span>{activeJob.stage}</span>
                  <span className="admin-elapsed">{formatElapsed(elapsedMs)}</span>
                </div>
                <ol className="admin-events">
                  {(activeJob.events ?? []).map((ev) => (
                    <li key={ev.id}>
                      <code>{ev.stage}</code> · {formatElapsed(ev.elapsedMs)} — {ev.message}
                    </li>
                  ))}
                </ol>
                {activeJob.status === "completed" && (
                  <p>
                    <Link to={`/projects/${activeJob.slug}`}>Mở trang dự án</Link>
                    {" · "}
                    <Link to={`/projects/${activeJob.slug}/showroom`}>Showroom</Link>
                  </p>
                )}
              </div>
            )}
          </section>

          <section className="admin-section">
            <h2>Dự án ({projects.length})</h2>
            <ul className="admin-list">
              {projects.map((p) => (
                <li key={p.id}>
                  <Link to={`/projects/${p.slug}`}>{p.name}</Link>
                  <span>{p.district ?? p.city}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="admin-section">
            <div className="admin-section-head">
              <h2>Blog</h2>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => void onGenerateBlog()}
                disabled={busy}
              >
                Generate weekly draft
              </button>
            </div>
            <ul className="admin-list">
              {posts.map((p) => (
                <li key={p.id}>
                  <Link to={`/blog/${p.slug}`}>{p.title}</Link>
                  <span>{p.status}</span>
                </li>
              ))}
              {posts.length === 0 && <li>Chưa có bài</li>}
            </ul>
          </section>

          <section className="admin-section">
            <h2>Jobs gần đây</h2>
            <ul className="admin-list">
              {jobs.map((j) => (
                <li key={j.id}>
                  <button
                    type="button"
                    className="linkish"
                    onClick={() => {
                      setActiveJobId(j.id);
                      setActiveJob(j);
                    }}
                  >
                    {j.name}
                  </button>
                  <span>{j.status}</span>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
