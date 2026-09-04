# 0030. Route arrival animates live content

- **Status:** Accepted for trial
- **Date:** 2026-09-04
- **Deciders:** Josh + Codex
- **Related:** [#428 — executable page-navigation motion](https://github.com/o3world/o3-sanity/issues/428), [#425 — site motion system](https://github.com/o3world/o3-sanity/issues/425), [ADR 0004](0004-layered-test-approach.md)

## Context

The O3 site used React View Transitions for a 300ms captured page crossfade. The arriving page was
ready while a stationary-pointer click on its navigation could still be lost. Baseline production
artifacts from `14ac3bc9` reproduced the failure; browser experiments reproduced it in Chromium,
Playwright WebKit, and Firefox. This is a mismatch with snapshot semantics, not evidence that all
three engines have an implementation defect: [CSS View Transitions Level 1](https://drafts.csswg.org/css-view-transitions-1/#view-transition-pseudo)
excludes captured elements and descendants from hit testing during animation.

Removing pointer events from the overlay did not restore the captured navigation. Cancelling on
pointer movement helped a moving pointer, but a stationary down/up still lost its click. Cancelling
on pointerover also cancelled in response to capture itself. Forwarding a synthetic click, cloning
old content, and taking ownership of App Router state were rejected.

Josh approved trying a live arrival fade, superseding the crossfade prescription for this route
contract. Immediately usable content and navigation take priority over preserving two snapshots.

The first trial faded `main`, including its ink ground, over the white document body. Work to
Insights visibly lightened despite both heroes being dark. A production screenshot regression on
`6a42fd37` measured the same gutter pixel at `[32,32,33]` during arrival and `[10,10,11]` settled.
Josh approved a foreground-only trial: authored section backgrounds must remain solid.

## Decision

The O3 site's persistent layout keeps complete server-rendered `main` content and live navigation
as siblings. A null client component observes committed `usePathname` changes behind its own
Suspense boundary, so unknown dynamic parameters cannot block the shell's prerender.

On a pathname change, a layout effect animates eligible live foregrounds from opacity 0.72 to 1 using
`--duration-page` (300ms) and `--ease-out`. It does not animate initial hydration, query/hash changes,
or repeated navigation to the same path. Opacity never gates content readiness or hit testing.
There is no exit phase, geometry change, artificial delay, or animation-owned navigation state.

The destination's nav skin settles in that same layout effect, before the fade and before the
reduced-motion/API guards. The existing pin writer reads the current browser scroll position,
then the existing ground sampler selects the skin. A header-scoped stylesheet disables nav and
descendant transitions for one forced style pass and is removed synchronously. Scroll-driven
surface changes retain the existing 350ms color transition; links and the CTA retain their hover
cadence. This follows the pre-hydration script's instantaneous-paint technique without serializing
a client closure into that script. Neither path takes ownership of scrolling or router state.

Existing transparent containers explicitly opt in with `data-route-foreground`: CollectionHero,
CaseStudyHero, SectionShell's content slot, the orbital hero's copy column, and InsightView's hero
and article body. Section fills, background slots, separately layered hero artwork and scrims, and
`main` stay outside those targets. Artwork placed inside a content slot (such as a foreground
MoleculeDecoration) arrives with that content; this trial does not move it to another layer.
The annotation has no behavior outside O3's route observer. There is no surface inference or
route-color table. Custom bands and feed-only views without a marker retain ordinary paint and
their existing scroll reveals; streamed content absent at commit does not get a delayed arrival.

Only foregrounds intersecting the viewport at commit are eligible. Hidden retained trees are
excluded, nested markers select the innermost foreground, and an existing active opacity animation
on an ancestor or descendant keeps ownership. In particular, the home hero's CSS entrances,
including their delays, are not suppressed or stacked with another fade. A cached foreground with
no active entrance can use the route cadence. The observer neither changes those CSS animations
nor wraps Reveal's inner content, which could contain another band's ground.

The effect owns the selected Web Animations and one reduced-motion subscription. A new route or
unmount cancels them. Enabling reduced motion during a fade cancels them immediately. Reduced
motion and missing `Element.animate` or `Element.getAnimations` produce ordinary navigation; no inline opacity or forwards
fill remains after completion or cancellation. Existing Link prefetch, history, scrolling, focus,
and Next's retained route trees remain framework-owned.

Only O3's captured route boundary is removed. Shared View Transition styles and nav sampling stay
available for existing consumers. No retired-app-specific code or tooling is changed; the shared
menu repairs below carry through mechanically.

The production journey also exposed existing menu dependencies. All menu destinations dismiss its
portal immediately on Next `onNavigate`, so client navigation ends modal ownership without
closing it for modified clicks or offsite links. The contact CTA passes that callback through
`ButtonLink` without changing the control or external-link arms. A three-state menu distinguishes
open, manually closed, and navigation-dismissed: manual closure keeps the exit cadence, while
navigation cannot leave a retained dismissable layer over the arriving page. Reopening restores
the ordinary menu lifecycle. Pointer CSS overrides were rejected after a real touch reached the
trigger but the retained modal's dismissal immediately closed it again.
Reduced-motion sheet exits retain their animation name with zero duration: Radix Presence needs
that name to finish an exit when the preference changes while it is running. These are scoped
repairs to keep route navigation free of orphaned modals, not a new menu runtime.

## Alternatives and consequences

- **Captured crossfade:** preserves visual overlap, but fails the required immediate input contract
  for captured participants. Keeping it would need a larger architecture decision.
- **No route motion:** remains the fallback. The live fade adds a small arrival cue without changing
  the navigation mechanism.
- **Whole-main opacity:** rejected after the rendered trial exposed background flashing. One dark
  backing color would instead wash light pages, and one hero-color backing cannot preserve mixed
  bands. Foreground-only opacity keeps the actual authored grounds painted throughout.
- **Foreground arrival:** loses old/new overlap deliberately and creates temporary stacking contexts
  only on selected content containers. Nav/footer remain outside. Existing active entrances win;
  this is not a replacement for the separate scroll-motion audit.

Basic [Element.animate](https://developer.mozilla.org/en-US/docs/Web/API/Element/animate) predates
the installed [Next browser floor](https://nextjs.org/docs/architecture/supported-browsers)
(Chrome/Edge 111+, Firefox 111+, Safari 16.4+). Feature detection
avoids raising that floor. Tests use current Chromium, Firefox, and Playwright's patched WebKit,
not branded Safari or every historical version; physical-device and oldest-supported-version
checks remain release evidence to collect, not claims made by this matrix. The guarded
[Element.getAnimations](https://developer.mozilla.org/en-US/docs/Web/API/Element/getAnimations)
subtree query includes scheduled CSS entrances as well as currently advancing animations.

The production contract in `apps/web/motion-contract/` is the acceptance seam. Its first-arrival
sample checks actual nav, mark, inactive-link and CTA colors, not just the final `data-ink` value.
Actual screenshot pixels at plain hero and feed gutters must match during active arrival and after
settling, across dark-to-dark, light-to-light and mixed-surface journeys. These are within-run
composition checks, not maintained screenshot baselines. Input timing observes the foreground
animation rather than treating `main` opacity as readiness.
Regular route arrivals also check the first-frame pin offset. Native history restoration can
arrive after the layout effect; its color assertions remain first-frame, while its pin assertion
waits for the existing scroll watcher. The repeated-cache journey has returned at zero in local
checks; this trial neither changes that scroll policy nor establishes whether it predates the work.
Final design acceptance requires rendered review; this trial does not authorize production website
promotion.
