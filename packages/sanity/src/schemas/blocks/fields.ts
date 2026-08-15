import { defineField } from 'sanity'

/**
 * SHARED EDITORIAL FIELDS — the counterpart to `src/knobs/` (CONTEXT.md →
 * Known drift, which reserved this module for exactly this).
 *
 * The line between the two directories is the one the knob guard turns on: a
 * closed set an editor picks a **look** from is a knob and is declared in
 * `src/knobs/`; a field an editor **fills in** that more than one type carries
 * is written once here. Copying a `defineField` from one schema into another is
 * the signal to add it here instead.
 */

/** No `#`, no whitespace — which is also the whole of what an HTML `id` forbids. */
const ANCHOR_NAME = /^[^\s#]+$/

/**
 * The one rule for an anchor's name, so the two ends of a jump link cannot
 * disagree about what a valid one is.
 *
 * A section stores the name a button stores, character for character: the
 * button emits `#` + the value and the section emits it as an `id`, so a rule
 * applied at one end and not the other would let an editor write a link that
 * can never resolve. Both ends call this.
 *
 * Deliberately loose. Slugifying (lowercase, kebab, must start with a letter)
 * would be a second vocabulary an editor has to learn to write a link, and the
 * browser asks for none of it — HTML5 accepts any non-empty id with no
 * whitespace in it.
 */
export function validateAnchorName(value: string | undefined): true | string {
  return !value || ANCHOR_NAME.test(value)
    ? true
    : 'Write the anchor’s name on its own — no # and no spaces.'
}

/**
 * THE ANCHOR EVERY SECTION BLOCK CARRIES — injected by `defineSectionBlock`,
 * beside the surface knob's generated field (#149).
 *
 * **A plain field, not a knob, and that is the test rather than an omission.**
 * An anchor id has no closed set to pick from and naming one is not a design
 * decision, so there is no control for a toolbar to draw (CONTEXT.md → Knobs).
 *
 * **Authored, never derived from the heading.** A derived anchor changes the
 * moment someone edits the heading above it, which breaks every link already
 * shared — and does it silently, on a page nobody was editing.
 *
 * The value reaches the page as an `id` on the band's own wrapper
 * (`apps/web/src/content/blocks/anchors.ts`), which is also where two bands
 * claiming one name are resolved.
 */
export function anchorField() {
  return defineField({
    name: 'anchor',
    title: 'Anchor',
    type: 'string',
    description:
      'A name for this band, so a button can jump to it. Written without the #. Keep it once people are sharing the link — changing it breaks every link already sent. Two bands with the same name resolve to the first.',
    validation: (rule) => rule.custom((value: string | undefined) => validateAnchorName(value)),
  })
}
