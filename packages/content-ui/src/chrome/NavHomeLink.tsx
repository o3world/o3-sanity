'use client'

import type { ComponentProps } from 'react'
import Link from 'next/link'

type NavHomeLinkProps = Pick<ComponentProps<typeof Link>, 'children' | 'className' | 'aria-label'>

export function NavHomeLink(props: NavHomeLinkProps) {
  return (
    <Link
      {...props}
      href="/"
      onNavigate={(event) => {
        if (window.location.pathname !== '/') return
        event.preventDefault()
        if (window.location.hash) {
          window.history.replaceState(window.history.state, '', `/${window.location.search}`)
        }
        window.scrollTo({ top: 0 })
      }}
    />
  )
}
