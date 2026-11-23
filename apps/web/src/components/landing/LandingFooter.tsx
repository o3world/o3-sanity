import type { ReactNode } from 'react'

import styles from './landing.module.css'

/** The site's privacy policy page — the same link the site footer's legal row carries. */
const PRIVACY_POLICY_HREF = '/privacy-policy'

type LandingFooterProps = {
  readonly year: number
  /** App-owned controls beside the privacy link, as the site footer takes them. */
  readonly utilities?: ReactNode
}

/** A landing page's footer: the copyright line, any utilities, and the privacy policy. */
export function LandingFooter({ year, utilities }: LandingFooterProps) {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerRow}>
        <span>© {year} O3 World</span>
        <div className={styles.footerEnd}>
          {utilities}
          <a className={styles.footerLink} href={PRIVACY_POLICY_HREF}>
            Privacy policy
          </a>
        </div>
      </div>
    </footer>
  )
}
