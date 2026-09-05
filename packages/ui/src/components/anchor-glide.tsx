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
 * Native history restores scroll after popstate. Leave smoothing off for that
 * restoration, before the router handles the event, then re-arm on the next
 * frame. Otherwise the saved position animates through the arriving page and
 * the navigation samples a transient ground (#445). This changes no position
 * or history entry; native restoration still owns both.
 *
 * An inline script rather than an effect: hydration lands before `load` on an
 * image-heavy page, so an effect would arm the glide inside the window the gate
 * exists to cover.
 */
const ARM_AFTER_LOAD = `(function(){
  var root=document.documentElement;
  var restore=0;
  var arm=function(){root.setAttribute('data-anchor-glide','')};
  if(document.readyState==='complete'){arm()}else{addEventListener('load',arm,{once:true})}
  addEventListener('popstate',function(){
    if(!root.hasAttribute('data-anchor-glide')&&!restore)return;
    root.removeAttribute('data-anchor-glide');
    void getComputedStyle(root).scrollBehavior;
    cancelAnimationFrame(restore);
    restore=requestAnimationFrame(function(){restore=0;arm()});
  },true);
})()`

export function AnchorGlide() {
  return <script dangerouslySetInnerHTML={{ __html: ARM_AFTER_LOAD }} />
}

/** The script's body, exported so its behaviour can be run in a test. */
export const ANCHOR_GLIDE_SCRIPT = ARM_AFTER_LOAD
