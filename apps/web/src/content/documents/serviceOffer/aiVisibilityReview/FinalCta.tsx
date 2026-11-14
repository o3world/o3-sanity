import { ArrowIcon, buttonVariants, cn } from '@o3/ui'

import { TrackedLink } from '@/components/landing/TrackedLink'

import styles from './aiVisibilityReview.module.css'

/**
 * The closing band, `#contact` — where every booking button lands while the
 * offer has no booking URL.
 */
export function FinalCta({ bookingHref }: { readonly bookingHref: string }) {
  return (
    <section id="contact" className={styles.cta}>
      <div className={styles.stars} aria-hidden="true" />
      <div className={styles.ctaGlow} aria-hidden="true" />
      <div className={cn(styles.wrap, styles.reveal, styles.ctaInner)}>
        <p className={cn(styles.eyebrow, styles.eyebrowOnInk)}>Get started</p>
        <h2 className={styles.ctaHeading}>
          Find out what AI is saying <span className={styles.dim}>about you.</span>
        </h2>
        <p className={styles.ctaLead}>
          Start with a quick call. We’ll show you one or two AI answers about your business and
          recommend the right package.
        </p>
        <div className={styles.ctaButtons}>
          <TrackedLink
            href={bookingHref}
            event="book_call_click"
            location="final-cta"
            className={cn(buttonVariants({ variant: 'light' }), styles.btn, styles.btnLightGlow)}
          >
            Book a free 20-minute call
            <ArrowIcon size={18} />
          </TrackedLink>
          {/* Scrolls to the packages, where the Check's own button is what
              counts as starting one — so this one pushes no event. */}
          <a
            href="#packages"
            className={cn(
              buttonVariants({ variant: 'light', appearance: 'secondary' }),
              styles.btn,
            )}
          >
            Start with a Check
          </a>
        </div>
      </div>
    </section>
  )
}
