/**
 * `pnpm figma:sync` — which canonical page frames moved since the last sync (#78).
 *
 *   1. one call to `/files/:key?depth=1` for the file's version
 *   2. version unchanged and the baseline covers every tracked node? stop there
 *   3. otherwise fetch each tracked subtree, normalize it, hash it, diff it
 *   4. write the baseline and the report, print the summary
 *
 * The committed baseline is what makes step 2 possible, so a sync is a commit:
 * `data/baseline.json` plus `data/report.{json,md}` describe the run that
 * produced them, and git carries the history.
 */
import { diffHashes, isBaselineFresh } from './diff'
import { readFigmaToken } from './env'
import { createFigmaClient } from './figma-api'
import { hashSubtree } from './hash'
import { readBaseline, readManifest, writeBaseline, writeReport } from './paths'
import { buildReport, renderReportMarkdown } from './report'

import type { Baseline, ChangedEntry } from './types'

const line = (entry: ChangedEntry) =>
  `  ${entry.change.padEnd(8)} ${entry.name}${entry.variant ? ` (${entry.variant})` : ''}` +
  `${entry.route ? ` → ${entry.route}` : ''}  ${entry.nodeId}`

async function main() {
  const manifest = readManifest()
  const baseline = readBaseline()
  const client = createFigmaClient(readFigmaToken())
  const ranAt = new Date().toISOString()

  const meta = await client.getFileMeta(manifest.fileKey)
  console.log(`${meta.name} — version ${meta.version}, last modified ${meta.lastModified}`)

  const trackedIds = manifest.entries.map((entry) => entry.nodeId)

  if (isBaselineFresh(baseline, meta, trackedIds)) {
    console.log(`no changes since ${baseline?.syncedAt}`)
    const report = buildReport({
      ranAt,
      fileVersion: meta.version,
      shortCircuited: true,
      manifest,
    })
    writeReport(report, renderReportMarkdown(report))
    return
  }

  const documents = await client.getNodeDocuments(manifest.fileKey, trackedIds)

  const errors: string[] = []
  const hashes: Record<string, string> = {}
  for (const entry of manifest.entries) {
    const document = documents.get(entry.nodeId)
    if (document === undefined) {
      // A tracked id the file no longer has: renamed, deleted, or — the trap
      // this file is famous for — a child node id that was never a frame.
      errors.push(`${entry.nodeId} (${entry.name}, ${entry.variant}) not found in the file`)
      continue
    }
    hashes[entry.nodeId] = hashSubtree(document)
  }

  const diff = diffHashes(baseline?.hashes ?? {}, hashes)
  const report = buildReport({
    ranAt,
    fileVersion: meta.version,
    shortCircuited: false,
    manifest,
    diff,
    errors,
  })
  writeReport(report, renderReportMarkdown(report))

  const next: Baseline = {
    fileKey: manifest.fileKey,
    version: meta.version,
    lastModified: meta.lastModified,
    syncedAt: ranAt,
    hashes,
  }
  writeBaseline(next)

  const changed = [...report.changedFrames, ...report.changedComponentSets]
  if (changed.length === 0) {
    console.log(`file moved, but no tracked node changed (${trackedIds.length} checked)`)
  } else {
    console.log(`${changed.length} of ${trackedIds.length} tracked nodes changed:`)
    for (const entry of changed) console.log(line(entry))
  }
  for (const error of errors) console.error(`  error    ${error}`)
  console.log('\nbaseline and report written to tools/figma-sync/data/ — commit them.')
}

await main()
