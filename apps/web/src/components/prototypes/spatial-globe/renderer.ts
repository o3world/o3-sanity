/// <reference types="@webgpu/types" />
import { draw, frame, init, surface } from 'vgpu'
import { buildArcs, rgb } from './geometry'
import { dotShader, orbitShader, shootingStarShader, starsShader } from './shaders'

export async function startSpatialGlobe(
  canvas: HTMLCanvasElement,
  hero: HTMLElement,
  globe: HTMLElement,
  signal: AbortSignal,
) {
  const gpu = await init({ powerPreference: 'low-power' })
  if (signal.aborted) {
    gpu.dispose()
    return
  }
  const target = surface(gpu, canvas, { dpr: [1, 2], alphaMode: 'premultiplied' })
  const arcs = buildArcs()
  const rings = arcs.map(() =>
    draw(gpu, { shader: orbitShader, vertices: 288 * 6, blend: 'alpha' }),
  )
  const electrons = arcs.map((arc) =>
    arc.dots.map(() => draw(gpu, { shader: dotShader, vertices: 6, blend: 'alpha' })),
  )
  const stars = draw(gpu, {
    shader: starsShader,
    vertices: 6,
    instances: 4000,
    blend: 'alpha',
  })
  const shootingStar = draw(gpu, { shader: shootingStarShader, vertices: 6, blend: 'alpha' })
  const previewShootingStar = new URLSearchParams(location.search).has('shooting-star-preview')
  let raf = 0
  let dead = false
  let visible = true
  let previous: number | undefined
  let elapsed = 0
  let skyRise = 0
  let mx = 0,
    my = 0,
    sx = 0,
    sy = 0
  const reduced = matchMedia('(prefers-reduced-motion: reduce)')
  const forcedStill = new URLSearchParams(location.search).has('spatial-still')
  const isStill = () => forcedStill || reduced.matches
  const phases = arcs.map((arc) => arc.dots.map((dot) => dot.t))
  const cleanup = () => {
    if (dead) return
    dead = true
    cancelAnimationFrame(raf)
    observer.disconnect()
    window.removeEventListener('pointermove', pointer)
    window.removeEventListener('resize', wake)
    window.removeEventListener('scroll', wake)
    document.removeEventListener('visibilitychange', wake)
    reduced.removeEventListener('change', wake)
    hero.style.removeProperty('--spatial-sky-overhang')
    delete hero.dataset.spatialReady
    delete document.documentElement.dataset.spatialChrome
    document.documentElement.style.removeProperty('--spatial-nav-solid')
    delete hero.dataset.spatialStill
    canvas.style.opacity = '0'
    gpu.dispose()
  }
  const fail = (error: unknown) => {
    if (dead) return
    console.warn(
      `Original globe · GPU unavailable (${error instanceof Error ? error.message : String(error)})`,
    )
    cleanup()
  }
  const pointer = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse' || isStill()) return
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
    const overhang = Math.max(0, heroBounds.top + scrollY)
    hero.style.setProperty('--spatial-sky-overhang', `${overhang}px`)
    canvas.style.top = `-${overhang}px`
    canvas.style.height = `calc(100% + ${overhang}px)`
    const h = canvas.getBoundingClientRect()
    const g = globe.getBoundingClientRect()
    const viewport = [h.width, h.height, 0, 0]
    const geometry = [g.left - h.left + g.width / 2, g.top - h.top + g.height / 2, g.width / 680, 0]
    const scrollOrbit = isStill() ? 0 : Math.min(1, Math.max(0, scrollY / heroBounds.height)) * 0.08
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
    const targetSkyRise = Math.min(heroBounds.height, Math.max(0, -heroBounds.top)) * 0.12
    skyRise = isStill() ? 0 : skyRise + (targetSkyRise - skyRise) * (1 - 0.94 ** (dt * 30))
    const skyViewport = [h.width, h.height, skyRise, 0]
    const skyMotion = [isStill() ? 0 : elapsed, -sx * 0.045, sy * 0.032, 0]
    stars.set({
      p: { viewport: skyViewport, motion: skyMotion, globe: geometry },
    })
    shootingStar.set({
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
      rings[i]!.set({ p: { ...shared, color: [...rgb(arc.col), arc.op * pulse] } })
      arc.dots.forEach((dot, j) =>
        electrons[i]![j]!.set({
          p: {
            ...shared,
            color: [...rgb(dot.col), pulse],
            dot: [isStill() ? dot.t : phases[i]![j], dot.r, Number(dot.glow), 0],
          },
        }),
      )
    })
    try {
      frame(gpu, (f) =>
        f.pass({ target, clear: [0, 0, 0, 0] }, (pass) => {
          pass.draw(stars)
          if (!isStill()) pass.draw(shootingStar)
          rings.forEach((ring) => pass.draw(ring))
          electrons.forEach((orbit) => orbit.forEach((dot) => pass.draw(dot)))
        }),
      )
      hero.dataset.spatialReady = 'true'
      document.documentElement.dataset.spatialChrome = 'true'
      const mobile = innerWidth < 1024
      document.documentElement.style.setProperty(
        '--spatial-nav-solid',
        String(Math.min(1, Math.max(0, (scrollY - (mobile ? 30 : 100)) / (mobile ? 130 : 240)))),
      )
      canvas.style.opacity = '1'
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
      [...rings, ...electrons.flat(), stars, shootingStar].map((item) =>
        item.compile({ colors: [navigator.gpu.getPreferredCanvasFormat()], sampleCount: 1 }),
      ),
    )
    if (signal.aborted || dead) {
      cleanup()
      return
    }
    observer.observe(hero)
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
}
