#!/usr/bin/env bash
# orca-hooks.sh — the worktree lifecycle hooks Orca runs, wired up in orca.yaml.
#
#   setup     after Orca creates a worktree: carry the env files across,
#             allocate its dev ports, install dependencies
#   archive   before Orca removes one: stop the dev servers it left running
#
# Orca runs these with cwd set to the worktree, under a NON-INTERACTIVE
# /bin/bash — no ~/.zshrc, so an nvm/fnm node is off PATH. Hence the shim
# below. Orca also exports ORCA_ROOT_PATH (main checkout), ORCA_WORKTREE_PATH
# and ORCA_WORKSPACE_NAME, and kills the hook at 120s.
#
# Run them by hand the same way Orca does:
#   bash scripts/orca-hooks.sh setup

set -uo pipefail

# cwd is the worktree, and this script lives inside it — so WT is the worktree
# being set up, not the main checkout. worktree-provision.sh finds the main
# checkout itself, via git.
WT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# ---------------------------------------------------------------------------
# PATH shim — a non-interactive shell inherits Orca's PATH, not the user's.
# ---------------------------------------------------------------------------

ensure_node_on_path() {
  command -v pnpm >/dev/null 2>&1 && return 0

  # nvm: source it and honour the repo's .nvmrc.
  local nvm_dir="${NVM_DIR:-$HOME/.nvm}"
  if [ -s "$nvm_dir/nvm.sh" ]; then
    # shellcheck disable=SC1091
    . "$nvm_dir/nvm.sh" >/dev/null 2>&1
    nvm use >/dev/null 2>&1 || nvm use default >/dev/null 2>&1 || true
    command -v pnpm >/dev/null 2>&1 && return 0
  fi

  if command -v fnm >/dev/null 2>&1; then
    eval "$(fnm env)" >/dev/null 2>&1 || true
    fnm use >/dev/null 2>&1 || true
    command -v pnpm >/dev/null 2>&1 && return 0
  fi

  local dir
  for dir in /opt/homebrew/bin /usr/local/bin "$HOME/.local/bin" "$HOME/Library/pnpm"; do
    if [ -x "$dir/pnpm" ]; then
      PATH="$dir:$PATH"
      export PATH
    fi
  done

  command -v pnpm >/dev/null 2>&1
}

# ---------------------------------------------------------------------------
# setup
# ---------------------------------------------------------------------------
# The env files, the prototype symlink and the port allocation are instant and
# are what make the checkout usable; `pnpm install` is the slow half and runs
# last. If the 120s hook timeout cuts the install off, the worktree still has
# its env and ports — finish it with `pnpm install` in the new terminal.

cmd_setup() {
  if ! ensure_node_on_path; then
    echo "orca setup: pnpm not found on PATH (tried nvm, fnm, homebrew)." >&2
    echo "orca setup: run \`bash scripts/worktree-provision.sh\` in $WT." >&2
    return 1
  fi

  bash "$WT/scripts/worktree-provision.sh" "$WT"
}

# ---------------------------------------------------------------------------
# archive
# ---------------------------------------------------------------------------
# Runs while the worktree still exists, so down.sh can still see which
# processes belong to it — it only kills processes whose cwd is inside this
# checkout, which is exactly the guarantee we need with several worktrees up.
# Never fails the removal.

cmd_archive() {
  ensure_node_on_path || true
  echo "orca archive: stopping this worktree's dev servers…"
  bash "$WT/scripts/down.sh" || true
}

case "${1:-}" in
  setup) cmd_setup ;;
  archive) cmd_archive ;;
  *)
    echo "Usage: bash scripts/orca-hooks.sh <setup|archive>" >&2
    exit 2
    ;;
esac
