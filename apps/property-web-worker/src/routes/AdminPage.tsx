import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import type { BlogPost, ProjectBuildJob } from "@ancu/shared";
import type { ProjectSummary } from "../types";
import "./AdminPage.css";

const SECRET_KEY = "ancu-admin-secret";

type AdminTab = "projects" | "blog" | "tools" | "jobs";

function formatElapsed(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const rem = s % 60;
  if (m <= 0) return `${rem}s`;
  return `${m}m ${rem}s`;
}

function formatUpdated(iso?: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("vi-VN", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export default function AdminPage() {
  const [secret, setSecret] = useState(() => localStorage.getItem(SECRET_KEY) ?? "");
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState<AdminTab>("projects");
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [jobs, setJobs] = useState<ProjectBuildJob[]>([]);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [name, setName] = useState("");
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [activeJob, setActiveJob] = useState<ProjectBuildJob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [status, setStatus] = useState<string | null>(null);

  const [assistSlug, setAssistSlug] = useState("");
  const [assistDesc, setAssistDesc] = useState("");
  const [assistResult, setAssistResult] = useState<string | null>(null);

  const [imagePrompt, setImagePrompt] = useState("");
  const [imageResult, setImageResult] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState("");
  const [editBase64, setEditBase64] = useState("");
  const [editResult, setEditResult] = useState<string | null>(null);

  const [previewSlug, setPreviewSlug] = useState<string | null>(null);
  const [previewPost, setPreviewPost] = useState<BlogPost | null>(null);

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
      setError("Unauthorized — kiểm tra ADMIN_SECRET");
      return;
    }
    if (!res.ok) throw new Error("Không tải được dữ liệu admin");
    const data = (await res.json()) as {
      projects: ProjectSummary[];
      jobs: ProjectBuildJob[];
    };
    setProjects(data.projects);
    setJobs(data.jobs);
    setAuthed(true);
    localStorage.setItem(SECRET_KEY, secret);
    setAssistSlug((prev) => prev || data.projects[0]?.slug || "");

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
    setStatus(null);
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
      setStatus(`Đã tạo job build cho ${data.job.name}`);
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
      if (!res.ok) throw new Error("Tạo draft blog thất bại");
      const data = (await res.json()) as { post?: BlogPost };
      setStatus("Đã tạo draft blog tuần (chưa publish)");
      if (data.post) {
        setPreviewSlug(data.post.slug);
        setPreviewPost(data.post);
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Blog generate failed");
    } finally {
      setBusy(false);
    }
  }

  async function onPublishPost(slug: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/blog/${encodeURIComponent(slug)}`, {
        method: "POST",
        headers,
        body: JSON.stringify({ publish: true }),
      });
      if (!res.ok) throw new Error("Publish thất bại");
      setStatus(`Đã publish /blog/${slug}`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Publish failed");
    } finally {
      setBusy(false);
    }
  }

  async function onPreviewPost(slug: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/blog/${encodeURIComponent(slug)}`, { headers });
      if (!res.ok) throw new Error("Không tải được draft");
      const data = (await res.json()) as { post: BlogPost };
      setPreviewSlug(slug);
      setPreviewPost(data.post);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Preview failed");
    } finally {
      setBusy(false);
    }
  }

  async function onAssist(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setAssistResult(null);
    try {
      const res = await fetch("/api/admin/assist/2d3d", {
        method: "POST",
        headers,
        body: JSON.stringify({
          projectSlug: assistSlug,
          imageDescription: assistDesc,
        }),
      });
      if (!res.ok) throw new Error("2D→3D assist thất bại");
      const data = (await res.json()) as { result: unknown };
      setAssistResult(JSON.stringify(data.result, null, 2));
      setStatus("Đã chạy 2D→3D assist");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Assist failed");
    } finally {
      setBusy(false);
    }
  }

  async function onGenerateImage(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setImageResult(null);
    try {
      const res = await fetch("/api/admin/images/generate", {
        method: "POST",
        headers,
        body: JSON.stringify({ prompt: imagePrompt }),
      });
      if (!res.ok) throw new Error("Image generate thất bại");
      const data = (await res.json()) as { result: { r2Key?: string; note?: string; url?: string } };
      setImageResult(`${data.result.url ?? data.result.r2Key ?? "—"} · ${data.result.note ?? ""}`);
      setStatus("Đã generate ảnh");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Image generate failed");
    } finally {
      setBusy(false);
    }
  }

  async function onEditImage(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setEditResult(null);
    try {
      const res = await fetch("/api/admin/images/edit", {
        method: "POST",
        headers,
        body: JSON.stringify({ prompt: editPrompt, imageBase64: editBase64 }),
      });
      if (!res.ok) throw new Error("Image edit thất bại");
      const data = (await res.json()) as { result: { r2Key?: string; note?: string; url?: string } };
      setEditResult(`${data.result.url ?? data.result.r2Key ?? "—"} · ${data.result.note ?? ""}`);
      setStatus("Đã edit ảnh");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Image edit failed");
    } finally {
      setBusy(false);
    }
  }

  async function onApproveAll() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/projects/approve-all", {
        method: "POST",
        headers,
        body: "{}",
      });
      if (!res.ok) throw new Error("Approve all thất bại");
      const data = (await res.json()) as {
        apartmentUpdates?: number;
        nearbyUpdates?: number;
        projectUpdates?: number;
      };
      setStatus(
        `Đã duyệt: ${data.apartmentUpdates ?? 0} căn · ${data.nearbyUpdates ?? 0} tiện ích gần · ${data.projectUpdates ?? 0} dự án`,
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Approve failed");
    } finally {
      setBusy(false);
    }
  }

  function onDisconnect() {
    setAuthed(false);
    setSecret("");
    localStorage.removeItem(SECRET_KEY);
    setProjects([]);
    setJobs([]);
    setPosts([]);
    setActiveJob(null);
    setActiveJobId(null);
    setStatus(null);
    setError(null);
  }

  function onPickEditFile(file: File | null) {
    if (!file) {
      setEditBase64("");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const raw = String(reader.result ?? "");
      const base64 = raw.includes(",") ? raw.split(",")[1]! : raw;
      setEditBase64(base64);
    };
    reader.readAsDataURL(file);
  }

  const elapsedMs = (() => {
    if (!activeJob) return 0;
    if (
      activeJob.startedAt &&
      (activeJob.status === "running" || activeJob.status === "queued")
    ) {
      return Math.max(0, now - new Date(activeJob.startedAt).getTime());
    }
    return activeJob.events?.at(-1)?.elapsedMs ?? 0;
  })();

  const tabs: { id: AdminTab; label: string }[] = [
    { id: "projects", label: "Dự án" },
    { id: "blog", label: "Blog" },
    { id: "tools", label: "Công cụ" },
    { id: "jobs", label: "Jobs" },
  ];

  return (
    <div className="admin-page">
      <div className="admin-shell container">
        <header className="admin-topbar">
          <div className="admin-topbar-brand">
            <p className="admin-kicker">AnCư 3D · Operator</p>
            <h1>Admin</h1>
          </div>

          <div className="admin-topbar-actions">
            {authed ? (
              <>
                <span className="admin-connected" aria-live="polite">
                  Connected
                </span>
                <button type="button" className="btn btn-ghost" onClick={onDisconnect}>
                  Disconnect
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => void onApproveAll()}
                  disabled={busy}
                >
                  Duyệt tất cả pending
                </button>
              </>
            ) : (
              <form
                className="admin-auth-compact"
                onSubmit={(e) => {
                  e.preventDefault();
                  void load();
                }}
              >
                <label htmlFor="admin-secret" className="visually-hidden">
                  ADMIN_SECRET
                </label>
                <input
                  id="admin-secret"
                  type="password"
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  placeholder="ADMIN_SECRET"
                  autoComplete="off"
                />
                <button type="submit" className="btn btn-primary" disabled={!secret}>
                  Kết nối
                </button>
              </form>
            )}
          </div>
        </header>

        {error && (
          <p className="admin-error" role="alert">
            {error}
          </p>
        )}
        {status && <p className="admin-status">{status}</p>}

        {!authed && (
          <section className="admin-gate">
            <h2>Đăng nhập operator</h2>
            <p>Nhập ADMIN_SECRET để mở bảng điều khiển crawl, blog và công cụ AI.</p>
          </section>
        )}

        {authed && (
          <>
            <nav className="admin-tabs" role="tablist" aria-label="Admin sections">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  id={`admin-tab-${t.id}`}
                  aria-selected={tab === t.id}
                  aria-controls={`admin-panel-${t.id}`}
                  className={`admin-tab${tab === t.id ? " is-active" : ""}`}
                  onClick={() => setTab(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </nav>

            {tab === "projects" && (
              <div
                className="admin-panel"
                role="tabpanel"
                id="admin-panel-projects"
                aria-labelledby="admin-tab-projects"
              >
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
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={busy || !name.trim()}
                    >
                      Crawl &amp; build
                    </button>
                  </form>

                  {activeJob && (
                    <div className="admin-job">
                      <div className="admin-job-meta">
                        <strong>{activeJob.name}</strong>
                        <span className={`admin-badge status-${activeJob.status}`}>
                          {activeJob.status}
                        </span>
                        <span className="admin-badge">{activeJob.stage}</span>
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
                        <p className="admin-links">
                          <Link to={`/projects/${activeJob.slug}`}>Trang dự án</Link>
                          <Link to={`/projects/${activeJob.slug}/showroom`}>Showroom</Link>
                        </p>
                      )}
                    </div>
                  )}
                </section>

                <section className="admin-section">
                  <h2>Dự án ({projects.length})</h2>
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Tên</th>
                          <th>Slug</th>
                          <th>Status</th>
                          <th>Cập nhật</th>
                        </tr>
                      </thead>
                      <tbody>
                        {projects.map((p) => (
                          <tr key={p.id}>
                            <td>
                              <Link to={`/projects/${p.slug}`}>{p.name}</Link>
                            </td>
                            <td>
                              <code>{p.slug}</code>
                            </td>
                            <td>
                              <span className={`admin-badge status-${p.status ?? "published"}`}>
                                {p.status ?? "published"}
                              </span>
                            </td>
                            <td>{formatUpdated(p.updatedAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            )}

            {tab === "blog" && (
              <div
                className="admin-panel"
                role="tabpanel"
                id="admin-panel-blog"
                aria-labelledby="admin-tab-blog"
              >
                <div className="admin-section-head">
                  <h2>Blog</h2>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => void onGenerateBlog()}
                    disabled={busy}
                  >
                    Tạo draft tuần
                  </button>
                </div>

                <ul className="admin-list">
                  {posts.map((p) => (
                    <li key={p.id}>
                      <div>
                        <strong>{p.title}</strong>
                        <div className="admin-muted">
                          <code>{p.slug}</code> · {p.status}
                        </div>
                      </div>
                      <div className="admin-row-actions">
                        <button
                          type="button"
                          className="btn btn-ghost"
                          onClick={() => void onPreviewPost(p.slug)}
                        >
                          Xem trước
                        </button>
                        {p.status !== "published" && (
                          <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => void onPublishPost(p.slug)}
                            disabled={busy}
                          >
                            Publish
                          </button>
                        )}
                        {p.status === "published" && <Link to={`/blog/${p.slug}`}>Mở</Link>}
                      </div>
                    </li>
                  ))}
                  {posts.length === 0 && <li>Chưa có bài</li>}
                </ul>

                {previewPost && previewSlug && (
                  <div className="admin-preview">
                    <h3>Draft preview · {previewSlug}</h3>
                    <p className="admin-muted">{previewPost.excerpt}</p>
                    <pre>{previewPost.bodyMarkdown}</pre>
                  </div>
                )}
              </div>
            )}

            {tab === "tools" && (
              <div
                className="admin-panel admin-panel-split"
                role="tabpanel"
                id="admin-panel-tools"
                aria-labelledby="admin-tab-tools"
              >
                <section className="admin-section">
                  <h2>2D → 3D assist</h2>
                  <form className="admin-stack" onSubmit={(e) => void onAssist(e)}>
                    <label>
                      Project slug
                      <select value={assistSlug} onChange={(e) => setAssistSlug(e.target.value)}>
                        {projects.map((p) => (
                          <option key={p.slug} value={p.slug}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Mô tả ảnh mặt đứng / render
                      <textarea
                        value={assistDesc}
                        onChange={(e) => setAssistDesc(e.target.value)}
                        rows={3}
                        required
                        placeholder="Facade glass, warm wood lobby, evening light…"
                      />
                    </label>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={busy || !assistDesc.trim()}
                    >
                      Chạy assist
                    </button>
                  </form>
                  {assistResult && <pre className="admin-preview">{assistResult}</pre>}
                </section>

                <section className="admin-section">
                  <h2>Tạo ảnh</h2>
                  <form className="admin-stack" onSubmit={(e) => void onGenerateImage(e)}>
                    <textarea
                      value={imagePrompt}
                      onChange={(e) => setImagePrompt(e.target.value)}
                      rows={3}
                      required
                      placeholder="Warm showroom interior, HCMC daylight…"
                    />
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={busy || !imagePrompt.trim()}
                    >
                      Generate
                    </button>
                  </form>
                  {imageResult && (
                    <>
                      <p className="admin-muted">{imageResult}</p>
                      {imageResult.startsWith("/api/media/") && (
                        <img src={imageResult.split(" · ")[0]} alt="" className="admin-media-preview" />
                      )}
                    </>
                  )}

                  <h3>Sửa ảnh</h3>
                  <form className="admin-stack" onSubmit={(e) => void onEditImage(e)}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => onPickEditFile(e.target.files?.[0] ?? null)}
                    />
                    <textarea
                      value={editPrompt}
                      onChange={(e) => setEditPrompt(e.target.value)}
                      rows={2}
                      required
                      placeholder="Softer evening light, keep architecture…"
                    />
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={busy || !editPrompt.trim() || !editBase64}
                    >
                      Edit
                    </button>
                  </form>
                  {editResult && <p className="admin-muted">{editResult}</p>}
                </section>
              </div>
            )}

            {tab === "jobs" && (
              <div
                className="admin-panel"
                role="tabpanel"
                id="admin-panel-jobs"
                aria-labelledby="admin-tab-jobs"
              >
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
                          setTab("projects");
                        }}
                      >
                        {j.name}
                      </button>
                      <span className={`admin-badge status-${j.status}`}>{j.status}</span>
                    </li>
                  ))}
                  {jobs.length === 0 && <li>Chưa có job</li>}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
