import type { Metadata, Viewport } from 'next'
import type React from 'react'
import { Figtree } from 'next/font/google'

import { AnchorGlide } from '@o3/ui'
import { getBaseUrl } from '@o3/content-runtime/base-url'

import '@/app/globals.css'
// Side-effect import: validates env vars and asserts the brand (see src/env.ts).
import '@/env'

// Figtree in both brands — the UI kit's Typography canvas sets the whole O3XO
// ramp in it, so the token package moves the sizes and leaves the family
// alone. No `weight`, which loads the variable face: the kit draws Light 300
// through Bold 700 and the axis covers 300–900.
const figtree = Figtree({
  subsets: ['latin'],
  variable: '--font-figtree',
  display: 'swap',
})

export const viewport: Viewport = { width: 'device-width', initialScale: 1 }

export const metadata: Metadata = {
  // Every relative URL a route emits (canonical, og:url, og:image) resolves
  // against this. Without it Next drops relative canonicals silently, which
  // is the failure mode #26 exists to prevent.
  metadataBase: new URL(getBaseUrl()),
  title: { default: 'O3XO', template: '%s | O3XO' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    /*
     * `data-brand` is the whole token mechanism (ADR 0028). The base theme
     * declares its colors in a plain `@theme` block, so every utility compiles
     * to `var(--color-*)`; `@o3/tailwind-config-o3xo` re-points those custom
     * properties under `:root[data-brand='o3xo']`. Drop the attribute and the
     * app renders in O3's paint with no error anywhere.
     */
    <html lang="en" data-brand="o3xo" className={figtree.variable}>
      <body className="text-fg bg-white font-sans antialiased">
        {children}
        <AnchorGlide />
      </body>
    </html>
  )
}
