/**
 * THE CLIP A BLEEDING TRACK NEEDS, for the band that hosts one.
 *
 * `CarouselTrack`'s viewport reaches the right edge of the screen in `vw`, and
 * `100vw` counts the classic scrollbar the layout viewport does not have. On a
 * platform that draws one the track therefore overshoots by half its width and
 * pushes the page sideways. Clipping at the band is what absorbs it —
 * `LayoutSection` pairs its own bleeding column with the same clip for the same
 * reason.
 *
 * Every band that renders a `CarouselTrack` hands this to its `SectionShell`.
 *
 * ITS OWN MODULE, AND THAT IS NOT TIDINESS. `CarouselTrack` is a `'use client'`
 * module, and every export of one reaches a server component as a client
 * reference rather than as its value — a string constant exported from there
 * arrives at `cn()` as an object, contributes no class, and fails silently.
 * A plain module is the only place a server component can read a constant from.
 */
export const CAROUSEL_BAND_CLASS = 'overflow-hidden'
