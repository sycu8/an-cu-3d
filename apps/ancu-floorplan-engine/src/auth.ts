export async function timingSafeEqualStrings(
  a: string,
  b: string,
): Promise<boolean> {
  const encoder = new TextEncoder();
  const aBytes = encoder.encode(a);
  const bBytes = encoder.encode(b);

  if (aBytes.byteLength !== bBytes.byteLength) {
    return false;
  }

  return crypto.subtle.timingSafeEqual(aBytes, bBytes);
}

export async function verifyBearerToken(
  authorizationHeader: string | undefined,
  expectedSecret: string | undefined,
): Promise<boolean> {
  if (!expectedSecret) return false;
  if (!authorizationHeader?.startsWith("Bearer ")) return false;

  const token = authorizationHeader.slice("Bearer ".length).trim();
  if (!token) return false;

  return timingSafeEqualStrings(token, expectedSecret);
}
