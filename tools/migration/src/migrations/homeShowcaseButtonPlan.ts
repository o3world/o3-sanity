/** Only the existing Home showcase button's contrast changes. */
export type HomeShowcaseRow = {
  _id: string
  _rev: string
  _type: string
  slug?: { current?: string }
  migration?: { locked?: boolean }
  sections?: { _key?: string; _type: string; button?: { contrast?: string | null } | null }[]
}

export function planHomeShowcaseButton(row: HomeShowcaseRow) {
  if (
    !['page-seed-index', 'drafts.page-seed-index'].includes(row._id) ||
    row._type !== 'page' ||
    row.slug?.current !== 'index'
  )
    throw new Error('Expected the published Home page or its draft')
  const sections = row.sections?.filter((section) => section._type === 'caseShowcaseSection') ?? []
  if (!sections.length) return null
  const section = sections[0]
  if (sections.length !== 1 || section?._key !== 'work')
    throw new Error('Expected exactly one Home showcase keyed work')
  if (!section.button || section.button.contrast === 'brand') return null
  if (row.migration?.locked) throw new Error('Home is migration-locked')
  if (
    section.button.contrast != null &&
    !['auto', 'dark', 'light'].includes(section.button.contrast)
  )
    throw new Error(`Unexpected showcase button contrast ${section.button.contrast}`)
  return {
    id: row._id,
    revision: row._rev,
    set: { 'sections[_key=="work"].button.contrast': 'brand' },
  }
}
