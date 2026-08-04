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
 *
 * A run that stops at step 2 writes **nothing at all** — not even a fresh
 * `ranAt`. The files on disk go on describing the last run that had something
 * to say, so two syncs in a row leave `git status` empty, and the console is
 * where a short-circuited run reports the conflicts the baseline still carries.
 */
import {
  applyAssetDecisions,
  assetSourceNodeIds,
  carryOpenConflicts,
  planAssetSync,
} from './assets'
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
import {
  buildReport,
  formatChangedEntry,
  renderReportMarkdown,
  shortCircuitSummary,
} from './report'

import type { Baseline, TrackedKind } from './types'

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

  // `isBaselineFresh` is false without a baseline, so there is one here.
  if (baseline && isBaselineFresh(baseline, meta, trackedIds, assetIds)) {
    for (const summary of shortCircuitSummary(baseline)) console.log(summary)
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
  // What each node *was*, so a removal the manifest no longer describes still
  // knows whether it was a page or a component set.
  const kinds: Record<string, TrackedKind> = {}
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
    kinds[entry.nodeId] = entry.kind
  }

  // The asset stage (#81): the same hash, a different question — not "which
  // page moved?" but "is a committed file now out of date with the node it
  // was exported from?". A node that did not move costs no export call.
  const assetHashes: Record<string, string> = {}
  for (const nodeId of assetIds) {
    const document = documents.get(nodeId)
    if (document !== undefined) assetHashes[nodeId] = hashSubtree(document)
  }
  // Conflicts the baseline is carrying, minus the ones something has closed:
  // an unreconciled locked conflict is reported by *every* run, not just the
  // one that found it (#81).
  const carried = carryOpenConflicts(assetManifest, baseline?.openAssetConflicts ?? [], assetHashes)
  const assets = await applyAssetDecisions(
    planAssetSync(assetManifest, baseline?.assetHashes ?? {}, assetHashes),
    assetHashes,
    {
      fileKey: assetManifest.fileKey,
      client,
      documents,
      writeAsset: writeSeedAsset,
    },
    { ranAt, stillOpen: carried.stillOpen },
  )

  const diff = diffHashes(baseline?.hashes ?? {}, hashes)
  const report = buildReport({
    ranAt,
    fileVersion: meta.version,
    shortCircuited: false,
    manifest,
    diff,
    previousKinds: baseline?.kinds,
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
    kinds,
    // Only what this run settled: an asset whose export failed keeps no hash,
    // so the next run tries again instead of calling it done.
    assetHashes: assets.hashes,
    // The conflicts that outlive this run. The hashes above moved on; these
    // are what keep the conflict visible until the manifest entry changes.
    openAssetConflicts: assets.openConflicts,
  }
  writeBaseline(next)

  const changed = [...report.changedFrames, ...report.changedComponentSets]
  if (changed.length === 0) {
    console.log(`file moved, but no tracked node changed (${trackedIds.length} checked)`)
  } else {
    console.log(`${changed.length} of ${trackedIds.length} tracked nodes changed:`)
    for (const entry of changed) console.log(formatChangedEntry(entry, 'plain'))
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
        ' Reconcile by hand (edit the manifest entry to close one):',
    )
    for (const conflict of assets.lockedConflicts) {
      const age =
        conflict.state === 'stillOpen'
          ? `still open since ${conflict.firstSeenAt}`
          : conflict.reason
      console.log(`  conflict ${conflict.path}  ← ${conflict.nodeId} (${age})`)
    }
  }
  if (carried.cleared.length > 0) {
    console.log(
      `\n${carried.cleared.length} locked-asset conflict(s) closed since the last run` +
        ' — the manifest entry changed, or a newer conflict replaced it.',
    )
  }
  for (const failure of assets.failures) {
    console.error(`  failed   ${failure.path}  ← ${failure.nodeId ?? '?'}: ${failure.error}`)
  }
  for (const error of errors) console.error(`  error    ${error}`)
  console.log('\nbaseline and report written to tools/figma-sync/data/ — commit them.')
}

await main()
