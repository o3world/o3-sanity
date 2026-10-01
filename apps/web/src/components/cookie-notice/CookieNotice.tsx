'use client'

import { useState, useSyncExternalStore } from 'react'
import { Button, CloseIcon } from '@o3/ui'

/**
 * The WordPress Cookie Notice plugin's cookie, name, value and lifetime, so a
 * visitor who accepted on the old site is not asked again after the cutover.
 */
export const COOKIE_NOTICE_COOKIE = 'cookie_notice_accepted'
const THIRTY_DAYS_S = 60 * 60 * 24 * 30

const hasAccepted = () => document.cookie.split('; ').includes(`${COOKIE_NOTICE_COOKIE}=true`)
const subscribe = () => () => {}

/**
 * A notice, not a consent mechanism: it blocks no tag and offers no refusal
 * (OWSW-28), and the close button accepts too. The consent review, OWSW-89,
 * is what would change that.
 *
 * The shell is prerendered, so the server cannot know whether a visitor has
 * accepted. It renders nothing, and the browser decides once hydrated: an
 * accepted visitor never sees the notice flash, and a new one sees it arrive.
 * Fixed to the viewport, so arriving shifts nothing.
 */
export function CookieNotice() {
  const accepted = useSyncExternalStore(subscribe, hasAccepted, () => true)
  const [dismissed, setDismissed] = useState(false)

  if (accepted || dismissed) return null

  const accept = () => {
    document.cookie = `${COOKIE_NOTICE_COOKIE}=true; max-age=${THIRTY_DAYS_S}; path=/; samesite=lax`
    setDismissed(true)
  }

  return (
    <section
      aria-label="Cookie notice"
      className="text-ink px-gutter fixed inset-x-0 bottom-0 z-40 bg-white py-4 shadow-[0_-1px_0_var(--color-line)]"
    >
      <div className="max-w-section mx-auto flex items-center gap-4">
        <p className="text-nav flex-1">
          We use cookies to enhance your experience with our site and to analyze the performance of
          our marketing efforts.
        </p>
        <Button type="button" onClick={accept}>
          Accept
        </Button>
        <Button type="button" variant="ghost" aria-label="Close" onClick={accept} className="p-2">
          <CloseIcon />
        </Button>
      </div>
    </section>
  )
}
