import Link from 'next/link'

import { BrandMark } from '@o3/ui'
import type { SITE_SETTINGS_QUERY_RESULT } from '@o3/sanity/types/generated'

import { resolveCtaHref } from '@/content/CtaLink'

interface SiteFooterProps {
  settings: SITE_SETTINGS_QUERY_RESULT
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
 * Every string still comes from Site Settings (#19); the component decides only
 * the year and the arrangement.
 */
export function SiteFooter({ settings }: SiteFooterProps) {
  const year = new Date().getFullYear()
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
    <footer id="footer" className="px-gutter relative overflow-hidden bg-black py-16 text-white">
      {/*
       * The orbital arc: a 1275×1277 two-ring vector stroked at 2px in
       * `rgba(255,255,255,0.2)`, bleeding off the left edge. Decorative and
       * drawn exactly once, so it is inline SVG at the call site rather than a
       * component.
       *
       * Carried from the dead frame footer (`1680:2097`). The component draws
       * the ring as a FILLED `#0A0A0B` donut instead (`1320:117`) — a delta
       * #87 left alone, being neither of the two it was scoped to.
       */}
      <svg
        viewBox="0 0 1276 1277"
        fill="none"
        aria-hidden="true"
        focusable="false"
        className="stroke-on-ink-line pointer-events-none absolute -left-[570px] top-[228px] h-[1277px] w-[1276px] lg:top-[148px]"
      >
        <path
          d="M637.572 1C988.607 1 1274.14 286.893 1274.14 638.463C1274.14 990.033 988.534 1276 637.572 1276C286.611 1276 1 989.959 1 638.463C1.0002 286.967 286.537 1 637.572 1ZM637.572 255.993C427.023 255.993 255.679 427.525 255.679 638.463C255.679 849.401 426.949 1021.01 637.572 1021.01C848.196 1021.01 1019.47 849.327 1019.47 638.463C1019.47 427.525 848.122 255.993 637.572 255.993Z"
          strokeWidth="2"
        />
      </svg>

      <div className="max-w-section relative mx-auto flex w-full flex-col gap-12 lg:gap-32">
        {/* "Left" — logo beside the tagline block at 1440, stacked at 402. */}
        <div className="flex flex-col gap-9 lg:flex-row lg:justify-between">
          {/* `1280:1856` — the mark alone in white, tight-bounded at 148px and
              128 at 402 (`2225:2613`); the red tile went with the rework. No
              color class: it takes the footer's own white through
              `currentColor`, the way the nav's takes the bar's ink. */}
          <BrandMark trim size={128} className="lg:size-[148px]" />

          <div className="flex flex-col gap-24 lg:w-[600px] lg:gap-9">
            {settings?.footerTagline ? (
              <p className="text-display-xl max-w-[600px] text-balance">{settings.footerTagline}</p>
            ) : null}

            {/* "Upper" — three columns side by side at both widths. */}
            <nav aria-label="Footer" className="flex justify-between gap-6 pb-16">
              {leadGroup ? (
                <FooterColumn label={leadGroup.label}>
                  {(leadGroup.links ?? []).map((link) => (
                    <li key={link._key}>
                      <FooterLink href={resolveCtaHref(link)}>{link.label}</FooterLink>
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
                      <FooterLink href={resolveCtaHref(link)}>{link.label}</FooterLink>
                    </li>
                  ))}
                </FooterColumn>
              ))}
            </nav>
          </div>
        </div>

        {/* "Lower" — legal row; stacked at 402 (`1814:1807`), split at 1440. */}
        <div className="text-legal text-fg-subtle flex flex-col gap-3 lg:flex-row lg:justify-between">
          <ul className="flex flex-wrap gap-6">
            {legalLinks.map((link) => (
              <li key={link._key}>
                <Link href={resolveCtaHref(link)} className="hover:text-white">
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
