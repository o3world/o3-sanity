// Never the `next-sanity` barrel — it drags in @portabletext/react, which
// cannot resolve under Storybook's Next preset. A lint rule enforces this.
import { stegaClean } from '@sanity/client/stega'

import { hrefForDoc } from '@o3/content-runtime/urls'

/**
 * Structural button shape — every query projects buttons as
 * `{..., "target": target->{_type, title, "slug": slug.current}}`, so the
 * generated shapes (heroSection.button, navItems[], layoutSection button
 * items, …) are all assignable here without per-site casts.
 */
export interface ButtonLinkData {
  label?: string | null
  contrast?: string | null
  icon?: string | null
  href?: string | null
  anchor?: string | null
  target?: { _type: string; title?: string | null; slug?: string | null } | null
}

/**
 * Where a button goes, as one of four arms.
 *
 * `none` is a real answer and not a failure to fill something in: a button
 * that goes nowhere acts on the page it is already on, which is what the
 * inquiry form's submit does.
 */
export type ButtonDestination =
  | { readonly kind: 'none' }
  | { readonly kind: 'internal'; readonly href: string }
  | { readonly kind: 'anchor'; readonly href: string }
  | { readonly kind: 'external'; readonly href: string; readonly offsite: boolean }

const clean = (value: string | null | undefined): string => (stegaClean(value) ?? '').trim()

/**
 * Absolute, so it leaves this site. Protocol-relative counts; `mailto:` and a
 * relative path do not — a new tab for the visitor's own mail client, or for a
 * page one route away, is a tab they did not ask for.
 *
 * A same-origin absolute URL reads as offsite here. Nothing in this layer
 * knows the deployment's host, and an editor who typed the whole URL out is
 * more likely to have meant a different site than to have meant this one.
 */
const LEAVES_THE_SITE = /^(?:https?:)?\/\//i

/**
 * Which arm a button is on, read from the fields it carries.
 *
 * The one reader of the union — the block renderers, the nav and the footer
 * all come through here, so none of them can hold its own idea of what an
 * empty destination means.
 *
 * **Precedence is the order the Studio gates the fields in**: an internal
 * reference outranks an external URL, and a URL outranks an anchor. A document
 * carrying two arms is off-schema (the form hides the loser), and this is what
 * it resolves to.
 */
export function buttonDestination(button: ButtonLinkData): ButtonDestination {
  if (button.target) {
    return { kind: 'internal', href: clean(hrefForDoc(button.target)) || '/' }
  }

  const href = clean(button.href)
  if (href) return { kind: 'external', href, offsite: LEAVES_THE_SITE.test(href) }

  const anchor = clean(button.anchor)
  if (anchor) return { kind: 'anchor', href: `#${anchor}` }

  return { kind: 'none' }
}

/**
 * The destination as a bare href, for the chrome that draws a button's fields
 * as a plain text link rather than as a button — the nav rows, the footer
 * columns, the utility strip.
 *
 * Those links have no element to choose: they are `<Link>` either way, and one
 * with no destination has nowhere to send a visitor, so `/` is the same
 * fallback a broken href has always had.
 */
export function resolveButtonHref(button: ButtonLinkData): string {
  const destination = buttonDestination(button)
  return destination.kind === 'none' ? '/' : destination.href
}
