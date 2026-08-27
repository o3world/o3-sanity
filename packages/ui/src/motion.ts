/**
 * Motion recipes — the class strings an interaction is assembled from, so a
 * card in `packages/content-ui` and a card in an app move the same way from
 * one import rather than from five copies of the same list.
 *
 * Curves and durations come from `packages/tailwind-config/tokens/motion.css`;
 * nothing here spells a millisecond value.
 *
 * **Colour and opacity stay on under reduced motion** — they move nothing
 * across the screen. Anything that moves geometry is `motion-reduce`-gated.
 * The gate cancels the property the utility actually writes: Tailwind v4
 * compiles `scale-*` to `scale` and `translate-*` to `translate`, so
 * `transform-none` reaches neither and `scale-none` / `translate-none` are
 * what turn them off.
 *
 * The card recipes read a `group` on the card root, and answer to focus as
 * well as hover so a keyboard gets the same affordance a pointer does.
 */

/** The house idiom for a colour or border hover. */
export const HOVER_TRANSITION = 'transition-colors duration-(--duration-hover) ease-out'

/** The same idiom for a hover that fades rather than recolours. */
export const HOVER_FADE_TRANSITION = 'transition-opacity duration-(--duration-hover) ease-out'

/** A card's media, easing up on hover at the reveal duration. */
export const CARD_MEDIA_ZOOM = [
  'transition-transform duration-(--duration-reveal) ease-out',
  'group-hover:scale-[1.03] group-focus-visible:scale-[1.03]',
  'motion-reduce:transition-none',
  'motion-reduce:group-hover:scale-none motion-reduce:group-focus-visible:scale-none',
].join(' ')

/** A card's trailing arrow, sliding a step on hover. */
export const CARD_ARROW_NUDGE = [
  'transition-transform duration-(--duration-hover) ease-out',
  'group-hover:translate-x-1 group-focus-visible:translate-x-1',
  'motion-reduce:transition-none',
  'motion-reduce:group-hover:translate-none motion-reduce:group-focus-visible:translate-none',
].join(' ')

/** A card's title, dimming with the rest of the card. */
export const CARD_TITLE_FADE = [
  HOVER_FADE_TRANSITION,
  'group-hover:opacity-70 group-focus-visible:opacity-70',
].join(' ')

/**
 * The focus ring for a link that wraps a whole card. `brand` is a role both
 * token packages define, which is what `brand-token-seam.test.ts` checks.
 */
export const CARD_LINK_FOCUS =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2'
