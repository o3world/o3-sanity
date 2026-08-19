/**
 * The new-frame probe (#79) — the one part of a sync run that looks outside
 * the manifest.
 *
 * Hashing answers "did anything we watch change?". It cannot answer "is there
 * design work we are not watching at all?", and that gap is how a brand-new
 * page frame appears in the file and nobody notices for a month. So every
 * non-short-circuited run lists the **direct children** of the Design Concept
 * section and names the frames the manifest has never heard of.
 *
 * ## It surfaces, it never promotes
 *
 * The file holds two generations of the same site (`docs/agents/figma.md`), so
 * "a frame exists in the section" and "a frame is canonical" are different
 * claims — the second one is a judgement, and this module does not make it.
 * Nothing here writes to `tracked-nodes.json`; the report says *triage me* and
 * a human (or the judgement layer) answers, either by adding a manifest entry
 * or by muting the node in `ignoredNodeIds`.
 *
 * Only direct children, and only the node types the manifest asks for.
 * Descending would report every hero in the file as new; taking every type
 * would report the loose components a site file's section holds (the canonical
 * `NavBar` sits right there). Which types are news depends on what the file
 * is, so the manifest says: a site file watches `FRAME`s, and the O3XO kit
 * watches library nodes because its frames are spec sheets (#242).
 */
import type { TrackedManifest, UntrackedFrame } from './types'

/** What a site file's section holds that is worth triaging. */
const DEFAULT_PROBE_TYPES = ['FRAME'] as const

/** As much of a `?depth=1` child as the classification needs. */
export interface SectionChild {
  readonly id: string
  readonly name: string
  readonly type: string
  readonly absoluteBoundingBox?: { readonly width?: number } | null
}

/**
 * Section children → the ones nobody has made a decision about yet. Pure: the
 * listing comes from `figma-api.ts`, the decisions from the manifest.
 */
export function findUntrackedFrames(
  children: readonly SectionChild[],
  manifest: TrackedManifest,
): UntrackedFrame[] {
  const known = new Set<string>([
    ...manifest.entries.map((entry) => entry.nodeId),
    ...(manifest.ignoredNodeIds ?? []).map((entry) => entry.nodeId),
  ])
  const types = new Set<string>(manifest.probeNodeTypes ?? DEFAULT_PROBE_TYPES)

  return children
    .filter((child) => types.has(child.type) && !known.has(child.id))
    .map((child) => {
      const width = child.absoluteBoundingBox?.width
      return {
        nodeId: child.id,
        name: child.name,
        width: typeof width === 'number' ? Math.round(width) : null,
      }
    })
}
