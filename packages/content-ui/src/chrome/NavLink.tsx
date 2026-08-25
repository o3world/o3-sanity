'use client'

import type { ComponentProps } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { cn } from '@o3/ui'

/**
 * A nav destination that knows whether the visitor is already on it.
 *
 * The bar's `Link` set (`2225:2894`) draws hover in brand red and nothing
 * else, so the resting page marker is a code decision made on the frame's one
 * vocabulary: the current section takes the same `--color-brand` the hover
 * reaches for, on both skins of the ink flip and on the mobile panel. It also
 * carries `aria-current="page"`, which is the half of it a screen reader gets.
 *
 * Client, and only for `usePathname` — with no router context (the render
 * tests, a story) the hook returns null and every link draws its resting
 * state, which is the frame.
 */
export function NavLink({
  href,
  className,
  children,
  ...rest
}: ComponentProps<typeof Link> & { href: string }) {
  const pathname = usePathname()
  const active = isCurrentSection(pathname, href)

  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(className, active && 'text-brand')}
      {...rest}
    >
      {children}
    </Link>
  )
}

/**
 * A section link stays lit for everything under it — `/work` is current on a
 * case study at `/work/<slug>` — because the bar names sections, not pages.
 * Home is the exception: every path is "under" `/`, so it matches exactly.
 * An off-site href never matches; the visitor cannot be on it.
 */
export function isCurrentSection(pathname: string | null, href: string): boolean {
  if (!pathname || !href.startsWith('/')) return false
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(`${href}/`)
}
