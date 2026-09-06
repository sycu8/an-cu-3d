/** Timing-safe bearer auth for admin routes. */

export async function verifyAdminBearer(
  authorization: string | null,
  secret: string | undefined,
): Promise<boolean> {
  if (!secret || secret.length < 8) return false;
  if (!authorization?.startsWith("Bearer ")) return false;
  const token = authorization.slice("Bearer ".length).trim();
  if (!token) return false;

  const enc = new TextEncoder();
  const a = enc.encode(token);
  const b = enc.encode(secret);
  if (a.byteLength !== b.byteLength) {
    // still hash compare length-padded to avoid early exit timing on length alone being useful
    const digA = await crypto.subtle.digest("SHA-256", a);
    const digB = await crypto.subtle.digest("SHA-256", b);
    return timingSafeEqual(new Uint8Array(digA), new Uint8Array(digB)) && false;
  }
  return timingSafeEqual(a, b);
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.byteLength !== b.byteLength) return false;
  let out = 0;
  for (let i = 0; i < a.byteLength; i++) {
    out |= a[i] ^ b[i];
  }
  return out === 0;
}
