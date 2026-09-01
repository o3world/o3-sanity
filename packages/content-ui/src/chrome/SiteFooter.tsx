import type { ReactNode } from 'react'
import Link from 'next/link'

import { SurfaceProvider, surfaceAttrs } from '@o3/ui'
import type { SITE_SETTINGS_QUERY_RESULT } from '@o3/sanity/types/generated'

import { resolveButtonHref } from '../buttonDestination'

interface SiteFooterProps {
  settings: SITE_SETTINGS_QUERY_RESULT
  /**
   * The brand's mark, drawn by the app that mounts this footer (#228) — the
   * same seam `SiteNav` takes, and sized there too, because how big a mark
   * runs depends on its own proportions.
   */
  brandMark: ReactNode
  /** The copyright year — the footer prints it, the layout resolves it. */
  year: number
}

/**
 * The site footer, built to the `Footer` component (`1280:1885`, mobile
 * `2225:2671`) — `#000000`, `64px 96px`.
 *
 * The component is the source of record as of the 2026-08-13 sync (#87): the
 * 2026-08 pass reworked it and made Home's footer an override-free instance,
 * and the frame footer this was first built from (`1680:2096`) no longer
 * exists in the file.
 *
 * Every string still comes from Site Settings (#19); the component decides
 * only the arrangement.
 */
export function SiteFooter({ settings, brandMark, year }: SiteFooterProps) {
  const groups = settings?.footerGroups ?? []
  const socialLinks = settings?.socialLinks ?? []
  const legalLinks = settings?.legalLinks ?? []
  const legalName = settings?.legalName ?? settings?.title ?? 'O3'

  // Figma draws three peer columns — Company, Socials, Everything else
  // (`1680:2103` / `2110` / `2114`). Socials is a separate schema field rather
  // than a `footerGroup`, because its links are external URLs off the ACF
  // options page and need `rel="noreferrer"` — so it is spliced into the
  // frame's position instead of being appended after the authored groups.
  const [leadGroup, ...restGroups] = groups

  return (
    // The third piece of chrome outside the band system. Black, so `ink`.
    <SurfaceProvider surface="ink">
      <footer
        id="footer"
        {...surfaceAttrs('ink')}
        className="px-gutter relative overflow-hidden bg-black py-16 text-white"
      >
        {/*
         * The 'O' the footer bleeds off its left edge — the component's
         * `Vector` (`1320:117`, mobile `2225:2609`): a 1052×1053 donut FILLED
         * `ink`, its ring 211.76 thick. It sits 40px below the footer's top
         * edge at both widths; its left is -374.24 in the 1440 component and
         * -526 in the 402 one, which puts the circle's centre exactly on that
         * frame's left edge. Decorative and drawn once, so it is inline SVG at
         * the call site rather than a component.
         */}
        <svg
          viewBox="0 0 1052 1053"
          aria-hidden="true"
          focusable="false"
          className="fill-ink pointer-events-none absolute -left-[526px] top-10 h-[1053px] w-[1052px] lg:-left-[374.24px]"
        >
          <path d="M0 526.47C0 816.764 235.998 1053 526 1053C816.002 1053 1052 816.825 1052 526.47C1052 236.115 816.062 0 526 0C235.938 0 0 236.176 0 526.47ZM840.239 526.47C840.239 699.892 699.309 841.087 526 841.087C352.692 841.087 211.761 699.953 211.761 526.47C211.761 352.986 352.752 211.913 526 211.913C699.248 211.913 840.239 352.986 840.239 526.47Z" />
        </svg>

        <div className="max-w-section relative mx-auto flex w-full flex-col gap-12 lg:gap-32">
          {/* "Left" — logo beside the tagline block at 1440, stacked at 402. */}
          <div className="flex flex-col gap-9 lg:flex-row lg:justify-between">
            {/* The app's mark (#228), first thing in the left column. O3's
              Figma vector here is the mark alone in white, tight-bounded at
              148px and 128 at 402 (`1280:1856`, `2225:2613`) — a read of one
              brand's node, so the size travels with the mark rather than
              being imposed on every brand's from here. */}
            {brandMark}

            <div className="flex flex-col gap-24 lg:w-[600px] lg:gap-9">
              {settings?.footerTagline ? (
                <p className="text-display-xl max-w-[600px] text-balance">
                  {settings.footerTagline}
                </p>
              ) : null}

              {/* "Upper" — three columns side by side at both widths. */}
              <nav aria-label="Footer" className="flex justify-between gap-6 pb-16">
                {leadGroup ? (
                  <FooterColumn label={leadGroup.label}>
                    {(leadGroup.links ?? []).map((link) => (
                      <li key={link._key}>
                        <FooterLink href={resolveButtonHref(link)}>{link.label}</FooterLink>
                      </li>
                    ))}
                  </FooterColumn>
                ) : null}

                {socialLinks.length > 0 ? (
                  <FooterColumn label={settings?.socialsLabel ?? 'Socials'}>
                    {socialLinks.map((social) => (
                      <li key={social._key}>
                        {/* External profiles, so a plain anchor, not next/link. */}
                        <a
                          href={social.url ?? '#'}
                          className="text-nav duration-(--duration-hover) text-white transition-opacity ease-out hover:opacity-70"
                          rel="noreferrer"
                          target="_blank"
                        >
                          {social.label}
                        </a>
                      </li>
                    ))}
                  </FooterColumn>
                ) : null}

                {restGroups.map((group) => (
                  <FooterColumn key={group._key} label={group.label}>
                    {(group.links ?? []).map((link) => (
                      <li key={link._key}>
                        <FooterLink href={resolveButtonHref(link)}>{link.label}</FooterLink>
                      </li>
                    ))}
                  </FooterColumn>
                ))}
              </nav>
            </div>
          </div>

          {/* "Lower" — legal row; stacked at 402 (`1814:1807`), split at 1440.
            The copy is `on-utility` (#AAA69E): the component binds the same
            Figma variable here as the Utility Nav's links (`2050:1226`) — the
            warm solid for muted copy on the black chrome, which replaced the
            `fg-subtle` grey this row shipped with (2026-08-13 token pass). */}
          <div className="text-legal text-on-utility flex flex-col gap-3 lg:flex-row lg:justify-between">
            <ul className="flex flex-wrap gap-6">
              {legalLinks.map((link) => (
                <li key={link._key}>
                  <Link
                    href={resolveButtonHref(link)}
                    className="duration-(--duration-hover) transition-colors ease-out hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="flex gap-6 lg:w-[277px] lg:justify-between">
              <p>
                © {year} {legalName}. All rights reserved.
              </p>
              {/* The `Go birds.` easter egg (`1275:1631`), which reaches the page
                as Site Settings' copyrightNote rather than as chrome. Its
                `State=Hover` is the whole component: the line turns Eagles
                green. The set's eagle illustration is a 40×12 art vector that
                draws nothing in the footer instance, so it is not exported. */}
              {settings?.copyrightNote ? (
                <p className="duration-(--duration-hover) transition-colors ease-out hover:text-[#339c5e]">
                  {settings.copyrightNote}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </footer>
    </SurfaceProvider>
  )
}

/**
 * A footer link column (`1680:2103`): a brand-red uppercase heading over the
 * links, 12px apart, 188px wide at 1440.
 *
 * The heading is the one place on the canonical Home frame where brand red is
 * a **flat fill** rather than the gradient — see the note on `--color-brand`.
 */
function FooterColumn({ label, children }: { label?: string | null; children: React.ReactNode }) {
  return (
    <div className="lg:w-[188px]">
      {/* 14px / 600 / 0.07em uppercase. A footer-only step doing its job in
          exactly one place, so it stays a literal rather than earning a token
          (packages/tailwind-config README — "what earns a token"). */}
      <p className="text-brand mb-3 text-[14px] font-semibold uppercase tracking-[0.07em]">
        {label}
      </p>
      <ul className="flex flex-col gap-3">{children}</ul>
    </div>
  )
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-nav duration-(--duration-hover) text-white transition-opacity ease-out hover:opacity-70"
    >
      {children}
    </Link>
  )
}
