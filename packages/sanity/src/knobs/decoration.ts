import { knob } from '@o3/block-spec'
import type { Knob } from '@o3/block-spec'

/**
 * Which piece of the orbital vocabulary a band hangs behind its copy, or
 * `none` — the knob `heroSection`, `quoteSection` and `ctaSection` share.
 *
 * **Each block passes its own list**, because what a band can carry is a fact
 * about that band's composition: the hero and the CTA offer `orbs | none`, and
 * the quote adds the case-study `molecule` (`2250:1525`, #97). What is shared
 * is the knob itself — the name, the title, and the rule that the first option
 * is the default.
 *
 * This is `decorationField()` moved to the side of the line a toolbar can read
 * (#120). The factory it replaces generated a `defineField` directly, so the
 * three blocks calling it published an enum no editorial surface outside the
 * Studio form could see — which is the drift ADR 0020 inverts. Same argument,
 * one layer up: the list is still per-block, the field is now derived.
 *
 * The list is a non-empty tuple so there is always an `initialValue`; an enum
 * without one is what the original factory existed to stop. No `description`,
 * because the fields it replaces had none and the two option labels say the
 * rest — the meaning lives here rather than repeated on three forms.
 *
 * Menu-only, never on the bar. The bar carries `surface` and the one axis that
 * changes what the block is (CONTEXT.md → Knobs); decoration is what the band
 * hangs behind that.
 */
export function decorationKnob(options: readonly [string, ...string[]]): Knob {
  return knob({
    name: 'decoration',
    title: 'Decoration',
    options: [...options],
    initialValue: options[0],
  })
}
