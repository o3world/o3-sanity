import type { SERVICE_OFFER_QUERY_RESULT } from '@o3/sanity/types/generated'

/** A service offer as `SERVICE_OFFER_QUERY` returns it, once the route has found one. */
export type ServiceOffer = NonNullable<SERVICE_OFFER_QUERY_RESULT>
