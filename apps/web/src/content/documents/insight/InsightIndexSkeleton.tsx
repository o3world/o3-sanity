import { Skeleton } from '@o3/ui'

/**
 * What `/insights` draws while its feed is in flight — the route's Suspense
 * fallback (`insightIndex.fallback`).
 *
 * It stands in for the two things `InsightIndexView` draws below the authored
 * hero: the chip row and the first row of the card grid, on the same bone band
 * at the same columns. The ink block above it is the hero's space, and the
 * colour is the layout's ground — the hero arrives ink, so that part of the
 * page does not change when it lands.
 *
 * Approximate on purpose. It is seen for the length of one query, so what it
 * has to get right is the shape of the page, not its measurements.
 */
export function InsightIndexSkeleton() {
  return (
    <>
      <div className="bg-ink min-h-[24rem]" />
      <div className="px-gutter py-band-md bg-bone">
        <div className="max-w-section mx-auto flex flex-col gap-12">
          {/* `rounded-btn`, not a pill: `FilterChip` is a 5px-cornered plate. */}
          <div className="flex gap-2.5">
            {[0, 1, 2, 3].map((chip) => (
              <Skeleton key={chip} className="rounded-btn h-12 w-24" />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-x-8 gap-y-16 lg:grid-cols-3">
            {[0, 1, 2].map((card) => (
              // `InsightCard`'s own column: 24 between the square and the info
              // block, 6 inside it.
              <div key={card} className="flex flex-col gap-6">
                <Skeleton className="aspect-square w-full" />
                <div className="flex flex-col gap-1.5">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-6 w-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
