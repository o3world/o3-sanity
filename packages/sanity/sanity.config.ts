import { defineConfig } from 'sanity'
import { schemaTypes } from './src/schemas'
import { PROJECT_ID } from './src/constants'

/**
 * CLI-only config: `sanity schema extract` / `sanity typegen` / `sanity
 * schema deploy` read the schema from here. The actual Studio host is the
 * embedded /studio route in apps/web (see its sanity.config.ts).
 */
export default defineConfig({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  schema: { types: schemaTypes },
})
