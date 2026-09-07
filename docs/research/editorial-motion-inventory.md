# Editorial motion — issue 432

Baseline: merged main at `6c7e498a`, September 7, 2026. The shared no-JavaScript
feed correction already landed in PR 468. The older editorial branch is candidate
evidence, not the source of truth for route, hero, filter or globe behavior.

| Surface                                     | Owner and treatment                                                                                                                                                                           |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Interior heroes, metadata and article prose | Keep current first-paint content static. ReadingProgress retains its own scroll behavior.                                                                                                     |
| Headed interior layout sections             | RevealSequence introduces the heading and each base-block group at its own viewport boundary. The section background stays still. No document-ID allowlist.                                   |
| Unheaded layouts and other ordinary bands   | Retain SectionReveal. No paragraph-by-paragraph sequence.                                                                                                                                     |
| Interior panel tracks                       | Retain the track's existing entrance and interaction; remove the duplicate outer section reveal.                                                                                              |
| Case studies                                | Retain the existing chapter, capture and screen-grid owners.                                                                                                                                  |
| Insights feed                               | RevealSequence handles rows in DOM order. Already-visible cards stay visible; lower rows enter when reached. Existing local filtering, ordering, history and focus behavior remain unchanged. |
| Insight related content                     | Group the heading and carousel track. Pointer input or focus completes the entrance immediately; Embla retains horizontal movement.                                                           |
| Home, nav, hero/footer globes               | Preserve the accepted implementation. No rollout switches or replacement animation runtime.                                                                                                   |

The browser seam is `apps/web/motion-contract/editorial.spec.ts`, alongside the
existing Insights pagination contract. It covers section-ground stability,
row cadence, input interruption, static prose, history, rapid/reverse scrolling,
reduced motion and no-JavaScript content. Layout and carousel stories cover
component geometry; production-build browser checks cover the actual routes.

The wider physical-device, hidden-tab and sustained-performance matrix remains
with issue 434. Local emulation does not complete that release gate.

## Verification

- Full suite: 3,696 tests in 308 files passed.
- Browser checks: all 48 editorial cases passed across Chromium, WebKit and
  Firefox, desktop/mobile and normal/reduced motion. Twenty accompanying
  pagination/history cases passed on the same implementation.
- Visual comparison: 54 existing captures unchanged, two new captures, no
  rendering errors. The live About band was also inspected at both widths.
- Scoped lint, typechecks and production-build assertions passed. The content
  route budget is 696,786 of 730,000 bytes, 408 bytes above the merged baseline.
- Review found no actionable standards or scope findings.
