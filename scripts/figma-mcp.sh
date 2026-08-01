#!/usr/bin/env sh
# Launch the token-based Figma MCP server (figma-developer-mcp) with FIGMA_API_KEY
# sourced from apps/web/.env.local (populated by `pnpm env:pull`; the token lives
# in Vercel as a development env var).
set -e
cd "$(dirname "$0")/.."

if [ -z "$FIGMA_API_KEY" ] && [ -f apps/web/.env.local ]; then
  FIGMA_API_KEY=$(grep '^FIGMA_API_KEY=' apps/web/.env.local | head -1 | cut -d= -f2- | sed 's/^"//; s/"$//')
  export FIGMA_API_KEY
fi

if [ -z "$FIGMA_API_KEY" ]; then
  echo "FIGMA_API_KEY not found. Run: pnpm env:pull" >&2
  exit 1
fi

export FRAMELINK_TELEMETRY=off
exec pnpm dlx figma-developer-mcp --stdio --image-dir "$PWD/.figma"
