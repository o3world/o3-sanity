'use client'

import dynamic from 'next/dynamic'

// Keep the fallback's CTA server-rendered without adding its client dependencies
// to every route beneath the site layout.
export const NotFoundCta = dynamic(() => import('@o3/content-ui').then((m) => m.CtaSection))
