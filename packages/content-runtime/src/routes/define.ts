import type { DocumentSeo } from '../seo'

import type { CatchAllEntry, DetailEntry, IndexDocument, IndexEntry, SingletonEntry } from './types'

export function defineCatchAllType<Q extends string>(
  opts: Omit<CatchAllEntry<Q>, 'kind'>,
): CatchAllEntry<Q> {
  return { kind: 'catchAll', ...opts }
}

export function defineDetailType<Q extends string>(
  opts: Omit<DetailEntry<Q>, 'kind'>,
): DetailEntry<Q> {
  return { kind: 'detail', ...opts }
}

export function defineSingletonType<Q extends string>(
  opts: Omit<SingletonEntry<Q>, 'kind'>,
): SingletonEntry<Q> {
  return { kind: 'singleton', ...opts }
}

/**
 * `seo` is OPTIONAL on an index, but REQUIRED once the entry declares a
 * `document`.
 *
 * The route builds its canonical from `entry.seo.path` and never from the
 * document — an editor may not move an index's URL. So an entry with authored
 * chrome and no static SEO has a document whose `seo` overrides would be
 * resolved against a path nobody supplied, and the canonical would come out as
 * the bare origin: every page of that index pointing at the homepage, which is
 * worse than shipping no metadata at all.
 *
 * Enforced here rather than asserted at runtime because this is the one place
 * an index entry is constructed, which makes it a compile error at the call
 * site instead of a bad tag nobody looks at. The builder still guards, for a
 * caller that reaches past this.
 */
type IndexTypeOptions<Q extends string> = Omit<IndexEntry<Q>, 'kind'> &
  (
    | { readonly document?: undefined }
    | { readonly document: IndexDocument; readonly seo: DocumentSeo }
  )

export function defineIndexType<Q extends string>(opts: IndexTypeOptions<Q>): IndexEntry<Q> {
  return { kind: 'index', ...opts }
}
