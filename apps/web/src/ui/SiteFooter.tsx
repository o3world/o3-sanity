import Link from 'next/link'

import type { SITE_SETTINGS_QUERY_RESULT } from '@o3/sanity/types/generated'

import { resolveCtaHref } from '@/content/CtaLink'

interface SiteFooterProps {
  settings: SITE_SETTINGS_QUERY_RESULT
}

/**
 * The prototype's ink footer: tagline, then labelled link columns —
 * "Company", the socials, "Everything else" — over a rule carrying the legal
 * links and the copyright line.
 *
 * Every string here comes from Site Settings (#19), including the column
 * headings and the "Go birds." sign-off. The only thing the component decides
 * is the year.
 */
export function SiteFooter({ settings }: SiteFooterProps) {
  const year = new Date().getFullYear()
  const groups = settings?.footerGroups ?? []
  const socialLinks = settings?.socialLinks ?? []
  const legalLinks = settings?.legalLinks ?? []
  const legalName = settings?.legalName ?? settings?.title ?? 'O3'

  return (
    <footer id="footer" className="bg-ink text-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-14 px-6 py-24">
        {settings?.footerTagline ? (
          <p className="text-display-lg font-display max-w-3xl text-balance">
            {settings.footerTagline}
          </p>
        ) : null}

        <nav aria-label="Footer" className="flex flex-wrap gap-x-16 gap-y-10">
          {groups.map((group) => (
            <FooterColumn key={group._key} label={group.label}>
              {(group.links ?? []).map((link) => (
                <li key={link._key}>
                  <FooterLink href={resolveCtaHref(link)}>{link.label}</FooterLink>
                </li>
              ))}
            </FooterColumn>
          ))}

          {socialLinks.length > 0 ? (
            <FooterColumn label={settings?.socialsLabel ?? 'Socials'}>
              {socialLinks.map((social) => (
                <li key={social._key}>
                  {/* External profiles, so a plain anchor rather than next/link. */}
                  <a
                    href={social.url ?? '#'}
                    className="text-sm text-white hover:text-white/70"
                    rel="noreferrer"
                    target="_blank"
                  >
                    {social.label}
                  </a>
                </li>
              ))}
            </FooterColumn>
          ) : null}
        </nav>

        <div className="text-fg-inverse-muted flex flex-col justify-between gap-4 border-t border-white/15 pt-6 text-xs md:flex-row">
          <ul className="flex flex-wrap gap-x-7 gap-y-2">
            {legalLinks.map((link) => (
              <li key={link._key}>
                <Link href={resolveCtaHref(link)} className="hover:text-white">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <p>
            © {year} {legalName}. All rights reserved.
            {settings?.copyrightNote ? ` ${settings.copyrightNote}` : null}
          </p>
        </div>
      </div>
    </footer>
  )
}

function FooterColumn({ label, children }: { label?: string | null; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-brand mb-4 text-[11px] font-bold uppercase tracking-[0.14em]">{label}</p>
      <ul className="flex flex-col gap-2.5">{children}</ul>
    </div>
  )
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-sm text-white hover:text-white/70">
      {children}
    </Link>
  )
}
