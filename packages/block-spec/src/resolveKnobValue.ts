import { optionKey } from './showWhen'
import type { Knob, KnobValue } from './types'

/**
 * What a control shows when nothing resolved: no stored value, and no default
 * that names a real option. Exported so the toolbar, the menu and the Studio
 * do not each spell it their own way.
 */
export const UNRESOLVED_KNOB_TITLE = 'Default'

/**
 * What a knob control DISPLAYS for a stored value — the one resolution every
 * surface reads (bar trigger, menu row, option check-mark), so they cannot
 * disagree. Exactly three branches:
 *
 * 1. the stored value names an option → that option, `isDefault: false`;
 * 2. it does not (or is unset), but the knob declares a default that names a
 *    real option → that option, marked `isDefault: true`;
 * 3. neither → the literal fallback title, with no value to check.
 *
 * "Unset" and "explicitly the default" render the same page — an editor sees
 * the default's title either way, because that is what the block draws. The
 * `isDefault` marker is the only thing that tells them apart, and it is what
 * lets a control say *inherited* rather than *chosen*.
 *
 * Branch 2 revalidates `initialValue` against the option set even though
 * `knob()` already refused a bad one: a `Knob` can also arrive hand-built or
 * deserialised, and a default outside the set would display a value the
 * control cannot re-pick.
 */
export function resolveKnobValue(knob: Knob, stored: unknown): KnobValue {
  const key = optionKey(stored)
  const current = knob.options.find((option) => option.value === key)
  if (current) return { value: current.value, title: current.title, isDefault: false }

  const fallback = knob.options.find((option) => option.value === knob.initialValue)
  if (fallback) return { value: fallback.value, title: fallback.title, isDefault: true }

  return { value: undefined, title: UNRESOLVED_KNOB_TITLE, isDefault: true }
}
