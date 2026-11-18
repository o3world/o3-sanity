import Link from 'next/link'
import { ArrowIcon, BrandMark, buttonVariants, cn } from '@o3/ui'

import { TrackedLink } from './TrackedLink'
import styles from './landing.module.css'

interface LandingNavLink {
  readonly label: string
  /** An in-page anchor, with its `#`. */
  readonly href: string
}

export interface LandingNavProps {
  /** The page's own sections, in order. Hidden on phones (≤860px). */
  readonly links: readonly LandingNavLink[]
  /** Where "Let’s talk" goes. */
  readonly bookingHref: string
}

/**
 * A landing page's nav: the O3 mark home to the site's homepage (relative, so
 * a preview or draft session stays where it is), and a pinned glass
 * pill of the page's own anchors with a "Let’s talk" button. It replaces the
 * site nav, so nothing here leads anywhere but this page and the homepage.
 */
export function LandingNav({ links, bookingHref }: LandingNavProps) {
  return (
    <header className={styles.navbar}>
      <div className={styles.navRow}>
        <Link
          href="/"
          aria-label="O3 World home"
          className={cn(
            styles.logo,
            'bg-glass shadow-glass-rim focus-visible:ring-brand flex size-20 items-center justify-center rounded-full text-white backdrop-blur-[3px] backdrop-saturate-[1.1] focus-visible:outline-none focus-visible:ring-2',
          )}
        >
          <BrandMark size={64} />
        </Link>
        <nav className={styles.pill} aria-label="Page sections">
          <div className={styles.links}>
            {links.map((link) => (
              <a key={link.href} className={styles.link} href={link.href}>
                {link.label}
              </a>
            ))}
          </div>
          <TrackedLink
            href={bookingHref}
            event="book_call_click"
            location="nav"
            className={cn(buttonVariants({ variant: 'light' }), styles.talk)}
          >
            Let’s talk
            <ArrowIcon size={16} />
          </TrackedLink>
        </nav>
        <div className={styles.logoBalance} aria-hidden="true" />
      </div>
    </header>
  )
}
