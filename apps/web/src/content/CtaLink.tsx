import Link from 'next/link'
import { stegaClean } from '@sanity/client/stega'

import { Button } from '@o3/ui'

import { hrefForDoc } from '@/content/documents/urls'

/**
 * Structural cta shape — every query projects ctas as
 * `{..., "target": target->{_type, title, "slug": slug.current}}`, so the
 * generated shapes (heroSection.cta, navItems[], layoutSection cta items, …)
 * are all assignable here without per-site casts.
 */
export interface CtaLinkData {
  label?: string | null
  variant?: string | null
  href?: string | null
  target?: { _type: string; title?: string | null; slug?: string | null } | null
}

const VARIANTS = ['dark', 'light', 'ghost'] as const
type CtaVariant = (typeof VARIANTS)[number]

/**
 * The pre-#42 enum, mapped rather than dropped. `load` replaces every
 * pipeline-owned document, but a dataset that has not been rebuilt since the
 * rename still carries the old strings — and a locked document keeps them
 * forever. `brand` becomes `dark` because the canonical frames have no red
 * button (docs/figma-components.md); `inverse` was already the white fill.
 */
const LEGACY_VARIANTS: Record<string, CtaVariant> = { brand: 'dark', inverse: 'light' }

export function resolveCtaHref(cta: CtaLinkData): string {
  const href = cta.target ? hrefForDoc(cta.target) : (cta.href ?? '/')
  return stegaClean(href) ?? '/'
}

function resolveVariant(value: string | null | undefined): CtaVariant {
  const clean = stegaClean(value) ?? ''
  if (VARIANTS.includes(clean as CtaVariant)) return clean as CtaVariant
  return LEGACY_VARIANTS[clean] ?? 'dark'
}

/**
 * The one cta renderer: resolves internal-reference-or-external-URL into an
 * href and renders the `@o3/ui` Button in the editor-chosen variant.
 *
 * `arrow` is a render-side prop, not a schema field, for the reason #38 gives:
 * Figma's `Show right icon` toggles the presence of a child rather than the
 * button's appearance, so it is a prop everywhere — including here. The chrome
 * CTA sets it because `1710:2250` carries `arrow_forward`.
 */
export function CtaLink({
  cta,
  arrow = false,
  size,
  variant,
  className,
}: {
  cta: CtaLinkData | null | undefined
  arrow?: boolean
  /** Figma's `Size` axis. Base is the frames' default; section headers use Large. */
  size?: 'base' | 'large'
  /**
   * Force the fill, ignoring the editor's choice. For **chrome and section
   * shells that own their own background**: the nav pill is always a dark
   * scrim, so a `dark` button on it is unreadable no matter what a Site
   * Settings editor picks. Content bands leave this alone.
   */
  variant?: CtaVariant
  className?: string
}) {
  if (!cta?.label) return null
  return (
    <Link href={resolveCtaHref(cta)} className={className}>
      <Button variant={variant ?? resolveVariant(cta.variant)} size={size} arrow={arrow}>
        {cta.label}
      </Button>
    </Link>
  )
}
