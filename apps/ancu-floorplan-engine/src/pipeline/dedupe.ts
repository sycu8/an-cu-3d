export async function sha256Hex(bytes: ArrayBuffer | Uint8Array): Promise<string> {
  const buffer = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export type DedupeResult = {
  contentHash: string | null;
  isDuplicate: boolean;
};

export async function dedupeByBytes(
  bytes: ArrayBuffer | Uint8Array | null | undefined,
  knownHashes: Set<string>,
): Promise<DedupeResult> {
  if (!bytes) {
    return { contentHash: null, isDuplicate: false };
  }

  const contentHash = await sha256Hex(bytes);
  return {
    contentHash,
    isDuplicate: knownHashes.has(contentHash),
  };
}
