'use client'

import {
  useEffect,
  useId,
  useRef,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from 'react'
import { useSpatialMotion } from '../globe/SpatialMotionProvider'
import './work-membrane-prototype.css'
import { membranePath } from './work-membrane-path'

export const subscribeWorkStudy = (listener: () => void) => {
  const refresh = () => {
    document.documentElement.dataset.workStudy = readWorkStudy()
    listener()
  }
  refresh()
  window.addEventListener('popstate', refresh)
  return () => window.removeEventListener('popstate', refresh)
}
export const readWorkStudy = () => new URLSearchParams(location.search).get('workMembrane') ?? 'off'
export const noWorkStudy = () => 'off'
const clamp = (value: number, limit: number) => Math.max(-limit, Math.min(limit, value))

/** Local homepage study: can the case cards themselves behave like floating membranes? */
export function WorkMembranePrototype({ children }: { children: ReactNode }) {
  const mode = useSyncExternalStore(subscribeWorkStudy, readWorkStudy, noWorkStudy)
  const enabled = mode === 'on' || mode === 'ambient'
  const id = useId().replaceAll(':', '')
  const rootRef = useRef<HTMLDivElement>(null)
  const pathRef = useRef<SVGPathElement>(null)
  const motion = useSpatialMotion()

  useEffect(() => {
    const root = rootRef.current
    if (!enabled || !root) return
    if (document.documentElement.hasAttribute('data-work-cards-hidden')) return
    let raf = 0
    let visible = false
    let last = 0
    let elapsed = 0
    const responsive = mode === 'on'
    const layout = root.parentElement!
    const index = Array.from(layout.parentElement!.children).indexOf(layout)
    const depth = 0.03 + (index % 3) * 0.006
    let top = 0
    let left = 0
    let width = 0
    let height = 0
    let mobile = false
    let membraneSize: Parameters<typeof membranePath>[3]
    let previousScroll = window.scrollY
    let pointerX = 0
    let pointerY = 0
    let pointerAt = 0
    let impulseX = 0
    let impulseY = 0
    let offsetX = 0
    let offsetY = 0
    let velocityX = 0
    let velocityY = 0
    let bendX = 0
    let bendY = 0
    const reduced = matchMedia('(prefers-reduced-motion: reduce)')
    let pointerHeld = false
    let selecting = false
    const paused = () => motion?.getSnapshot() || reduced.matches || pointerHeld || selecting
    const measure = () => {
      const rect = layout.getBoundingClientRect()
      top = rect.top + window.scrollY
      left = rect.left
      width = rect.width
      height = root.offsetHeight
      mobile = window.innerWidth < 768
      const background = root.querySelector<HTMLElement>('a > .absolute')
      if (background) {
        membraneSize = {
          width: background.offsetWidth,
          height: background.offsetHeight,
          bleedX: (background.offsetWidth - root.offsetWidth) / 2,
          bleedY: (background.offsetHeight - height) / 2,
          paddingX: Number.parseFloat(getComputedStyle(background.parentElement!).paddingLeft),
        }
      }
    }
    const pointerMove = (event: PointerEvent) => {
      if (!responsive || !visible || paused() || event.pointerType !== 'mouse') return
      const now = performance.now()
      const dt = (now - pointerAt) / 1000
      const dx = Math.max(left - event.clientX, 0, event.clientX - left - width)
      const dy = Math.max(
        top - window.scrollY - event.clientY,
        0,
        event.clientY - (top - window.scrollY + height),
      )
      const influence = Math.max(0, 1 - Math.hypot(dx, dy) / 180)
      if (dt > 0 && dt < 0.1) {
        impulseX = clamp((event.clientX - pointerX) / dt, 1600) * influence
        impulseY = clamp((event.clientY - pointerY) / dt, 1600) * influence
      }
      pointerAt = now
      pointerX = event.clientX
      pointerY = event.clientY
    }
    const paint = (now: number) => {
      raf = 0
      const dt = last ? Math.min(now - last, 32) / 1000 : 1 / 60
      if (!paused()) {
        elapsed += dt * 0.35
        if (responsive) {
          const scrollVelocity = clamp((window.scrollY - previousScroll) / dt, 1800)
          const parallax = clamp(
            (window.scrollY + window.innerHeight / 2 - top - height / 2) * depth,
            mobile ? 16 : 28,
          )
          const targetX = mobile ? 0 : impulseX * 0.008
          const targetY =
            parallax + clamp(scrollVelocity * 0.018, mobile ? 22 : 30) + clamp(impulseY * 0.007, 10)
          // A damped spring retains momentum after input stops; no wheel or scroll interception.
          velocityX += ((targetX - offsetX) * 75 - velocityX * 17) * dt
          velocityY += ((targetY - offsetY) * 42 - velocityY * 12.5) * dt
          offsetX += velocityX * dt
          offsetY += velocityY * dt
          const follow = 1 - Math.exp(-dt * 9)
          bendX += (clamp(impulseX * 0.000007 + velocityX * 0.00012, 0.013) - bendX) * follow
          bendY += (clamp(scrollVelocity * 0.000007 + impulseY * 0.000006, 0.016) - bendY) * follow
          impulseX *= Math.exp(-dt * 6)
          impulseY *= Math.exp(-dt * 6)
        }
      }
      previousScroll = window.scrollY
      last = now
      const path = membranePath(elapsed * 1.8, bendX, bendY, membraneSize)
      pathRef.current?.setAttribute('d', path)
      const phase = index * 1.7
      const floatX = Math.sin(elapsed * 0.65 + phase) * 2
      const floatY = Math.sin(elapsed * 0.8 + phase) * 3
      root.style.transform = `translate3d(${offsetX + floatX}px, ${offsetY + floatY}px, 0)`
      if (visible && !document.hidden && !paused()) raf = requestAnimationFrame(paint)
    }
    const refresh = () => {
      cancelAnimationFrame(raf)
      last = 0
      previousScroll = window.scrollY
      impulseX = impulseY = 0
      pointerAt = 0
      if (visible && !document.hidden) raf = requestAnimationFrame(paint)
    }
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? false
      refresh()
    })
    observer.observe(root)
    const resize = new ResizeObserver(() => {
      measure()
      refresh()
    })
    resize.observe(layout)
    measure()
    const selectionChanged = () => {
      const selection = window.getSelection()
      selecting =
        !!selection &&
        !selection.isCollapsed &&
        (root.contains(selection.anchorNode) || root.contains(selection.focusNode))
      refresh()
    }
    const pointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return
      pointerHeld = true
      refresh()
    }
    const pointerUp = () => {
      pointerHeld = false
      selectionChanged()
    }
    root.addEventListener('pointerdown', pointerDown)
    window.addEventListener('pointerup', pointerUp)
    window.addEventListener('pointercancel', pointerUp)
    window.addEventListener('blur', pointerUp)
    document.addEventListener('selectionchange', selectionChanged)
    const unsubscribe = motion?.subscribe(refresh)
    window.addEventListener('pointermove', pointerMove, { passive: true })
    window.addEventListener('resize', measure, { passive: true })
    document.addEventListener('visibilitychange', refresh)
    reduced.addEventListener('change', refresh)
    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
      resize.disconnect()
      unsubscribe?.()
      root.removeEventListener('pointerdown', pointerDown)
      window.removeEventListener('pointerup', pointerUp)
      window.removeEventListener('pointercancel', pointerUp)
      window.removeEventListener('blur', pointerUp)
      document.removeEventListener('selectionchange', selectionChanged)
      window.removeEventListener('pointermove', pointerMove)
      window.removeEventListener('resize', measure)
      document.removeEventListener('visibilitychange', refresh)
      reduced.removeEventListener('change', refresh)
    }
  }, [enabled, mode, motion])

  return (
    <div
      ref={rootRef}
      className="work-organic-card-study"
      style={{ '--work-card-clip': `url(#work-clip-${id})` } as CSSProperties}
      onDragStart={enabled ? (event) => event.preventDefault() : undefined}
      onClickCapture={
        enabled
          ? (event) => {
              const selection = window.getSelection()
              if (
                selection &&
                !selection.isCollapsed &&
                event.currentTarget.contains(selection.anchorNode)
              )
                event.preventDefault()
            }
          : undefined
      }
    >
      <svg className="work-organic-card-clip" width="0" height="0" aria-hidden="true">
        <defs>
          <clipPath id={`work-clip-${id}`} clipPathUnits="objectBoundingBox">
            <path ref={pathRef} d={membranePath(0)} />
          </clipPath>
        </defs>
      </svg>
      {children}
    </div>
  )
}
