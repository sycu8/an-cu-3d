#!/usr/bin/env bash
# Provision Cloudflare resources (idempotent) and deploy AnCư apps.
# Requires: CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# Accept common alias secret names
export CLOUDFLARE_API_TOKEN="${CLOUDFLARE_API_TOKEN:-${CF_API_TOKEN:-${API_TOKEN:-}}}"
export CLOUDFLARE_ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID:-${CF_ACCOUNT_ID:-${ACCOUNT_ID:-}}}"

if [[ -z "${CLOUDFLARE_API_TOKEN}" || -z "${CLOUDFLARE_ACCOUNT_ID}" ]]; then
  echo "Missing CLOUDFLARE_API_TOKEN and/or CLOUDFLARE_ACCOUNT_ID"
  exit 1
fi

W=(pnpm exec wrangler)
ensure_wrangler() {
  if ! pnpm exec wrangler --version >/dev/null 2>&1; then
    pnpm add -Dw wrangler@^4
  fi
}

json_field() {
  python3 -c 'import json,sys; d=json.load(sys.stdin); print(d.get(sys.argv[1],""))' "$1"
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
    echo "Creating D1 database: $name"
    local out
    out="$(pnpm exec wrangler d1 create "$name" 2>&1 || true)"
    echo "$out"
    id="$(d1_id_by_name "$name" || true)"
    if [[ -z "$id" ]]; then
      id="$(echo "$out" | python3 -c '
import re,sys
text=sys.stdin.read()
m=re.search(r"database_id\s*[:=]\s*\"?([0-9a-fA-F-]{36})\"?", text)
print(m.group(1) if m else "")
')"
    fi
  else
    echo "D1 exists: $name ($id)"
  fi
  printf '%s' "$id"
}

ensure_r2() {
  local name="$1"
  if pnpm exec wrangler r2 bucket list 2>/dev/null | rg -q "$name"; then
    echo "R2 exists: $name"
  else
    echo "Creating R2 bucket: $name"
    pnpm exec wrangler r2 bucket create "$name" || true
  fi
}

ensure_queue() {
  local name="$1"
  if pnpm exec wrangler queues list 2>/dev/null | rg -q "$name"; then
    echo "Queue exists: $name"
  else
    echo "Creating queue: $name"
    pnpm exec wrangler queues create "$name" || true
  fi
}

patch_database_id() {
  local file="$1"
  local name="$2"
  local id="$3"
  python3 - "$file" "$name" "$id" <<'PY'
import pathlib, re, sys
path, name, new_id = pathlib.Path(sys.argv[1]), sys.argv[2], sys.argv[3]
text = path.read_text()
# Replace database_id only inside blocks that mention this database_name
pattern = re.compile(
    rf'("database_name"\s*:\s*"{re.escape(name)}"[\s\S]*?"database_id"\s*:\s*")([^"]+)(")',
    re.M,
)
new_text, n = pattern.subn(rf'\g<1>{new_id}\g<3>', text)
if n == 0:
    # fallback: any placeholder near the name
    pattern2 = re.compile(
        rf'("database_name"\s*:\s*"{re.escape(name)}"[\s\S]{{0,200}}?database_id"\s*:\s*")00000000-0000-0000-0000-00000000000[0-9](")'
    )
    new_text, n = pattern2.subn(rf'\g<1>{new_id}\g<2>', text)
print(f"patched {path}: {n} replacement(s) for {name}")
path.write_text(new_text)
PY
}

ensure_wrangler
echo "Account: ${CLOUDFLARE_ACCOUNT_ID:0:6}…"

PROPERTY_DB_ID="$(ensure_d1 ancu-property-db)"
ENGINE_DB_ID="$(ensure_d1 ancu-engine-db)"

if [[ -z "$PROPERTY_DB_ID" || -z "$ENGINE_DB_ID" ]]; then
  echo "Failed to resolve D1 IDs"
  echo "property=$PROPERTY_DB_ID engine=$ENGINE_DB_ID"
  exit 1
fi

ensure_r2 ancu-property-assets
ensure_r2 ancu-floorplans

for q in ancu-conversion ancu-conversion-dlq ancu-crawl ancu-crawl-dlq; do
  ensure_queue "$q"
done

patch_database_id apps/property-web-worker/wrangler.jsonc ancu-property-db "$PROPERTY_DB_ID"
patch_database_id apps/ancu-floorplan-engine/wrangler.jsonc ancu-engine-db "$ENGINE_DB_ID"
# Also patch production env name if present
patch_database_id apps/ancu-floorplan-engine/wrangler.jsonc ancu-engine-db "$ENGINE_DB_ID" || true

echo "Installing deps + building…"
pnpm install --frozen-lockfile
pnpm -r run build

echo "Applying D1 migrations…"
(
  cd apps/property-web-worker
  pnpm exec wrangler d1 migrations apply DB --remote || true
)
(
  cd apps/ancu-floorplan-engine
  pnpm exec wrangler d1 migrations apply ENGINE_DB --remote || true
)

echo "Deploying property web…"
(
  cd apps/property-web-worker
  pnpm exec wrangler deploy
)

echo "Deploying floorplan engine…"
(
  cd apps/ancu-floorplan-engine
  pnpm exec wrangler deploy
)

# Engine secret: use provided or generate once and set
ENGINE_SECRET="${ENGINE_API_SECRET:-}"
if [[ -z "$ENGINE_SECRET" ]]; then
  ENGINE_SECRET="$(python3 -c 'import secrets; print(secrets.token_urlsafe(32))')"
  echo "Generated ENGINE_API_SECRET (set in Worker; store in GitHub secrets as ENGINE_API_SECRET for reuse)"
fi
(
  cd apps/ancu-floorplan-engine
  printf '%s' "$ENGINE_SECRET" | pnpm exec wrangler secret put ENGINE_API_SECRET
) || (
  cd apps/ancu-floorplan-engine
  printf '%s' "$ENGINE_SECRET" | pnpm exec wrangler secret put ENGINE_API_TOKEN
) || true

echo "Deploy complete."
echo "Resolve worker URLs via Cloudflare dashboard or:"
echo "  pnpm --filter @ancu/property-web-worker exec wrangler deployments list"
echo "  pnpm --filter @ancu/floorplan-engine exec wrangler deployments list"
