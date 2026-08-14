/**
 * Which stories does this diff actually touch?
 *
 * Answered from Storybook's own module graph (`preview-stats.json`), not from
 * filename guesswork. Editing `packages/ui/src/components/stat.tsx` selects
 * every story that renders a `Stat`, including the ones three files away that
 * never mention it by name — and editing a file no story imports selects
 * nothing, which is what keeps a run down to seconds.
 *
 * Module ids in the stats file are relative to `apps/storybook` (the Storybook
 * config's root): `./globals.css`, `./../../packages/ui/src/components/stat.tsx`.
 * Everything below normalises them to repo-relative paths so they can be
 * compared against `git diff` output.
 */
import path from 'node:path'

import type { StatsModule, StoryEntry } from './storybook'

const STORYBOOK_DIR = 'apps/storybook'

/**
 * Modules that sit above every story. A change that reaches one of these has
 * no story-shaped blast radius — it has all of them.
 */
const GLOBAL_MODULES = [`${STORYBOOK_DIR}/.storybook/preview.ts`, `${STORYBOOK_DIR}/globals.css`]

function toRepoPath(moduleId: string): string | null {
  // Virtual modules (`virtual:/@storybook/...`), rollup's `\0`-prefixed ids and
  // anything inside a package directory are not files anyone edits.
  if (!moduleId.startsWith('./') || moduleId.includes('\0')) return null
  const resolved = path.normalize(path.join(STORYBOOK_DIR, moduleId.slice(2)))
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

export function affectedStoryFiles(modules: StatsModule[], changed: string[]): Affected {
  // moduleId → the modules that import it, both sides normalised.
  const importers = new Map<string, Set<string>>()
  for (const module of modules) {
    const self = toRepoPath(module.id)
    if (!self) continue
    const parents = importers.get(self) ?? new Set<string>()
    for (const reason of module.reasons ?? []) {
      const parent = reason.moduleName ? toRepoPath(reason.moduleName) : null
      if (parent && parent !== self) parents.add(parent)
    }
    importers.set(self, parents)
  }

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
    if (GLOBAL_MODULES.includes(current)) return { storyFiles: [], everything: true }
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
export function storiesFor(index: StoryEntry[], affected: Affected): StoryEntry[] {
  if (affected.everything) return index
  const wanted = new Set(affected.storyFiles)
  return index.filter((entry) => wanted.has(entryPath(entry)))
}

/** `../../packages/ui/src/x.stories.tsx` → `packages/ui/src/x.stories.tsx`. */
export function entryPath(entry: StoryEntry): string {
  return path.normalize(path.join(STORYBOOK_DIR, entry.importPath))
}
