import { useEffect, useState } from "react";
import type { ProjectDetail, ProjectSummary } from "../types";
import { getProjectBySlug, getProjectSummaries } from "../data/gamuda-projects";
import { fetchProject, fetchProjects } from "../lib/api";

type LoadState<T> =
  | { status: "loading" }
  | { status: "ready"; data: T; source: "api" | "seed" }
  | { status: "error"; error: string; data?: T };

/**
 * Prefer live `/api/projects` (D1+seed merge). Fall back to in-memory seed
 * when the API is unavailable so local/static demos still work.
 */
export function useProjectSummaries(): LoadState<ProjectSummary[]> {
  const [state, setState] = useState<LoadState<ProjectSummary[]>>({
    status: "loading",
  });

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const projects = await fetchProjects();
        if (!cancelled) setState({ status: "ready", data: projects, source: "api" });
      } catch (err) {
        const seed = getProjectSummaries();
        if (!cancelled) {
          setState({
            status: seed.length ? "ready" : "error",
            data: seed,
            source: "seed",
            error: err instanceof Error ? err.message : "Failed to load projects",
          } as LoadState<ProjectSummary[]>);
          if (seed.length) {
            setState({ status: "ready", data: seed, source: "seed" });
          }
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

export function useProject(slug: string | undefined): LoadState<ProjectDetail> {
  const [state, setState] = useState<LoadState<ProjectDetail>>({
    status: "loading",
  });

  useEffect(() => {
    if (!slug) {
      setState({ status: "error", error: "Missing project slug" });
      return;
    }
    let cancelled = false;
    void (async () => {
      setState({ status: "loading" });
      try {
        const project = await fetchProject(slug);
        if (!cancelled) setState({ status: "ready", data: project, source: "api" });
      } catch (err) {
        const seed = getProjectBySlug(slug);
        if (!cancelled) {
          if (seed) {
            setState({ status: "ready", data: seed, source: "seed" });
          } else {
            setState({
              status: "error",
              error: err instanceof Error ? err.message : `Project not found: ${slug}`,
            });
          }
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return state;
}
