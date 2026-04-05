#!/bin/bash
# Run all tests: unit tests + extension linting.
#
# Run from the repo root: ./scripts/test.sh
# Or: pnpm test
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${REPO_ROOT}"

echo "==> Running unit tests"
pnpm --filter @firestorm/broker run test

echo ""
echo "==> Linting Firefox extension"
pnpm --filter firefox run lint

echo ""
echo "==> Linting Thunderbird extension"
pnpm --filter thunderbird run lint

echo ""
echo "==> All checks passed"
