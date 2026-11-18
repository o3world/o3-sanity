import { ArrowIcon, buttonVariants, cn } from '@o3/ui'

import { TrackedLink } from '@/components/landing/TrackedLink'

import styles from './aiVisibilityReview.module.css'

const TOOLS = [
  'ChatGPT',
  'Google Gemini',
  'Perplexity',
  'Microsoft Copilot',
  'Claude',
  'Google AI Overviews',
] as const

/**
 * The opener on ink: starfield, sequenced copy, the floating AI answer card
 * (hidden once the hero stacks at 1080px), the glowing planet with its
 * orbits, and the marquee of the tools a review covers.
 */
export function Hero({ bookingHref }: { readonly bookingHref: string }) {
  return (
    <section className={styles.hero}>
      <div className={styles.stars} aria-hidden="true" />
      <div className={styles.starsNear} aria-hidden="true" />
      <div className={cn(styles.wrap, styles.heroGrid)}>
        <div>
          <p className={cn(styles.heroEyebrow, styles.fade, styles.d1)}>AI Visibility Reviews</p>
          <h1 className={cn(styles.heroHeading, styles.fade, styles.d2)}>
            When customers ask AI about you, <span className={styles.dim}>what does it say?</span>
          </h1>
          <p className={cn(styles.heroLead, styles.fade, styles.d3)}>
            We review how ChatGPT, Gemini, Perplexity and other AI tools see your business, find
            what’s holding you back, and help you fix it.
          </p>
          <div className={cn(styles.heroButtons, styles.fade, styles.d4)}>
            <TrackedLink
              href={bookingHref}
              event="book_call_click"
              location="hero"
              className={cn(buttonVariants({ variant: 'light' }), styles.btn, styles.btnLightGlow)}
            >
              Book a free 20-minute call
              <ArrowIcon size={18} />
            </TrackedLink>
            <a
              href="#packages"
              className={cn(
                buttonVariants({ variant: 'light', appearance: 'secondary' }),
                styles.btn,
              )}
            >
              See packages
            </a>
          </div>
        </div>
        <div className={cn(styles.heroPreview, styles.fade, styles.d5)}>
          <AnswerCard />
        </div>
      </div>

      <div className={styles.planetZone} aria-hidden="true">
        <div className={styles.planet} />
        <div className={cn(styles.orbit, styles.orbitWide)}>
          <span className={styles.satellite} />
        </div>
        <div className={cn(styles.orbit, styles.orbitRed)}>
          <span className={cn(styles.satellite, styles.satelliteWhite)} />
        </div>
        <div className={cn(styles.orbit, styles.orbitTall)} />
      </div>

      <ToolMarquee />
    </section>
  )
}

/** An AI assistant answering "who's the best near me?", with the visitor's business in doubt. */
function AnswerCard() {
  return (
    <div
      className={styles.card}
      role="img"
      aria-label="Illustration of an AI assistant answering a customer question and listing businesses, with your business marked as a question"
    >
      <div className={styles.cardHead}>
        <div className={styles.cardTitle}>
          <span className={styles.cardIcon}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z" />
              <path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" />
            </svg>
          </span>
          AI answer
        </div>
        <span className={styles.cardTag}>Live preview</span>
      </div>
      <div className={styles.cardQuestion}>Who’s the best [your category] company near me?</div>
      <div className={styles.cardRows}>
        <div className={cn(styles.cardIntro, styles.rowIn, styles.r1)}>
          Here are a few top-rated options
          <span className={styles.typing} aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </div>
        <div className={cn(styles.answer, styles.rowIn, styles.r2)}>
          <span className={styles.answerRank}>1</span>
          Competitor A
          <span className={styles.answerBar} style={{ width: 70 }} />
        </div>
        <div className={cn(styles.answer, styles.rowIn, styles.r3)}>
          <span className={styles.answerRank}>2</span>
          Competitor B
          <span className={styles.answerBar} style={{ width: 54 }} />
        </div>
        <div className={cn(styles.answer, styles.answerYou, styles.rowIn, styles.r4)}>
          <span className={styles.answerRank}>3</span>
          Your business?
          <span className={styles.answerFlag}>Are you here</span>
        </div>
      </div>
    </div>
  )
}

/**
 * The tools a review covers, scrolling. The list is drawn twice so the loop
 * is seamless; the second copy is hidden from assistive technology.
 */
function ToolMarquee() {
  return (
    <div className={styles.tools}>
      <p className={styles.toolsLabel}>We test how you appear across</p>
      <div className={styles.marquee}>
        <div className={styles.track}>
          <ToolList />
          <ToolList hidden />
        </div>
      </div>
    </div>
  )
}

function ToolList({ hidden = false }: { readonly hidden?: boolean }) {
  return (
    <ul className={styles.trackSet} aria-hidden={hidden || undefined}>
      {TOOLS.map((tool) => (
        <li key={tool}>
          {tool}
          <span className={styles.trackDot} aria-hidden="true">
            ·
          </span>
        </li>
      ))}
    </ul>
  )
}
