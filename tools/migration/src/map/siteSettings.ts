import { z } from 'zod'

import type { WpChrome, WpMenuItem } from '../lib/chrome'
import type { ConversionIssue } from '../lib/htmlToPortableText'
import type { WpSiteSeo } from '../lib/yoast'
import { wpPath } from './paths'
import { seoObject } from './seo'
import { failed, ok, type ExtractMeta, type Mapped } from './types'

/**
 * WordPress chrome → the `siteSettings` singleton (#19).
 *
 * Three sources, one document: the nav menus (structure and destinations),
 * the ACF options page (socials — LinkedIn and Instagram, exactly the two the
 * prototype's footer lists), and the Yoast site defaults extracted for #26
 * (`defaultSeo`).
 *
 * Two rules make this a conversion rather than an authoring exercise:
 *
 * 1. **Links become paths, not references.** Every nav destination is a
 *    document that has not been migrated yet (#18 brings the utility pages,
 *    #23 seeds the greenfield ones), so a `target` reference would dangle for
 *    the whole build-out. `cta.href` takes a relative path instead, and path
 *    parity (#26) is what makes that safe: `/work` is `/work` before and
 *    after, so these links do not have to be revisited when the documents
 *    land. Swapping an href for a reference later is per-item and optional.
 * 2. **WordPress owns the structure; the redesign owns the words.** Extraction
 *    fills WP truth, and `DISPLAY_LABELS` carries the renames the mockup makes
 *    — one table, reviewable in a diff, rather than labels invented inline.
 */

/**
 * Redesign renames, keyed by the path they point at. "Perspectives" becomes
 * "Insights" in the chrome (CONTEXT.md: display copy, not a type rename);
 * "Solutions" becomes "Services" to match the prototype's nav.
 */
const DISPLAY_LABELS: Readonly<Record<string, string>> = {
  '/perspectives': 'Insights',
  '/solutions': 'Services',
  'https://www.o3xo.ai/': 'O3XO',
}

/**
 * The prototype's footer columns, as destination lists over the extracted
 * menus. Selected explicitly rather than derived, because WordPress has no
 * concept of these groupings: its one "Footer Navigation" menu mixes company
 * links with legal ones, and its "Secondary Navigation" mixes the two
 * campaign destinations the prototype's "Everything else" column shows with
 * two service pages the prototype puts under the nav's Services instead.
 *
 * Order here is the rendered order.
 */
const COMPANY_PATHS = ['/work', '/about', '/solutions', '/perspectives', '/careers']
const EXTRAS_PATHS = ['/1682-conference-ai-innovation', 'https://www.o3xo.ai/']
const LEGAL_PATHS = ['/privacy-policy', '/accessibility-statement']

export const siteSettingsDoc = z.object({
  _id: z.literal('siteSettings'),
  _type: z.literal('siteSettings'),
  title: z.string().min(1),
  perspectivesLabel: z.string().min(1),
  navItems: z.array(z.object({ _type: z.literal('cta'), _key: z.string(), label: z.string() })),
  primaryCta: z.object({ _type: z.literal('cta'), label: z.string() }).loose(),
  footerTagline: z.string().min(1),
  footerGroups: z
    .array(
      z.object({
        _type: z.literal('footerGroup'),
        _key: z.string(),
        label: z.string().min(1),
        links: z.array(z.object({ _type: z.literal('cta'), _key: z.string() }).loose()).min(1),
      }),
    )
    .min(1),
  socialsLabel: z.string().min(1),
  socialLinks: z.array(
    z.object({
      _type: z.literal('socialLink'),
      _key: z.string(),
      label: z.string().min(1),
      url: z.string().url(),
    }),
  ),
  legalLinks: z.array(z.object({ _type: z.literal('cta'), _key: z.string() }).loose()),
  legalName: z.string().min(1),
  copyrightNote: z.string().optional(),
  defaultSeo: seoObject.optional(),
  migration: z.object({ locked: z.boolean(), sourceId: z.string(), extractedAt: z.string() }),
})

export type SiteSettingsDoc = z.infer<typeof siteSettingsDoc>

/**
 * A menu item's destination as the new site spells it: an internal WordPress
 * URL becomes its path (parity, #26), an external one stays absolute.
 */
export function hrefForMenuItem(item: WpMenuItem, siteUrl: string): string | null {
  if (!item.url) return null
  let url: URL
  try {
    url = new URL(item.url)
  } catch {
    return null
  }
  let host: string
  try {
    host = new URL(siteUrl).host
  } catch {
    host = ''
  }
  if (url.host !== host) return url.toString()
  return wpPath(item.url)
}

interface ResolvedItem {
  readonly label: string
  readonly href: string
}

function resolveMenu(chrome: WpChrome, slug: string, siteUrl: string): ResolvedItem[] {
  const menu = chrome.menus[slug]
  if (!menu) return []
  const out: ResolvedItem[] = []
  for (const item of menu.items) {
    // Sub-items would need a nested nav the prototype does not have; the
    // three live menus are flat, so a child here means the source changed.
    if (item.parent !== 0) continue
    const href = hrefForMenuItem(item, siteUrl)
    if (!href) continue
    out.push({ label: DISPLAY_LABELS[href] ?? item.title, href })
  }
  return out
}

function cta(item: ResolvedItem, key: string, variant?: 'brand' | 'inverse' | 'ghost') {
  return {
    _type: 'cta' as const,
    _key: key,
    label: item.label,
    href: item.href,
    ...(variant ? { variant } : {}),
  }
}

/** Pick items by destination, in the order the destinations are listed. */
function pickByPath(items: readonly ResolvedItem[], paths: readonly string[]): ResolvedItem[] {
  return paths
    .map((path) => items.find((item) => item.href === path))
    .filter((item): item is ResolvedItem => item !== undefined)
}

export interface SiteSettingsCopy {
  /** The prototype's footer headline. */
  readonly footerTagline: string
  /** The registered entity in the copyright line. */
  readonly legalName: string
  /** The sign-off after "All rights reserved." */
  readonly copyrightNote: string
  /** Label for the "Everything else" footer column. */
  readonly extrasLabel: string
  readonly companyLabel: string
  readonly socialsLabel: string
  /** The nav's primary button. */
  readonly primaryCtaLabel: string
}

/**
 * Copy the redesign introduces, which has no WordPress source. It lives in one
 * literal so a reviewer can see every invented string at once, and so editors
 * can change any of it in Studio afterwards without touching the pipeline.
 */
export const REDESIGN_COPY: SiteSettingsCopy = {
  footerTagline: 'Strategy, design, engineering, and AI under one roof.',
  legalName: 'O3 World, LLC',
  copyrightNote: 'Go birds.',
  companyLabel: 'Company',
  extrasLabel: 'Everything else',
  socialsLabel: 'Socials',
  primaryCtaLabel: 'Let’s talk',
}

export function mapSiteSettings(
  chrome: WpChrome & { _meta: ExtractMeta },
  site: WpSiteSeo,
  copy: SiteSettingsCopy = REDESIGN_COPY,
): Mapped<SiteSettingsDoc> {
  const issues: ConversionIssue[] = []
  const siteUrl = site.siteUrl

  const primary = resolveMenu(chrome, 'primary-navigation', siteUrl)
  const footer = resolveMenu(chrome, 'footer-navigation', siteUrl)
  const secondary = resolveMenu(chrome, 'secondary-navigation', siteUrl)

  if (primary.length === 0) {
    issues.push({ element: 'navItems', detail: 'primary-navigation menu is empty or missing' })
  }

  const contact = primary.find((item) => item.href === '/contact')
  if (!contact) {
    issues.push({ element: 'primaryCta', detail: 'no /contact item in primary-navigation' })
  }

  // The nav drops Contact — the primary CTA button is that destination.
  const navItems = primary.filter((item) => item.href !== '/contact')

  const companyLinks = pickByPath([...primary, ...footer], COMPANY_PATHS)
  if (companyLinks.length === 0) {
    issues.push({ element: 'footerGroups', detail: 'no company links resolved from the menus' })
  }

  const extraLinks = pickByPath(secondary, EXTRAS_PATHS)
  if (extraLinks.length === 0) {
    issues.push({
      element: 'footerGroups',
      detail: 'no "everything else" links resolved from secondary-navigation',
    })
  }

  const legalLinks = pickByPath(footer, LEGAL_PATHS)
  if (legalLinks.length === 0) {
    issues.push({ element: 'legalLinks', detail: 'no legal links resolved from footer-navigation' })
  }

  const socialLinks = chrome.options.social.filter((s) => s.label && s.url)
  if (socialLinks.length === 0) {
    issues.push({ element: 'socialLinks', detail: 'ACF options page has no social_media entries' })
  }

  if (issues.length > 0) return failed(issues)

  const groups = [
    { label: copy.companyLabel, links: companyLinks },
    { label: copy.extrasLabel, links: extraLinks },
  ].filter((group) => group.links.length > 0)

  const doc = {
    _id: 'siteSettings' as const,
    _type: 'siteSettings' as const,
    title: site.siteName,
    perspectivesLabel: DISPLAY_LABELS['/perspectives'] ?? 'Insights',
    navItems: navItems.map((item, i) => cta(item, `nav-${i}`)),
    primaryCta: {
      _type: 'cta' as const,
      label: copy.primaryCtaLabel,
      href: contact?.href ?? '/contact',
      variant: 'brand' as const,
    },
    footerTagline: copy.footerTagline,
    footerGroups: groups.map((group, g) => ({
      _type: 'footerGroup' as const,
      _key: `group-${g}`,
      label: group.label,
      links: group.links.map((item, i) => cta(item, `g${g}-${i}`, 'inverse')),
    })),
    socialsLabel: copy.socialsLabel,
    socialLinks: socialLinks.map((s, i) => ({
      _type: 'socialLink' as const,
      _key: `social-${i}`,
      label: s.label,
      url: s.url,
    })),
    legalLinks: legalLinks.map((item, i) => cta(item, `legal-${i}`, 'inverse')),
    legalName: copy.legalName,
    copyrightNote: copy.copyrightNote,
    // Yoast's site-wide defaults, the bottom tier of the render-time SEO
    // chain (#26). The default OG image migrates as an asset like any other.
    defaultSeo: {
      ...(site.description ? { description: site.description } : {}),
      ...(site.ogDefaultImage
        ? { ogImage: { _type: 'image' as const, _wpSrc: site.ogDefaultImage } }
        : {}),
    },
    migration: {
      locked: false,
      sourceId: 'wp:site:chrome',
      extractedAt: chrome._meta.extractedAt,
    },
  }

  const parsed = siteSettingsDoc.safeParse(doc)
  if (!parsed.success) {
    return failed(
      parsed.error.issues.map((i) => ({ element: i.path.join('.'), detail: i.message })),
    )
  }
  return ok(doc)
}
