#!/bin/bash
# Start the full development environment:
#   - Broker WebSocket server
#   - Firefox with dev profile and extension loaded
#   - Thunderbird with dev profile and extension loaded
#
# Run from the repo root: ./scripts/dev.sh
# Or: pnpm run dev
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${REPO_ROOT}"

# Sanity check: ensure the native host binary exists
HOST_SCRIPT="packages/native-host/bin/firestorm-host"
if [[ ! -x "${HOST_SCRIPT}" ]]; then
  echo "ERROR: Native host not built. Run ./scripts/setup.sh first."
  exit 1
fi

# Sanity check: ensure native messaging manifests are registered
NM_FIREFOX="${HOME}/Library/Application Support/Mozilla/NativeMessagingHosts/me.digitalby.firestorm.json"
NM_THUNDERBIRD="${HOME}/Library/Mozilla/NativeMessagingHosts/me.digitalby.firestorm.json"
if [[ ! -f "${NM_FIREFOX}" ]] || [[ ! -f "${NM_THUNDERBIRD}" ]]; then
  echo "ERROR: Native messaging not registered. Run ./scripts/setup.sh first."
  exit 1
fi

# Kill any stale broker process still holding the port from a previous session
BROKER_PORT=9467
STALE_PIDS=$(lsof -ti :"${BROKER_PORT}" 2>/dev/null || true)
if [[ -n "${STALE_PIDS}" ]]; then
  echo "==> Clearing stale process on port ${BROKER_PORT}"
  echo "${STALE_PIDS}" | xargs kill -9 2>/dev/null || true
  sleep 0.5
fi

echo "==> Starting Firestorm dev environment"
echo "    Broker:      localhost:9467"
echo "    Firefox:     profiles/firefox-dev"
echo "    Thunderbird: profiles/thunderbird-dev"
echo ""
echo "    Firefox console: about:debugging#/runtime/this-firefox -> Inspect"
echo "    Thunderbird console: Tools > Developer Tools > Error Console"
echo ""

exec pnpm exec concurrently \
  --names "broker,firefox,tbrd" \
  --prefix-colors "cyan,darkorange,mediumpurple" \
  --kill-others \
  --kill-others-on-fail \
  "node packages/broker/dist/index.js" \
  "pnpm --filter firefox run:ext" \
  "pnpm --filter thunderbird run:ext"
