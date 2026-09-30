import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { EXTRACT_DIR } from './paths'

/**
 * When each WordPress extract ran, kept out of the committed documents
 * themselves: `core/plan.ts` stamps the time onto `migration.extractedAt` for
 * the documents `drift` compares, because the dataset copies carry it.
 */
interface ExtractManifest {
  /** The WordPress environment every record came from. */
  readonly source: string
  /** Extract type → ISO timestamp of the run that produced it. */
  readonly runs: Readonly<Record<string, string>>
}

const MANIFEST_PATH = join(EXTRACT_DIR, '_manifest.json')

export function readManifest(): ExtractManifest {
  if (!existsSync(MANIFEST_PATH)) {
    throw new Error(
      `no extract manifest at ${MANIFEST_PATH} — it is committed; restore it from git`,
    )
  }
  return JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')) as ExtractManifest
}
