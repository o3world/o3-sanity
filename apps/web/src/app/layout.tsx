import type { Metadata, Viewport } from 'next'
import type React from 'react'
import { Figtree } from 'next/font/google'

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
  title: { default: 'O3', template: '%s | O3' },
  description: 'O3 — digital products, platforms, and ventures.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={figtree.variable}>
      <body className="text-fg bg-white font-sans antialiased">{children}</body>
    </html>
  )
}
