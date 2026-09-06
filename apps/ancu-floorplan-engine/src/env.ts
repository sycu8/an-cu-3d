export type ProductionEnv = {
  ENVIRONMENT?: string;
  ENGINE_API_SECRET?: string;
};

export function assertProductionEnv(env: ProductionEnv): void {
  if (env.ENVIRONMENT !== "production") return;

  const secret = env.ENGINE_API_SECRET ?? "";
  if (secret.length < 16) {
    throw new Error(
      "ENGINE_API_SECRET must be at least 16 characters when ENVIRONMENT=production",
    );
  }
}
