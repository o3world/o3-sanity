import Link from 'next/link'

import { SurfaceProvider, surfaceAttrs } from '@o3/ui'

import { hrefForDoc } from '@/content/documents/urls'

/** Minimal fallback card for types without a bespoke card component. */
export interface DefaultCardProps {
  readonly _type?: string
  readonly title?: string | null
  readonly slug?: string | null
}

export function DefaultCard({ _type = 'page', title, slug }: DefaultCardProps) {
  return (
    // Paints white, declares white — see PageCard for why both halves.
    <SurfaceProvider surface="white">
      <Link
        href={hrefForDoc({ _type, slug })}
        {...surfaceAttrs('white')}
        className="rounded-card border-line block border bg-white p-6"
      >
        <h3 className="text-fg text-lg font-medium">{title}</h3>
      </Link>
    </SurfaceProvider>
  )
}
