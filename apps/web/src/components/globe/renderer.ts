/// <reference types="@webgpu/types" />
import { frame, surface, target as offscreenTarget, type Draw, type FramePass } from 'vgpu'
import type { OrbitalRendererProps } from '@o3/ui'
import { resolveColor } from './resolve-color'
import { nestedOrbitBasis, nestedOrbitRadii } from './nested-orbits'
import { createGlobeParallax } from './globe-parallax'
import { createGlobeEntrance, readSkyEntranceOffset } from './globe-entrance'
import { startPhoneTilt } from './phone-tilt'
import { createSkyHandoff } from './sky-handoff'
import type { GlobeRuntime } from './globe-runtime'
import type { SpatialMotion } from './spatial-motion'

export function drawGlobeGeometry(
  pass: Pick<FramePass, 'draw'>,
  geometry: { rings: Draw[]; electrons: Draw[][]; rim: Draw },
) {
  // Every solid surface writes its own color and depth in the same pass.
  geometry.rings.forEach((ring) => pass.draw(ring))
  geometry.electrons.forEach((orbit) => orbit.forEach((dot) => pass.draw(dot)))
  pass.draw(geometry.rim)
}

export async function startSpatialGlobe(
  canvas: HTMLCanvasElement,
  hero: HTMLElement,
  globe: HTMLElement,
  signal: AbortSignal,
  runtime: GlobeRuntime,
  options: Pick<
    OrbitalRendererProps,
    'arcs' | 'motion' | 'preset' | 'opacity' | 'electronOpacity' | 'onReady'
  > & {
    stars: boolean
    entrance?: boolean
    quietStars?: boolean
    spatialMotion?: SpatialMotion
  },
) {
  const heroStars = options.stars && !options.quietStars
  const depthScrollSky =
    heroStars &&
    process.env.NODE_ENV === 'development' &&
    process.env.NEXT_PUBLIC_WORK_MEMBRANE_STUDY === '1' &&
    new URLSearchParams(location.search).get('workMembrane') === 'on'
  const footerStars = options.stars && !!options.quietStars && hero.matches('.cta-band')
  const skyResponse = footerStars ? 0.5 : options.quietStars ? 0.2 : 1
  const lease = await runtime.acquire()
  const { gpu } = lease
  if (signal.aborted) {
    lease.release()
    return
  }
  let dispose = () => lease.release()
  try {
    const target = surface(gpu, canvas, {
      dpr: [1.5, 2],
      alphaMode: 'premultiplied',
    })
    const release = () => {
      target.dispose()
      lease.release()
    }
    dispose = release
    const scene = offscreenTarget(gpu, {
      size: target.size,
      format: target.format,
      depth: 'depth24plus',
      msaa: 4,
    }) as ReturnType<typeof offscreenTarget> & { destroy(): void }
    const releaseScene = () => {
      scene.destroy()
      release()
    }
    dispose = releaseScene
    const composite = lease.draw(footerStars ? 'cachedComposite' : 'composite')
    const colors = new Map<string, string>()
    const colorOf = (value: string) => {
      let color = colors.get(value)
      if (!color) {
        color = resolveColor(value, globe)
        colors.set(value, color)
      }
      return color
    }
    const radii = nestedOrbitRadii(options.arcs)
    const arcs = options.arcs.map((arc, i) => {
      const { u, v } = nestedOrbitBasis(i)
      return {
        ...arc,
        u: u.map((value) => (value * radii[i]!) / 340),
        v: v.map((value) => (value * radii[i]!) / 340),
        col: colorOf(options.preset === 'hero' && i % 2 === 0 ? 'var(--color-brand)' : arc.col),
        dots: arc.dots.map((dot) => ({
          ...dot,
          col: colorOf(dot.col),
        })),
      }
    })
    const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    const dotGround =
      options.preset === 'line'
        ? [...rgb(colorOf(getComputedStyle(globe.closest('section') ?? hero).backgroundColor)), 1]
        : [0, 0, 0, 0]
    const rings: Draw[] = []
    const electrons: Draw[][] = []
    let setupStarted = performance.now()
    const yieldSetup = async () => {
      if (performance.now() - setupStarted < 4) return
      await new Promise<void>((resolve) => setTimeout(resolve, 0))
      signal.throwIfAborted()
      setupStarted = performance.now()
    }
    // Footer shader reflection must leave time for scrolling during its viewport warm-up.
    for (const arc of arcs) {
      rings.push(lease.draw('orbit'))
      if (footerStars) await yieldSetup()
      const dots: Draw[] = []
      for (let index = 0; index < arc.dots.length; index++) {
        dots.push(lease.draw('dot'))
        if (footerStars) await yieldSetup()
      }
      electrons.push(dots)
    }
    const rim = lease.draw('orbit')
    const rimColor = rgb(options.preset === 'line' ? colorOf('var(--color-ink)') : '#e9edf5')
    const heatHaze = options.preset === 'hero' ? lease.draw('heatHaze') : undefined
    const stars = options.stars
      ? lease.draw(options.quietStars ? 'quietStars' : 'stars')
      : undefined
    const shootingStar = heroStars ? lease.draw('shootingStar') : undefined
    const previewShootingStar = new URLSearchParams(location.search).has('shooting-star-preview')
    let parallax: ReturnType<typeof createGlobeParallax> | undefined
    let entrance: ReturnType<typeof createGlobeEntrance> | undefined
    const startupSky = heroStars
      ? globe.querySelector<HTMLCanvasElement>('[data-orbital-startup]')
      : null
    let stopTilt: (() => void) | undefined
    let raf = 0
    let dead = false
    let ready = false
    let firstFramePending = false
    let cachedGeometry: number[] | undefined
    let cachedSkyMode: 'moving' | 'paused' | 'still' | undefined
    const skyHandoff = heroStars ? createSkyHandoff() : undefined
    let visible = true
    let previous: number | undefined
    let elapsed = 0
    let skyRise = 0
    let skyScrollY = 0
    let skyEntranceDistance: number | undefined
    let skyState: { elapsed: number; step: number; mix: number } | undefined
    let cameraOffset = 0
    let skyCameraOffset = 0
    let scrollOrbit = 0
    let motionSampled = false
    let mx = 0,
      my = 0,
      sx = 0,
      sy = 0
    const spinRate = (Math.PI * 2) / (footerStars ? 1800 : options.quietStars ? 3600 : 900)
    let spinX = 0.16 / Math.hypot(0.16, 1, 0.08),
      spinY = 1 / Math.hypot(0.16, 1, 0.08),
      spinZ = 0.08 / Math.hypot(0.16, 1, 0.08)
    let targetSpinX = spinX,
      targetSpinY = spinY,
      targetSpinZ = spinZ
    let rotation = [0, 0, 0, 1]
    let lastPointer: { x: number; y: number } | undefined
    const reduced = matchMedia('(prefers-reduced-motion: reduce)')
    let forcedStill = new URLSearchParams(location.search).has('spatial-still')
    const isMobileFooter = () => footerStars && innerWidth < 1024
    const motionRestricted = () => options.motion === 'still' || forcedStill || reduced.matches
    const isStill = () => isMobileFooter() || motionRestricted()
    const isPaused = () => !motionRestricted() && !!options.spatialMotion?.getSnapshot()
    const sceneTime = (now: number) => options.spatialMotion?.now(now) ?? now
    let unsubscribeMotion: (() => void) | undefined
    const phases = arcs.map((arc) => arc.dots.map((dot) => dot.t))
    const cleanup = () => {
      if (dead) return
      dead = true
      signal.removeEventListener('abort', cleanup)
      cancelAnimationFrame(raf)
      parallax?.dispose()
      entrance?.dispose()
      stopTilt?.()
      observer.disconnect()
      resizeObserver.disconnect()
      window.removeEventListener('pointermove', pointer)
      window.removeEventListener('resize', wake)
      window.removeEventListener('scroll', wake)
      document.removeEventListener('visibilitychange', wake)
      reduced.removeEventListener('change', wake)
      unsubscribeMotion?.()
      if (ready) options.onReady(false)
      if (heroStars) hero.style.removeProperty('--spatial-sky-overhang')
      delete hero.dataset.spatialReady
      if (heroStars) delete document.documentElement.dataset.spatialChrome
      if (heroStars) document.documentElement.style.removeProperty('--spatial-nav-solid')
      delete hero.dataset.spatialStill
      canvas.style.opacity = '0'
      releaseScene()
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
      if (event.pointerType !== 'mouse' || isStill() || isPaused()) return
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
      if (heroStars) {
        const mobile = innerWidth < 1024
        document.documentElement.style.setProperty(
          '--spatial-nav-solid',
          String(Math.min(1, Math.max(0, (scrollY - (mobile ? 30 : 100)) / (mobile ? 130 : 240)))),
        )
      }
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
    const tick = (timestamp: number) => {
      raf = 0
      if (dead || signal.aborted) return
      if (!visible || document.hidden) {
        previous = undefined
        return
      }
      const separateStars = isMobileFooter()
      const movingSky = !motionRestricted()
      const skyMode = movingSky ? (isPaused() ? 'paused' : 'moving') : 'still'
      const now = sceneTime(timestamp)
      if (isStill()) hero.dataset.spatialStill = 'true'
      else delete hero.dataset.spatialStill
      const dt = isPaused() ? 0 : previous === undefined ? 1 / 30 : (now - previous) / 1000
      previous = now
      const sampleMotion = !isPaused() || !motionSampled
      if (sampleMotion) skyState = skyHandoff?.sample(now, dt, isStill())
      const sky = skyState
      const skyStep = isPaused() ? 0 : (sky?.step ?? dt)
      const skyMix = sky?.mix ?? 1
      if (movingSky && !isPaused()) {
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
          const halfAngle = (spinRate * magnitude * skyStep) / 2
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
      } else if (isStill()) {
        sx = 0
        sy = 0
      }
      const heroBounds = hero.getBoundingClientRect()
      if (sampleMotion)
        parallax?.update(heroBounds, document.documentElement.clientHeight, dt, isStill())
      // A late GPU frame joins the same sky path, rather than scaling it to
      // the globe's remaining travel after the text has already started.
      skyEntranceDistance ??=
        (innerWidth < 1024
          ? 48
          : Math.max(96, heroBounds.bottom - globe.getBoundingClientRect().top)) * 1.15
      if (sampleMotion) {
        cameraOffset = entrance?.update(now, isStill()) ?? 0
        skyCameraOffset =
          entrance && !isStill() && (depthScrollSky || heroBounds.top >= -80)
            ? readSkyEntranceOffset(hero, now, skyEntranceDistance)
            : 0
        scrollOrbit =
          isStill() || !heroStars ? 0 : Math.min(1, Math.max(0, scrollY / heroBounds.height)) * 0.08
      }
      motionSampled = true
      const overhang = heroStars ? Math.max(0, heroBounds.top + scrollY) : 0
      if (heroStars) {
        hero.style.setProperty('--spatial-sky-overhang', `${overhang}px`)
        canvas.style.top = `-${overhang}px`
        canvas.style.height = `calc(100% + ${overhang}px)`
      }
      const h = canvas.getBoundingClientRect()
      const g = globe.getBoundingClientRect()
      // Cancel this frame's bloom translation while the startup sky crossfades.
      if (startupSky?.hasAttribute('data-painted')) {
        startupSky.style.left = `${heroBounds.left - g.left}px`
        startupSky.style.top = `${heroBounds.top - overhang - g.top}px`
      }
      const viewport = [h.width, h.height, 0, 0]
      const geometry = [
        g.left - h.left + g.width / 2,
        g.top - cameraOffset - h.top + g.height / 2,
        g.width / 680,
        options.electronOpacity,
      ]
      // Scrolling moves the cached mobile footer with the page; only geometry changes need GPU work.
      let redrawGlobe = true
      if (isMobileFooter()) {
        const nextGeometry = [h.width, h.height, ...geometry, ...target.size]
        redrawGlobe = !cachedGeometry?.every(
          (value, i) => Math.abs(value - nextGeometry[i]!) < 0.01,
        )
        if (!redrawGlobe && skyMode !== 'moving' && skyMode === cachedSkyMode) return
        cachedGeometry = nextGeometry
      } else cachedGeometry = undefined
      // The DOM translation only keeps the SVG bloom with the camera projection.
      // Geometry follows the text; the sky starts its independent descent with the nav.
      const camera = [0, -cameraOffset / geometry[2]!, 0, 0]
      const skyCamera = [0, -skyCameraOffset / geometry[2]!, 0, 0]
      const motion = [
        isStill() ? 0 : elapsed,
        -sx * 0.045,
        sy * 0.032 + scrollOrbit,
        Number(!isStill()),
      ]
      const params = {
        viewport,
        camera,
        globe: geometry,
        motion,
        u: [0, 0, 0, 0],
        v: [0, 0, 0, 0],
        color: [1, 1, 1, 1],
        dot: [0, 0, 0, Number(options.preset === 'hero')],
        dotGround,
      }
      const targetSkyRise =
        Math.min(heroBounds.height, Math.max(0, -heroBounds.top)) *
        (footerStars ? 0.0075 : options.quietStars ? 0 : 0.015)
      skyRise = isStill()
        ? 0
        : skyRise + (targetSkyRise * skyMix - skyRise) * (1 - 0.94 ** (skyStep * 30))
      if (depthScrollSky) {
        const travel = Math.min(heroBounds.height, Math.max(0, -heroBounds.top)) * 0.8
        skyScrollY = isStill()
          ? 0
          : skyScrollY + (travel * skyMix - skyScrollY) * (1 - Math.exp(-skyStep * 5))
        skyCamera[1] = skyCamera[1]! + skyScrollY
      }
      const skyViewport = [
        h.width,
        h.height,
        depthScrollSky ? 0 : skyRise,
        Number(options.quietStars),
      ]
      const skyMotion = [
        movingSky ? (sky?.elapsed ?? elapsed) : 0,
        -sx * 0.045 * skyResponse * skyMix,
        sy * 0.032 * skyResponse * skyMix,
        Number(footerStars),
      ]
      stars?.set({
        p: {
          viewport: skyViewport,
          camera: skyCamera,
          motion: skyMotion,
          globe: geometry,
          rotation: movingSky ? rotation : [0, 0, 0, 1],
        },
      })
      shootingStar?.set({
        p: {
          viewport: skyViewport,
          camera: skyCamera,
          globe: geometry,
          motion: [...skyMotion.slice(0, 3), Number(previewShootingStar)],
        },
      })
      if (redrawGlobe) {
        heatHaze?.set({ p: params })
        rim.set({
          p: {
            ...params,
            u: [0, 0, 0, 1.43],
            color: [...rimColor, options.preset === 'line' ? 0.2415 : 0.575],
            dot: [0, 0, 2, params.dot[3]],
          },
        })
        arcs.forEach((arc, i) => {
          // Keep the export's slow colored-orbit breathing.
          const phase = Math.max(0, elapsed - arc.i * 1.1) / ((4.2 + arc.i * 0.7) / 0.3)
          const pulse =
            arc.colored && !isStill() ? 0.725 + 0.275 * Math.cos(phase * Math.PI * 2) : 1
          const shared = {
            ...params,
            u: [...arc.u, arc.w],
            v: [...arc.v, arc.op],
          }
          const ringParams = {
            p: {
              ...shared,
              color: [...rgb(arc.col), arc.op * pulse],
            },
          }
          rings[i]!.set(ringParams)
          arc.dots.forEach((dot, j) => {
            const dotParams = {
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
            }
            electrons[i]![j]!.set(dotParams)
          })
        })
      }
      try {
        const submitted = frame(gpu, (f) => {
          if (redrawGlobe) {
            scene.resize(target.size)
            f.pass({ target: scene, clear: [0, 0, 0, 0] }, (pass) => {
              if (stars && !separateStars) {
                pass.draw(stars)
                if (shootingStar && !isStill()) pass.draw(shootingStar)
              }
              if (heatHaze && !isStill()) pass.draw(heatHaze)
              drawGlobeGeometry(pass, { rings, electrons, rim })
            })
          }
          composite.set({ scene: scene.color })
          f.pass({ target, clear: [0, 0, 0, 0] }, (pass) => {
            if (separateStars && stars) pass.draw(stars)
            pass.draw(composite)
          })
        })
        if (!ready && !firstFramePending) {
          firstFramePending = true
          void submitted.done
            .then(() => {
              if (dead || signal.aborted) return
              ready = true
              hero.dataset.spatialReady = 'true'
              if (heroStars) document.documentElement.dataset.spatialChrome = 'true'
              canvas.style.opacity = String(options.opacity)
              const fadeDuration =
                parseFloat(getComputedStyle(canvas).transitionDuration) * 1000 || 0
              skyHandoff?.reveal(sceneTime(performance.now()), fadeDuration)
              options.onReady(true)
            })
            .catch(fail)
        }
        cachedSkyMode = skyMode
        canvas.dataset.frame = String(Math.round(elapsed * 1000))
        if (movingSky && !isPaused()) raf = requestAnimationFrame(tick)
      } catch (error) {
        fail(error)
      }
    }
    lease.onError(fail)
    signal.addEventListener('abort', cleanup, { once: true })
    try {
      if (signal.aborted || dead) {
        cleanup()
        return
      }
      const parallaxLayer = globe.closest<HTMLElement>('.hero-lag, .cta-lag')
      if (heroStars && options.entrance) entrance = createGlobeEntrance(globe, hero)
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
        stopTilt = startPhoneTilt(
          canvas,
          () => visible && !document.hidden && !isStill() && !isPaused(),
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
      unsubscribeMotion = options.spatialMotion?.subscribe(() => {
        forcedStill = new URLSearchParams(location.search).has('spatial-still')
        // Cancel only the frame callback; retain the surface, draws and every phase.
        cancelAnimationFrame(raf)
        raf = 0
        previous = undefined
        lastPointer = undefined
        wake()
      })
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
