/**
 * The document's smooth-scroll switch, thrown after the browser has finished
 * with the URL's own fragment.
 *
 * `tokens/base.css` gates `html { scroll-behavior: smooth }` behind
 * `[data-anchor-glide]` and this is the only thing that sets it. The gate
 * exists because Chrome's load-time scroll to a `#fragment` inherits the root's
 * scroll-behavior: a smooth root turns it into an animation, and an animation
 * that starts while the page is still laying itself out is cancelled and never
 * retried — the reader arrives at the top of the page instead of at the band
 * they were linked to (#156). Instant on arrival, smooth thereafter, so a
 * pasted deep link lands and an in-page jump link still glides.
 *
 * An inline script rather than an effect: hydration lands before `load` on an
 * image-heavy page, so an effect would arm the glide inside the window the gate
 * exists to cover.
 */
const ARM_AFTER_LOAD = `(function(){var a=function(){document.documentElement.setAttribute('data-anchor-glide','')};if(document.readyState==='complete'){a()}else{addEventListener('load',a,{once:true})}})()`

export function AnchorGlide() {
  return <script dangerouslySetInnerHTML={{ __html: ARM_AFTER_LOAD }} />
}

/** The script's body, exported so its behaviour can be run in a test. */
export const ANCHOR_GLIDE_SCRIPT = ARM_AFTER_LOAD
