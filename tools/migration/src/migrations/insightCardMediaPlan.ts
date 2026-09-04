/**
 * What the `insight-card-media` migration will do, as a value (#418).
 *
 * A pure function from what was queried and what is on disk to the patches,
 * the file rewrites and the skips. The script beside this supplies the client
 * and nothing else, which is what lets the decision be unit tested with no
 * project and no token — the same split the brief corpus engine uses, and it
 * exists because the failure mode here is 272 committed files written wrongly.
 */

/** The `figure` object both fields hold — copied whole, asset reference and all. */
export type Figure = Record<string, unknown>

/** One insight as the migration queries it. Drafts arrive here like any other row. */
export interface InsightRow {
  readonly _id: string
  readonly title?: string | null
  readonly featuredImage?: Figure | null
  readonly cardMedia?: Figure | null
}

/** One committed insight, as read off disk. */
export interface InsightFile {
  readonly path: string
  readonly doc: Record<string, unknown>
}

export interface Patch {
  readonly _id: string
  readonly cardMedia: Figure
}

export interface Rewrite {
  readonly path: string
  readonly doc: Record<string, unknown>
}

export interface Skip {
  /** The document id or the file path, whichever the skip is about. */
  readonly subject: string
  readonly why: string
}

export interface Plan {
  readonly patches: readonly Patch[]
  readonly rewrites: readonly Rewrite[]
  readonly skips: readonly Skip[]
}

/**
 * `migration.locked` IS NOT CONSULTED, and that is not an oversight. The lock
 * guards a document's content being replaced from *outside* it — the pipeline
 * overwriting an editor's version with the committed JSON (ADR 0003). The only
 * input here is the document's own `featuredImage`, so there is no outside
 * version and nothing for the lock to protect. Honouring it would leave the
 * most carefully-tended articles as the only ones without a card picture.
 * This is the reading `statsToBand` already settled.
 */
export function planInsightCardMedia(
  rows: readonly InsightRow[],
  files: readonly InsightFile[],
): Plan {
  const patches: Patch[] = []
  const rewrites: Rewrite[] = []
  const skips: Skip[] = []

  for (const row of rows) {
    const subject = row.title ?? row._id
    if (row.cardMedia) {
      // Already carries one. Overwriting it would replace an editor's choice
      // with the old picture, and it is what makes a second run a no-op.
      skips.push({ subject, why: 'already has a card picture' })
      continue
    }
    if (!row.featuredImage) {
      skips.push({ subject, why: 'no picture at all' })
      continue
    }
    patches.push({ _id: row._id, cardMedia: row.featuredImage })
  }

  for (const file of files) {
    const featuredImage = file.doc.featuredImage as Figure | undefined | null
    if (file.doc.cardMedia) {
      skips.push({ subject: file.path, why: 'already has a card picture' })
      continue
    }
    if (!featuredImage) {
      skips.push({ subject: file.path, why: 'no picture at all' })
      continue
    }
    // `featuredImage` goes as the picture moves, so the record matches the
    // dataset the removal (#421) will leave behind. Key order is preserved
    // around it: the new field takes the old one's place in the object rather
    // than being appended, so the diff is one field renamed.
    const doc: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(file.doc)) {
      if (key === 'featuredImage') doc.cardMedia = value
      else doc[key] = value
    }
    rewrites.push({ path: file.path, doc })
  }

  return { patches, rewrites, skips }
}
