# 0011. The Live page is `/live`, and it is an ordinary Page document

- **Status:** Accepted
- **Date:** 2026-08-01
- **Deciders:** NickO3 + Claude
- **Related:** [issue #50](https://github.com/o3world/o3-sanity/issues/50), [issue #33](https://github.com/o3world/o3-sanity/issues/33), [issue #34](https://github.com/o3world/o3-sanity/issues/34), [issue #41](https://github.com/o3world/o3-sanity/issues/41), [issue #48](https://github.com/o3world/o3-sanity/issues/48), [ADR 0001](./0001-component-routing-port.md), [ADR 0007](./0007-content-sourcing-and-provenance.md)

## Context

The Live frame (`1644:1889`, mobile `1906:334`) is the one canonical page layer
with **no counterpart on the current site** — #34 checked it against
`extract/site/chrome.json` and all 22 extracted WordPress pages and found
nothing. Its hero reads eyebrow `LIVE`, headline _"What we're working on."_

The `NavBar` component (`1710:2271`) links five destinations — Work · Live ·
Insights · Solutions · About — so the page is top-level and #48 cannot pass
without it. The frame is canonical, but a frame does not carry a URL, and two
were live:

- **`/live`** — the nav label, verbatim.
- **`/now`** — the name of the page's precursor in the retired prototype
  (`1379:1980`, "What we're working on", identical deck copy), and the
  established convention for a personal "now page".

The second question the ticket left open is what backs the page: a section-built
`page` document, or a route that composes itself from live documents — recent
perspectives, in-flight case studies, a changelog. The content model has no
"now" concept, so anything dynamic is a schema conversation under working
agreement 3.

## Decision

**The route is `/live`, and it is an ordinary `page` document at slug `live`.**

`/live` because the nav label is the only naming the design actually gives this
page, and a URL that disagrees with the word a visitor just clicked is a cost
paid on every visit, forever. `/now` names a genre, not this page.

Being an ordinary Page means it needs no route file: the catch-all
(`[...segments]`) already resolves any Page by slug, so this is a **catch-all
route** in CONTEXT.md's four-kind vocabulary — the same kind `/about` and
`/solutions` are. No `ROUTABLE_TYPES` change, no collection prefix, no index.

**Its content is seeded, not composed.** The frame settles this in its own copy:
the studio band's cards are anonymous — no client, no logo, no link — and the
band's standfirst says "not the polished case study, the part where it's still
being figured out". Pointing those at `caseStudy` documents would publish client
work that has not shipped, which is the thing ADR 0007 exists to stop. The
appearances band has no document type behind it either, and the ideas band is
editorial positions, not records.

So `page-seed-live` is transcribed from the frame, through one new section block
(`inFlightSection`) that carries all three middle bands in two layouts. The seed
ships **`provisional: true`**: the frame authors one appearance and one idea and
then duplicates each to fill its lists, and the appearance it authors carries a
placeholder date. A page whose promise is "this is current" cannot launch with a
workshop that was never scheduled, so #48's provisional gate is the right place
for that to surface.

## Alternatives considered

### `/now`

- **Pros:** matches the precursor page's name; "now page" is a recognised genre with its own conventions, and a reader who knows it knows what to expect.
- **Cons:** nothing in the canonical design says "now". The nav says Live, so `/now` puts a second name on one destination and makes every link, analytics row and support answer choose between them. The genre convention is also for personal sites, and carries an implied cadence promise this page has not committed to.
- **Why not:** the design named it once. Naming it twice buys nothing.

### A dedicated route that composes from live documents

- **Pros:** a "what we're working on" page is only credible if it is current, and composition is the only version that stays current without anyone remembering to update it. Recent perspectives and in-flight case studies already exist as documents.
- **Cons:** it contradicts the frame. The studio cards are deliberately anonymous and unlinked, so the nearest documents (`caseStudy`) are the wrong shape _and_ would assert unshipped client work. Appearances have no document type at all, and inventing an `event` type for four rows on one page is the trade `roleListSection` already declined (#56). It would also make Live the only page layer whose composition is code rather than content.
- **Why not:** speculative schema for a cadence problem nobody has committed to owning yet. The provisional flag records the risk instead, and an `event` document type stays a live option the day an appearance needs its own URL or a second surface needs the list.

### Three new section blocks, one per band

- **Pros:** each block would be named for exactly what it holds; no layout enum to keep in step with the data.
- **Cons:** three half-known blocks in the Studio picker for one page, when all three bands carry the same entry — a kicker, a title, and a lead that is either a date or a disc. The repo already answered this shape twice (`disciplineGridSection.layout`, `railPanelsSection.rail`): same content, two compositions, one block.
- **Why not:** the content-naming skill's first question is whether an existing block can do it with a field. Applied to three siblings, the answer is one block with a layout axis.

## Consequences

- The nav item from #41 already pointed at `/live` in `siteSettings`; this ADR
  is what makes that a decision rather than a placeholder. **No seed change was
  needed** — which is worth stating, because "it already worked" is otherwise
  indistinguishable from "nobody checked".
- One new section block, `inFlightSection`, and one new field name in the
  CONTEXT.md lexicon (`date`).
- `page-seed-live` joins the provisional inventory in
  [`docs/content-sourcing.md`](../content-sourcing.md), so #48 sees it.
- **The cadence question is deferred, not answered.** Whoever owns the page's
  freshness is still unnamed; if the answer turns out to be "nobody", the
  honest fix is to cut the appearances band rather than let it go stale, and
  that is a content decision the block already supports.
