import type { Metadata, Viewport } from 'next'
import type React from 'react'
import { Figtree } from 'next/font/google'

import { AnchorGlide } from '@o3/ui'
import { getBaseUrl } from '@o3/content-runtime/base-url'

import '@/app/globals.css'
// Side-effect import: validates env vars at build/boot (see src/env.ts).
import '@/env'

// Figtree is both the display and body face (tokens/typography.css reads
// `--font-figtree` first in every stack).
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
  title: { default: 'O3', template: '%s | O3' },
  description: 'O3 — digital products, platforms, and ventures.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    /*
     * `data-scroll-behavior` is how Next is told the document scrolls
     * smoothly (tokens/base.css sets it for anchor links, once
     * `<AnchorGlide />` has armed the gate). Without the attribute the router
     * leaves the CSS alone during a route change, its scroll-to-top is
     * animated rather than instant, and the browser drops it — so a click on
     * Work from halfway down another page arrives halfway down that one. With
     * it, Next flips the property to `auto` for the one frame it needs and the
     * anchors keep their glide.
     *
     * `suppressHydrationWarning` is for `<AnchorGlide />`: it arms the gate on
     * `load`, which on a dev server lands before hydration does, and React
     * then finds `data-anchor-glide` on an element the server sent without
     * it. It is one level deep, so nothing under `<html>` is excused by it.
     */
    <html
      suppressHydrationWarning
      lang="en"
      data-scroll-behavior="smooth"
      className={figtree.variable}
    >
      <body className="text-fg bg-white font-sans antialiased">
        {children}
        <AnchorGlide />
      </body>
    </html>
  )
}
