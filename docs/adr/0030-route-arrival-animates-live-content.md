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

## Decision

The O3 site's persistent layout keeps complete server-rendered `main` content and live navigation
as siblings. A null client component observes committed `usePathname` changes behind its own
Suspense boundary, so unknown dynamic parameters cannot block the shell's prerender.

On a pathname change, a layout effect animates the actual `main` from opacity 0.72 to 1 using
`--duration-page` (300ms) and `--ease-out`. It does not animate initial hydration, query/hash changes,
or repeated navigation to the same path. Opacity never gates content readiness or hit testing.
There is no exit phase, geometry change, artificial delay, or animation-owned navigation state.

The effect owns one Web Animation and one reduced-motion subscription. A new route or unmount
cancels the old animation. Enabling reduced motion during a fade cancels it immediately. Reduced
motion and missing `Element.animate` produce ordinary navigation; no inline opacity or forwards
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
- **Live arrival:** loses old/new overlap deliberately. Applying opacity to `main` creates a temporary
  stacking context; nav/footer stay outside it. Existing inner reveals still own their motion and
  require the separate motion-system audit.

Basic [Element.animate](https://developer.mozilla.org/en-US/docs/Web/API/Element/animate) predates
the installed [Next browser floor](https://nextjs.org/docs/architecture/supported-browsers)
(Chrome/Edge 111+, Firefox 111+, Safari 16.4+). Feature detection
avoids raising that floor. Tests use current Chromium, Firefox, and Playwright's patched WebKit,
not branded Safari or every historical version; physical-device and oldest-supported-version
checks remain release evidence to collect, not claims made by this matrix.

The production contract in `apps/web/motion-contract/` is the acceptance seam. Final design
acceptance requires rendered review; this trial does not authorize production website promotion.
