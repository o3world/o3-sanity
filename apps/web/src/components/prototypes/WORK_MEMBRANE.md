# Our work card study

Question: can the existing case cards take on the floating, deforming behavior of the software-engineering page's breathing motif?

The study changes the actual cards: equal-width, aligned surfaces with clean, continuously deforming outlines. Corners and edges share a closed spline, so there are no fixed corner joints. Photos and complete card content come from the existing card component. Text is not distorted. Motion pauses offscreen, when the tab is hidden, and through the site's Reduce motion control or OS preference.

The initial HTML includes each outline; an opt-in startup script chooses the query variant before paint. The animated clip applies to the photo and scrim, while the content has its own transform layer. Whole-card translation includes a very light idle drift (2px horizontally, 3px vertically). Link and image dragging are disabled in the study so native text selection works. A card holds its position while the pointer is down or its text remains selected; selecting text does not follow the case-study link.

The active study reuses the globe's GPU runtime and the hero's full 4,180-star scene, including its depth distribution and nearby dust. Its depth-aware Y camera travel follows scroll, and visibility fades at both section boundaries in either direction. The viewport-sized sky stays behind the cards rather than allocating a section-height canvas.

In the hero, the same study URL replaces the flat sky parallax offset with depth-aware Y camera travel, composed with the existing intro camera offset. Globe geometry and motion remain unchanged. Outside this local study, the renderer keeps its existing behavior.

Run from the repository root:

```sh
pnpm --filter @o3/web preview:work
```

This runs the standard production build and its rendering, cached-404, and JavaScript-budget assertions, then serves the current checkout on port 3612. After editing, stop the server and rerun the command to rebuild. The study requires `NEXT_PUBLIC_WORK_MEMBRANE_STUDY=1` at build time; ordinary builds keep it disabled. Use this one preview for motion review. The former port 3613 audit snapshot is retired.

Open `http://localhost:3612/?workMembrane=on`. Scroll adds a different parallax depth per card; nearby mouse velocity pulls the edges and gives the card a small spring response. Touch uses scroll only. Native scrolling is unchanged.

Cards fade at both viewport edges using a native CSS view timeline on their stationary layout wrapper. The middle 70% of the passage stays fully opaque for reading. Opacity reflects the current scroll position immediately, including history restoration; idle float does not advance the reveal. Reduced motion, keyboard focus, and browsers without view-timeline support keep the cards fully visible.

The active study overrides the card scrims locally. Desktop spreads the dark-to-light transition across the full image instead of dropping sharply after its midpoint; stacked cards use a continuous wash without the fixed-height bright shelf. Shared card tokens and the ambient comparison keep their existing treatment.

After visual approval, profile the combined star and membrane effects against the unchanged baseline: GPU/compositor cost, frame pacing, scrolling, route restoration, and mobile hardware. Use isolated stars/card runs to identify each cost before selecting optimizations that preserve the accepted appearance.

The September 7 local performance baseline and remaining device checks are recorded in `docs/research/work-motion-performance-2026-09-07.md`. The following geometry and motion changes happened after those measurements:

- The background extends into half the page gutter, capped at 24px per side, with an 8px vertical allowance. A pixel-bounded spline moves within that allowance and preserves the text's padding. Rounded corners scale with the available padding rather than growing with card width.
- Cards retain equal layout widths. Mobile uses 24px content padding; it no longer expands the whole card to compensate for an inward clip.
- The stack reserves 112px between layout boxes, or 80px on mobile, to leave room for moving edges and neighboring scroll offsets.
- A softer vertical spring follows scroll velocity with a short catch-up. Positional parallax is smaller, while the existing subtle idle drift and cursor response remain.
- Images do not zoom on hover or keyboard focus. Only the complete card and its outline move.

Use `?workMembrane=ambient` for the accepted breathing-card starting point, or omit the query for the original cards. This is an opt-in local experiment, not an accepted production design. The earlier standalone membrane in the heading has been removed.
