'use client'

import { buttonVariants } from '@o3/ui'
import { cn } from '@o3/ui/lib/utils'

/**
 * Keyboard users' way past the nav (WCAG 2.4.1). It is the first focusable
 * element on the page and waits above the viewport until it takes focus, then
 * drops in above the pinned nav.
 *
 * Activating it moves focus to the target, which scrolls it into view, rather
 * than following the fragment. Browsers differ on whether a fragment jump
 * moves focus — Safari has long only scrolled — and a skip link that leaves
 * focus in the nav skips nothing. The `href` stays for a page whose script has
 * not loaded. The target must accept focus (`tabIndex={-1}`).
 */
export function SkipLink({ target }: { target: string }) {
  return (
    <a
      href={`#${target}`}
      onClick={(event) => {
        const main = document.getElementById(target)
        if (!main) return
        event.preventDefault()
        main.focus()
      }}
      className={cn(
        buttonVariants({ variant: 'brand' }),
        'fixed left-4 top-4 z-[60] -translate-y-[calc(100%+2rem)] focus:translate-y-0',
      )}
    >
      Skip to content
    </a>
  )
}
