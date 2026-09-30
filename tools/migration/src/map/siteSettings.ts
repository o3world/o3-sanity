import { z } from 'zod'

import { migrationObject } from '../core/state'
import { seoObject } from './seo'

/**
 * The `siteSettings` singleton (#19): the nav, utility strip and footer Figma
 * draws (ADR 0007), plus the facts WordPress held about the business — social
 * profiles, legal pages, the registered entity and the Yoast SEO defaults.
 */
export const siteSettingsDoc = z.object({
  _id: z.literal('siteSettings'),
  _type: z.literal('siteSettings'),
  title: z.string().min(1),
  // `href` is required here where `navItems` leaves it open: a brand-property
  // link with no destination is the whole content of the strip missing. That
  // holds for a mark too — it is the same button, drawn as artwork.
  utilityNavItems: z
    .array(
      z.union([
        z.object({
          _type: z.literal('button'),
          _key: z.string(),
          label: z.string().min(1),
          href: z.string().min(1),
        }),
        z.object({
          _type: z.literal('brandLogo'),
          _key: z.string(),
          button: z.object({
            _type: z.literal('button'),
            label: z.string().min(1),
            href: z.string().min(1),
          }),
          logo: z.object({ _type: z.literal('image'), _localSrc: z.string().min(1) }),
        }),
      ]),
    )
    .min(1),
  navItems: z.array(z.object({ _type: z.literal('button'), _key: z.string(), label: z.string() })),
  primaryButton: z.object({ _type: z.literal('button'), label: z.string() }).loose(),
  footerTagline: z.string().min(1),
  footerGroups: z
    .array(
      z.object({
        _type: z.literal('footerGroup'),
        _key: z.string(),
        label: z.string().min(1),
        links: z.array(z.object({ _type: z.literal('button'), _key: z.string() }).loose()).min(1),
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
  legalLinks: z.array(z.object({ _type: z.literal('button'), _key: z.string() }).loose()),
  legalName: z.string().min(1),
  copyrightNote: z.string().optional(),
  defaultSeo: seoObject.optional(),
  migration: migrationObject,
})
