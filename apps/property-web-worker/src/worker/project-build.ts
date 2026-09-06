import type { ProjectBuildStage } from "@ancu/shared";
import type { Env } from "./types";
import { appendBuildEvent, updateBuildJob } from "./db/jobs";
import { upsertSynthesizedProject } from "./db/projects";
import {
  assist2dTo3d,
  crawlSources,
  discoverSources,
  generateImageAsset,
  synthesizeProject,
} from "./ai/pipeline";

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

    // Optional engine crawl enrichment — never blocks failure of whole job
    if (env.ENGINE_BASE_URL && env.ENGINE_API_SECRET) {
      await emit(env, job.id, startedAt, "crawl", "Gọi floorplan-engine crawl (bổ sung)…");
      try {
        await fetch(`${env.ENGINE_BASE_URL.replace(/\/$/, "")}/sources/crawl`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${env.ENGINE_API_SECRET}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            seedUrl: discovered.sources[0]?.url,
            projectSlug: job.slug,
          }),
        });
        await emit(env, job.id, startedAt, "crawl", "Engine crawl đã enqueue");
      } catch (err) {
        await emit(
          env,
          job.id,
          startedAt,
          "crawl",
          `Engine crawl bỏ qua: ${err instanceof Error ? err.message : "error"}`,
        );
      }
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

    await emit(env, job.id, startedAt, "assets", "Tạo asset hình ảnh hỗ trợ / prompt…");
    const cover = await generateImageAsset(
      env,
      `Architectural hero photo of ${project.name} residential project in Ho Chi Minh City, showroom quality, natural light`,
      `projects/${job.slug}/media/cover-${job.id}`,
    );
    await emit(env, job.id, startedAt, "assets", `Asset: ${cover.r2Key} (${cover.note})`);

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

    if (env.ENGINE_BASE_URL && env.ENGINE_API_SECRET) {
      try {
        await fetch(`${env.ENGINE_BASE_URL.replace(/\/$/, "")}/jobs`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${env.ENGINE_API_SECRET}`,
            "Content-Type": "application/json",
            "X-AnCu-Admin-Build": "1",
          },
          body: JSON.stringify({
            projectSlug: job.slug,
            bypassRateLimit: true,
            note: "admin project build",
          }),
        });
        await emit(env, job.id, startedAt, "floorplans", "Conversion job gửi tới engine (no admin timeout)");
      } catch {
        await emit(env, job.id, startedAt, "floorplans", "Conversion job engine bỏ qua");
      }
    }

    await emit(env, job.id, startedAt, "persist", "Ghi D1 projects / amenities / units…");
    const projectId = await upsertSynthesizedProject(env.DB, project);
    await emit(env, job.id, startedAt, "persist", `Đã lưu project id=${projectId}`);

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
