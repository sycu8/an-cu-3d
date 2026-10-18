export function buildTargetEnvironment(cloudflareEnv: string | undefined): string;
export function stampBuildEnvironment(
  distDir: string,
  cloudflareEnv: string | undefined,
): { target: string; files: string[] };
