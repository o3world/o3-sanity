/**
 * The conversion events this app pushes to GTM's dataLayer. GA4 conversions
 * are configured in GTM against these names, so a rename here is a rename
 * there.
 *
 * `location` says which button on the page fired it — `nav`, `hero`,
 * `package-review`, `final-cta` — so one event name covers every placement.
 * `package` lets GTM check which tier a package button was counted against.
 */
export type DataLayerEvent = {
  readonly event: 'book_call_click' | 'start_check_click'
  readonly location: string
  /** On a package button: the package it sells, by its heading. */
  readonly package?: string
}

/**
 * Push one event. Creates the layer when GTM has not loaded yet; GTM replays
 * whatever is already queued when it does. A no-op on the server.
 */
export function pushDataLayerEvent(event: DataLayerEvent): void {
  if (typeof window === 'undefined') return
  const page = window as Window & { dataLayer?: Record<string, unknown>[] }
  ;(page.dataLayer ??= []).push({ ...event })
}
