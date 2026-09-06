import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import type { BlogPost, ProjectBuildJob } from "@ancu/shared";
import type { ProjectSummary } from "../types";
import "./AdminPage.css";

const TOKEN_KEY = "ancu-admin-token";
/** Clear legacy ADMIN_SECRET storage from older builds. */
const LEGACY_SECRET_KEY = "ancu-admin-secret";

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

function authErrorMessage(code: string | undefined): string {
  switch (code) {
    case "invalid_credentials":
      return "Sai username hoặc password";
    case "password_change_required":
      return "Bạn phải đổi mật khẩu trước khi tiếp tục";
    case "password_too_short":
      return "Mật khẩu mới tối thiểu 8 ký tự";
    case "password_is_default":
      return "Không được dùng mật khẩu mặc định admin";
    case "password_matches_username":
      return "Mật khẩu không được trùng username";
    case "invalid_current_password":
      return "Mật khẩu hiện tại không đúng";
    case "auth_unavailable":
      return "Auth chưa sẵn sàng (kiểm tra D1 migration)";
    default:
      return "Đăng nhập thất bại";
  }
}

export default function AdminPage() {
  const [token, setToken] = useState(() => {
    localStorage.removeItem(LEGACY_SECRET_KEY);
    return localStorage.getItem(TOKEN_KEY) ?? "";
  });
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [adminUsername, setAdminUsername] = useState<string | null>(null);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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

  const [editPrompt, setEditPrompt] = useState("");
  const [editBase64, setEditBase64] = useState("");
  const [editResult, setEditResult] = useState<string | null>(null);

  const [previewSlug, setPreviewSlug] = useState<string | null>(null);
  const [previewPost, setPreviewPost] = useState<BlogPost | null>(null);

  const headers = useMemo(
    () => ({
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    }),
    [token],
  );

  const persistSession = useCallback(
    (nextToken: string, nextUsername: string, nextMustChange: boolean) => {
      setToken(nextToken);
      setAdminUsername(nextUsername);
      setMustChangePassword(nextMustChange);
      localStorage.setItem(TOKEN_KEY, nextToken);
      setAuthed(!nextMustChange);
      if (nextMustChange) {
        setProjects([]);
        setJobs([]);
        setPosts([]);
      }
    },
    [],
  );

  const clearSession = useCallback(() => {
    setToken("");
    setAdminUsername(null);
    setMustChangePassword(false);
    setAuthed(false);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(LEGACY_SECRET_KEY);
    setProjects([]);
    setJobs([]);
    setPosts([]);
    setActiveJob(null);
    setActiveJobId(null);
  }, []);

  const load = useCallback(async () => {
    if (!token || mustChangePassword) return;
    setError(null);
    const res = await fetch("/api/admin/projects", { headers });
    if (res.status === 401) {
      clearSession();
      setError("Phiên đăng nhập hết hạn — đăng nhập lại");
      return;
    }
    if (res.status === 403) {
      const body = (await res.json().catch(() => ({}))) as {
        error?: string;
        mustChangePassword?: boolean;
      };
      if (body.mustChangePassword || body.error === "password_change_required") {
        setMustChangePassword(true);
        setAuthed(false);
        setError(authErrorMessage("password_change_required"));
        return;
      }
    }
    if (!res.ok) throw new Error("Không tải được dữ liệu admin");
    const data = (await res.json()) as {
      projects: ProjectSummary[];
      jobs: ProjectBuildJob[];
    };
    setProjects(data.projects);
    setJobs(data.jobs);
    setAuthed(true);
    setAssistSlug((prev) => prev || data.projects[0]?.slug || "");

    const blogRes = await fetch("/api/admin/blog", { headers });
    if (blogRes.ok) {
      const blogData = (await blogRes.json()) as { posts: BlogPost[] };
      setPosts(blogData.posts);
    }
  }, [clearSession, headers, mustChangePassword, token]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/admin/me", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (cancelled) return;
        if (res.status === 401) {
          clearSession();
          return;
        }
        if (!res.ok) {
          setError("Không kiểm tra được phiên đăng nhập");
          return;
        }
        const me = (await res.json()) as {
          username: string;
          mustChangePassword: boolean;
        };
        if (cancelled) return;
        setAdminUsername(me.username);
        setMustChangePassword(me.mustChangePassword);
        if (me.mustChangePassword) {
          setAuthed(false);
          return;
        }
        await load();
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Session restore failed");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // Re-check session when the bearer token changes (login / password change / restore).
    // eslint-disable-next-line react-hooks/exhaustive-deps -- avoid re-entry when mustChangePassword flips load identity
  }, [token]);

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        error?: string;
        token?: string;
        username?: string;
        mustChangePassword?: boolean;
      };
      if (!res.ok || !body.token || !body.username) {
        setError(authErrorMessage(body.error));
        return;
      }
      setPassword("");
      persistSession(body.token, body.username, Boolean(body.mustChangePassword));
      if (!body.mustChangePassword) {
        // load triggered via token effect + restoreSession
      } else {
        setCurrentPassword("admin");
        setStatus("Lần đăng nhập đầu — hãy đổi mật khẩu mặc định.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  async function onChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Xác nhận mật khẩu không khớp");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/change-password", {
        method: "POST",
        headers,
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        error?: string;
        token?: string;
        username?: string;
        mustChangePassword?: boolean;
      };
      if (!res.ok || !body.token || !body.username) {
        setError(authErrorMessage(body.error));
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setStatus("Đã đổi mật khẩu.");
      persistSession(body.token, body.username, false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Change password failed");
    } finally {
      setBusy(false);
    }
  }

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

  async function onDisconnect() {
    if (token) {
      try {
        await fetch("/api/admin/logout", { method: "POST", headers });
      } catch {
        /* ignore */
      }
    }
    clearSession();
    setUsername("");
    setPassword("");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
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
                  {adminUsername ?? "Connected"}
                </span>
                <button type="button" className="btn btn-ghost" onClick={() => void onDisconnect()}>
                  Đăng xuất
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
            ) : null}
          </div>
        </header>

        {error && (
          <p className="admin-error" role="alert">
            {error}
          </p>
        )}
        {status && <p className="admin-status">{status}</p>}

        {!authed && !mustChangePassword && (
          <section className="admin-gate">
            <h2>Đăng nhập operator</h2>
            <p>Chỉ tài khoản admin. Lần đầu dùng mật khẩu mặc định rồi đổi ngay.</p>
            <form className="admin-stack admin-login-form" onSubmit={(e) => void onLogin(e)}>
              <label htmlFor="admin-username">
                Username
                <input
                  id="admin-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  required
                />
              </label>
              <label htmlFor="admin-password">
                Password
                <input
                  id="admin-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </label>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={busy || !username || !password}
              >
                Đăng nhập
              </button>
            </form>
          </section>
        )}

        {mustChangePassword && (
          <section className="admin-gate">
            <h2>Đổi mật khẩu bắt buộc</h2>
            <p>
              Tài khoản <strong>{adminUsername}</strong> đang dùng mật khẩu mặc định. Đặt mật khẩu
              mới (tối thiểu 8 ký tự) trước khi vào bảng điều khiển.
            </p>
            <form
              className="admin-stack admin-login-form"
              onSubmit={(e) => void onChangePassword(e)}
            >
              <label htmlFor="admin-current-password">
                Mật khẩu hiện tại
                <input
                  id="admin-current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </label>
              <label htmlFor="admin-new-password">
                Mật khẩu mới
                <input
                  id="admin-new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </label>
              <label htmlFor="admin-confirm-password">
                Xác nhận mật khẩu mới
                <input
                  id="admin-confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </label>
              <div className="admin-row-actions">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={busy || !currentPassword || !newPassword || !confirmPassword}
                >
                  Lưu mật khẩu
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => void onDisconnect()}>
                  Đăng xuất
                </button>
              </div>
            </form>
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
                  <h2>Hình dự án</h2>
                  <p className="admin-muted">
                    Chính sách: hình dự án chỉ dùng ảnh thật hoặc hình từ chủ đầu tư (CĐT). Không tạo /
                    generate ảnh dự án bằng AI. Upload media CĐT hoặc dùng seed crawl từ trang chính thức.
                  </p>

                  <h3>Sửa ảnh (không dùng cho cover dự án)</h3>
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
