import type { ProjectDetail, ProjectSummary } from "../types";

export async function fetchProjects(): Promise<ProjectSummary[]> {
  const res = await fetch("/api/projects");
  if (!res.ok) throw new Error("Failed to fetch projects");
  const data = (await res.json()) as { projects: ProjectSummary[] };
  return data.projects;
}

export async function fetchProject(slug: string): Promise<ProjectDetail> {
  const res = await fetch(`/api/projects/${slug}`);
  if (!res.ok) throw new Error(`Failed to fetch project: ${slug}`);
  const data = (await res.json()) as { project: ProjectDetail };
  return data.project;
}

export async function fetchHealth(): Promise<{ status: string; db: string }> {
  const res = await fetch("/api/health");
  if (!res.ok) throw new Error("Health check failed");
  return res.json() as Promise<{ status: string; db: string }>;
}
