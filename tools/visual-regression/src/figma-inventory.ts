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
 * What each host globs on top of `SHARED_STORY_ROOTS` — the `appStoryRoots`
 * its `.storybook/main.ts` passes to `defineStorybookConfig`. O3's host also
 * mounts the captured prototypes (ADR 0010).
 */
const HOST_STORY_ROOTS: Record<Brand, readonly string[]> = {
  o3: ['apps/web/src', 'apps/storybook/prototypes'],
  o3xo: ['apps/o3xo/src'],
}

/**
 * Which `@o3/story-kit` export names each brand's design file. `figmaDesign`
 * defaults to O3's, so a story with one argument is an O3 pairing.
 */
const FILE_KEY_REF: Record<Brand, string> = {
  o3: 'FIGMA_FILE_KEY',
  o3xo: 'O3XO_FIGMA_FILE_KEY',
}

/** `tools/figma-sync/data/` — the manifests are that package's committed data. */
const MANIFEST: Record<Brand, string> = {
  o3: 'tools/figma-sync/data/tracked-nodes.json',
  o3xo: 'tools/figma-sync/data/tracked-nodes-o3xo.json',
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

/**
 * Story file → the hosts that serve it. A file under `packages/` is globbed by
 * both hosts and has one story id in each (ADR 0028), so it is one row with
 * two hosts rather than two rows.
 */
export function storyFilesByHost(brands: readonly Brand[]): Map<string, Brand[]> {
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

export function readDeclaredPairings(brands: readonly Brand[]): DeclaredPairing[] {
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

export function readDesignFiles(brands: readonly Brand[]): BrandDesignFile[] {
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

/**
 * The whole run. `brands` narrows the hosts whose stories are read and the
 * design files the report is about, the way `--brand` already splits `vr` and
 * `figma:sync`. Every manifest is loaded whatever the scope: a story on either
 * host can name either brand's file, and a join that could not see the other
 * one would call that pairing untracked.
 */
export function readInventory(brands: readonly Brand[] = BRANDS): Inventory {
  return buildInventory(readDeclaredPairings(brands), readDesignFiles(BRANDS), brands)
}
