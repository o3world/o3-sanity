import { cn } from '@o3/ui'

import styles from './aiVisibilityReview.module.css'

/** What a review can and cannot promise about how AI tools recommend a business. */
export function OurPromise() {
  return (
    <section className={cn(styles.section, styles.promiseSection)}>
      <div className={styles.wrap}>
        <div className={cn(styles.reveal, styles.promise)}>
          <p className={styles.eyebrow}>Our promise</p>
          <h2 className={styles.h2}>Honest about what’s possible.</h2>
          <p className={styles.promiseBody}>
            No one can guarantee how AI tools will recommend a business. Those platforms make their
            own decisions, and they change often. What we can do is make sure your business follows
            every known best practice, so you’re in the strongest possible position to be found,
            described accurately and recommended.
          </p>
        </div>
      </div>
    </section>
  )
}
