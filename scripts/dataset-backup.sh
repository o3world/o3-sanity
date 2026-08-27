#!/usr/bin/env bash
# dataset-backup — export the o3 `production` dataset to a local tarball.
#
# Editors author in `production` and this plan has no Sanity backups, so the
# tarballs written here ARE the backups. They land outside the repo because
# worktrees get reaped and a backup that dies with its checkout is not one.
#
# Usage:
#   pnpm dataset:backup            # → ~/.o3-sanity/backups/production-<stamp>.tar.gz
#   O3_BACKUP_DIR=/x pnpm dataset:backup
#
# Restore (whole dataset, into wherever you point it):
#   cd tools/migration && pnpm exec sanity dataset import <tarball> --dataset development --replace
set -euo pipefail

ROOT=$(git rev-parse --show-toplevel 2>/dev/null || { cd "$(dirname "$0")/.." && pwd; })
BACKUP_DIR="${O3_BACKUP_DIR:-$HOME/.o3-sanity/backups}"
mkdir -p "$BACKUP_DIR"

OUT="$BACKUP_DIR/production-$(date +%Y%m%d-%H%M%S).tar.gz"
cd "$ROOT/tools/migration"
pnpm exec sanity dataset export production "$OUT" --overwrite

# Only the last three days are kept — the nightly workflow covers history,
# and these run 300+ MB each.
find "$BACKUP_DIR" -name 'production-*.tar.gz' -mtime +3 -delete

echo ""
echo "backup written: $OUT"
ls -lh "$BACKUP_DIR" | tail -5
