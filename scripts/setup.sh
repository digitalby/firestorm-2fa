#!/bin/bash
# One-time setup: install dependencies, build packages, register native messaging
# hosts with Firefox and Thunderbird, and create isolated dev profiles.
#
# Run from the repo root: ./scripts/setup.sh
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HOST_NAME="me.digitalby.firestorm"

# macOS TCC restricts processes launched by browsers from accessing ~/Documents.
# We install a thin launcher script into ~/Library/Application Support where
# browsers can execute freely, and point both native messaging manifests there.
LAUNCHER_DIR="${HOME}/Library/Application Support/${HOST_NAME}"
LAUNCHER="${LAUNCHER_DIR}/firestorm-host"

FIREFOX_NM_DIR="${HOME}/Library/Application Support/Mozilla/NativeMessagingHosts"
# Thunderbird on macOS resolves XREUserNativeManifests to ~/Library/Mozilla (not Application Support)
THUNDERBIRD_NM_DIR="${HOME}/Library/Mozilla/NativeMessagingHosts"

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

# ── Native host launcher ──────────────────────────────────────────────────────
# Browsers set the native host's working directory to the launcher's parent.
# A launcher in ~/Library/Application Support avoids macOS TCC restrictions
# on ~/Documents that would cause getcwd() to fail for both Firefox and Thunderbird.
echo ""
echo "==> Installing native host launcher"
mkdir -p "${LAUNCHER_DIR}"
cat > "${LAUNCHER}" <<EOF
#!/bin/bash
exec node "${REPO_ROOT}/packages/native-host/dist/index.js" "\$@"
EOF
chmod +x "${LAUNCHER}"
echo "    Launcher: ${LAUNCHER}"

# ── Native Messaging registration ────────────────────────────────────────────
echo ""
echo "==> Registering native messaging host"

mkdir -p "${FIREFOX_NM_DIR}"
mkdir -p "${THUNDERBIRD_NM_DIR}"

cat > "${FIREFOX_NM_DIR}/${HOST_NAME}.json" <<EOF
{
  "name": "${HOST_NAME}",
  "description": "Firestorm IPC bridge",
  "path": "${LAUNCHER}",
  "type": "stdio",
  "allowed_extensions": ["firestorm-firefox@me.digitalby", "firestorm-thunderbird@me.digitalby"]
}
EOF
echo "    Firefox:     ${FIREFOX_NM_DIR}/${HOST_NAME}.json"

cat > "${THUNDERBIRD_NM_DIR}/${HOST_NAME}.json" <<EOF
{
  "name": "${HOST_NAME}",
  "description": "Firestorm IPC bridge",
  "path": "${LAUNCHER}",
  "type": "stdio",
  "allowed_extensions": ["firestorm-firefox@me.digitalby", "firestorm-thunderbird@me.digitalby"]
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
