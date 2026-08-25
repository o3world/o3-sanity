#!/usr/bin/env sh
# Launch the token-based Figma MCP server (figma-developer-mcp) with FIGMA_API_KEY
# from apps/web/.env.local (populated by `pnpm env:pull`; the token lives in
# Vercel as a development env var). The file wins over an exported key: an
# ambient FIGMA_API_KEY belongs to whichever project exported it.
set -e
cd "$(dirname "$0")/.."

FIGMA_TOKEN_SOURCE=""
if [ -f apps/web/.env.local ]; then
  _from_file=$(grep '^FIGMA_API_KEY=' apps/web/.env.local | head -1 | cut -d= -f2- | sed 's/^"//; s/"$//')
  if [ -n "$_from_file" ]; then
    FIGMA_API_KEY="$_from_file"
    FIGMA_TOKEN_SOURCE="apps/web/.env.local"
  fi
fi

if [ -n "$FIGMA_API_KEY" ] && [ -z "$FIGMA_TOKEN_SOURCE" ]; then
  FIGMA_TOKEN_SOURCE="the exported FIGMA_API_KEY"
fi

if [ -z "$FIGMA_API_KEY" ]; then
  echo "FIGMA_API_KEY not found (checked apps/web/.env.local, then the environment)." >&2
  echo "Run: pnpm env:pull" >&2
  exit 1
fi

export FIGMA_API_KEY
echo "figma-mcp: token from $FIGMA_TOKEN_SOURCE" >&2

export FRAMELINK_TELEMETRY=off
exec pnpm dlx figma-developer-mcp --stdio --image-dir "$PWD/.figma"
