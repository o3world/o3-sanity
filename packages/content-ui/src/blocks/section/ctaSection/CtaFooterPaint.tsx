'use client'

import { useLayoutEffect, useRef } from 'react'

const HEIGHT = '--cta-combined-height'

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
      const band = cta.getBoundingClientRect()
      const foot = footer.getBoundingClientRect()
      if (Math.abs(band.bottom - foot.top) > 1 || !band.height || !foot.height) {
        clear()
        return
      }
      const height = `${band.height + foot.height}px`
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
