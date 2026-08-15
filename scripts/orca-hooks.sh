#!/usr/bin/env bash
# orca-hooks.sh — the worktree lifecycle hooks Orca runs, wired up in orca.yaml.
#
#   setup     after Orca creates a worktree: carry the env files across,
#             allocate its dev ports, install dependencies
#   archive   before Orca removes one: stop the dev servers it left running
#   issue     when a worktree is made from an issue: put the ticket in the
#             branch name and claim it (orca.yaml's issueCommand)
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

# `gh` has the same problem pnpm does — Homebrew's bin is not on the PATH a
# non-interactive shell inherits, so the claim below would fail on a machine
# where `gh` works fine in a terminal.
ensure_gh_on_path() {
  command -v gh >/dev/null 2>&1 && return 0

  local dir
  for dir in /opt/homebrew/bin /usr/local/bin "$HOME/.local/bin"; do
    if [ -x "$dir/gh" ]; then
      PATH="$dir:$PATH"
      export PATH
      return 0
    fi
  done

  return 1
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

# ---------------------------------------------------------------------------
# issue
# ---------------------------------------------------------------------------
# Bind this checkout to the ticket it was made for. Orca names a worktree after
# the session's intent and cannot be told otherwise, so the branch is the only
# half of the pair that can carry a number — rename it, and `pnpm wt issue`
# (and so `reap`, `ls` and `rm`) can place the checkout like any other.
#
# The ticket stays derived, in the branch name. Recording it anywhere else would
# be a second copy of the same fact for the two to disagree over.

cmd_issue() {
  local url="${1:-}" issue branch prefix name
  issue="$(sed -nE 's#.*/issues/([0-9]+).*#\1#p' <<<"$url")"
  [[ -n $issue ]] || {
    echo "orca issue: no issue number in '${url}'" >&2
    return 1
  }

  branch="$(git -C "$WT" rev-parse --abbrev-ref HEAD 2>/dev/null || true)"
  prefix="${branch%/*}"
  name="${branch##*/}"

  # Re-running is ordinary — Orca fires this on a worktree it re-links, and the
  # fix for a half-run hook is to run it again. A branch `wt new` already named,
  # or this hook already renamed, carries its number and is left as it is.
  if [[ $name =~ ^[0-9]+- ]]; then
    echo "orca issue: branch $branch already carries its ticket"
  else
    git -C "$WT" branch -m "$prefix/$issue-$name"
    echo "orca issue: branch is now $prefix/$issue-$name"
  fi

  # The claim is what stops a second session starting the same ticket. `wt new`
  # refuses one already taken; there is nothing to refuse by the time Orca has
  # made the checkout, so this claims and lets the assignee say who else is on it.
  #
  # Said out loud when it fails, and never fatal: the rename above is what makes
  # the checkout reapable, and it should not be lost to an unauthenticated `gh`.
  # A claim that goes missing quietly leaves the ticket free for a second session.
  ensure_gh_on_path
  if gh issue edit "$issue" --add-assignee @me >/dev/null 2>&1; then
    echo "orca issue: claimed #$issue"
  else
    echo "orca issue: could not claim #$issue — run \`gh issue edit $issue --add-assignee @me\`" >&2
  fi
}

case "${1:-}" in
  setup) cmd_setup ;;
  archive) cmd_archive ;;
  issue) shift && cmd_issue "$@" ;;
  *)
    echo "Usage: bash scripts/orca-hooks.sh <setup|archive|issue>" >&2
    exit 2
    ;;
esac
