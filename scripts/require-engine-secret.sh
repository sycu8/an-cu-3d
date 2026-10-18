#!/usr/bin/env bash
# Validate ENGINE_API_SECRET. Exit 0 when it is safe to deploy.
# Never prints the secret. Does not trim a bad value and continue.
require_engine_api_secret() {
  local secret="${1-}"
  local trimmed="${secret#"${secret%%[![:space:]]*}"}"
  trimmed="${trimmed%"${trimmed##*[![:space:]]}"}"

  if [[ -z "$secret" || -z "${secret//[[:space:]]/}" ]]; then
    echo "ERROR: ENGINE_API_SECRET is missing. Set that GitHub secret before deploy. This script does not generate one." >&2
    return 1
  fi
  if [[ "$secret" != "$trimmed" || "$secret" =~ [[:space:]] ]]; then
    echo "ERROR: ENGINE_API_SECRET must not contain whitespace or a trailing newline. Refusing to trim it." >&2
    return 1
  fi
  if [[ ${#secret} -lt 32 ]]; then
    echo "ERROR: ENGINE_API_SECRET must be at least 32 characters. Refusing to deploy." >&2
    return 1
  fi
  # Printable ASCII only (0x21-0x7E). Space and controls are already rejected above.
  if [[ "$secret" =~ [^!-~] ]]; then
    echo "ERROR: ENGINE_API_SECRET must be printable ASCII only." >&2
    return 1
  fi
  return 0
}

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  set -euo pipefail
  require_engine_api_secret "${ENGINE_API_SECRET-}"
fi
