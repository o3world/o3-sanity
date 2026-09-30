export type AboutSurfaceRow = {
  _id: string
  _rev: string
  _type: string
  migration?: { locked?: boolean }
  sections?: { _key?: string; _type: string; surface?: string | null }[]
}

/** OWSW-66: only About's business band, preserving each document version. */
export function planAboutCharcoal(row: AboutSurfaceRow) {
  if (row._id.replace(/^drafts\./, '') !== 'page-seed-about' || row._type !== 'page')
    throw new Error(`Unexpected document ${row._id}`)
  const sections = row.sections?.filter((section) => section._key === 'beyond') ?? []
  if (sections.length !== 1 || sections[0]?._type !== 'layoutSection')
    throw new Error(`Expected About's business band in ${row._id}`)
  if (sections[0].surface === 'charcoal') return null
  if (row.migration?.locked) throw new Error(`${row._id} is migration-locked`)
  if (sections[0].surface !== 'ink') throw new Error(`Surface changed in ${row._id}; review again`)
  return {
    id: row._id,
    revision: row._rev,
    set: { 'sections[_key=="beyond"].surface': 'charcoal' },
  }
}
