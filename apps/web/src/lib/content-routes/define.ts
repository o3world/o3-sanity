import type { CatchAllEntry, DetailEntry, ListingEntry, SingletonEntry } from './types'

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

export function defineListingType<Q extends string>(
  opts: Omit<ListingEntry<Q>, 'kind'>,
): ListingEntry<Q> {
  return { kind: 'listing', ...opts }
}
