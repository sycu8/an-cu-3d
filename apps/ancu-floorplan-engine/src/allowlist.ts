export const DEFAULT_ALLOWLIST_DOMAINS = [
  "gamudaland.com.vn",
  "www.gamudaland.com.vn",
  "gamuda.com.vn",
  "www.gamuda.com.vn",
  "gamudacity.com.vn",
  "www.gamudacity.com.vn",
] as const;

const PRIVATE_IPV4_RANGES = [
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^169\.254\./,
  /^0\./,
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
];

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "metadata.google.internal",
  "metadata",
]);

export type UrlValidationResult =
  | { ok: true; url: URL }
  | { ok: false; reason: string };

export function normalizeHostname(hostname: string): string {
  return hostname.toLowerCase().replace(/\.$/, "");
}

export function isAllowlistedDomain(
  hostname: string,
  allowlist: readonly string[] = DEFAULT_ALLOWLIST_DOMAINS,
): boolean {
  const host = normalizeHostname(hostname);
  return allowlist.some((domain) => {
    const d = normalizeHostname(domain);
    return host === d || host.endsWith(`.${d}`);
  });
}

export function isPrivateOrBlockedHost(hostname: string): boolean {
  const host = normalizeHostname(hostname);
  if (BLOCKED_HOSTNAMES.has(host)) return true;
  if (host.endsWith(".local") || host.endsWith(".internal")) return true;

  if (host.includes(":")) {
    const lower = host.toLowerCase();
    if (lower === "::1" || lower.startsWith("fc") || lower.startsWith("fd")) {
      return true;
    }
  }

  for (const pattern of PRIVATE_IPV4_RANGES) {
    if (pattern.test(host)) return true;
  }

  return false;
}

export function validateAllowlistedUrl(
  rawUrl: string,
  allowlist: readonly string[] = DEFAULT_ALLOWLIST_DOMAINS,
): UrlValidationResult {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { ok: false, reason: "invalid_url" };
  }

  if (parsed.protocol !== "https:") {
    return { ok: false, reason: "https_only" };
  }

  if (isPrivateOrBlockedHost(parsed.hostname)) {
    return { ok: false, reason: "private_or_blocked_host" };
  }

  if (!isAllowlistedDomain(parsed.hostname, allowlist)) {
    return { ok: false, reason: "domain_not_allowlisted" };
  }

  return { ok: true, url: parsed };
}

/** Stub: validate redirect target stays on allowlist and https. */
export function validateRedirectTarget(
  redirectUrl: string,
  allowlist: readonly string[] = DEFAULT_ALLOWLIST_DOMAINS,
): UrlValidationResult {
  return validateAllowlistedUrl(redirectUrl, allowlist);
}

export const FETCH_LIMITS = {
  maxBytes: 15 * 1024 * 1024,
  allowedContentTypes: [
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/gif",
    "application/pdf",
    "text/html",
  ],
} as const;

/** Stub: reject disallowed content types. */
export function validateContentType(contentType: string | null): boolean {
  if (!contentType) return false;
  const base = contentType.split(";")[0]?.trim().toLowerCase() ?? "";
  return (FETCH_LIMITS.allowedContentTypes as readonly string[]).includes(base);
}

/** Stub: reject oversized payloads. */
export function validateContentLength(
  contentLength: number | null,
  maxBytes = FETCH_LIMITS.maxBytes,
): boolean {
  if (contentLength === null) return true;
  return contentLength >= 0 && contentLength <= maxBytes;
}
