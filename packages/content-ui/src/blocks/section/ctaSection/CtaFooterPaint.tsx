'use client'

import { useLayoutEffect, useRef } from 'react'

const HEIGHT = '--cta-combined-height'

/** Document layout coordinates, independent of an ancestor's entrance transform. */
function layoutTop(element: HTMLElement): number {
  let top = 0
  let current: HTMLElement | null = element
  while (current) {
    top += current.offsetTop
    current = current.offsetParent as HTMLElement | null
    if (current) top += current.clientTop
  }
  return top
}

/** Keep the adjacent CTA and footer on one gradient field as either box reflows. */
export function CtaFooterPaint() {
  const marker = useRef<HTMLSpanElement>(null)

  useLayoutEffect(() => {
    const cta = marker.current?.closest('section')
    const footer = document.getElementById('footer')
    if (!cta || !footer) return

    let painted: string | undefined
    const clear = () => {
      if (!painted) return
      for (const element of [cta, footer]) {
        if (element.style.getPropertyValue(HEIGHT) === painted) element.style.removeProperty(HEIGHT)
      }
      painted = undefined
    }
    const measure = () => {
      const bandHeight = cta.offsetHeight
      const footHeight = footer.offsetHeight
      if (
        Math.abs(layoutTop(cta) + bandHeight - layoutTop(footer)) > 1 ||
        !bandHeight ||
        !footHeight
      ) {
        clear()
        return
      }
      const height = `${bandHeight + footHeight}px`
      if (height === painted) return
      painted = height
      cta.style.setProperty(HEIGHT, height)
      footer.style.setProperty(HEIGHT, height)
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(cta, { box: 'border-box' })
    observer.observe(footer, { box: 'border-box' })
    return () => {
      observer.disconnect()
      clear()
    }
  }, [])

  return <span ref={marker} hidden aria-hidden="true" />
}
