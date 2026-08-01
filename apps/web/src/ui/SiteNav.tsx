import Link from 'next/link'

import { BrandLogo } from '@o3/ui'
import type { SITE_SETTINGS_QUERY_RESULT } from '@o3/sanity/types/generated'

import { CtaLink, resolveCtaHref } from '@/content/CtaLink'

import { MobileNavMenu } from './MobileNavMenu'

interface SiteNavProps {
  settings: SITE_SETTINGS_QUERY_RESULT
}

/**
 * The site nav, built to Figma's `NavBar` component (`1710:2271`) — #41.
 *
 * The two widths are **structurally** different, which makes this a
 * composition switch at `lg` rather than a resize (ADR 0006):
 *
 * |       | 402 (`1814:1630`)                 | 1440 (`1710:2271`)                     |
 * | ----- | --------------------------------- | -------------------------------------- |
 * | Shape | full-width square bar, `8px 20px` | 822px pill, radius 900px, `8px 32px`   |
 * | Links | behind "Open menu"                | five inline, in a 589px space-between  |
 * | CTA   | inline, beside the hamburger      | inline, ending the row                 |
 *
 * Both fills are `rgba(3,3,3,0.2)` — `bg-scrim`. It stays an alpha because it
 * sits over whatever the hero is showing, and the frames put **no blur** on it;
 * the prototype's `backdrop-blur` is dropped rather than kept on a hunch.
 *
 * Figma places the desktop bar at `y: 30` over a hero with 164px of top
 * padding — over the page, not in flow. Whether it then *stays* there while
 * scrolling is a motion question static frames cannot answer, so the
 * prototype's fixed behaviour carries over unchanged.
 */
export function SiteNav({ settings }: SiteNavProps) {
  const navItems = settings?.navItems ?? []
  const cta = settings?.primaryCta ?? null

  return (
    <header className="lg:px-gutter fixed inset-x-0 top-0 z-50 lg:top-[30px]">
      <nav
        aria-label="Primary"
        className="bg-scrim flex items-center justify-between px-5 py-2 lg:mx-auto lg:w-full lg:max-w-[822px] lg:rounded-full lg:px-8"
      >
        <Link
          href="/"
          aria-label={`${settings?.title ?? 'O3'} home`}
          className="focus-visible:ring-brand shrink-0 focus-visible:outline-none focus-visible:ring-2"
        >
          <BrandLogo color="black" size={64} />
        </Link>

        {/* 1440: the 589px row (`1710:2245`). `contents` promotes the list
            items to flex children, so space-between spreads links and CTA. */}
        <div className="hidden items-center justify-between lg:flex lg:w-[589px]">
          <ul className="contents">
            {navItems.map((item, i) => (
              <li key={item._key ?? `nav-${i}`}>
                <Link
                  href={resolveCtaHref(item)}
                  // `Button / Ghost` ships no Hover variant, so this hover is a
                  // code decision rather than a read one (#38's State rule).
                  className="text-button focus-visible:ring-brand duration-(--duration-hover) text-white transition-opacity ease-out hover:opacity-70 focus-visible:outline-none focus-visible:ring-2"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          {cta ? <CtaLink cta={cta} arrow /> : null}
        </div>

        {/* 402: CTA + hamburger, 32px apart (`1814:1632`). */}
        <div className="flex items-center gap-8 lg:hidden">
          {cta ? <CtaLink cta={cta} arrow /> : null}
          <MobileNavMenu items={navItems} cta={cta} />
        </div>
      </nav>
    </header>
  )
}
