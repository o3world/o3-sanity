import { PortableTextBody } from '@o3/content-ui/portable-text'
import { cn } from '@o3/ui'

import { TrackedLink } from '@/components/landing/TrackedLink'

import type { ServiceOffer } from '../types'
import styles from './aiVisibilityReview.module.css'

type FaqItem = NonNullable<ServiceOffer['faqs']>[number]

export interface FaqProps {
  readonly faqs: readonly FaqItem[]
  readonly bookingHref: string
}

/** The offer's questions as native disclosures, the first one open. */
export function Faq({ faqs, bookingHref }: FaqProps) {
  return (
    <section id="faq" className={cn(styles.section, styles.faqSection)}>
      <div className={styles.wrap}>
        <div className={styles.split}>
          <div className={styles.reveal}>
            <p className={styles.eyebrow}>FAQ</p>
            <h2 className={styles.h2}>Questions we hear a lot.</h2>
            <p className={cn(styles.lead, styles.body, styles.faqLead)}>
              Still curious?{' '}
              <TrackedLink
                href={bookingHref}
                event="book_call_click"
                location="faq"
                className={styles.inlineLink}
              >
                Book a free 20-minute call
              </TrackedLink>{' '}
              and ask us anything.
            </p>
          </div>
          <div className={cn(styles.faq, styles.reveal)}>
            {faqs.map((faq, index) => (
              <details key={faq._key} open={index === 0}>
                <summary>
                  {faq.question}
                  <span className={styles.chevron} aria-hidden="true">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      aria-hidden="true"
                    >
                      <path d="M12 5v14" />
                      <path d="M5 12h14" />
                    </svg>
                  </span>
                </summary>
                {/* The site's prose renderer, so an editor's link reads as every
                    other link on the site; the module sets the FAQ's own size
                    and rhythm over it. */}
                <PortableTextBody
                  value={faq.answer}
                  className={cn('max-w-none', styles.answerBody)}
                />
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
