/**
 * The client the three brief commands share.
 *
 * `raw`, because the default perspective hides drafts and the document a key
 * collision would destroy is usually one the authoring skill never published
 * (ADR 0027). `normalizeSnapshot` folds the copies back into one row.
 *
 * Here rather than in `briefs.ts` so the corpus definition stays free of
 * `sanity/cli`: the suite reads it without a project or a token. The guidance
 * pair fetches published documents only and keeps its own client.
 */
import { getCliClient } from 'sanity/cli'

export const briefClient = () => getCliClient({ apiVersion: '2026-07-01', perspective: 'raw' })
