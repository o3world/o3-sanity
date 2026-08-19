import Link from 'next/link'

import { SurfaceProvider, surfaceAttrs } from '@o3/ui'
import { resolveButtonHref } from '@o3/content-ui'

import type { Settings } from './navItems'

/**
 * O3XO's footer, built to the kit's `Footer` (`4404:4148`, Navigation canvas
 * `4404:3961`).
 *
 * App-local for the reason `SiteNav` beside it is: the shared footer is O3's
 * black orbital band and this is a different footer (ADR 0028, second
 * addendum). It is the shorter of the two by a long way.
 *
 * ── WHAT THE COMPONENT SAYS ────────────────────────────────────────────────
 *
 * 1440 × 249.6, filled `#F3F3F3` — `bone` under O3XO's palette, so the site's
 * last band is **light**, where O3's is black. `49px 32px 62px`, one 1200-wide
 * column left-aligned inside it, and 16px between the two blocks it holds:
 *
 * | Line       | Kit                             | Here                       |
 * | ---------- | ------------------------------- | -------------------------- |
 * | Wordmark   | `O3XO`, 28 / 400, `#111827`     | `text-display-md text-fg`  |
 * | Tagline    | 16 / 300, `#4B5563`             | `text-body text-fg-body`   |
 * | Copyright  | 16 / 300, `#4B5563`             | the same                   |
 * | Link row   | three links, 24px apart         | the same                   |
 *
 * ── THE WORDMARK IS TYPE, NOT THE MARK ─────────────────────────────────────
 *
 * `4404:4044` is a TEXT node, and o3xo.ai renders a `<p>` in the same place.
 * Both sources agree, so this sets the name in type rather than reaching for
 * `O3xoMark` — which the nav does use, because the nav is where both sources
 * draw the lockup. If the footer should carry the mark, that is a change to
 * the kit first (ADR 0028: corrections go to Nick, they are not made here).
 *
 * The string is `settings.title`, so the one place the brand's name is
 * authored is the one place it is read.
 *
 * ── THE LINK ROW IS WHERE THE UTILITY STRIP WENT ───────────────────────────
 *
 * O3 World · 1682 · Privacy policy — the first two are `utilityNavItems`, the
 * brand-property links O3 puts in a strip above its nav, and the third is
 * `legalLinks`. O3XO draws no strip, so the same two links land here, which is
 * where its design puts them.
 *
 * `footerGroups` and `socialLinks` are drawn by nothing here, and neither is an
 * omission: the kit's footer has no link columns, and o3xo.ai's has no social
 * links (the LinkedIn account in Site Settings comes from the site's
 * Organization ld+json, not from anything it renders).
 */
export function SiteFooter({ settings }: { settings: Settings | null }) {
  const year = new Date().getFullYear()
  const legalName = settings?.legalName ?? settings?.title ?? 'O3XO'
  const row = [...(settings?.utilityNavItems ?? []), ...(settings?.legalLinks ?? [])]

  return (
    // Light chrome, outside the band system, so it says so: a button dropped
    // in here resolves Auto against `bone` rather than against the dark bar
    // above it.
    <SurfaceProvider surface="bone">
      <footer id="footer" {...surfaceAttrs('bone')} className="px-gutter bg-bone pb-16 pt-12">
        <div className="max-w-section mx-auto flex w-full flex-col gap-4">
          <div className="flex flex-col gap-2">
            <p className="text-display-md text-fg">{settings?.title ?? 'O3XO'}</p>
            {settings?.footerTagline ? (
              <p className="text-body text-fg-body">{settings.footerTagline}</p>
            ) : null}
            <p className="text-body text-fg-body">
              © {year} {legalName}. All rights reserved.
              {settings?.copyrightNote ? ` ${settings.copyrightNote}` : null}
            </p>
          </div>

          {row.length > 0 ? (
            <nav aria-label="Footer">
              <ul className="flex flex-wrap gap-6">
                {row.map((link, index) => (
                  <li key={link._key ?? `footer-${index}`}>
                    <Link
                      href={resolveButtonHref(link)}
                      className="text-body text-fg-body hover:text-fg focus-visible:ring-brand duration-(--duration-hover) underline underline-offset-4 transition-colors ease-out focus-visible:outline-none focus-visible:ring-2"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}
        </div>
      </footer>
    </SurfaceProvider>
  )
}
