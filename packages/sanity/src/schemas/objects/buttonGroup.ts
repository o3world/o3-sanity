import { defineArrayMember, defineField } from 'sanity'
import { buttonGroupKnobs } from '../../knobs/buttonGroup'
import { defineSharedObject } from './defineSharedObject'

/**
 * SEVERAL BUTTONS, ARRANGED — the row of jump links a long page needs (#149).
 *
 * **A shared object that doubles as a base block**, the shape `figure`,
 * `embed`, `mark` and `button` already have: it is registered in `BASE_BLOCKS`,
 * so an editor drops it into a `layoutSection` column, and the same type is
 * available as a field anywhere a row of buttons is the right answer.
 *
 * **It arranges and does nothing else.** Each member is an ordinary `button`
 * carrying its own destination and its own fill, read from the button's own
 * declaration wherever it stands (ADR 0023). The group adds one design option,
 * `alignment`, declared in `src/knobs/buttonGroup.ts`.
 *
 * **It does not absorb the footer group or the social links.** Those are named
 * lists of navigation on `siteSettings` — `footerGroups[].links` carries a
 * column heading and `socialLinks` carries icons — and both are chrome that
 * sits outside the block tree. Collapsing them into this would give the site's
 * navigation an alignment control nobody wants and give this an inapplicable
 * heading.
 */
export const buttonGroup = defineSharedObject({
  knobs: buttonGroupKnobs,
  description:
    'A row of buttons that belong together — most often the quick-jump links across the top of a long page, each pointing at a band’s anchor further down. Reach for it when the alternatives are peers and one link is not enough. It arranges only: every button keeps its own destination and fill, and the row wraps onto a second line rather than scrolling.',
  fields: [
    defineField({
      name: 'buttons',
      type: 'array',
      of: [defineArrayMember({ type: 'button' })],
      description: 'In the order they are read. A jump link leaves the target and URL empty.',
      validation: (rule) => rule.required().min(1),
    }),
    'alignment',
  ],
  preview: {
    select: { title: 'buttons.0.label', buttons: 'buttons' },
    prepare: (sel) => ({
      title: (sel.title as string | undefined) ?? 'Button group',
      subtitle: `${((sel.buttons as unknown[] | undefined) ?? []).length} buttons`,
    }),
  },
})
