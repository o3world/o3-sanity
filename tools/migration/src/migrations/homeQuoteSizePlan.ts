/** Changes only the Home quote's responsive size, preserving all authored fields. */
export type HomeQuoteRow = {
  _id: string
  _rev: string
  _type: string
  slug?: { current?: string }
  migration?: { locked?: boolean }
  sections?: { _key?: string; _type: string; size?: string | null }[]
}

export function planHomeQuoteSize(row: HomeQuoteRow) {
  if (
    !['page-seed-index', 'drafts.page-seed-index'].includes(row._id) ||
    row._type !== 'page' ||
    row.slug?.current !== 'index'
  )
    throw new Error('Expected the published Home page or its draft')
  const quotes = row.sections?.filter((section) => section._type === 'quoteSection') ?? []
  const quote = quotes[0]
  if (quotes.length !== 1 || quote?._key !== 'quote')
    throw new Error('Expected exactly one Home quote keyed quote')
  if (quote.size === 'medium') return null
  if (row.migration?.locked) throw new Error('Home is migration-locked')
  if (quote.size != null && !['default', 'small'].includes(quote.size))
    throw new Error(`Unexpected quote size ${quote.size}`)
  return { id: row._id, revision: row._rev, set: { 'sections[_key=="quote"].size': 'medium' } }
}
