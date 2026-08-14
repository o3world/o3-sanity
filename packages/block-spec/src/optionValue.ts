import type { Knob } from './types'

/**
 * THE TWO DIRECTIONS A KNOB'S VALUE TRAVELS, kept in one file on purpose.
 *
 * A knob's options are strings on this side of the seam — `KnobOption.value`
 * is always a string, so gates, args, menu rows and check marks all compare
 * like with like without asking what a field's stored type is. The document
 * underneath may not be: `layoutSection.columns` is `type: 'number'` holding
 * `1 | 2 | 3`, and typegen publishes that literal.
 *
 * So every value crosses a boundary twice, and BOTH crossings have to convert:
 *
 *   document ──optionKey──▶ '2'  (read leg: what the gates and controls see)
 *   '2' ──storedValue──▶ document (write leg: what a pick commits)
 *
 * They live together because the bug that produced this file was having only
 * one of them (#123). The read leg converted and was tested; the write leg did
 * not, and nothing rejected it — Sanity's mutation API does not typecheck, so
 * a pick wrote the string `'2'` into a number field. It was silent: the
 * renderer coerces, so the page looked right while the document violated its
 * own schema and the Studio's number radio showed nothing selected.
 *
 * A reader who finds one of these should see the other in the same screen.
 */

/**
 * A stored value as an option key — the READ leg.
 *
 * Numbers and booleans coerce because a closed enum of numbers is stored as a
 * number and declared as strings. Anything else (an object, an array) matches
 * nothing rather than stringifying into a value that could collide.
 */
export function optionKey(value: unknown): string | undefined {
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return undefined
}

/**
 * An option key as the value to store — the WRITE leg, and the exact inverse
 * of `optionKey` for every option a knob can actually offer.
 *
 * Driven by the knob's DECLARED `valueType`, never by sniffing the string.
 * `'2'` is a plausible number and a plausible version label, and only the
 * declaration knows which — the same argument `knob()` makes when it refuses
 * to infer a knob from enum-ness. `knob()` already guarantees at load that
 * every option of a numeric knob round-trips `String(Number(v)) === v`, so
 * this cannot produce `NaN` for a declared option.
 */
export function storedValue(knob: Knob, optionValue: string): string | number {
  return knob.valueType === 'number' ? Number(optionValue) : optionValue
}
