import Link from 'next/link'
import { stegaClean } from '@sanity/client/stega'

import { Button } from '@o3/ui'

import { hrefForDoc } from '@/content/documents/urls'

/**
 * Structural cta shape — every query projects ctas as
 * `{..., "target": target->{_type, title, "slug": slug.current}}`, so the
 * generated shapes (heroBlock.cta, navItems[], layoutSection cta items, …)
 * are all assignable here without per-site casts.
 */
export interface CtaLinkData {
  label?: string | null
  variant?: string | null
  href?: string | null
  target?: { _type: string; title?: string | null; slug?: string | null } | null
}

const VARIANTS = ['brand', 'inverse', 'ghost'] as const
type CtaVariant = (typeof VARIANTS)[number]

export function resolveCtaHref(cta: CtaLinkData): string {
  const href = cta.target ? hrefForDoc(cta.target) : (cta.href ?? '/')
  return stegaClean(href) ?? '/'
}

function resolveVariant(value: string | null | undefined): CtaVariant {
  const clean = stegaClean(value)
  return VARIANTS.includes(clean as CtaVariant) ? (clean as CtaVariant) : 'brand'
}

/**
 * The one cta renderer: resolves internal-reference-or-external-URL into an
 * href and renders the `@o3/ui` Button in the editor-chosen variant.
 */
export function CtaLink({ cta }: { cta: CtaLinkData | null | undefined }) {
  if (!cta?.label) return null
  return (
    <Link href={resolveCtaHref(cta)}>
      <Button variant={resolveVariant(cta.variant)}>{cta.label}</Button>
    </Link>
  )
}
