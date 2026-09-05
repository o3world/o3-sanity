/** Keeps the SVG bloom and GPU geometry on the same animation frame. */
export function createGlobeParallax(layer: HTMLElement, range: 'hero' | 'cta') {
  const saved = ['animation', 'translate'].map((name) => ({
    name,
    value: layer.style.getPropertyValue(name),
    priority: layer.style.getPropertyPriority(name),
  }))
  layer.style.setProperty('animation', 'none')
  let position: number | undefined
  return {
    update(
      bounds: { top: number; height: number },
      viewportHeight: number,
      dt: number,
      still: boolean,
    ) {
      // Retain each placement's CSS timeline and units, including mobile's stable vh.
      const progress = Math.max(
        0,
        Math.min(
          1,
          range === 'hero'
            ? -bounds.top / bounds.height
            : (viewportHeight - bounds.top) / (viewportHeight + bounds.height),
        ),
      )
      const target = range === 'hero' ? progress * 12 : (progress * 0.2 - 0.1) * bounds.height
      if (still) position = 0
      else if (position === undefined) position = target
      else position += (target - position) * (1 - 0.94 ** (Math.min(dt, 1 / 20) * 30))
      layer.style.setProperty('translate', `0 ${position}${range === 'hero' ? 'vh' : 'px'}`)
      return position
    },
    dispose() {
      for (const { name, value, priority } of saved) {
        if (value) layer.style.setProperty(name, value, priority)
        else layer.style.removeProperty(name)
      }
    },
  }
}
