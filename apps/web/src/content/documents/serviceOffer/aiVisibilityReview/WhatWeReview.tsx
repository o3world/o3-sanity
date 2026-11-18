import type { ReactNode } from 'react'

import { cn } from '@o3/ui'

import styles from './aiVisibilityReview.module.css'

interface ReviewArea {
  readonly heading: string
  readonly body: string
  readonly icon: ReactNode
}

const AREAS: readonly ReviewArea[] = [
  {
    heading: 'How AI sees you today',
    body: 'We ask the leading AI tools the questions your customers ask, and record what they say about you and your competitors.',
    icon: (
      <>
        <path d="M21 12a8 8 0 0 1-11.8 7L4 20l1.1-4.6A8 8 0 1 1 21 12z" />
        <path d="M9 10h6" />
        <path d="M9 14h4" />
      </>
    ),
  },
  {
    heading: 'Business info and brand consistency',
    body: 'We check that your name, locations, hours, services and story match everywhere AI looks.',
    icon: (
      <>
        <path d="M9 11l3 3 8-8" />
        <path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9" />
      </>
    ),
  },
  {
    heading: 'Website discoverability',
    body: 'We review your site’s content, structure and technical setup so AI tools can find, understand and cite it.',
    icon: (
      <>
        <rect x="3" y="4" width="18" height="14" rx="2" />
        <path d="M3 9h18" />
        <path d="M8 13h5" />
        <path d="M9 21h6" />
      </>
    ),
  },
  {
    heading: 'Opportunities to stand out',
    body: 'We find the questions you should be answering and the content that will earn you mentions.',
    icon: (
      <>
        <path d="M3 17l6-6 4 4 8-8" />
        <path d="M15 7h6v6" />
      </>
    ),
  },
  {
    heading: 'OpenAI Business Hub and Business Agents',
    body: 'We review your eligibility and help you get set up the right way.',
    icon: (
      <>
        <rect x="4" y="7" width="16" height="12" rx="3" />
        <path d="M12 3v4" />
        <circle cx="9" cy="13" r="1.2" />
        <circle cx="15" cy="13" r="1.2" />
        <path d="M2 12v3" />
        <path d="M22 12v3" />
      </>
    ),
  },
]

/** Five areas: three across, then two wide; two columns at 1080px, one at 640px. */
export function WhatWeReview() {
  return (
    <section id="review" className={cn(styles.section, styles.reviewSection)}>
      <div className={styles.wrap}>
        <div className={cn(styles.reveal, styles.sectionHead)}>
          <p className={styles.eyebrow}>What we review</p>
          <h2 className={styles.h2}>Everything AI looks at before it mentions you.</h2>
        </div>
        <ul className={styles.reviewGrid}>
          {AREAS.map((area, index) => (
            <li
              key={area.heading}
              className={cn(
                styles.reviewCard,
                styles.reveal,
                index >= 3 && styles.reviewCardWide,
                index === AREAS.length - 1 && styles.reviewCardLast,
              )}
            >
              <div className={styles.icon}>
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  {area.icon}
                </svg>
              </div>
              <h3 className={styles.cardHeading}>{area.heading}</h3>
              <p className={styles.cardBody}>{area.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
