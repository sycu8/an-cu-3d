/** Project build job types — admin name → crawl → publish. */

export const PROJECT_BUILD_STAGES = [
  "queued",
  "discover",
  "crawl",
  "synthesize",
  "assets",
  "floorplans",
  "persist",
  "publish",
  "completed",
  "failed",
] as const;

export type ProjectBuildStage = (typeof PROJECT_BUILD_STAGES)[number];

export type ProjectBuildJobStatus = "queued" | "running" | "completed" | "failed";

export type ProjectBuildEvent = {
  id: string;
  jobId: string;
  stage: ProjectBuildStage;
  message: string;
  atMs: number;
  elapsedMs: number;
};

export type ProjectBuildJob = {
  id: string;
  name: string;
  slug: string;
  status: ProjectBuildJobStatus;
  stage: ProjectBuildStage;
  startedAt: string | null;
  finishedAt: string | null;
  error: string | null;
  resultJson: string | null;
  createdAt: string;
  updatedAt?: string;
  events?: ProjectBuildEvent[];
};

export function slugifyProjectName(name: string): string {
  return (
    name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/đ/g, "d")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "project"
  );
}
