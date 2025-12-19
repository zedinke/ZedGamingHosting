#!/usr/bin/env bash
set -euo pipefail

# E2E smoke test for Upay webhook idempotency
# Sends the same webhook twice and expects the second response to include "deduped": true
#
# Usage:
#   ./scripts/test-webhook-idempotency.sh [BASE_URL] [UPAY_API_KEY]
#
# Examples:
#   ./scripts/test-webhook-idempotency.sh                 # default http://localhost:3000, no signature (mock mode)
#   ./scripts/test-webhook-idempotency.sh http://localhost:3000 my-upay-api-key

BASE_URL="${1:-${BASE_URL:-http://localhost:3000}}"
API_KEY="${2:-${UPAY_API_KEY:-}}"

ENDPOINT="$BASE_URL/payments/upay/webhook"
PAYLOAD='{"paymentId":"TEST_IDEMPOTENCY_123","status":"SUCCESS","eventId":"TEST_IDEMPOTENCY_EVENT_123"}'

calc_sig() {
  if [ -z "$API_KEY" ]; then
    echo ""
    return 0
  fi
  # Requires openssl
  printf '%s' "$PAYLOAD" \
    | openssl dgst -sha256 -hmac "$API_KEY" 2>/dev/null \
    | awk '{print $2}'
}

have_jq=0
if command -v jq >/dev/null 2>&1; then
  have_jq=1
fi

post_once() {
  local sig="$1"
  if command -v curl >/dev/null 2>&1; then
    if [ -n "$sig" ]; then
      curl -sS -H "Content-Type: application/json" -H "x-upay-signature: $sig" -d "$PAYLOAD" "$ENDPOINT"
    else
      curl -sS -H "Content-Type: application/json" -d "$PAYLOAD" "$ENDPOINT"
    fi
  elif command -v wget >/dev/null 2>&1; then
    # wget cannot easily set custom headers for POST from string; use --method/--body-data
    if [ -n "$sig" ]; then
      wget -qO- --header="Content-Type: application/json" --header="x-upay-signature: $sig" --method=POST --body-data="$PAYLOAD" "$ENDPOINT"
    else
      wget -qO- --header="Content-Type: application/json" --method=POST --body-data="$PAYLOAD" "$ENDPOINT"
    fi
  else
    echo "Neither curl nor wget found. Please install one of them." >&2
    exit 2
  fi
}

echo "[1/3] Target endpoint: $ENDPOINT"
if [ -n "$API_KEY" ]; then
  echo "[2/3] Using HMAC signature from provided API key"
else
  echo "[2/3] No API key provided — relying on mock mode (signature disabled)"
fi

SIG="$(calc_sig)"

echo "[3/3] Sending first webhook..."
FIRST_RESP="$(post_once "$SIG" || true)"
echo "First response: $FIRST_RESP"

sleep 1

echo "Sending second webhook (should be deduped)..."
SECOND_RESP="$(post_once "$SIG" || true)"
echo "Second response: $SECOND_RESP"

dedup_flag=""
if [ $have_jq -eq 1 ]; then
  dedup_flag=$(printf '%s' "$SECOND_RESP" | jq -r 'try .deduped // empty')
else
  # fallback: naive grep
  if printf '%s' "$SECOND_RESP" | grep -qi '"deduped"\s*:\s*true'; then
    dedup_flag="true"
  fi
fi

if [ "$dedup_flag" = "true" ]; then
  echo "OK: deduped=true detected on second call"
  exit 0
else
  echo "FAIL: second call did not return deduped=true"
  exit 1
fi
