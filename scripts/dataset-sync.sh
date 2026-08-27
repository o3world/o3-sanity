#!/usr/bin/env bash
# dataset-sync — production → development, via a backup tarball.
#
# Editors author in `production`, so `development` goes stale against real
# content. This exports production (keeping the tarball as a backup — see
# dataset-backup.sh) and imports it into `development` with --replace:
# a document that exists in both is replaced by production's copy, and a
# development-only document (a brief, an experiment) is left alone. Nothing
# is deleted, and no dataset is created or dropped (docs/agents/ops.md).
#
# Usage:
#   pnpm dataset:sync
set -euo pipefail

ROOT=$(git rev-parse --show-toplevel 2>/dev/null || { cd "$(dirname "$0")/.." && pwd; })
BACKUP_DIR="${O3_BACKUP_DIR:-$HOME/.o3-sanity/backups}"

"$ROOT/scripts/dataset-backup.sh"
TARBALL=$(ls -t "$BACKUP_DIR"/production-*.tar.gz | head -1)

echo ""
echo "importing $TARBALL → development (--replace)"
cd "$ROOT/tools/migration"
pnpm exec sanity dataset import "$TARBALL" --dataset development --replace

echo ""
echo "development now mirrors production's documents (development-only documents kept)."
echo "If a dev server is running against development, restart it clean."
