import { NotFoundHero } from '@/components/not-found/NotFoundHero'
import { LANDING_CONTENT_ID } from '@/components/landing/landingContent'

/**
 * A landing route with nothing to render — its offer unpublished, say. The
 * site's own 404 band, inside the landing shell, whose skip link targets this
 * `<main>`; "Go home" is the way back to the site.
 */
export default function LandingNotFound() {
  return (
    <main id={LANDING_CONTENT_ID} tabIndex={-1} className="outline-none">
      <NotFoundHero />
    </main>
  )
}
