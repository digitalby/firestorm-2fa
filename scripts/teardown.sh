#!/bin/bash
# Remove native messaging host registrations from Firefox and Thunderbird.
#
# Run from the repo root: ./scripts/teardown.sh
set -euo pipefail

HOST_NAME="me.digitalby.firestorm"
LAUNCHER_DIR="${HOME}/Library/Application Support/${HOST_NAME}"
FIREFOX_NM="${HOME}/Library/Application Support/Mozilla/NativeMessagingHosts/${HOST_NAME}.json"
THUNDERBIRD_NM="${HOME}/Library/Mozilla/NativeMessagingHosts/${HOST_NAME}.json"

echo "==> Removing native messaging host registrations"

removed=0
for manifest in "${FIREFOX_NM}" "${THUNDERBIRD_NM}"; do
  if [[ -f "${manifest}" ]]; then
    rm "${manifest}"
    echo "    Removed: ${manifest}"
    removed=$((removed + 1))
  else
    echo "    Not found (already removed?): ${manifest}"
  fi
done

if [[ -d "${LAUNCHER_DIR}" ]]; then
  rm -rf "${LAUNCHER_DIR}"
  echo "    Removed launcher: ${LAUNCHER_DIR}"
fi

echo ""
echo "==> Teardown complete (${removed} manifest(s) removed)"
