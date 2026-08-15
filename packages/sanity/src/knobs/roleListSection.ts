import { defineBlockKnobs } from '@o3/block-spec'
import { surfaceKnob } from './surface'
import type { RoleListSection } from '../types/generated'

/**
 * The role list's design options — `surface` and nothing else.
 *
 * The Careers band (`1925:6061`) is one stack of rows, each with its own Apply
 * button, and every row is drawn the same way. Nothing on it is a pick.
 *
 * A role carries no design option of its own either, so this block declares no
 * `items` spec (#122): `heading`, `eyebrow` and `button` are all things an editor
 * fills in.
 */
export const roleListSectionKnobs = defineBlockKnobs({
  type: 'roleListSection',
  title: 'Role list',
  tier: 'section',
  knobs: [surfaceKnob({ initialValue: 'white' })],
  placeholder: {
    _type: 'roleListSection',
    eyebrow: 'Careers',
    heading: 'A heading for this list.',
    roles: [{ _key: 'first', _type: 'role', heading: 'A role title', eyebrow: 'Location · Type' }],
  } satisfies RoleListSection,
})
