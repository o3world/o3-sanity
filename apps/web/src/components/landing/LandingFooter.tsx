import styles from './landing.module.css'

/** The site's privacy policy page — the same link the site footer's legal row carries. */
const PRIVACY_POLICY_HREF = '/privacy-policy'

/** A landing page's footer: the copyright line and the privacy policy, nothing else. */
export function LandingFooter({ year }: { readonly year: number }) {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerRow}>
        <span>© {year} O3 World</span>
        <a className={styles.footerLink} href={PRIVACY_POLICY_HREF}>
          Privacy policy
        </a>
      </div>
    </footer>
  )
}
