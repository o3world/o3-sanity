/**
 * Stopping the clock, in the two documents a capture contains.
 *
 * Animations and transitions are collapsed rather than paused: an animation
 * left running is the single biggest source of false diffs, and one left
 * *paused* still lands wherever the scheduler happened to stop it. Collapsed,
 * every run screenshots the same end state — which for every animation in this
 * codebase is also the state its `prefers-reduced-motion` branch asks for.
 */
const FREEZE_RULES = `
*, *::before, *::after {
  animation-delay: -1ms !important;
  animation-duration: 1ms !important;
  animation-iteration-count: 1 !important;
  transition-duration: 1ms !important;
  transition-delay: 0s !important;
}
`

const PAGE_RULES = `${FREEZE_RULES}
*, *::before, *::after { caret-color: transparent !important; }
html { scroll-behavior: auto !important; }
`

/** Injected before the first byte of the story renders. */
export const FREEZE_SCRIPT = `
  const style = document.createElement('style')
  style.textContent = ${JSON.stringify(PAGE_RULES)}
  const attach = () => (document.head ?? document.documentElement).appendChild(style)
  if (document.documentElement) attach()
  else document.addEventListener('readystatechange', attach, { once: true })
`

/**
 * The same freeze, written into an SVG served to an `<img>`.
 *
 * An SVG loaded as an image is its own document. The page's init script cannot
 * reach it, `prefers-reduced-motion` emulation does not carry into it, and
 * Playwright's `animations: 'disabled'` stops at the page boundary too — so the
 * one decorative rail illustration on the homepage, which carries four CSS
 * keyframe animations of its own, rasterised at a different phase in all six of
 * six captures. Rewriting the bytes on the way to the browser is the only seam
 * that reaches inside.
 *
 * Appended last and marked `!important`, so it does not matter where the
 * asset's own `<style>` sits. A body with no closing tag is returned untouched.
 */
export function freezeSvg(body: string): string {
  const close = body.lastIndexOf('</svg>')
  if (close === -1) return body
  return `${body.slice(0, close)}<style>${FREEZE_RULES}</style>${body.slice(close)}`
}
