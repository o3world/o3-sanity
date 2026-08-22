import { defineConfig } from 'sanity'

import { currentBrand } from './src/brand'
import { resolveDataset, resolveProjectId } from './src/constants'
import { schemaTypes, schemaTypesFor } from './src/schemas'

/**
 * CLI-only config — the actual Studio hosts are the embedded /studio routes in
 * the apps. Two workspaces, one per audience:
 *
 * - `default` is what `schema:deploy` publishes: the roster of the brand the
 *   env names, to that brand's project — the same brand resolution each app's
 *   Studio does. Every schema-driven writer — `get_schema`, the typeset skill,
 *   `schema:check` — trusts the DEPLOYED schema and resolves the workspace
 *   named `default` when given none, so that workspace may only declare the
 *   blocks this brand's app can render (#252).
 *
 * - `model` is the whole content model, for `sanity schema extract` and the
 *   typegen behind the generated types both apps read (ADR 0028: one model,
 *   one typegen). It is never deployed — `schema:deploy` names `default`, and
 *   `schema:check` fails on any schema document a deploy of `default` did not
 *   write. Its API target is only manifest filler.
 */
export default defineConfig([
  {
    name: 'default',
    basePath: '/default',
    projectId: resolveProjectId(),
    dataset: resolveDataset(),
    schema: { types: schemaTypesFor(currentBrand()) },
  },
  {
    name: 'model',
    basePath: '/model',
    projectId: resolveProjectId(),
    dataset: resolveDataset(),
    schema: { types: schemaTypes },
  },
])
