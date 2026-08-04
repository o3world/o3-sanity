import { defineConfig } from 'sanity'
import { schemaTypes } from './src/schemas'
import { resolveDataset, resolveProjectId } from './src/constants'

/**
 * CLI-only config: `sanity schema extract` / `sanity typegen` / `sanity
 * schema deploy` read the schema from here. The actual Studio host is the
 * embedded /studio route in apps/web (see its sanity.config.ts).
 */
export default defineConfig({
  projectId: resolveProjectId(),
  dataset: resolveDataset(),
  schema: { types: schemaTypes },
})
