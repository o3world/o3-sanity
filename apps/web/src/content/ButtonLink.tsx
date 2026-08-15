import Link from 'next/link'
import { stegaClean } from '@sanity/client/stega'

import { Button } from '@o3/ui'

import { hrefForDoc } from '@/content/documents/urls'

/**
 * Structural button shape — every query projects buttons as
 * `{..., "target": target->{_type, title, "slug": slug.current}}`, so the
 * generated shapes (heroSection.button, navItems[], layoutSection button
 * items, …) are all assignable here without per-site casts.
 */
export interface ButtonLinkData {
  label?: string | null
  variant?: string | null
  href?: string | null
  target?: { _type: string; title?: string | null; slug?: string | null } | null
}

const VARIANTS = ['dark', 'light', 'ghost'] as const
type ButtonVariant = (typeof VARIANTS)[number]

/**
 * The pre-#42 enum, mapped rather than dropped. `load` replaces every
 * pipeline-owned document, but a dataset that has not been rebuilt since the
 * rename still carries the old strings — and a locked document keeps them
 * forever. `brand` becomes `dark` because the canonical frames have no red
 * button (docs/figma-components.md); `inverse` was already the white fill.
 */
const LEGACY_VARIANTS: Record<string, ButtonVariant> = { brand: 'dark', inverse: 'light' }

export function resolveButtonHref(button: ButtonLinkData): string {
  const href = button.target ? hrefForDoc(button.target) : (button.href ?? '/')
  return stegaClean(href) ?? '/'
}

function resolveVariant(value: string | null | undefined): ButtonVariant {
  const clean = stegaClean(value) ?? ''
  if (VARIANTS.includes(clean as ButtonVariant)) return clean as ButtonVariant
  return LEGACY_VARIANTS[clean] ?? 'dark'
}

/**
 * The one button renderer: resolves internal-reference-or-external-URL into an
 * href and renders the `@o3/ui` Button in the editor-chosen variant.
 *
 * `arrow` is a render-side prop, not a schema field, for the reason #38 gives:
 * Figma's `Show right icon` toggles the presence of a child rather than the
 * button's appearance, so it is a prop everywhere — including here. The chrome
 * button sets it because the nav pill's button (`2225:2877`) carries a trailing
 * icon.
 */
export function ButtonLink({
  button,
  arrow = false,
  size,
  variant,
  className,
  buttonClassName,
}: {
  button: ButtonLinkData | null | undefined
  arrow?: boolean
  /** `Button`'s authored size step. Base is what the frames draw; section headers use Large. */
  size?: 'base' | 'large'
  /**
   * Force the fill, ignoring the editor's choice. For **chrome and section
   * shells that own their own background**: the nav pill is always a dark
   * scrim, so a `dark` button on it is unreadable no matter what a Site
   * Settings editor picks. Content bands leave this alone.
   */
  variant?: ButtonVariant
  /** Styles the `<Link>`. Positioning and spacing — never the fill. */
  className?: string
  /**
   * Styles the `<Button>` itself, merged into its variant classes.
   *
   * The wrapping `Link` is what `className` reaches, so a caller that needs to
   * reach the FILL has nowhere to put it — and the nav does: its button has to
   * invert with the bar's ink flip, and `Button` already owns both fills. This
   * is the seam for a caller whose surface changes underneath a button, not a
   * general escape hatch; a fill a *document* chooses is `variant`.
   */
  buttonClassName?: string
}) {
  if (!button?.label) return null
  return (
    <Link href={resolveButtonHref(button)} className={className}>
      <Button
        variant={variant ?? resolveVariant(button.variant)}
        size={size}
        arrow={arrow}
        className={buttonClassName}
      >
        {button.label}
      </Button>
    </Link>
  )
}
