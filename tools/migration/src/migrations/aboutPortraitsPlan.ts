import { isDeepStrictEqual } from 'node:util'
import manifest from '../../data/about-portraits.json'

export const ABOUT_PORTRAITS = manifest.portraits

export type PortraitRow = {
  _id: string
  _rev: string
  _type: string
  name?: string
  headshot?: unknown
  migration?: { locked?: boolean }
}

/** Replace only reviewed image references; refuse editor changes and locks. */
export function planAboutPortrait(row: PortraitRow) {
  const target = ABOUT_PORTRAITS.find((person) => person.id === row._id.replace(/^drafts\./, ''))
  if (!target || row._type !== 'person' || row.name !== target.name || !row._rev)
    throw new Error(`Unexpected portrait document: ${row._id}`)
  const asset = { ...target.expectedHeadshot.asset, _ref: target.asset }
  const current = row.headshot as { asset?: { _ref?: string } } | null | undefined
  if (current?.asset?._ref === target.asset) return null
  if (row.migration?.locked) throw new Error(`Migration-locked portrait: ${row._id}`)
  if (!isDeepStrictEqual(row.headshot, target.expectedHeadshot))
    throw new Error(`Headshot changed since review: ${row._id}; preserve and reconcile it first`)
  return { id: row._id, revision: row._rev, set: { 'headshot.asset': asset } }
}
