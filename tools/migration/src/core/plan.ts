/**
 * What a load run does: the committed corpus and a live lock snapshot in, the
 * writes, retirements, stale-draft clears and locked skips out.
 *
 * Pure — no client, no filesystem — so the destructive rules are pinned by
 * fixtures instead of by a dataset with no backups.
 */
import { isPipelineOwned, type CorpusDoc } from './read'
import { bareId, lockedIds, type LockRow } from './state'

/** A document the corpus no longer contains, and the forms the dataset holds. */
export interface Retirement {
  readonly id: string
  readonly draft: boolean
  readonly published: boolean
}

/** Everything a load run will do, as a value that can be printed. */
export interface LoadPlan {
  /**
   * Every unlocked committed document, provenance-stamped, in corpus order —
   * created-or-replaced **published**, in all three trees (ADR 0016).
   */
  readonly writes: readonly CorpusDoc[]
  /**
   * Bare ids whose live draft shadows a document this run writes. A draft
   * shadows its published document everywhere draft mode is on — Studio opens
   * the draft, the preview switcher serves it — so a stale one would keep
   * showing the previous load's content while the site served the new one,
   * with nothing to say the two disagreed. Only for documents the run writes:
   * a locked document is skipped before it gets here, which is what protects
   * an editor who took one over.
   */
  readonly staleDraftClears: readonly string[]
  /**
   * Retirement — the delete half of CONTEXT.md's Rebuild promise ("deletes
   * and recreates every unlocked pipeline-owned document"). A document the
   * corpus no longer contains is removed by the same run that stops writing
   * it. Ownership is the deterministic id contract (`isPipelineOwned`), so a
   * Studio-created document is never touched, and a locked one is skipped
   * and left for `verify`'s orphan check to name.
   */
  readonly retirements: readonly Retirement[]
  /** Ids the run leaves alone because an editor took them over (ADR 0003). */
  readonly lockedSkips: readonly string[]
}

/** What the adapter read for the stamps: the manifest and the extract tree. */
export interface ProvenanceSources {
  /** Extract type → the run timestamp the manifest records for it. */
  readonly runs: Readonly<Record<string, string>>
  /** A translated document's extracted source, parsed; undefined if gone. */
  readonly extractSource: (sourceFile: string) => unknown
}

/**
 * `migration.sourceId` prefix → the extract that produced the document.
 *
 * `extractedAt` is a fact about the extract run, not about the document, so
 * the committed JSON does not carry it: the plan stamps it from the manifest,
 * which keeps the committed tree a pure function of the content while Studio
 * still shows the run that actually produced it.
 */
const EXTRACT_OF_SOURCE: ReadonlyArray<readonly [prefix: string, extractType: string]> = [
  // o3xo.ai has one extract type: a category document is derived from the
  // insight that files itself under it, so it is dated by the same run.
  ['framer:insight:', 'insight'],
  ['framer:category:', 'insight'],
  ['framer:caseStudy:', 'caseStudy'],
  // A client is derived from the case study whose card names it, so it is
  // dated by the same run — the rule the category arm above already states.
  ['framer:client:', 'caseStudy'],
  ['wp:post:', 'perspective'],
  ['wp:page:', 'page'],
  ['wp:work:', 'caseStudy'],
  ['wp:user:', 'person'],
  ['wp:team:', 'team'],
  ['wp:term:', 'category'],
  ['wp:site:chrome', 'siteChrome'],
]

/**
 * Stamp `migration.extractedAt` on documents that came from WordPress.
 * Seeded documents have no extract behind them and are left alone — an
 * invented timestamp would be worse than an absent one.
 */
function withExtractProvenance(doc: CorpusDoc, runs: Readonly<Record<string, string>>): CorpusDoc {
  const migration = doc.migration as { sourceId?: string } | undefined
  const sourceId = migration?.sourceId
  if (!sourceId) return doc
  const match = EXTRACT_OF_SOURCE.find(([prefix]) => sourceId.startsWith(prefix))
  const at = match && runs[match[1]]
  if (!at) return doc
  return { ...doc, migration: { ...migration, extractedAt: at } } as CorpusDoc
}

/**
 * A translated document carries a `_meta` provenance header that is not part
 * of the schema (#21). Strip it, and put the **extracted source** on
 * `migration.source` instead — that is what makes the document reviewable
 * side-by-side in Studio without leaving it.
 *
 * The flags travel with it: a reviewer opening the document sees which fields
 * an agent proposed and why, in the same panel as the source it worked from.
 * That review still has to happen — publishing what WordPress publishes
 * (ADR 0016) changes when it happens, not whether.
 */
function withTranslationProvenance(
  doc: CorpusDoc,
  extractSource: ProvenanceSources['extractSource'],
): CorpusDoc {
  const meta = doc._meta as
    { sourceFile?: string; flags?: unknown[]; model?: string; translatedAt?: string } | undefined
  if (!meta?.sourceFile) return doc

  const rest = Object.fromEntries(Object.entries(doc).filter(([k]) => k !== '_meta')) as CorpusDoc
  const extracted = extractSource(meta.sourceFile)
  const source =
    extracted === undefined
      ? undefined
      : JSON.stringify(
          {
            translation: {
              model: meta.model,
              translatedAt: meta.translatedAt,
              flags: meta.flags ?? [],
            },
            source: extracted,
          },
          null,
          2,
        )

  return {
    ...rest,
    migration: { ...(rest.migration as Record<string, unknown>), ...(source ? { source } : {}) },
  } as CorpusDoc
}

export function plan(
  committed: readonly CorpusDoc[],
  live: readonly LockRow[],
  provenance: ProvenanceSources,
): LoadPlan {
  const locked = lockedIds(live)
  const corpusIds = new Set(committed.map((doc) => doc._id))

  const retiring = new Map<string, { draft: boolean; published: boolean }>()
  for (const row of live) {
    const bare = bareId(row._id)
    if (!isPipelineOwned(bare) || corpusIds.has(bare)) continue
    const entry = retiring.get(bare) ?? { draft: false, published: false }
    if (row._id.startsWith('drafts.')) entry.draft = true
    else entry.published = true
    retiring.set(bare, entry)
  }

  const liveDrafts = new Set(
    live.filter((row) => row._id.startsWith('drafts.')).map((row) => bareId(row._id)),
  )
  const writes: CorpusDoc[] = []
  const staleDraftClears: string[] = []
  const writeSkips: string[] = []
  for (const doc of committed) {
    if (locked.has(doc._id)) {
      writeSkips.push(doc._id)
      continue
    }
    writes.push(
      withExtractProvenance(
        withTranslationProvenance(doc, provenance.extractSource),
        provenance.runs,
      ),
    )
    if (liveDrafts.has(doc._id)) staleDraftClears.push(doc._id)
  }

  const retirementSkips: string[] = []
  const retirements: Retirement[] = []
  for (const [id, where] of retiring) {
    if (locked.has(id)) {
      retirementSkips.push(id)
      continue
    }
    retirements.push({ id, ...where })
  }

  return { writes, staleDraftClears, retirements, lockedSkips: [...writeSkips, ...retirementSkips] }
}
