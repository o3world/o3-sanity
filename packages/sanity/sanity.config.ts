import { defineConfig } from 'sanity'

import { resolveDataset, resolveProjectId } from './src/brand'
import { schemaTypes } from './src/schemas'

/**
 * CLI-only config — the actual Studio host is the embedded /studio route in
 * `apps/web`. `schema:deploy` publishes this workspace, typegen extracts it,
 * and every schema-driven writer (`get_schema`, the typeset skill,
 * `schema:check`) resolves it as `default` when given no name.
 */
export default defineConfig({
  name: 'default',
  basePath: '/default',
  projectId: resolveProjectId(),
  dataset: resolveDataset(),
  schema: { types: schemaTypes },
})
