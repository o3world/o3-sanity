import { SERVICE_OFFER_QUERY } from '@o3/sanity/queries'
import { defineSingletonType, type RendererProps } from '@o3/content-runtime/routes'
import { getBaseUrl } from '@o3/content-runtime/base-url'

import { JsonLd, OrganizationJsonLd } from '@/content/structuredData/JsonLd'
import { faqPage, service } from '@/content/structuredData/schema'

import { AiVisibilityReviewView } from './aiVisibilityReview/AiVisibilityReviewView'
import type { ServiceOffer } from './types'

/** The coded route's segment, and the `slug` of the offer it renders. */
const SLUG = 'ai-visibility-review'
const PATH = `/${SLUG}`

/** The Service with every priced package as an Offer, the FAQ, and O3 World. */
function ServiceOfferStructuredData({ offer }: { offer: ServiceOffer }) {
  const faq = faqPage(offer.faqs ?? [])
  return (
    <>
      <OrganizationJsonLd />
      <JsonLd
        data={service({
          baseUrl: getBaseUrl(),
          name: offer.title ?? '',
          description: offer.seo?.description,
          path: PATH,
          offers: (offer.packages ?? []).map((pkg) => ({
            name: pkg.heading,
            price: pkg.priceAmount,
          })),
        })}
      />
      {faq ? <JsonLd data={faq} /> : null}
    </>
  )
}

function AiVisibilityReviewRenderer({
  slug: _slug,
  ...rest
}: RendererProps<typeof SERVICE_OFFER_QUERY>) {
  const offer = rest as ServiceOffer
  return (
    <>
      <ServiceOfferStructuredData offer={offer} />
      <AiVisibilityReviewView offer={offer} />
    </>
  )
}

/**
 * `/ai-visibility-review`: the `serviceOffer` slugged after the route, through
 * the singleton builder — cached, tagged for the webhook, and a 404 when the
 * dataset holds no such offer. Its title and description are the offer's `seo`.
 */
export const aiVisibilityReview = defineSingletonType({
  type: 'serviceOffer',
  query: SERVICE_OFFER_QUERY,
  params: { slug: SLUG },
  renderer: AiVisibilityReviewRenderer,
  seo: (offer) => ({ title: offer.title, path: PATH }),
})
