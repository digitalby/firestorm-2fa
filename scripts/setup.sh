#!/bin/bash
# One-time setup: install dependencies, build packages, register native messaging
# hosts with Firefox and Thunderbird, and create isolated dev profiles.
#
# Run from the repo root: ./scripts/setup.sh
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HOST_SCRIPT="${REPO_ROOT}/packages/native-host/bin/firestorm-host"
HOST_NAME="me.digitalby.firestorm"

FIREFOX_NM_DIR="${HOME}/Library/Application Support/Mozilla/NativeMessagingHosts"
THUNDERBIRD_NM_DIR="${HOME}/Library/Application Support/Thunderbird/NativeMessagingHosts"

echo "==> firestorm-2fa setup"
echo "    Repo: ${REPO_ROOT}"

# ── Dependencies ──────────────────────────────────────────────────────────────
echo ""
echo "==> Updating dependencies"
cd "${REPO_ROOT}"
pnpm update -r

echo ""
echo "==> Installing dependencies"
pnpm install

# ── Build ─────────────────────────────────────────────────────────────────────
echo ""
echo "==> Building all packages"
pnpm run build

# ── Dev profiles ─────────────────────────────────────────────────────────────
echo ""
echo "==> Creating isolated dev profiles"
mkdir -p "${REPO_ROOT}/profiles/firefox-dev"
mkdir -p "${REPO_ROOT}/profiles/thunderbird-dev"

# ── Native Messaging registration ────────────────────────────────────────────
echo ""
echo "==> Registering native messaging host"

if [[ ! -x "${HOST_SCRIPT}" ]]; then
  echo "ERROR: Native host script not found or not executable: ${HOST_SCRIPT}"
  exit 1
fi

mkdir -p "${FIREFOX_NM_DIR}"
mkdir -p "${THUNDERBIRD_NM_DIR}"

# Firefox manifest — only the Firefox extension ID is allowed
cat > "${FIREFOX_NM_DIR}/${HOST_NAME}.json" <<EOF
{
  "name": "${HOST_NAME}",
  "description": "Firestorm IPC bridge",
  "path": "${HOST_SCRIPT}",
  "type": "stdio",
  "allowed_extensions": ["firestorm-firefox@me.digitalby"]
}
EOF
echo "    Firefox:     ${FIREFOX_NM_DIR}/${HOST_NAME}.json"

# Thunderbird manifest — only the Thunderbird extension ID is allowed
cat > "${THUNDERBIRD_NM_DIR}/${HOST_NAME}.json" <<EOF
{
  "name": "${HOST_NAME}",
  "description": "Firestorm IPC bridge",
  "path": "${HOST_SCRIPT}",
  "type": "stdio",
  "allowed_extensions": ["firestorm-thunderbird@me.digitalby"]
}
EOF
echo "    Thunderbird: ${THUNDERBIRD_NM_DIR}/${HOST_NAME}.json"

echo ""
echo "==> Setup complete!"
echo ""
echo "    To start developing, run:"
echo "      pnpm run dev"
echo ""
echo "    To run tests:"
echo "      pnpm test"
echo ""
echo "    To remove native messaging registrations:"
echo "      ./scripts/teardown.sh"
