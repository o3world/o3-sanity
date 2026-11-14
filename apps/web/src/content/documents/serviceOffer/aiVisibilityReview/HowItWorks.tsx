import { cn } from '@o3/ui'

import styles from './aiVisibilityReview.module.css'

const STEPS = [
  {
    heading: 'Pick your package',
    body: 'Choose the level of help you need, or book a quick call and we’ll recommend one.',
  },
  {
    heading: 'We dig in',
    body: 'We test real customer questions across AI tools and review your site, listings and brand presence.',
  },
  {
    heading: 'You get a clear plan',
    body: 'We walk you through what we found and what to fix first, in plain language.',
  },
  {
    heading: 'We help you act',
    body: 'Take the plan to your team, or have us make the changes for you.',
  },
] as const

/** Four numbered steps on charcoal; the red line through the numbers draws in as it scrolls into view. */
export function HowItWorks() {
  return (
    <section id="how" className={cn(styles.section, styles.howSection)}>
      <div className={styles.wrap}>
        <div className={cn(styles.reveal, styles.howHead)}>
          <p className={cn(styles.eyebrow, styles.eyebrowOnInk)}>How it works</p>
          <h2 className={styles.h2}>Simple from start to finish.</h2>
        </div>
        <div className={styles.stepsTrack}>
          <div className={styles.stepsLine} aria-hidden="true">
            <span />
          </div>
          <ol className={styles.steps}>
            {STEPS.map((step, index) => (
              <li key={step.heading} className={cn(styles.step, styles.reveal)}>
                <div className={styles.stepNumber} aria-hidden="true">
                  {index + 1}
                </div>
                <h3 className={styles.stepHeading}>{step.heading}</h3>
                <p className={styles.stepBody}>{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
