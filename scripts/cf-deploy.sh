#!/usr/bin/env bash
# Provision Cloudflare resources (idempotent) and deploy AnCư apps.
# Requires: CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID
# Status logs go to stderr; IDs only on stdout from helpers.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export CLOUDFLARE_API_TOKEN="${CLOUDFLARE_API_TOKEN:-${CF_API_TOKEN:-${API_TOKEN:-}}}"
export CLOUDFLARE_ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID:-${CF_ACCOUNT_ID:-${ACCOUNT_ID:-}}}"

if [[ -z "${CLOUDFLARE_API_TOKEN}" || -z "${CLOUDFLARE_ACCOUNT_ID}" ]]; then
  echo "Missing CLOUDFLARE_API_TOKEN and/or CLOUDFLARE_ACCOUNT_ID" >&2
  exit 1
fi

log() { echo "$*" >&2; }

has_line() {
  local needle="$1"
  grep -Fq "$needle"
}

is_uuid() {
  [[ "$1" =~ ^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$ ]]
}

ensure_wrangler() {
  if ! pnpm exec wrangler --version >/dev/null 2>&1; then
    pnpm add -Dw wrangler@^4 >&2
  fi
}

d1_id_by_name() {
  local name="$1"
  pnpm exec wrangler d1 list --json 2>/dev/null | python3 -c '
import json,sys
name=sys.argv[1]
rows=json.load(sys.stdin)
for r in rows:
  if r.get("name")==name:
    print(r.get("uuid") or r.get("id") or "")
    break
' "$name"
}

ensure_d1() {
  local name="$1"
  local id
  id="$(d1_id_by_name "$name" || true)"
  if [[ -z "$id" ]]; then
    log "Creating D1 database: $name"
    local out
    out="$(pnpm exec wrangler d1 create "$name" 2>&1 || true)"
    log "$out"
    id="$(d1_id_by_name "$name" || true)"
    if [[ -z "$id" ]]; then
      id="$(echo "$out" | python3 -c '
import re,sys
text=sys.stdin.read()
m=re.search(r"([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})", text)
print(m.group(1) if m else "")
')"
    fi
  else
    log "D1 exists: $name ($id)"
  fi
  if ! is_uuid "$id"; then
    log "ERROR: invalid D1 id for $name: '$id'"
    exit 1
  fi
  printf '%s' "$id"
}

ensure_r2() {
  local name="$1"
  if pnpm exec wrangler r2 bucket list 2>/dev/null | has_line "$name"; then
    log "R2 exists: $name"
  else
    log "Creating R2 bucket: $name"
    pnpm exec wrangler r2 bucket create "$name" >&2 || true
  fi
}

ensure_queue() {
  local name="$1"
  if pnpm exec wrangler queues list 2>/dev/null | has_line "$name"; then
    log "Queue exists: $name"
  else
    log "Creating queue: $name"
    pnpm exec wrangler queues create "$name" >&2 || true
  fi
}

patch_database_id() {
  local file="$1"
  local name="$2"
  local id="$3"
  python3 - "$file" "$name" "$id" <<'PY' >&2
import pathlib, re, sys
path, name, new_id = pathlib.Path(sys.argv[1]), sys.argv[2], sys.argv[3]
text = path.read_text()
pattern = re.compile(
    rf'("database_name"\s*:\s*"{re.escape(name)}"[\s\S]*?"database_id"\s*:\s*")([^"]+)(")',
    re.M,
)
new_text, n = pattern.subn(rf'\g<1>{new_id}\g<3>', text)
print(f"patched {path}: {n} replacement(s) for {name}")
if n == 0:
    sys.exit(2)
path.write_text(new_text)
PY
}

ensure_wrangler
log "Account: ${CLOUDFLARE_ACCOUNT_ID:0:6}…"

PROPERTY_DB_ID="$(ensure_d1 ancu-property-db)"
ENGINE_DB_ID="$(ensure_d1 ancu-engine-db)"
log "Resolved D1 property=$PROPERTY_DB_ID engine=$ENGINE_DB_ID"

ensure_r2 ancu-property-assets
ensure_r2 ancu-floorplans

for q in ancu-conversion ancu-conversion-dlq ancu-crawl ancu-crawl-dlq; do
  ensure_queue "$q"
done

patch_database_id apps/property-web-worker/wrangler.jsonc ancu-property-db "$PROPERTY_DB_ID"
patch_database_id apps/ancu-floorplan-engine/wrangler.jsonc ancu-engine-db "$ENGINE_DB_ID"

log "Installing deps…"
pnpm install --frozen-lockfile >&2

log "Building property web (assets)…"
pnpm --filter @ancu/property-web-worker run build >&2

log "Applying D1 migrations…"
(
  cd apps/property-web-worker
  pnpm exec wrangler d1 migrations apply DB --remote >&2 || true
)
(
  cd apps/ancu-floorplan-engine
  pnpm exec wrangler d1 migrations apply ENGINE_DB --remote >&2 || true
)

log "Deploying property web…"
(
  cd apps/property-web-worker
  pnpm exec wrangler deploy >&2
)

log "Deploying floorplan engine…"
(
  cd apps/ancu-floorplan-engine
  pnpm exec wrangler deploy >&2
)

ENGINE_SECRET="${ENGINE_API_SECRET:-}"
if [[ -z "$ENGINE_SECRET" ]]; then
  ENGINE_SECRET="$(python3 -c 'import secrets; print(secrets.token_urlsafe(32))')"
  log "Generated ENGINE_API_SECRET (also add to GitHub secrets for stable reuse)"
fi
log "Setting ENGINE_API_SECRET on engine worker…"
(
  cd apps/ancu-floorplan-engine
  printf '%s' "$ENGINE_SECRET" | pnpm exec wrangler secret put ENGINE_API_SECRET >&2
) || true

log "Deploy complete."
log "Workers: ancu-property-web , ancu-floorplan-engine"
log "URLs appear in wrangler deploy output above / Cloudflare dashboard."
