'use client'

import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Renders its children on the home route and nowhere else.
 *
 * The brand-property strip is a front-door element: Home (`2250:1453`) is the
 * one frame that carries it, and an interior page opens on the pill alone. It
 * lives in the layout beside `SiteNav` because it is chrome that scrolls
 * (`UtilityNav`), and a layout cannot read the path — hence one client
 * component around it rather than the strip moving into the page.
 *
 * With no router context (a render test, a story) `usePathname` returns null
 * and this draws nothing, so anything that wants to see the strip renders
 * `UtilityNav` directly, as the story and the chrome test already do.
 */
export function HomeOnly({ children }: { children: ReactNode }) {
  return usePathname() === '/' ? <>{children}</> : null
}
