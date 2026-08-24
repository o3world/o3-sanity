/**
 * The 48/58 → 64/76 statement step, solved across the two frame widths the way
 * the ramp's own clamps are (ADR 0006).
 *
 * No token spans that pair: `display-xl` caps at 48 and `hero` floors at 36.
 * Both of this band's redrawn compositions set it — the rail header
 * (`2975:8190` → `2747:4488`) and the track's column heading (`2975:8355` →
 * `2846:5480`) — so it is one string rather than two that have to agree.
 *
 * Tracking rides along: 0 at 402, −1px at 1440.
 */
export const STATEMENT_STEP =
  'text-[clamp(48px,calc(1.541vw_+_41.8px),64px)] font-light leading-[clamp(58px,calc(1.734vw_+_51.03px),76px)] tracking-[clamp(-1px,calc(0.387px_-_0.096vw),0px)]'
