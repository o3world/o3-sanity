import { stegaClean } from '@sanity/client/stega'

import { buttonDestination } from '@o3/content-ui'
import { ArrowIcon, buttonVariants, cn } from '@o3/ui'

import { TrackedLink } from '@/components/landing/TrackedLink'

import type { ServiceOffer } from '../types'
import styles from './aiVisibilityReview.module.css'

type ServicePackage = NonNullable<ServiceOffer['packages']>[number]
type AddOn = NonNullable<ServiceOffer['addOns']>[number]

export interface PackagesProps {
  readonly packages: readonly ServicePackage[]
  readonly addOns: readonly AddOn[]
  readonly bookingHref: string
}

/**
 * The priced tiers and the add-ons, from the offer document. A package with a
 * `featuredLabel` is the dark card and wears the label as a pill.
 */
export function Packages({ packages, addOns, bookingHref }: PackagesProps) {
  return (
    <section id="packages" className={cn(styles.section, styles.packagesSection)}>
      <div className={styles.wrap}>
        <div className={cn(styles.reveal, styles.centeredHead)}>
          <p className={styles.eyebrow}>Packages</p>
          <h2 className={styles.h2}>Choose your starting point.</h2>
          <p className={cn(styles.lead, styles.body)}>
            Each package builds on the one before. Start small, or go straight to having us do the
            work.
          </p>
        </div>

        <ol className={styles.packageGrid}>
          {packages.map((pkg, index) => (
            <PackageCard key={pkg._key} pkg={pkg} number={index + 1} bookingHref={bookingHref} />
          ))}
        </ol>

        {addOns.length > 0 ? (
          <div className={cn(styles.reveal, styles.addOns)}>
            <h3 className={styles.addOnsLabel}>Add to any package</h3>
            <ul className={styles.addOnGrid}>
              {addOns.map((addOn) => (
                <li key={addOn._key} className={styles.addOn}>
                  <span className={styles.addOnLabel}>{addOn.label}</span>
                  <span className={styles.addOnPrice}>{addOn.price}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  )
}

function PackageCard({
  pkg,
  number,
  bookingHref,
}: {
  readonly pkg: ServicePackage
  readonly number: number
  readonly bookingHref: string
}) {
  const featured = Boolean(stegaClean(pkg.featuredLabel)?.trim())
  const destination = pkg.button ? buttonDestination(pkg.button) : { kind: 'none' as const }
  const href = destination.kind === 'none' ? bookingHref : destination.href
  const location = `package-${stegaClean(pkg._key)}`
  const packageName = stegaClean(pkg.heading)?.trim() || undefined

  return (
    <li className={cn(styles.package, styles.reveal, featured && styles.featured)}>
      <div>
        <div className={styles.packageTop}>
          <p className={styles.packageNumber}>{`Package ${number}`}</p>
          {featured ? <span className={styles.pill}>{pkg.featuredLabel}</span> : null}
        </div>
        <h3 className={styles.packageHeading}>{pkg.heading}</h3>
        {pkg.subheading ? <p className={styles.packageSub}>{pkg.subheading}</p> : null}
      </div>
      <p className={styles.price}>{pkg.price}</p>
      <div className={styles.packageRule} aria-hidden="true" />
      {pkg.note ? <p className={styles.packageNote}>{pkg.note}</p> : null}
      {pkg.features?.length ? (
        <ul className={styles.features}>
          {pkg.features.map((feature, index) => (
            // Plain strings carry no `_key`, and two lines may read the same.
            <li key={`${index}-${feature}`}>
              <svg
                className={styles.check}
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M5 12l5 5 9-10" />
              </svg>
              {feature}
            </li>
          ))}
        </ul>
      ) : null}
      {pkg.button?.label ? (
        <TrackedLink
          href={href}
          // Every package builds on the one before, so the first is the entry
          // tier — the "Check" a visitor starts with — whatever it is called.
          event={number === 1 ? 'start_check_click' : 'book_call_click'}
          location={location}
          package={packageName}
          className={cn(
            buttonVariants({ variant: featured ? 'light' : 'dark' }),
            styles.btn,
            featured ? styles.btnLightGlow : styles.btnDarkGlow,
            styles.packageButton,
          )}
        >
          {pkg.button.label}
          <ArrowIcon size={18} />
        </TrackedLink>
      ) : null}
    </li>
  )
}
