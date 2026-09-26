export type SolutionsEngagementRow = {
  _id: string
  _rev: string
  _type: string
  slug?: { current?: string }
  migration?: { locked?: boolean }
  sections?: { _key?: string; _type: string; layout?: string | null }[]
}

export function planSolutionsEngagementAlignment(row: SolutionsEngagementRow) {
  if (
    !['page-seed-solutions', 'drafts.page-seed-solutions'].includes(row._id) ||
    row._type !== 'page' ||
    row.slug?.current !== 'solutions'
  )
    throw new Error('Expected the published Solutions page or its draft')
  const sections = row.sections?.filter((section) => section._key === 'engagements') ?? []
  const section = sections[0]
  if (sections.length !== 1 || section?._type !== 'railPanelsSection')
    throw new Error('Expected exactly one engagement panel section')
  if (section.layout === 'cards') return null
  if (row.migration?.locked) throw new Error('Solutions is migration-locked')
  if (section.layout !== 'track') throw new Error(`Unexpected engagement layout ${section.layout}`)
  return {
    id: row._id,
    revision: row._rev,
    set: { 'sections[_key=="engagements"].layout': 'cards' },
  }
}
