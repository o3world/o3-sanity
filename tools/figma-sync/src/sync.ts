/**
 * `pnpm figma:sync` — what moved in the design file since the last sync
 * (#78, extended by #79 and #81).
 *
 *   1. one call to `/files/:key?depth=1` for the file's version
 *   2. version unchanged and the baseline covers every tracked node *and*
 *      every asset source node? stop there
 *   3. otherwise fetch each subtree — page frames, component sets, and the
 *      nodes the committed assets came from — normalize it, hash it, diff it
 *   4. list the Design Concept section's direct children and name the frames
 *      the manifest has never heard of (`probe.ts`)
 *   5. re-export the assets whose source node moved, and refuse to touch the
 *      locked ones (`assets.ts`)
 *   6. write the baseline and the report, print the summary
 *
 * The committed baseline is what makes step 2 possible, so a sync is a commit:
 * `data/baseline.json` plus `data/report.{json,md}` describe the run that
 * produced them, any asset it rewrote is right there in the same diff, and git
 * carries the history.
 */
import { applyAssetDecisions, assetSourceNodeIds, planAssetSync } from './assets'
import { diffHashes, isBaselineFresh } from './diff'
import { readFigmaToken } from './env'
import { createFigmaClient } from './figma-api'
import { hashSubtree } from './hash'
import {
  readAssetManifest,
  readBaseline,
  readManifest,
  writeBaseline,
  writeReport,
  writeSeedAsset,
} from './paths'
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
  const assetManifest = readAssetManifest()
  // One node fetch serves both manifests, which only works if they describe
  // the same file. They are hand-maintained separately, so say it out loud.
  if (assetManifest.fileKey !== manifest.fileKey) {
    throw new Error(
      `tracked-nodes.json watches ${manifest.fileKey} but asset-manifest.json ` +
        `claims ${assetManifest.fileKey} — one of them is wrong.`,
    )
  }
  const baseline = readBaseline()
  const client = createFigmaClient(readFigmaToken())
  const ranAt = new Date().toISOString()

  const meta = await client.getFileMeta(manifest.fileKey)
  console.log(`${meta.name} — version ${meta.version}, last modified ${meta.lastModified}`)

  const trackedIds = manifest.entries.map((entry) => entry.nodeId)
  const assetIds = assetSourceNodeIds(assetManifest)

  if (isBaselineFresh(baseline, meta, trackedIds, assetIds)) {
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

  // The asset source nodes ride along in the same batched fetch: they are
  // hashed exactly like a tracked frame, just kept in their own map.
  const documents = await client.getNodeDocuments(manifest.fileKey, [
    ...new Set([...trackedIds, ...assetIds]),
  ])

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

  // The asset stage (#81): the same hash, a different question — not "which
  // page moved?" but "is a committed file now out of date with the node it
  // was exported from?". A node that did not move costs no export call.
  const assetHashes: Record<string, string> = {}
  for (const nodeId of assetIds) {
    const document = documents.get(nodeId)
    if (document !== undefined) assetHashes[nodeId] = hashSubtree(document)
  }
  const assets = await applyAssetDecisions(
    planAssetSync(assetManifest, baseline?.assetHashes ?? {}, assetHashes),
    assetHashes,
    {
      fileKey: assetManifest.fileKey,
      client,
      documents,
      writeAsset: writeSeedAsset,
    },
  )

  const diff = diffHashes(baseline?.hashes ?? {}, hashes)
  const report = buildReport({
    ranAt,
    fileVersion: meta.version,
    shortCircuited: false,
    manifest,
    diff,
    untrackedFrames,
    assets,
    errors,
  })
  writeReport(report, renderReportMarkdown(report))

  const next: Baseline = {
    fileKey: manifest.fileKey,
    version: meta.version,
    lastModified: meta.lastModified,
    syncedAt: ranAt,
    hashes,
    // Only what this run settled: an asset whose export failed keeps no hash,
    // so the next run tries again instead of calling it done.
    assetHashes: assets.hashes,
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
  if (assets.regenerated.length > 0) {
    console.log(`\n${assets.regenerated.length} asset(s) re-exported — review the git diff:`)
    for (const asset of assets.regenerated) {
      console.log(`  rewrote  ${asset.path}  ← ${asset.nodeId} (${asset.export}, ${asset.reason})`)
    }
  }
  if (assets.lockedConflicts.length > 0) {
    console.log(
      `\n${assets.lockedConflicts.length} locked asset(s) whose source moved — nothing was written.` +
        ' Reconcile by hand:',
    )
    for (const conflict of assets.lockedConflicts) {
      console.log(`  conflict ${conflict.path}  ← ${conflict.nodeId} (${conflict.reason})`)
    }
  }
  for (const failure of assets.failures) {
    console.error(`  failed   ${failure.path}  ← ${failure.nodeId ?? '?'}: ${failure.error}`)
  }
  for (const error of errors) console.error(`  error    ${error}`)
  console.log('\nbaseline and report written to tools/figma-sync/data/ — commit them.')
}

await main()
