'use client'

import type { AnchorHTMLAttributes } from 'react'

import { pushDataLayerEvent, type DataLayerEvent } from '@/lib/dataLayer'

export interface TrackedLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  readonly href: string
  /** The dataLayer event a click pushes. */
  readonly event: DataLayerEvent['event']
  /** Which placement on the page this is — `hero`, `nav`, `package-review`. */
  readonly location: string
  /** The package a package button sells, sent with the event. */
  readonly package?: string
}

/**
 * A plain link that tells GTM it was clicked. The event, location and package
 * are also written onto the element, so the conversion a link counts as is readable in
 * view-source.
 */
export function TrackedLink({
  href,
  event,
  location,
  package: packageName,
  onClick,
  children,
  ...rest
}: TrackedLinkProps) {
  return (
    <a
      {...rest}
      href={href}
      data-event={event}
      data-location={location}
      data-package={packageName}
      onClick={(clickEvent) => {
        pushDataLayerEvent(
          packageName ? { event, location, package: packageName } : { event, location },
        )
        onClick?.(clickEvent)
      }}
    >
      {children}
    </a>
  )
}
