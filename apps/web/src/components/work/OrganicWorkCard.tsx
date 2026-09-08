'use client'

import { useContext, useEffect, useId, useRef, type CSSProperties, type ReactNode } from 'react'
import { useSpatialMotion } from '../globe/SpatialMotionProvider'
import './work-cards.css'
import { membranePath } from './work-membrane-path'
import {
  createMembrane,
  resetMembrane,
  stepMembrane,
  springMembranePath,
  type Membrane,
} from './work-membrane-spring'
import { WorkCardFrames, type WorkCardFrame } from './WorkCardFrames'
import {
  cardProfile,
  stepScrollCard,
  type CardScrollState,
  cardTravelScale,
  stepCardSpring,
  type CardSpring,
} from './work-card-motion'

const clamp = (value: number, limit: number) => Math.max(-limit, Math.min(limit, value))

/** Keep the existing case card content inside a floating, continuously curved surface. */
export function OrganicWorkCard({ children }: { children: ReactNode }) {
  const id = useId().replaceAll(':', '')
  const rootRef = useRef<HTMLDivElement>(null)
  const pathRef = useRef<SVGPathElement>(null)
  const motion = useSpatialMotion()
  const frames = useContext(WorkCardFrames)

  useEffect(() => {
    const root = rootRef.current
    if (!root || !frames) return
    let visible = false
    let elapsed = 0
    const layout = root.parentElement!
    const profile = cardProfile(root.querySelector('a')?.getAttribute('href') ?? '')
    const { phase, pace } = profile
    let travelScale = 1
    let top = 0
    let left = 0
    let width = 0
    let height = 0
    let mobile = false
    let membraneSize: Parameters<typeof membranePath>[3]
    let pointerX = 0
    let pointerY = 0
    let pointerAt = 0
    let impulseX = 0
    let impulseY = 0
    let offsetX = 0
    let springY: CardScrollState = { position: 0, velocity: 0, momentum: 0 }
    let mouseY: CardSpring = { position: 0, velocity: 0 }
    let velocityX = 0
    let membrane: Membrane | undefined
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
      const gap = Number.parseFloat(getComputedStyle(layout.parentElement!).rowGap)
      travelScale = cardTravelScale(profile, mobile, Number.isFinite(gap) ? gap : mobile ? 80 : 112)
      const background = root.querySelector<HTMLElement>('a > .absolute')
      if (background) {
        membraneSize = {
          width: background.offsetWidth,
          height: background.offsetHeight,
          bleedX: (background.offsetWidth - root.offsetWidth) / 2,
          bleedY: (background.offsetHeight - height) / 2,
          paddingX: Number.parseFloat(getComputedStyle(background.parentElement!).paddingLeft),
        }
        if (
          !membrane ||
          Object.keys(membraneSize).some(
            (key) =>
              membrane!.size[key as keyof typeof membraneSize] !==
              membraneSize![key as keyof typeof membraneSize],
          )
        ) {
          membrane = createMembrane(membraneSize, phase)
        }
      }
    }
    const pointerMove = (event: PointerEvent) => {
      if (!visible || paused() || event.pointerType !== 'mouse') return
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
    const resetImpulse = () => {
      springY.velocity = 0
      springY.momentum = 0
      mouseY.velocity = 0
      velocityX = 0
      impulseX = impulseY = 0
      pointerAt = 0
      if (membrane) resetMembrane(membrane)
    }
    const paint = ({ dt, scrollVelocity, reset, atRest }: WorkCardFrame) => {
      if (reset || paused()) resetImpulse()
      if (atRest) {
        springY = { position: 0, velocity: 0, momentum: 0 }
        mouseY = { position: 0, velocity: 0 }
        offsetX = 0
        if (membrane) resetMembrane(membrane, true)
      }
      if (!paused() && dt > 0) {
        elapsed += dt * 0.35 * pace
        const previousVX = velocityX
        const previousVY = springY.velocity + mouseY.velocity
        springY = stepScrollCard(springY, profile, scrollVelocity, travelScale, dt)
        const horizontal = stepCardSpring(
          { position: offsetX, velocity: velocityX },
          mobile ? 0 : impulseX * 0.008,
          0.22,
          dt,
        )
        mouseY = stepCardSpring(mouseY, mobile ? 0 : impulseY * 0.004, 0.22, dt)
        offsetX = horizontal.position
        velocityX = horizontal.velocity
        if (membrane) {
          stepMembrane(
            membrane,
            {
              accelerationX: reset ? 0 : (velocityX - previousVX) / dt,
              accelerationY: reset ? 0 : (springY.velocity + mouseY.velocity - previousVY) / dt,
              pointer: pointerAt
                ? {
                    x:
                      pointerX -
                      left -
                      offsetX -
                      Math.sin(elapsed * 0.45 + phase) +
                      membrane.size.bleedX,
                    y:
                      pointerY -
                      (top - window.scrollY) -
                      springY.position -
                      mouseY.position -
                      Math.sin(elapsed * 0.55 + phase) * 1.5 +
                      membrane.size.bleedY,
                    velocityX: impulseX,
                    velocityY: impulseY,
                  }
                : undefined,
            },
            dt,
          )
        }
        impulseX *= Math.exp(-dt * 6)
        impulseY *= Math.exp(-dt * 6)
      }
      if (!visible) return
      pathRef.current?.setAttribute(
        'd',
        membrane ? springMembranePath(membrane) : membranePath(phase, 0, 0, membraneSize),
      )
      const floatX = Math.sin(elapsed * 0.45 + phase)
      const floatY = Math.sin(elapsed * 0.55 + phase) * 1.5
      root.style.transform = `translate3d(${offsetX + floatX}px, ${springY.position + mouseY.position + floatY}px, 0)`
    }
    const refresh = () => {
      resetImpulse()
      paint({ dt: 0, scrollVelocity: 0, reset: true, atRest: false })
    }
    frames.add(paint)
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? false
      paint({ dt: 0, scrollVelocity: 0, reset: false, atRest: false })
    })
    observer.observe(layout)
    const resize = new ResizeObserver(() => {
      measure()
      refresh()
    })
    resize.observe(layout)
    measure()
    const selectionChanged = () => {
      const selection = window.getSelection()
      const nextSelecting =
        !!selection &&
        !selection.isCollapsed &&
        (root.contains(selection.anchorNode) || root.contains(selection.focusNode))
      if (nextSelecting !== selecting) {
        selecting = nextSelecting
        refresh()
      }
    }
    const pointerDown = (event: PointerEvent) => {
      if (event.button !== 0 || event.pointerType !== 'mouse') return
      pointerHeld = true
      refresh()
    }
    const pointerUp = () => {
      const wasHeld = pointerHeld
      pointerHeld = false
      selectionChanged()
      if (wasHeld) refresh()
    }
    root.addEventListener('pointerdown', pointerDown)
    window.addEventListener('pointerup', pointerUp)
    window.addEventListener('pointercancel', pointerUp)
    window.addEventListener('blur', pointerUp)
    document.addEventListener('selectionchange', selectionChanged)
    window.addEventListener('pointermove', pointerMove, { passive: true })
    window.addEventListener('resize', measure, { passive: true })
    return () => {
      frames.delete(paint)
      observer.disconnect()
      resize.disconnect()
      root.removeEventListener('pointerdown', pointerDown)
      window.removeEventListener('pointerup', pointerUp)
      window.removeEventListener('pointercancel', pointerUp)
      window.removeEventListener('blur', pointerUp)
      document.removeEventListener('selectionchange', selectionChanged)
      window.removeEventListener('pointermove', pointerMove)
      window.removeEventListener('resize', measure)
    }
  }, [motion, frames])

  return (
    <div
      ref={rootRef}
      className="work-organic-card"
      style={{ '--work-card-clip': `url(#work-clip-${id})` } as CSSProperties}
      onDragStart={(event) => event.preventDefault()}
      onClickCapture={(event) => {
        const selection = window.getSelection()
        if (
          selection &&
          !selection.isCollapsed &&
          event.currentTarget.contains(selection.anchorNode)
        )
          event.preventDefault()
      }}
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
