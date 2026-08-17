#!/usr/bin/env bash
#
# Lint every skill in the o3sanity plugin against the agent-skill spec.
#
# `skills-ref validate` takes one skill directory at a time — pointed at the
# parent it looks for a SKILL.md there and fails — so this loops and collects.
# It is the check that reads the frontmatter as YAML: `claude plugin validate`
# passes a file two YAML parsers reject, so it guards the manifest and not this.

set -uo pipefail

cd "$(dirname "$0")/.."

fail=0
for skill in tools/authoring-skill/skills/*/; do
  pnpm exec skills-ref validate "$skill" || fail=1
done

if [ "$fail" -ne 0 ]; then
  echo "::error::A skill failed validation — see the output above."
fi

exit "$fail"
