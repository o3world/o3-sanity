import { stegaClean } from '@sanity/client/stega'

import { LandingNav } from '@/components/landing/LandingNav'
import { LANDING_CONTENT_ID } from '@/components/landing/landingContent'

import type { ServiceOffer } from '../types'
import { Faq } from './Faq'
import { FinalCta } from './FinalCta'
import { Hero } from './Hero'
import { HowItWorks } from './HowItWorks'
import { OurPromise } from './OurPromise'
import { Packages } from './Packages'
import { TheShift } from './TheShift'
import { WhatWeReview } from './WhatWeReview'
import styles from './aiVisibilityReview.module.css'

const SECTION_LINKS = [
  { label: 'What we review', href: '#review' },
  { label: 'Packages', href: '#packages' },
  { label: 'How it works', href: '#how' },
  { label: 'FAQ', href: '#faq' },
] as const

/** Where a booking button goes: the offer's booking URL, or the page's own contact band. */
function bookingHrefOf(offer: Pick<ServiceOffer, 'bookingUrl'>): string {
  return stegaClean(offer.bookingUrl)?.trim() || '#contact'
}

/**
 * The AI Visibility Review landing page. Hero, review areas, steps and
 * promise are written here; packages, add-ons, FAQ and the booking URL come
 * from the `serviceOffer` document.
 */
export function AiVisibilityReviewView({ offer }: { readonly offer: ServiceOffer }) {
  const bookingHref = bookingHrefOf(offer)
  return (
    <div className={styles.page}>
      <LandingNav links={SECTION_LINKS} bookingHref={bookingHref} />
      <main id={LANDING_CONTENT_ID} tabIndex={-1} className="outline-none">
        <Hero bookingHref={bookingHref} />
        <TheShift />
        <WhatWeReview />
        <Packages
          packages={offer.packages ?? []}
          addOns={offer.addOns ?? []}
          bookingHref={bookingHref}
        />
        <HowItWorks />
        <OurPromise />
        <Faq faqs={offer.faqs ?? []} bookingHref={bookingHref} />
        <FinalCta bookingHref={bookingHref} />
      </main>
    </div>
  )
}
