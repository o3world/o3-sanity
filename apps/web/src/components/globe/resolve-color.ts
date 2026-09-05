/** Resolve token-derived colors in the actual globe element's style context. */
export function resolveColor(value: string, host: HTMLElement): string {
  const probe = document.createElement('span')
  probe.style.color = value
  host.append(probe)
  const color = getComputedStyle(probe).color
  probe.remove()
  const ctx = document.createElement('canvas').getContext('2d')!
  ctx.fillStyle = color
  ctx.fillRect(0, 0, 1, 1)
  const bytes = ctx.getImageData(0, 0, 1, 1).data
  return (
    '#' +
    [...bytes]
      .slice(0, 3)
      .map((v) => v.toString(16).padStart(2, '0'))
      .join('')
  )
}
