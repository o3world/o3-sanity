/** Only the About hero's design alignment changes; authored content stays intact. */
export type AboutHeroRow = {
  _id: string
  _rev: string
  _type: string
  slug?: { current?: string }
  migration?: { locked?: boolean }
  sections?: { _key?: string; _type: string; variant?: string; alignment?: string | null }[]
}

export function planAboutHeroAlignment(row: AboutHeroRow) {
  if (
    !['page-seed-about', 'drafts.page-seed-about'].includes(row._id) ||
    row._type !== 'page' ||
    row.slug?.current !== 'about'
  )
    throw new Error('Expected the published About page or its draft')
  const heroes = row.sections?.filter((section) => section._type === 'heroSection') ?? []
  const hero = heroes[0]
  if (heroes.length !== 1 || hero?._key !== 'hero' || hero.variant !== 'band')
    throw new Error('Expected exactly one About band hero keyed hero')
  if (hero.alignment === 'center') return null
  if (row.migration?.locked)
    throw new Error('About is migration-locked; no external design value may overwrite it')
  if (hero.alignment != null && hero.alignment !== 'start')
    throw new Error(`Unexpected hero alignment ${hero.alignment}`)
  return { id: row._id, revision: row._rev, set: { 'sections[_key=="hero"].alignment': 'center' } }
}
