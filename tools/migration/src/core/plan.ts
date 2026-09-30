/**
 * Which committed documents `drift` compares: the corpus and a live lock
 * snapshot in, the provenance-stamped writes and the locked skips out.
 *
 * Pure — no client, no filesystem — so the lock rule is pinned by fixtures
 * instead of by a dataset with no backups.
 */
import type { CorpusDoc } from './read'
import { lockedIds, type LockRow } from './state'

/** The committed corpus split by the lock rule, as a value that can be printed. */
export interface LoadPlan {
  /**
   * Every unlocked committed document, provenance-stamped, in corpus order —
   * the version `drift` compares the dataset's copy against.
   */
  readonly writes: readonly CorpusDoc[]
  /** Ids left alone because an editor took them over (ADR 0003). */
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
  const writes: CorpusDoc[] = []
  const lockedSkips: string[] = []
  for (const doc of committed) {
    if (locked.has(doc._id)) {
      lockedSkips.push(doc._id)
      continue
    }
    writes.push(
      withExtractProvenance(
        withTranslationProvenance(doc, provenance.extractSource),
        provenance.runs,
      ),
    )
  }
  return { writes, lockedSkips }
}
