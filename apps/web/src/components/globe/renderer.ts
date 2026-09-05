/// <reference types="@webgpu/types" />
import { draw, frame, init, surface } from 'vgpu'
import type { OrbitalRendererProps } from '@o3/ui'
import { resolveColor } from './resolve-color'
import { createGlobeParallax } from './globe-parallax'
import { startPhoneTiltPrototype } from './phone-tilt-prototype'
import { dotShader, orbitMaskShader, orbitShader, shootingStarShader, starsShader } from './shaders'

export async function startSpatialGlobe(
  canvas: HTMLCanvasElement,
  hero: HTMLElement,
  globe: HTMLElement,
  signal: AbortSignal,
  options: Pick<
    OrbitalRendererProps,
    'arcs' | 'motion' | 'preset' | 'opacity' | 'electronOpacity' | 'onReady'
  > & {
    stars: boolean
    quietStars?: boolean
  },
) {
  const heroStars = options.stars && !options.quietStars
  const gpu = await init({ powerPreference: 'low-power' })
  if (signal.aborted) {
    gpu.dispose()
    return
  }
  let dispose = () => gpu.dispose()
  try {
    const target = surface(gpu, canvas, { dpr: [1, 2], alphaMode: 'premultiplied' })
    const arcs = options.arcs.map((arc) => ({
      ...arc,
      col: resolveColor(arc.col, globe),
      dots: arc.dots.map((dot) => ({ ...dot, col: resolveColor(dot.col, globe) })),
    }))
    const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    const rings = arcs.map(() =>
      draw(gpu, { shader: orbitShader, vertices: 288 * 6, blend: 'alpha' }),
    )
    // Erase sky pixels beneath every rail before drawing translucent globe colors.
    const masks = (options.stars ? arcs : []).map(() =>
      draw(gpu, {
        shader: orbitMaskShader,
        vertices: 288 * 6,
        blend: { color: { src: 'zero', dst: 'one-minus-src-alpha' } },
      }),
    )
    const electrons = arcs.map((arc) =>
      arc.dots.map(() => draw(gpu, { shader: dotShader, vertices: 6, blend: 'alpha' })),
    )
    const stars = options.stars
      ? draw(gpu, {
          shader: starsShader,
          vertices: 6,
          instances: options.quietStars ? 1100 : 4180,
          blend: 'alpha',
        })
      : undefined
    const shootingStar = heroStars
      ? draw(gpu, { shader: shootingStarShader, vertices: 6, blend: 'alpha' })
      : undefined
    const previewShootingStar = new URLSearchParams(location.search).has('shooting-star-preview')
    let parallax: ReturnType<typeof createGlobeParallax> | undefined
    let stopTilt: (() => void) | undefined
    let raf = 0
    let dead = false
    let ready = false
    let visible = true
    let previous: number | undefined
    let elapsed = 0
    let skyRise = 0
    let mx = 0,
      my = 0,
      sx = 0,
      sy = 0
    const spinRate = (Math.PI * 2) / (options.quietStars ? 3600 : 900)
    let spinX = 0.16 / Math.hypot(0.16, 1, 0.08),
      spinY = 1 / Math.hypot(0.16, 1, 0.08),
      spinZ = 0.08 / Math.hypot(0.16, 1, 0.08)
    let targetSpinX = spinX,
      targetSpinY = spinY,
      targetSpinZ = spinZ
    let rotation = [0, 0, 0, 1]
    let lastPointer: { x: number; y: number } | undefined
    const reduced = matchMedia('(prefers-reduced-motion: reduce)')
    const forcedStill = new URLSearchParams(location.search).has('spatial-still')
    const isStill = () => options.motion === 'still' || forcedStill || reduced.matches
    const phases = arcs.map((arc) => arc.dots.map((dot) => dot.t))
    const cleanup = () => {
      if (dead) return
      dead = true
      signal.removeEventListener('abort', cleanup)
      cancelAnimationFrame(raf)
      parallax?.dispose()
      stopTilt?.()
      observer.disconnect()
      resizeObserver.disconnect()
      window.removeEventListener('pointermove', pointer)
      window.removeEventListener('resize', wake)
      window.removeEventListener('scroll', wake)
      document.removeEventListener('visibilitychange', wake)
      reduced.removeEventListener('change', wake)
      if (ready) options.onReady(false)
      if (heroStars) hero.style.removeProperty('--spatial-sky-overhang')
      delete hero.dataset.spatialReady
      if (heroStars) delete document.documentElement.dataset.spatialChrome
      if (heroStars) document.documentElement.style.removeProperty('--spatial-nav-solid')
      delete hero.dataset.spatialStill
      canvas.style.opacity = '0'
      gpu.dispose()
    }
    dispose = cleanup
    const fail = (error: unknown) => {
      if (dead) return
      console.warn(
        `Original globe · GPU unavailable (${error instanceof Error ? error.message : String(error)})`,
      )
      cleanup()
      options.onReady(false)
    }
    const pointer = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse' || isStill()) return
      const bounds = hero.getBoundingClientRect()
      if (event.clientY < Math.max(0, bounds.top) || event.clientY > bounds.bottom) {
        lastPointer = undefined
        return
      }
      if (lastPointer) {
        const dx = event.clientX - lastPointer.x
        const dy = event.clientY - lastPointer.y
        const distance = Math.hypot(dx, dy)
        if (distance >= 2) {
          targetSpinX = dy / distance
          targetSpinY = -dx / distance
          targetSpinZ = 0
          lastPointer = { x: event.clientX, y: event.clientY }
        }
      } else lastPointer = { x: event.clientX, y: event.clientY }
      mx = (event.clientX / innerWidth - 0.5) * 2
      my = (event.clientY / innerHeight - 0.5) * 2
    }
    const wake = () => {
      if (!visible || document.hidden) previous = undefined
      if (!dead && !raf && visible && !document.hidden) {
        previous = undefined
        raf = requestAnimationFrame(tick)
      }
    }
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? false
      wake()
    })
    const resizeObserver = new ResizeObserver(wake)
    const tick = (now: number) => {
      raf = 0
      if (dead || signal.aborted) return
      if (!visible || document.hidden) {
        previous = undefined
        return
      }
      if (isStill()) hero.dataset.spatialStill = 'true'
      else delete hero.dataset.spatialStill
      const dt = previous === undefined ? 1 / 30 : (now - previous) / 1000
      previous = now
      if (!isStill()) {
        elapsed += dt
        const ease = 1 - 0.94 ** (dt * 30)
        sx += (mx - sx) * ease
        sy += (my - sy) * ease
        spinX += (targetSpinX - spinX) * ease
        spinY += (targetSpinY - spinY) * ease
        spinZ += (targetSpinZ - spinZ) * ease
        // Integrate the changing axis rather than recomputing orientation from time.
        const magnitude = Math.hypot(spinX, spinY, spinZ)
        if (magnitude > 0.00001) {
          const halfAngle = (spinRate * magnitude * dt) / 2
          const scale = Math.sin(halfAngle) / magnitude
          const x = spinX * scale,
            y = spinY * scale,
            z = spinZ * scale,
            w = Math.cos(halfAngle)
          const [qx = 0, qy = 0, qz = 0, qw = 1] = rotation
          const next = [
            w * qx + x * qw + y * qz - z * qy,
            w * qy - x * qz + y * qw + z * qx,
            w * qz + x * qy - y * qx + z * qw,
            w * qw - x * qx - y * qy - z * qz,
          ]
          const length = Math.hypot(...next)
          rotation = next.map((value) => value / length)
        }
        arcs.forEach((arc, i) =>
          arc.dots.forEach((dot, j) => {
            phases[i]![j]! += dot.sp * 0.15 * dt
          }),
        )
      } else {
        sx = 0
        sy = 0
      }
      const heroBounds = hero.getBoundingClientRect()
      parallax?.update(heroBounds, document.documentElement.clientHeight, dt, isStill())
      const overhang = heroStars ? Math.max(0, heroBounds.top + scrollY) : 0
      if (heroStars) {
        hero.style.setProperty('--spatial-sky-overhang', `${overhang}px`)
        canvas.style.top = `-${overhang}px`
        canvas.style.height = `calc(100% + ${overhang}px)`
      }
      const h = canvas.getBoundingClientRect()
      const g = globe.getBoundingClientRect()
      const viewport = [h.width, h.height, 0, 0]
      const geometry = [
        g.left - h.left + g.width / 2,
        g.top - h.top + g.height / 2,
        g.width / 680,
        options.electronOpacity,
      ]
      const scrollOrbit =
        isStill() || !heroStars ? 0 : Math.min(1, Math.max(0, scrollY / heroBounds.height)) * 0.08
      const motion = [isStill() ? 0 : elapsed, -sx * 0.045, sy * 0.032 + scrollOrbit, 0]
      const params = {
        viewport,
        globe: geometry,
        motion,
        u: [0, 0, 0, 0],
        v: [0, 0, 0, 0],
        color: [1, 1, 1, 1],
        dot: [0, 0, 0, 0],
      }
      const targetSkyRise =
        Math.min(heroBounds.height, Math.max(0, -heroBounds.top)) * (options.quietStars ? 0 : 0.015)
      skyRise = isStill() ? 0 : skyRise + (targetSkyRise - skyRise) * (1 - 0.94 ** (dt * 30))
      const skyViewport = [h.width, h.height, skyRise, Number(options.quietStars)]
      const skyMotion = [
        isStill() ? 0 : elapsed,
        -sx * (options.quietStars ? 0.009 : 0.045),
        sy * (options.quietStars ? 0.0064 : 0.032),
        0,
      ]
      stars?.set({
        p: {
          viewport: skyViewport,
          motion: skyMotion,
          globe: geometry,
          rotation: isStill() ? [0, 0, 0, 1] : rotation,
        },
      })
      shootingStar?.set({
        p: {
          viewport: skyViewport,
          globe: geometry,
          motion: [...skyMotion.slice(0, 3), Number(previewShootingStar)],
        },
      })
      arcs.forEach((arc, i) => {
        // Keep the export's slow colored-orbit breathing.
        const phase = Math.max(0, elapsed - arc.i * 1.1) / ((4.2 + arc.i * 0.7) / 0.3)
        const pulse = arc.colored && !isStill() ? 0.725 + 0.275 * Math.cos(phase * Math.PI * 2) : 1
        const shared = { ...params, u: [...arc.u, arc.w], v: [...arc.v, arc.op] }
        masks[i]?.set({ p: shared })
        rings[i]!.set({ p: { ...shared, color: [...rgb(arc.col), arc.op * pulse] } })
        arc.dots.forEach((dot, j) =>
          electrons[i]![j]!.set({
            p: {
              ...shared,
              color: [...rgb(dot.col), pulse],
              dot: [
                isStill() ? dot.t : phases[i]![j],
                dot.r,
                Number(dot.glow),
                Number(options.preset === 'hero'),
              ],
            },
          }),
        )
      })
      try {
        frame(gpu, (f) =>
          f.pass({ target, clear: [0, 0, 0, 0] }, (pass) => {
            if (stars) {
              pass.draw(stars)
              if (shootingStar && !isStill()) pass.draw(shootingStar)
              masks.forEach((mask) => pass.draw(mask))
            }
            rings.forEach((ring) => pass.draw(ring))
            electrons.forEach((orbit) => orbit.forEach((dot) => pass.draw(dot)))
          }),
        )
        hero.dataset.spatialReady = 'true'
        if (!ready) {
          ready = true
          options.onReady(true)
        }
        if (heroStars) document.documentElement.dataset.spatialChrome = 'true'
        const mobile = innerWidth < 1024
        if (heroStars)
          document.documentElement.style.setProperty(
            '--spatial-nav-solid',
            String(
              Math.min(1, Math.max(0, (scrollY - (mobile ? 30 : 100)) / (mobile ? 130 : 240))),
            ),
          )
        canvas.style.opacity = String(options.opacity)
        canvas.dataset.frame = String(Math.round(elapsed * 1000))
        if (!isStill()) raf = requestAnimationFrame(tick)
      } catch (error) {
        fail(error)
      }
    }
    gpu.onError(fail)
    gpu.gpu.lost.then((info) => {
      if (!dead) fail(new Error(info.message || 'device lost'))
    })
    signal.addEventListener('abort', cleanup, { once: true })
    try {
      await Promise.all(
        [...masks, ...rings, ...electrons.flat(), stars, shootingStar].map((item) =>
          item?.compile({ colors: [navigator.gpu.getPreferredCanvasFormat()], sampleCount: 1 }),
        ),
      )
      if (signal.aborted || dead) {
        cleanup()
        return
      }
      const parallaxLayer = globe.closest<HTMLElement>('.hero-lag, .cta-lag')
      if (parallaxLayer)
        parallax = createGlobeParallax(
          parallaxLayer,
          parallaxLayer.matches('.hero-lag') ? 'hero' : 'cta',
        )
      observer.observe(options.stars ? hero : (globe.closest('section') ?? globe))
      resizeObserver.observe(globe)
      resizeObserver.observe(hero)
      if (new URLSearchParams(location.search).get('tilt') !== 'off') {
        let lastTilt: { x: number; y: number } | undefined
        stopTilt = startPhoneTiltPrototype(
          canvas,
          () => visible && !document.hidden && !isStill(),
          (x, y, reset) => {
            if (reset) lastTilt = undefined
            if (lastTilt) {
              const dx = x - lastTilt.x
              const dy = y - lastTilt.y
              const distance = Math.hypot(dx, dy)
              // About 1.3 degrees of tilt must accumulate before redirecting the coast.
              if (distance >= 0.08) {
                targetSpinX = dy / distance
                targetSpinY = -dx / distance
                targetSpinZ = 0
                lastTilt = { x, y }
              }
            } else lastTilt = { x, y }
            mx = x
            my = y
          },
        )
      }
      window.addEventListener('pointermove', pointer, { passive: true })
      window.addEventListener('resize', wake, { passive: true })
      window.addEventListener('scroll', wake, { passive: true })
      document.addEventListener('visibilitychange', wake)
      reduced.addEventListener('change', wake)
      canvas.dataset.renderer = 'vgpu'
      wake()
    } catch (error) {
      fail(error)
    }
  } catch (error) {
    dispose()
    throw error
  }
}
