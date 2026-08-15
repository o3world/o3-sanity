import type { ComponentType } from 'react'
import type { Knob } from '@o3/block-spec'

/**
 * The glyphs an option row may draw, keyed by the option VALUE that names one.
 *
 * Handed in by the site through `createCanvasComponents`, the same way the knob
 * registries are and for the same reason (ADR 0020): this package knows the
 * knob vocabulary and none of the site's drawings. A project with no glyphs
 * passes nothing and gets titles, which is a real configuration rather than a
 * broken one.
 */
export type OptionGlyphs = Readonly<Record<string, ComponentType<{ className?: string }>>>

/**
 * WHAT AN OPTION LOOKS LIKE, resolved.
 *
 * The declaration says `optionPreview: 'glyph'` and nothing more — a knob
 * cannot carry a component, because `@o3/block-spec` has zero dependencies and
 * cannot name React. So the option's value is a NAME, this is where a name
 * becomes a drawing, and the map it is looked up in belongs to the app.
 *
 * The box is drawn whether or not a glyph fills it, so `None` does not shunt
 * its own title one notch left of every other row's.
 */
export function OptionGlyph({
  knob,
  value,
  glyphs,
}: {
  knob: Knob
  value: string
  glyphs?: OptionGlyphs
}) {
  if (knob.optionPreview !== 'glyph') return null
  // Own-property guard: the key is an option value, and a knob declaring
  // `constructor` would otherwise resolve to something off Object.prototype.
  const Glyph =
    glyphs && Object.prototype.hasOwnProperty.call(glyphs, value) ? glyphs[value] : undefined
  return (
    <span aria-hidden="true" className="flex h-3.5 w-3.5 shrink-0 items-center justify-center">
      {Glyph ? <Glyph className="h-3.5 w-3.5" /> : null}
    </span>
  )
}
