/** Official developer (CĐT) public sites. */
export const DEVELOPER_ALLOWLIST_DOMAINS = [
  // Gamuda Land
  "gamudaland.com.vn",
  "www.gamudaland.com.vn",
  "gamuda.com.vn",
  "www.gamuda.com.vn",
  "gamudacity.com.vn",
  "www.gamudacity.com.vn",
  // Vinhomes / Vingroup
  "vinhomes.vn",
  "www.vinhomes.vn",
  "vinhomes.com.vn",
  "www.vinhomes.com.vn",
  "vingroup.net",
  "www.vingroup.net",
  // Ecopark
  "ecopark.com.vn",
  "www.ecopark.com.vn",
  // Đất Xanh / Bluemarq
  "datxanh.com.vn",
  "www.datxanh.com.vn",
  "dxg.com.vn",
  "www.dxg.com.vn",
  "bluemarq.vn",
  "www.bluemarq.vn",
] as const;

/**
 * Reputable VN listing / research sites.
 * Secondary-market price references only — never official CĐT sheets.
 */
export const SECONDARY_MARKET_ALLOWLIST_DOMAINS = [
  "batdongsan.com.vn",
  "www.batdongsan.com.vn",
  "nhadat247.com.vn",
  "www.nhadat247.com.vn",
  "mogi.vn",
  "www.mogi.vn",
  "homedy.com",
  "www.homedy.com",
  "cafeland.vn",
  "www.cafeland.vn",
  "vietnambiz.vn",
  "www.vietnambiz.vn",
] as const;

export const DEFAULT_ALLOWLIST_DOMAINS = [
  ...DEVELOPER_ALLOWLIST_DOMAINS,
  ...SECONDARY_MARKET_ALLOWLIST_DOMAINS,
] as const;

export function crawlChannelForHost(
  hostname: string,
): "developer" | "secondary_market" | null {
  if (isAllowlistedDomain(hostname, DEVELOPER_ALLOWLIST_DOMAINS)) return "developer";
  if (isAllowlistedDomain(hostname, SECONDARY_MARKET_ALLOWLIST_DOMAINS)) {
    return "secondary_market";
  }
  return null;
}

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

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, reason: "invalid_protocol" };
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
