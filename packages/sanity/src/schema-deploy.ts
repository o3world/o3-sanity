/**
 * Deploy → publish this brand's roster, and only it (#252).
 *
 *   pnpm schema:deploy                       # the brand the env names (o3 unset)
 *   NEXT_PUBLIC_BRAND=o3xo pnpm schema:deploy
 *
 * `sanity.config.ts` declares the brand-filtered `default` workspace plus the
 * whole-model `model` workspace for typegen, and a bare `sanity schemas
 * deploy` publishes BOTH — which would put the full model into a project whose
 * writers must not see the other brand's blocks. So the workspace is always
 * named, and naming it is this wrapper's whole job. `currentBrand()` is only
 * read back for the log line — the config resolves the brand itself, from the
 * same environment.
 */
import { execFileSync } from 'node:child_process'

import { currentBrand } from './brand'

console.log(`deploying the "${currentBrand()}" roster as workspace "default"`)
execFileSync('pnpm', ['exec', 'sanity', 'schemas', 'deploy', '--workspace', 'default'], {
  stdio: 'inherit',
})
