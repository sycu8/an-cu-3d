export type VisionCacheRecord = {
  model: string;
  modelVersion: string;
  inputHash: string;
  promptVersion: string;
  output: {
    candidates: Array<Record<string, string | number | boolean | null>>;
  };
  confidence: number;
  createdAt: string;
};

export async function runVisionStub(input: {
  inputHash: string;
  assetId: string;
}): Promise<VisionCacheRecord> {
  return {
    model: "stub-vision",
    modelVersion: "0.0.0",
    inputHash: input.inputHash,
    promptVersion: "p12-stub-v1",
    output: { candidates: [] },
    confidence: 0,
    createdAt: new Date().toISOString(),
  };
}
