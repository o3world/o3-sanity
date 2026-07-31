import Link from 'next/link'

import type { SITE_SETTINGS_QUERY_RESULT } from '@o3/sanity/types/generated'

import { CtaLink, resolveCtaHref } from '@/content/CtaLink'

interface SiteNavProps {
  settings: SITE_SETTINGS_QUERY_RESULT
}

/**
 * The floating pill nav (simple version of the prototype's `#main-nav`):
 * fixed, centered, glassy rounded-full bar — O3 mark, nav links from
 * siteSettings, and the primary "Let's talk" CTA.
 */
export function SiteNav({ settings }: SiteNavProps) {
  return (
    <header className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4">
      <nav className="bg-ink/25 pointer-events-auto flex w-full max-w-4xl items-center gap-6 rounded-full border border-white/15 py-3 pl-6 pr-3 shadow-lg backdrop-blur-md">
        <Link href="/" className="shrink-0 text-lg font-extrabold text-white" aria-label="O3 home">
          O<span className="text-brand">3</span>
        </Link>
        <ul className="ml-auto hidden items-center gap-7 md:flex">
          {(settings?.navItems ?? []).map((item) => (
            <li key={item._key}>
              <Link href={resolveCtaHref(item)} className="text-sm font-medium text-white">
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        {settings?.primaryCta ? (
          <div className="shrink-0 max-md:ml-auto">
            <CtaLink cta={settings.primaryCta} />
          </div>
        ) : null}
      </nav>
    </header>
  )
}
