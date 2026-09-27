const ARRAYS: Record<string, readonly string[]> = {
  page: ['sections'],
  collectionIndex: ['sectionsAbove', 'sectionsBelow'],
  caseStudy: ['story'],
}
export type CtaDecorationRow = {
  _id: string
  _rev: string
  _type: string
  [field: string]: unknown
}

/** Remove the retired setting from each document's own CTA; no replacement content is imported. */
export function planCtaDecorationRetirement(row: CtaDecorationRow) {
  if (!row._id || !row._rev || !Object.hasOwn(ARRAYS, row._type))
    throw new Error(`Unexpected document identity: ${row._id}`)
  const unset: string[] = []
  const before: Record<string, unknown> = {}
  for (const field of ARRAYS[row._type]!) {
    const sections = row[field]
    if (sections == null) continue
    if (!Array.isArray(sections)) throw new Error(`Unexpected ${field} on ${row._id}`)
    const keys = new Set<string>()
    for (const section of sections) {
      if (section?._type !== 'ctaSection' || section.decoration === undefined) continue
      if (
        typeof section._key !== 'string' ||
        !/^[a-zA-Z0-9_-]+$/.test(section._key) ||
        keys.has(section._key) ||
        sections.filter((item) => item?._key === section._key).length !== 1
      )
        throw new Error(`Invalid or duplicate CTA key on ${row._id}`)
      keys.add(section._key)
      if (section.decoration !== null && !['orbs', 'molecule', 'none'].includes(section.decoration))
        throw new Error(`Unexpected CTA decoration on ${row._id}/${section._key}`)
      const path = `${field}[_key=="${section._key}"].decoration`
      before[path] = section.decoration
      unset.push(path)
    }
  }
  return unset.length ? { id: row._id, revision: row._rev, before, unset } : null
}
