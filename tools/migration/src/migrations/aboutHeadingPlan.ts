/** The approved About design correction sets one field; all authored content stays intact. */
export type AboutHeadingRow = {
  _id: string
  _rev: string
  _type: string
  slug?: { current?: string }
  migration?: { locked?: boolean }
  sections?: { _key?: string; _type: string; headingLevel?: string | null }[]
}

export function planAboutHeading(row: AboutHeadingRow) {
  if (row._id !== 'page-seed-about' || row._type !== 'page' || row.slug?.current !== 'about') {
    throw new Error('Expected the published About page page-seed-about')
  }
  const sections = row.sections?.filter((section) => section._key === 'why') ?? []
  const section = sections[0]
  if (sections.length !== 1 || !section || section._type !== 'layoutSection') {
    throw new Error('Expected exactly one About layoutSection keyed why')
  }
  const current = section.headingLevel
  if (current === 'xl') return null
  if (row.migration?.locked)
    throw new Error('About is migration-locked; no external design value may overwrite it')
  if (current != null && current !== 'auto')
    throw new Error(`Refusing to replace authored headingLevel ${current}`)
  return { id: row._id, revision: row._rev, set: { 'sections[_key=="why"].headingLevel': 'xl' } }
}
