export type CardFitRow = {
  _id: string
  _rev: string
  _type: string
  migration?: { locked?: boolean }
  sections?: {
    _key?: string
    _type: string
    items?: { _key?: string; _type: string; heading?: string; fit?: string | null }[]
  }[]
}

/** Only the two approved O3XO placements, in published documents and existing drafts. */
export function planO3xoCardFit(row: CardFitRow) {
  const id = row._id.replace(/^drafts\./, '')
  const target =
    id === 'page-seed-index'
      ? ['0fb21c7a51ee', '9ffa2b389cc3']
      : id === 'page-seed-about'
        ? ['beyond', 'b-ventures']
        : null
  if (!target || row._type !== 'page') throw new Error(`Unexpected document ${row._id}`)
  const sections = row.sections?.filter((section) => section._key === target[0]) ?? []
  const cards = sections[0]?.items?.filter((item) => item._key === target[1]) ?? []
  const card = cards[0]
  if (
    sections.length !== 1 ||
    sections[0]?._type !== 'layoutSection' ||
    cards.length !== 1 ||
    card?._type !== 'mediaCard' ||
    card.heading !== 'O3XO'
  )
    throw new Error(`Expected the approved O3XO card in ${row._id}`)
  if (card.fit === 'contain') return null
  if (row.migration?.locked) throw new Error(`${row._id} is migration-locked`)
  if (card.fit != null) throw new Error(`Refusing to replace authored fit in ${row._id}`)
  return {
    id: row._id,
    revision: row._rev,
    set: { [`sections[_key=="${target[0]}"].items[_key=="${target[1]}"].fit`]: 'contain' },
  }
}
