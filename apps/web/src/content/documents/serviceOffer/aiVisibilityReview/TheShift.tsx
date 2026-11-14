import { cn } from '@o3/ui'

import styles from './aiVisibilityReview.module.css'

const FINDINGS = [
  {
    title: 'How AI describes you today',
    body: 'What the tools say, what they get wrong and what they leave out.',
  },
  {
    title: 'Who shows up when you don’t',
    body: 'The competitors AI recommends in your place, and why.',
  },
  {
    title: 'The fixes that matter most',
    body: 'A short, prioritized list your team can act on right away.',
  },
] as const

/** The problem: customers ask AI now, and most businesses have never checked what it says. */
export function TheShift() {
  return (
    <section className={cn(styles.section, styles.shift)}>
      <div className={styles.wrap}>
        <div className={styles.split}>
          <div className={styles.reveal}>
            <p className={styles.eyebrow}>The shift</p>
            <h2 className={styles.h2}>Search has a new front door.</h2>
          </div>
          <div className={cn(styles.reveal, styles.shiftCopy)}>
            <p className={styles.lead}>
              Your customers aren’t just Googling anymore. They’re asking AI tools for
              recommendations, comparisons and quick answers, and they often act on the first answer
              they get.
            </p>
            <p className={cn(styles.lead, styles.body)}>
              Those tools build their answers from your website, your listings, your reviews and
              what others say about you. If that information is missing, outdated or inconsistent,
              AI may describe you wrong, or recommend a competitor instead.
            </p>
            <p className={cn(styles.lead, styles.body)}>
              Most businesses have never checked. An AI Visibility Review shows you exactly where
              you stand and what to do next.
            </p>
          </div>
        </div>
        <ol className={styles.statGrid}>
          {FINDINGS.map((finding, index) => (
            <li key={finding.title} className={cn(styles.stat, styles.reveal)}>
              <p className={styles.statNumber} aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
              </p>
              <h3 className={styles.statTitle}>{finding.title}</h3>
              <p className={styles.statBody}>{finding.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
