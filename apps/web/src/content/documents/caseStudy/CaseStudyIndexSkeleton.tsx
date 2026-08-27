import { Skeleton } from '@o3/ui'

/**
 * What `/work` draws while its feed is in flight — the route's Suspense
 * fallback (`caseStudyIndex.fallback`).
 *
 * The /work feed is a stack of full-width cards 48px apart on white, not a
 * grid, so this stands in for two of those rather than for a row of three. The
 * ink block above it is the authored hero's space, in the ground colour the
 * layout paints.
 *
 * Approximate on purpose. It is seen for the length of one query, so what it
 * has to get right is the shape of the page, not its measurements.
 */
export function CaseStudyIndexSkeleton() {
  return (
    <>
      <div className="bg-ink min-h-[24rem]" />
      <div className="px-gutter py-band-sm lg:py-band-md bg-white">
        <div className="max-w-section mx-auto flex flex-col gap-12">
          {[0, 1].map((card) => (
            <div key={card} className="flex flex-col gap-4">
              <Skeleton className="aspect-21/9 w-full" />
              <Skeleton className="h-3 w-40" />
              <Skeleton className="h-8 w-2/3" />
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
