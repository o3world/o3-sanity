/** Wait for a displayed globe near the viewport; release it if CSS hides it. */
export function observeGlobeAvailability(
  host: HTMLElement,
  region: Element,
  onChange: (available: boolean) => void,
): () => void {
  let nearby = false
  let available = false
  const update = () => {
    const bounds = host.getBoundingClientRect()
    // Once initialized, scrolling only pauses drawing; it must not reset the scene.
    const next = bounds.width > 0 && bounds.height > 0 && (nearby || available)
    if (next === available) return
    available = next
    onChange(next)
  }
  const intersection = new IntersectionObserver(
    ([entry]) => {
      nearby = entry?.isIntersecting ?? false
      update()
    },
    { rootMargin: '100px' },
  )
  const resize = new ResizeObserver(update)
  intersection.observe(region)
  resize.observe(host)
  return () => {
    intersection.disconnect()
    resize.disconnect()
  }
}
