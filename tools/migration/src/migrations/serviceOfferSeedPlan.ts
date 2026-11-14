/**
 * What `serviceOfferSeed` does with the committed AI Visibility Review offer:
 * create it when the dataset has nothing at its id or its slug, and nothing
 * otherwise.
 *
 * It only ever creates. A document already at the seed's id — published or a
 * draft — is an editor's from then on, and a different offer holding the slug
 * is what the route already reads; either one stops the run with nothing
 * written, so a rerun is a no-op.
 */
export type SeedOffer = {
  readonly _id: string
  readonly _type: string
  readonly slug: { readonly current: string; readonly _type?: string }
  readonly [field: string]: unknown
}

/** A `serviceOffer` the dataset already holds, at the seed's id or slug. */
export type ExistingOffer = { readonly _id: string; readonly slug?: string | null }

export type ServiceOfferSeedPlan =
  | { readonly kind: 'create'; readonly document: SeedOffer }
  | { readonly kind: 'skip'; readonly reason: string }

export function planServiceOfferSeed(
  seed: SeedOffer,
  existing: readonly ExistingOffer[],
): ServiceOfferSeedPlan {
  if (seed._type !== 'serviceOffer') {
    throw new Error(`${seed._id} is a ${seed._type}, not a serviceOffer`)
  }

  const ids = new Set([seed._id, `drafts.${seed._id}`])
  const sameId = existing.find((doc) => ids.has(doc._id))
  if (sameId) return { kind: 'skip', reason: `${sameId._id} already exists` }

  const sameSlug = existing.find((doc) => doc.slug === seed.slug.current)
  if (sameSlug) {
    return {
      kind: 'skip',
      reason: `${sameSlug._id} already claims slug "${seed.slug.current}"`,
    }
  }

  return { kind: 'create', document: structuredClone(seed) }
}
