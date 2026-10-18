import type { ProjectBuildStage } from "@ancu/shared";
import type { Env } from "./types";
import { appendBuildEvent, updateBuildJob } from "./db/jobs";
import { upsertSynthesizedProject, updateProjectCoverR2Key } from "./db/projects";
import {
  assist2dTo3d,
  crawlSources,
  discoverSources,
  runFactualQa,
  synthesizeProject,
} from "./ai/pipeline";

/** 401/5xx (and any other non-2xx) fail the build instead of being logged as success. */
async function assertEngineOk(res: Response, action: string): Promise<void> {
  if (!res.ok) {
    const status = res.status;
    await res.body?.cancel();
    throw new Error(`${action} failed: HTTP ${status}`);
  }
  await res.body?.cancel();
}

function engineTarget(env: Env): { baseUrl: string; secret: string } | null {
  const baseUrl = env.ENGINE_BASE_URL?.trim().replace(/\/$/, "") ?? "";
  const secret = env.ENGINE_API_SECRET ?? "";
  if (!baseUrl || !secret.trim()) return null;
  return { baseUrl, secret };
}

function engineSkipMessage(env: Env): string {
  const missing: string[] = [];
  if (!env.ENGINE_BASE_URL?.trim()) missing.push("ENGINE_BASE_URL");
  if (!env.ENGINE_API_SECRET?.trim()) missing.push("ENGINE_API_SECRET");
  return `Engine calls skipped: web Worker has no ${missing.join(" or ")}`;
}

async function emit(
  env: Env,
  jobId: string,
  startedAt: number,
  stage: ProjectBuildStage,
  message: string,
): Promise<void> {
  const atMs = Date.now();
  await appendBuildEvent(env.DB, {
    id: crypto.randomUUID(),
    jobId,
    stage,
    message,
    atMs,
    elapsedMs: atMs - startedAt,
  });
}

/**
 * Long-running project build. No rate limiting / artificial timeout.
 * Invoked via waitUntil from the admin API.
 */
export async function runProjectBuild(
  env: Env,
  job: { id: string; name: string; slug: string },
): Promise<void> {
  const startedAt = Date.now();
  await updateBuildJob(env.DB, job.id, {
    status: "running",
    stage: "discover",
    startedAt: new Date().toISOString(),
    error: null,
  });

  try {
    await emit(env, job.id, startedAt, "discover", `Đang tìm nguồn cho “${job.name}”…`);
    const discovered = await discoverSources(job.name, job.slug);
    await emit(
      env,
      job.id,
      startedAt,
      "discover",
      `Tìm thấy ${discovered.sources.length} nguồn gợi ý (${discovered.queryHints.join("; ")})`,
    );

    await emit(env, job.id, startedAt, "crawl", "Đang crawl / lấy nội dung nguồn…");
    const crawled = await crawlSources(discovered.sources);
    await emit(
      env,
      job.id,
      startedAt,
      "crawl",
      `Đã lấy ${crawled.length} snippet (không giới hạn thời gian tác vụ)`,
    );

    const engine = engineTarget(env);
    if (!engine) {
      const skipped = engineSkipMessage(env);
      console.warn(JSON.stringify({ level: "warn", message: skipped }));
      await emit(env, job.id, startedAt, "crawl", skipped);
    } else {
      await emit(env, job.id, startedAt, "crawl", "Gọi floorplan-engine crawl (bổ sung)…");
      const crawlRes = await fetch(`${engine.baseUrl}/sources/crawl`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${engine.secret}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: discovered.sources[0]?.url,
          projectSlug: job.slug,
        }),
      });
      await assertEngineOk(crawlRes, "Engine crawl");
      await emit(env, job.id, startedAt, "crawl", "Engine crawl đã enqueue");
    }

    await emit(env, job.id, startedAt, "synthesize", "AI Gateway đang tổng hợp thông tin dự án…");
    const { project, chat } = await synthesizeProject(env, job.name, crawled);
    await emit(
      env,
      job.id,
      startedAt,
      "synthesize",
      chat
        ? `Tổng hợp xong via ${chat.source} (${chat.model}, ${chat.latencyMs}ms)`
        : "Tổng hợp bằng fallback deterministic (chưa cấu hình AI Gateway)",
    );

    await emit(env, job.id, startedAt, "synthesize", "QA thực tế — đối chiếu claims với nguồn…");
    const claims = [
      project.priceRange,
      project.handover,
      project.totalUnits,
      project.address,
      ...project.apartmentTypes.map((a) => a.areaSqm),
    ].join("\n");
    const sources = crawled.map((c) => `### ${c.label}\n${c.snippet}`).join("\n\n");
    const qa = await runFactualQa(env, claims, sources);
    await emit(
      env,
      job.id,
      startedAt,
      "synthesize",
      qa.ok
        ? `QA OK (${qa.source})`
        : `QA flags: ${qa.issues.slice(0, 3).join("; ") || "issues"} (${qa.source})`,
    );

    await emit(
      env,
      job.id,
      startedAt,
      "assets",
      "Bỏ qua AI image generation — hình dự án chỉ dùng ảnh thật / CĐT (seed hoặc upload).",
    );
    const cover = { r2Key: null as string | null, note: "skipped_ai_project_cover_policy" };

    await emit(env, job.id, startedAt, "floorplans", "Gắn floorplan mẫu + 2D→3D assist…");
    const assist = await assist2dTo3d(
      env,
      job.slug,
      `Facade / marketing render for ${project.name}. Modern mid-rise residential, warm materials.`,
    );
    await emit(
      env,
      job.id,
      startedAt,
      "floorplans",
      `Assist ${assist.assistJsonKey}; units linked to sample plans`,
    );

    
    if (assist.materials) {
      project.showroom = {
        ...project.showroom,
        materialFromPhoto: {
          floor: assist.materials.floor ?? "#d9cbb8",
          wall: assist.materials.wall ?? "#f4efe8",
          cabinet: assist.materials.cabinet ?? "#8b7355",
          accent: assist.materials.accent ?? "#285A52",
          notes: assist.notes,
        },
        materialPaletteLabel: project.showroom?.materialPaletteLabel ?? "Ivory ấm",
      };
    }

    let conversionError: string | null = null;
    if (engine) {
      try {
        const jobRes = await fetch(`${engine.baseUrl}/jobs`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${engine.secret}`,
            "Content-Type": "application/json",
            "X-AnCu-Admin-Build": "1",
          },
          body: JSON.stringify({
            projectSlug: job.slug,
            bypassRateLimit: true,
            note: "admin project build",
          }),
        });
        await assertEngineOk(jobRes, "Engine conversion");
        await emit(env, job.id, startedAt, "floorplans", "Conversion job gửi tới engine (no admin timeout)");
      } catch (err) {
        conversionError = err instanceof Error ? err.message : "engine_jobs_failed";
        await emit(env, job.id, startedAt, "floorplans", conversionError);
      }
    }

    await emit(env, job.id, startedAt, "persist", "Ghi D1 projects / amenities / units…");
    const projectId = await upsertSynthesizedProject(env.DB, project);
    if (cover.r2Key && !String(cover.r2Key).endsWith(".json")) {
      await updateProjectCoverR2Key(env.DB, job.slug, cover.r2Key);
    }
    await emit(env, job.id, startedAt, "persist", `Đã lưu project id=${projectId}`);

    if (conversionError) {
      const result = {
        projectId,
        slug: job.slug,
        path: `/projects/${job.slug}`,
        persisted: true,
        engineJobs: "failed",
      };
      await updateBuildJob(env.DB, job.id, {
        status: "failed",
        stage: "failed",
        finishedAt: new Date().toISOString(),
        error: conversionError,
        resultJson: JSON.stringify(result),
      });
      await emit(env, job.id, startedAt, "failed", conversionError);
      return;
    }

    await emit(env, job.id, startedAt, "publish", "Xuất bản trang dự án…");
    const result = {
      projectId,
      slug: job.slug,
      path: `/projects/${job.slug}`,
      showroomPath: `/projects/${job.slug}/showroom`,
      cover: cover.r2Key,
      assist: assist.assistJsonKey,
      elapsedMs: Date.now() - startedAt,
    };
    await updateBuildJob(env.DB, job.id, {
      status: "completed",
      stage: "completed",
      finishedAt: new Date().toISOString(),
      resultJson: JSON.stringify(result),
    });
    await emit(
      env,
      job.id,
      startedAt,
      "completed",
      `Hoàn tất sau ${result.elapsedMs}ms — /projects/${job.slug}`,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "project_build_failed";
    await updateBuildJob(env.DB, job.id, {
      status: "failed",
      stage: "failed",
      finishedAt: new Date().toISOString(),
      error: message,
    });
    await emit(env, job.id, startedAt, "failed", message);
  }
}
