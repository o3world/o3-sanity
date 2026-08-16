import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * The monorepo root. Every corpus reads its sources through this, so a stored
 * `sourcePath` is the path you type into an editor rather than one relative to
 * wherever the command happened to run.
 */
export const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..')
