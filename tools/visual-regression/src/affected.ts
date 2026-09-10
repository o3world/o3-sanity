/**
 * Which stories does this diff actually touch?
 *
 * Answered from Storybook's own module graph (`preview-stats.json`), not from
 * filename guesswork. Editing `packages/ui/src/components/stat.tsx` selects
 * every story that renders a `Stat`, including the ones three files away that
 * never mention it by name — and editing a file no story imports selects
 * nothing, which is what keeps a run down to seconds.
 *
 * Module ids in the stats file are relative to the **host that built them** (the
 * Storybook config's root): `./globals.css`,
 * `./../../packages/ui/src/components/stat.tsx`. Everything below normalises
 * them to repo-relative paths so they can be compared against `git diff`
 * output — which is why every entry point takes the host directory. The same
 * `./globals.css` is a different file on each of the two hosts (#242).
 */
import path from 'node:path'

import { DEFAULT_BRAND, hostDir, type StatsModule, type StoryEntry } from './storybook'

const O3_HOST = hostDir(DEFAULT_BRAND)

/**
 * Modules that sit above every story of one host. A change that reaches one of
 * these has no story-shaped blast radius — it has all of them.
 */
function globalModules(storybookDir: string): string[] {
  return [`${storybookDir}/.storybook/preview.ts`, `${storybookDir}/globals.css`]
}

function toRepoPath(moduleId: string, storybookDir: string): string | null {
  // Virtual modules (`virtual:/@storybook/...`), rollup's `\0`-prefixed ids and
  // anything inside a package directory are not files anyone edits.
  if (!moduleId.startsWith('./') || moduleId.includes('\0')) return null
  const resolved = path.normalize(path.join(storybookDir, moduleId.slice(2).split('?')[0]!))
  return resolved.includes('node_modules') ? null : resolved
}

function isStoryFile(repoPath: string): boolean {
  return /\.stories\.(ts|tsx|js|jsx|mjs)$/.test(repoPath)
}

export interface Affected {
  /** Repo-relative story files the change reaches. */
  storyFiles: string[]
  /** True when the change is global (a token, `preview.ts`, `globals.css`). */
  everything: boolean
}

export function affectedStoryFiles(
  modules: StatsModule[],
  changed: string[],
  storybookDir: string = O3_HOST,
): Affected {
  // moduleId → the modules that import it, both sides normalised.
  const importers = new Map<string, Set<string>>()
  for (const module of modules) {
    const self = toRepoPath(module.id, storybookDir)
    if (!self) continue
    const parents = importers.get(self) ?? new Set<string>()
    for (const reason of module.reasons ?? []) {
      const parent = reason.moduleName ? toRepoPath(reason.moduleName, storybookDir) : null
      if (parent && parent !== self) parents.add(parent)
    }
    importers.set(self, parents)
  }

  const globals = globalModules(storybookDir)
  const changedSet = new Set(changed)
  const storyFiles = new Set<string>()
  const seen = new Set<string>()
  const queue = changed.filter((file) => importers.has(file))

  // A changed story file is affected whether or not anything imports it.
  for (const file of changed) if (isStoryFile(file) && importers.has(file)) storyFiles.add(file)

  while (queue.length > 0) {
    const current = queue.shift() as string
    if (seen.has(current)) continue
    seen.add(current)
    if (globals.includes(current)) return { storyFiles: [], everything: true }
    if (isStoryFile(current)) {
      storyFiles.add(current)
      // A story file imports no other story file; stop climbing here rather
      // than walking into Storybook's generated entry module.
      continue
    }
    for (const parent of importers.get(current) ?? []) if (!seen.has(parent)) queue.push(parent)
  }

  // A brand new story file is in the git diff but not yet in the baseline's
  // graph; it still needs capturing, so trust the diff for those.
  for (const file of changedSet) if (isStoryFile(file)) storyFiles.add(file)

  return { storyFiles: [...storyFiles].sort(), everything: false }
}

/** Story entries whose file is in `storyFiles` (or all of them). */
export function storiesFor(
  index: StoryEntry[],
  affected: Affected,
  storybookDir: string = O3_HOST,
): StoryEntry[] {
  if (affected.everything) return index
  const wanted = new Set(affected.storyFiles)
  return index.filter((entry) => wanted.has(entryPath(entry, storybookDir)))
}

/** `../../packages/ui/src/x.stories.tsx` → `packages/ui/src/x.stories.tsx`. */
export function entryPath(entry: StoryEntry, storybookDir: string = O3_HOST): string {
  return path.normalize(path.join(storybookDir, entry.importPath))
}

/**
 * Stories the baseline had and this checkout does not — the "removed" cards.
 *
 * **The test is the story id, not the file.** Deleting one `export const` from
 * a stories file that still exists drops an id from the current index while the
 * file stays put, so a file-deletion test misses it entirely: the id lands in
 * neither shot map and the report says "0 removed" over a story that silently
 * stopped shipping. A rename is one removed and one added, which is honest.
 *
 * `touched` is every file the diff mentions, deletions included — outside an
 * explicit `--story`/`--all` scope it is the only evidence left that a story
 * which no longer exists was this run's business.
 */
export function removedStories(
  baselineIndex: StoryEntry[],
  currentIds: Set<string>,
  touched: Set<string>,
  affected: Affected,
  storybookDir: string = O3_HOST,
): StoryEntry[] {
  return baselineIndex.filter(
    (entry) =>
      !currentIds.has(entry.id) &&
      (affected.everything || touched.has(entryPath(entry, storybookDir))),
  )
}
