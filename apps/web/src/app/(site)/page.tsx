import { buildSingletonRoute } from '@o3/content-runtime/routes'

import { home } from '@/content/documents'
import { HeroStarfield } from '@/components/globe/HeroStarfield'

// The homepage renders the `page` document whose slug is "index" through the
// singleton builder — same renderer + cache-tag wiring as the catch-all.
const route = buildSingletonRoute(home)

export const generateMetadata = route.generateMetadata
export default function HomePage() {
  const page = <route.Page />
  return process.env.O3_SPATIAL_GLOBE_ENABLED === '1' ? (
    <>
      <HeroStarfield />
      {page}
    </>
  ) : (
    page
  )
}
