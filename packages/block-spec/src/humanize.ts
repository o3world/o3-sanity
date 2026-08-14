/**
 * `'full-bleed'` → `'Full bleed'`, `'railPanels'` → `'Rail panels'`.
 *
 * Sentence case, not title case: these are option labels sitting next to a
 * knob's own title in a toolbar, and Title Case On Every Word reads as a
 * heading. camelCase splits too, because a stored `_type` is the fallback
 * label wherever a title is missing and `railPanels` reads as a symbol.
 */
export function humanize(value: string): string {
  const words = value
    .replace(/[-_]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .trim()
    .toLowerCase()
  return words.charAt(0).toUpperCase() + words.slice(1)
}
