/**
 * `pnpm figma:sync` — what moved in the design file since the last sync
 * (#78, extended by #79).
 *
 *   1. one call to `/files/:key?depth=1` for the file's version
 *   2. version unchanged and the baseline covers every tracked node? stop there
 *   3. otherwise fetch each tracked subtree — page frames *and* component sets
 *      — normalize it, hash it, diff it
 *   4. list the Design Concept section's direct children and name the frames
 *      the manifest has never heard of (`probe.ts`)
 *   5. write the baseline and the report, print the summary
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
import { findUntrackedFrames } from './probe'
import { buildReport, renderReportMarkdown } from './report'

import type { Baseline, ChangedEntry } from './types'

const line = (entry: ChangedEntry) =>
  `  ${entry.change.padEnd(8)} ${entry.name}${entry.variant ? ` (${entry.variant})` : ''}` +
  `${entry.route ? ` → ${entry.route}` : ''}` +
  `${entry.codeComponent === undefined ? '' : ` → ${entry.codeComponent ?? 'no code target'}`}` +
  `  ${entry.nodeId}`

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

  // The probe (#79): one `depth=1` call, and the only thing here that looks
  // outside the manifest. It surfaces candidates and promotes nothing.
  const children = await client.getSectionChildren(manifest.fileKey, manifest.sectionNodeId)
  if (children === null) {
    errors.push(
      `section ${manifest.sectionNodeId} not found — the untracked-frame probe was skipped`,
    )
  }
  const untrackedFrames = children ? findUntrackedFrames(children, manifest) : []

  const hashes: Record<string, string> = {}
  for (const entry of manifest.entries) {
    const document = documents.get(entry.nodeId)
    if (document === undefined) {
      // A tracked id the file no longer has: renamed, deleted, or — the trap
      // this file is famous for — a child node id that was never a frame.
      errors.push(
        `${entry.nodeId} (${entry.name}, ${entry.variant ?? entry.kind}) not found in the file`,
      )
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
    untrackedFrames,
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
  if (untrackedFrames.length > 0) {
    console.log(
      `\n${untrackedFrames.length} frame(s) in the Design Concept section are not in the manifest —` +
        ' canonical? add them to tracked-nodes.json. noise? add them to ignoredNodeIds.',
    )
    for (const frame of untrackedFrames) {
      console.log(
        `  untracked ${frame.name}${frame.width ? ` (${frame.width}w)` : ''}  ${frame.nodeId}`,
      )
    }
  }
  for (const error of errors) console.error(`  error    ${error}`)
  console.log('\nbaseline and report written to tools/figma-sync/data/ — commit them.')
}

await main()
