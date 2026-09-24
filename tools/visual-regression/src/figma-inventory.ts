/**
 * The IO half of the pairing inventory (#336): find the story files each
 * Storybook host globs, read the tracked-nodes manifests, and hand both to the
 * engine in `pairing.ts`.
 *
 * Story files are read as **source text**, not imported. A story module pulls
 * JSX, CSS and `@/` aliases behind it, so importing one costs a bundler; the
 * `figmaDesign` call is a string literal in every case, so a read of the file
 * answers the question with no Storybook build and no browser — which is what
 * the ticket's last acceptance criterion asks for.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { SHARED_STORY_ROOTS } from '@o3/story-kit/story-roots'

import {
  buildInventory,
  extractPairings,
  type BrandDesignFile,
  type DeclaredPairing,
  type Inventory,
  type TrackedEntry,
} from './pairing'
import { BRANDS, type Brand } from './storybook'

/** This package is `tools/visual-regression`. */
export const REPO_ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..')

/**
 * What the host globs on top of `SHARED_STORY_ROOTS` — the `appStoryRoots`
 * its `.storybook/main.ts` passes to `defineStorybookConfig`, the captured
 * prototypes (ADR 0010) among them.
 */
const HOST_STORY_ROOTS: Record<Brand, readonly string[]> = {
  o3: ['apps/web/src', 'apps/storybook/prototypes'],
}

/** The `@o3/story-kit` export that names the design file `figmaDesign` links to. */
const FILE_KEY_REF: Record<Brand, string> = {
  o3: 'FIGMA_FILE_KEY',
}

/** `tools/figma-sync/data/` — the manifest is that package's committed data. */
const MANIFEST: Record<Brand, string> = {
  o3: 'tools/figma-sync/data/tracked-nodes.json',
}

const STORY_FILE = /\.stories\.(js|jsx|mjs|ts|tsx)$/

function storyFilesUnder(root: string): string[] {
  const absolute = path.join(REPO_ROOT, root)
  if (!fs.existsSync(absolute)) return []
  const found: string[] = []
  const walk = (dir: string): void => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) walk(full)
      else if (STORY_FILE.test(entry.name)) found.push(path.relative(REPO_ROOT, full))
    }
  }
  walk(absolute)
  return found
}

/** Story file → the hosts that serve it. */
export function storyFilesByHost(brands: readonly Brand[] = BRANDS): Map<string, Brand[]> {
  const hosts = new Map<string, Brand[]>()
  for (const brand of brands) {
    const roots = [...SHARED_STORY_ROOTS, ...HOST_STORY_ROOTS[brand]]
    for (const root of roots) {
      for (const file of storyFilesUnder(root)) {
        hosts.set(file, [...(hosts.get(file) ?? []), brand])
      }
    }
  }
  return hosts
}

export function readDeclaredPairings(brands: readonly Brand[] = BRANDS): DeclaredPairing[] {
  const pairings: DeclaredPairing[] = []
  for (const [file, hosts] of storyFilesByHost(brands)) {
    const source = fs.readFileSync(path.join(REPO_ROOT, file), 'utf8')
    pairings.push(...extractPairings(file, source, hosts))
  }
  return pairings
}

interface ManifestFile {
  readonly fileKey: string
  readonly entries: readonly TrackedEntry[]
}

export function readDesignFiles(brands: readonly Brand[] = BRANDS): BrandDesignFile[] {
  return brands.map((brand) => {
    const manifest = JSON.parse(
      fs.readFileSync(path.join(REPO_ROOT, MANIFEST[brand]), 'utf8'),
    ) as ManifestFile
    return {
      brand,
      fileKeyRef: FILE_KEY_REF[brand],
      fileKey: manifest.fileKey,
      entries: manifest.entries,
    }
  })
}

/** The whole run: every story's pairing joined against the manifest. */
export function readInventory(): Inventory {
  return buildInventory(readDeclaredPairings(), readDesignFiles())
}
