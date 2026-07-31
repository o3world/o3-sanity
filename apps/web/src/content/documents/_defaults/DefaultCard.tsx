import Link from 'next/link'

import { hrefForDoc } from '@/content/documents/urls'

/** Minimal fallback card for types without a bespoke card component. */
export interface DefaultCardProps {
  readonly _type?: string
  readonly title?: string | null
  readonly slug?: string | null
}

export function DefaultCard({ _type = 'page', title, slug }: DefaultCardProps) {
  return (
    <Link
      href={hrefForDoc({ _type, slug })}
      className="rounded-card border-line block border bg-white p-6"
    >
      <h3 className="text-fg text-lg font-medium">{title}</h3>
    </Link>
  )
}
