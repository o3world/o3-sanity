import Link from 'next/link'

import type { SITE_SETTINGS_QUERY_RESULT } from '@o3/sanity/types/generated'

import { resolveCtaHref } from '@/content/CtaLink'

interface SiteFooterProps {
  settings: SITE_SETTINGS_QUERY_RESULT
}

export function SiteFooter({ settings }: SiteFooterProps) {
  const year = new Date().getFullYear()
  return (
    <footer id="footer" className="bg-ink text-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-14 px-6 py-24">
        {settings?.footerTagline ? (
          <p className="text-display-lg font-display max-w-3xl text-balance">
            {settings.footerTagline}
          </p>
        ) : null}
        <div className="flex flex-col justify-between gap-10 border-t border-white/15 pt-10 md:flex-row">
          <nav aria-label="Footer">
            <ul className="flex flex-wrap gap-x-8 gap-y-3">
              {(settings?.footerLinks ?? []).map((link) => (
                <li key={link._key}>
                  <Link
                    href={resolveCtaHref(link)}
                    className="text-fg-inverse-muted text-sm hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <ul className="flex gap-6">
            {(settings?.socialLinks ?? []).map((social) => (
              <li key={social._key}>
                <a
                  href={social.url ?? '#'}
                  className="text-fg-inverse-muted text-sm hover:text-white"
                  rel="noreferrer"
                  target="_blank"
                >
                  {social.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-fg-inverse-muted text-xs">
          © {year} {settings?.title ?? 'O3'}. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
