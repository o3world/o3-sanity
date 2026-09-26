/** Current Best Egg frame 3503:10901: a feature image beside two stacked tiles. */
export const BEST_EGG_GALLERY_KEY = '10f6027a8e0e'
const EXPECTED_SCREENS = [
  ['980bd5de4a66', 'image-668bf0e9e446a4fa4e2e30bec61914c901da9cb2-2784x2100-png'],
  ['d276fac530b0', 'image-6b3f9d9f7f9f99324fd0ee7e37dc44b92a46338c-864x1002-png'],
  ['6fad31ab3b16', 'image-a2a859554866d5a0c6d8f48f3d83a9c009ac189e-864x1002-png'],
  ['f83f1855998d', 'image-02e5f3c8aabf4b08ccd5d7754b86aea0ee34a7ed-1824x1002-png'],
  ['7fbe1f51d32b', 'image-8f7247c644227efbfb2b52916515572396f34921-1260x1500-webp'],
] as const

export type BestEggGalleryRow = {
  _id: string
  _rev: string
  _type: string
  slug?: { current?: string }
  migration?: { locked?: boolean }
  story?: {
    _key?: string
    _type: string
    layout?: string | null
    screens?: {
      _key?: string
      span?: string
      framing?: string
      media?: { image?: { asset?: { _ref?: string } } }
    }[]
  }[]
}

export function planBestEggGalleryLayout(row: BestEggGalleryRow) {
  if (
    !['caseStudy-wp-5803', 'drafts.caseStudy-wp-5803'].includes(row._id) ||
    row._type !== 'caseStudy' ||
    row.slug?.current !== 'best-egg'
  )
    throw new Error('Expected the published Best Egg case study or its draft')
  if (!row._rev?.trim()) throw new Error('A document revision is required')
  const matches = row.story?.filter((section) => section._key === BEST_EGG_GALLERY_KEY) ?? []
  const gallery = matches[0]
  if (matches.length !== 1 || gallery?._type !== 'screenGridSection')
    throw new Error('Expected exactly one Best Egg gallery keyed 10f6027a8e0e')
  if (
    gallery.screens?.length !== EXPECTED_SCREENS.length ||
    EXPECTED_SCREENS.some(([key, ref], index) => {
      const screen = gallery.screens?.[index]
      return (
        screen?._key !== key ||
        screen.media?.image?.asset?._ref !== ref ||
        screen.span !== (index === 0 ? 'wide' : 'standard')
      )
    }) ||
    gallery.screens?.[0]?.framing !== 'image'
  )
    throw new Error('Best Egg gallery assets, order, span, or image framing changed')
  if (gallery.layout === 'feature') return null
  if (row.migration?.locked)
    throw new Error('Best Egg is migration-locked; cannot apply an external design value')
  if (gallery.layout != null && gallery.layout !== 'grid')
    throw new Error('Unexpected Best Egg gallery layout')
  return {
    id: row._id,
    revision: row._rev,
    set: { [`story[_key=="${BEST_EGG_GALLERY_KEY}"].layout`]: 'feature' },
  }
}
