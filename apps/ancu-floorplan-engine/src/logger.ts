export function logJob(
  level: "info" | "warn" | "error",
  message: string,
  fields: Record<string, unknown> = {},
): void {
  console.log(
    JSON.stringify({
      level,
      message,
      service: "ancu-floorplan-engine",
      ts: new Date().toISOString(),
      ...fields,
    }),
  );
}
