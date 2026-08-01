# 0010. Captured prototypes live in Storybook, as dated read-only snapshots

- **Status:** Accepted
- **Date:** 2026-08-01
- **Deciders:** NickO3 + Claude
- **Related:** [issue #33](https://github.com/o3world/o3-sanity/issues/33), [issue #51](https://github.com/o3world/o3-sanity/issues/51), [ADR 0004](./0004-layered-test-approach.md), [`apps/storybook/prototypes/README.md`](../../apps/storybook/prototypes/README.md)

## Context

Design proposals for this repo are increasingly written as Claude artifacts —
one self-contained HTML page, its own CSS and JS, often interactive. The
mobile-menu open-state proposal (#51) is the current example: two 402 device
frames side by side, the closed bar rebuilt from `1814:1630` and the open state
proposed, with every value traced to a token or a frame node in a table so a
reviewer can check it rather than trust it.

Those artifacts live on claude.ai. Sharing one means sending someone there,
which puts internal client-facing design work behind a third-party account we
don't administer, on a URL with no relationship to the repo or its history.
That is the problem this decision exists to solve — it was ruled out explicitly.

The complicating fact is that #33 **made Figma the design source of record** and
retired the old `prototype/` directory. Any place we put these has to make them
_more_ findable without making them authoritative — those pull in opposite
directions, and getting it wrong reintroduces the exact ambiguity #33 removed.
The mobile menu sharpens this: it proposes a panel **no Figma frame draws**, so
it is filling a gap rather than reading a spec, and it would be easy to mistake
for the spec itself.

## Decision

**Captured prototypes are committed to `apps/storybook/prototypes/` and served
by Storybook as static files, framed by a story that labels them as dated
snapshots.**

A set is a directory containing an `index.html`; `.storybook/main.ts` derives a
`staticDirs` mount per set from disk, so adding one is "drop the folder, write a
story" with no registry to update. A shared `PrototypeFrame` renders each page
in an iframe under a strip carrying its name, capture date, and the words
"Snapshot — not a source of record".

Three reasons, in order of weight:

1. **Storybook is already the shared, deployed design surface.** The link works,
   it's already the thing people are sent, and the prototypes end up beside the
   components that superseded them — which is where the comparison is useful.
2. **Committed and dated beats gitignored.** A capture that only exists on one
   laptop is not a record. Date-prefixing the directory makes staleness legible
   without anyone maintaining a status field.
3. **The framing carries the hierarchy.** Storybook's affordance is "this is the
   current system", so the label has to be on the artifact itself, not only in a
   doc. Sidebar ordering puts `Prototypes` last for the same reason.

## Alternatives considered

### Port the prototypes to React components/stories

- **Pros:** they'd use real tokens, be a11y-checked, and stay alive as the system changes.
- **Cons:** days of work per set, and it destroys the thing that makes a capture useful — a proposal rewritten in current components stops being a proposal and starts being an implementation, which is what #51 is for. It also produces components nobody asked for, competing with `packages/ui`.
- **Why not:** it converts a record into a fork of the design system, and pre-empts the decision the prototype exists to inform.

### Keep them on claude.ai and share the artifact link

- **Pros:** zero repo weight, zero wiring, and the link already exists.
- **Cons:** internal design work sits behind an account we don't administer, with no relationship to the repo's history, and no way to tell from the repo that a proposal exists at all. Explicitly not wanted.
- **Why not:** the reason this ADR exists.

### A separate deployment (its own Vercel project, or a `/prototypes` route in `apps/web`)

- **Pros:** clean separation from the component library; independent access control.
- **Cons:** another deploy target to maintain and another link to remember, for a handful of static pages. A `/prototypes` route in `apps/web` is worse — it puts unshipped proposals inside the shipping site and inside its routing, caching, and SEO surface.
- **Why not:** cost with no matching benefit at this size. Revisit if a set ever needs access control the Storybook deployment can't give it.

### A throwaway branch, per the prototype skill's capture step

- **Pros:** the repo's default answer for capturing an answered prototype; zero weight on `main`.
- **Cons:** works for prototypes whose value is _code you might read again_ (a logic prototype, a state-machine spike). It fails for visual ones: nobody checks out a branch to look at a page, and a branch has no URL to send.
- **Why not:** kept for logic prototypes, which stay on branches. Visual ones need to be _seen_, and that's a hosting problem a branch doesn't solve.

## Consequences

- **The claude.ai frame-runtime is stripped on the way in**, and what was
  changed is stated in an HTML comment at the top of the capture. That preamble
  only talks to the artifact shell; keeping it would be ~25 KB of minified noise
  that does nothing outside claude.ai. Nothing else about the page is touched.
- **Prototype stories opt out of the a11y check.** Axe traverses same-origin
  iframes, so an unsuppressed frame would report the artifact's violations as
  this repo's failures. `prototypeParameters` sets `a11y: { test: 'off' }` on
  prototype stories only; components keep the rule (ADR 0004). Note this cuts
  against the grain for the mobile menu, whose whole third argument is about
  `aria-label`/`aria-expanded`/`aria-controls` on an icon-only control — but the
  place to enforce that is the component #51 produces, not the capture.
- **A capture may cite tokens without being bound to them.** The mobile-menu
  page hard-codes `--o3-*` values copied from `packages/tailwind-config` at
  capture time. That is honest and checkable, and it is also frozen: if a token
  moves, the page keeps the old number silently. Values get verified against the
  token package, never the other way round.
- **Every capture must record the question it answers**, in the story's meta
  docblock. This is the load-bearing part of the pattern — without it a capture
  is a screenshot with extra steps, and the reason to keep it expires.
- **A capture is not retired when its proposal is accepted.** #51 landing in
  `packages/ui` does not delete this page; it becomes the record of how the
  component got its shape.
- **Captures are never edited.** Refactoring one to use O3 tokens, or fixing its
  a11y, ends its usefulness as a record. If the artifact changes, capture the
  new version beside the old one. If a capture disagrees with Figma, Figma wins
  and the capture is marked stale in its docblock.
- **`prototype/` is unaffected.** It stays gitignored and stays retired; this
  decision is about artifacts that never lived there.
- Prototypes inherit whatever protects the deployed Storybook. Anything that
  must not be publicly linkable does not get captured here.
