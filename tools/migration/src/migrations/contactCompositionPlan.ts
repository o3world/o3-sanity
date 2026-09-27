type Section = { _type: string; _key?: string; [field: string]: unknown }

export type ContactCompositionRow = {
  _id: string
  _rev: string
  _type: string
  slug?: { current?: string }
  migration?: { locked?: boolean }
  sections?: Section[]
}

/** Move the document's own introduction into its form without replacing authored content. */
export function planContactComposition(row: ContactCompositionRow) {
  if (
    !['page-seed-contact', 'drafts.page-seed-contact'].includes(row._id) ||
    row._type !== 'page' ||
    row.slug?.current !== 'contact'
  )
    throw new Error('Expected the Contact page or its draft')
  const sections = row.sections ?? []
  const forms = sections.filter((section) => section._type === 'formSection')
  const heroes = sections.filter((section) => section._type === 'heroSection')
  const form = forms[0]
  if (forms.length !== 1 || !form?._key) throw new Error('Expected exactly one keyed form')
  if (!heroes.length && form.variant === 'hero') return null
  const hero = heroes[0]
  if (
    heroes.length !== 1 ||
    !hero?._key ||
    hero.variant !== 'band' ||
    sections[0] !== hero ||
    sections[1] !== form
  )
    throw new Error('Expected adjacent opening hero and form')
  if (row.migration?.locked)
    throw new Error('Contact is migration-locked; its new surface needs explicit reconciliation')
  if (form.variant != null && form.variant !== 'band')
    throw new Error('Unexpected form composition')
  const transferred = new Set([
    '_key',
    '_type',
    'variant',
    'alignment',
    'surface',
    'decoration',
    'eyebrow',
    'headlineLines',
    'subheading',
  ])
  for (const [key, value] of Object.entries(hero)) {
    if (!transferred.has(key) && value != null)
      throw new Error(`Hero field ${key} must be reconciled before removing the hero`)
  }
  if (
    !Array.isArray(hero.headlineLines) ||
    !hero.headlineLines.length ||
    !hero.headlineLines.every((line) => typeof line === 'string')
  )
    throw new Error('Expected authored hero headline lines')
  if (hero.decoration != null && !['orbs', 'none'].includes(String(hero.decoration)))
    throw new Error('Unexpected hero decoration')
  const button = form.button
  if (button != null && (typeof button !== 'object' || Array.isArray(button)))
    throw new Error('Unexpected form button')
  const moved = {
    heading: hero.headlineLines.join('\n'),
    ...(hero.eyebrow != null ? { eyebrow: hero.eyebrow } : {}),
    ...(hero.subheading != null ? { note: hero.subheading } : {}),
    decoration: hero.decoration ?? 'orbs',
  }
  for (const [key, value] of Object.entries(moved)) {
    if (form[key] != null && form[key] !== value)
      throw new Error(`Existing form ${key} differs from the hero`)
  }
  return {
    id: row._id,
    revision: row._rev,
    set: {
      sections: sections
        .filter((section) => section !== hero)
        .map((section) =>
          section === form
            ? {
                ...form,
                ...moved,
                variant: 'hero',
                surface: 'paper',
                ...(button ? { button: { ...button, contrast: 'brand' } } : {}),
              }
            : section,
        ),
    },
  }
}
