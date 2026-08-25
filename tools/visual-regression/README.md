# Visual regression

```bash
pnpm vr                       # the stories your change touches, vs the merge base with main
pnpm vr --brand o3xo          # the o3xo Storybook host, not o3's
pnpm vr --base NickO3/toolbar # vs another ref
pnpm vr --story hero          # these stories, whatever the diff says
pnpm vr --all                 # every story
pnpm vr --list                # what would be compared, without comparing it
pnpm vr --figma --list        # the pairing inventory: every story that names a Figma node
pnpm vr --figma               # score every paired story against its cached frame export
pnpm vr --figma --accept      # record this run's scores in the drift ledger
pnpm vr --help
```

A run builds Storybook twice — once for your working tree, once for the baseline commit — screenshots
the affected stories in headless Chromium at 402px and 1440px, diffs the pixels, and opens an HTML
report with side-by-side, slider, onion-skin, and diff views.

Nothing leaves the machine and nothing is committed. Everything lives in `.vr/`, which is gitignored.

## Which host

`--brand` names one of the two Storybook hosts (#240): `o3` is `apps/storybook`, `o3xo` is
`apps/storybook-o3xo`. It defaults to `o3`, so an unqualified `pnpm vr` is what it always was.

The brand is not a decoration on the run — it decides which build the module graph is read from, and
therefore which files select which stories. Storybook writes module ids relative to the host that
built them, so `./globals.css` is `apps/storybook/globals.css` on one host and
`apps/storybook-o3xo/globals.css` on the other; a change to one host's `preview.ts` or `globals.css`
selects every story on **that** host and nothing on the other. The shared packages sit under both, so
editing `packages/ui/src/components/stat.tsx` selects the `Stat` stories on either — under O3's
tokens or O3XO's, depending which brand you asked for.

A change to `packages/story-kit` reaches everything on both hosts, because each host's `preview.ts`
is a shell over it and the climb runs through that import.

A baseline commit older than the host has no such directory to build. That is reported rather than
crashed: the baseline index is empty and every story on that host reads as `added`.

## What it compares

**The baseline is a commit, not a folder of accepted PNGs.** Snapshot tools store approved images in
the repo and ask you to re-approve them; that is a workflow built for a team that needs to agree on
what "correct" looks like. Here there is no one to agree with, and stored baselines have a failure
mode worth avoiding: they drift, and a stale approval quietly becomes the thing you compare against
forever.

So the tool renders both sides on demand. The baseline is the **merge base** of your branch and
`main` — not the tip of `main`, because commits other people landed while you were working are not
your change, and diffing against the tip would report every one of them as a regression in your
branch.

The cost of rendering the baseline is paid once. `.vr/base` is a detached git worktree that gets
reused, `pnpm install` there only reruns when the lockfile changes, the Storybook build is cached per
commit, and screenshots are cached per commit too — so the second run against the same baseline skips
straight to the capture of your own working tree.

## What it captures

Only the stories your change can reach. That comes from Storybook's own module graph
(`preview-stats.json`), read in reverse: edit `packages/ui/src/components/stat.tsx` and every story
that renders a `Stat` is selected, including the ones that never mention it by name. Edit a file no
story imports and nothing is selected. A change to `globals.css` or `.storybook/preview.ts` sits above
every story, so it selects all of them.

Two viewports, `mobile` (402×844) and `desktop` (1440×900), full page — the widths the design
file draws at, so an ordinary run and a `--figma` run measure the same layout. Override with
`--viewports mobile:402x844,wide:1920x1080` or just `--viewports 1440`.

To keep a rerun of the same commit byte-identical, every capture runs with animations and transitions
collapsed to 1ms, `prefers-reduced-motion`, a fixed device pixel ratio, a wait on
`document.fonts.ready`, and the two rules below. Three hundred and twenty-eight stories captured four
times over come back byte-identical. A story whose pixels are genuinely non-deterministic
— canvas, video, anything seeded by a clock — should opt out rather than be tuned around:

```ts
export const meta = {
  title: 'UI/OrbitalSphere',
  component: OrbitalSphere,
  tags: ['vr:skip'],
}
```

### Nothing reaches the network twice

Half the suite fetches something from someone else's server — 256 images from `cdn.sanity.io`, plus
the YouTube and Vimeo players the Embed block renders. Whether a given one arrived before the shutter
used to be a property of the morning's bandwidth, and the homepage lost its partner logos in one run
in three that way (#226).

So a capture reaches the network once per asset, ever. The first run writes each image and font to
`.vr/assets`; every run after that — and, more to the point, the baseline capture and the current
capture of the _same_ run — replays those bytes off disk. Anything that would _execute_ is stubbed
empty instead of cached: a player document renders a different frame, a different consent state and a
different thumbnail every time it runs, so caching its HTML would not make it deterministic. The
Embed stories keep their 16:9 frame and their iframe title, which is what they are under test for.

An asset that cannot be fetched is recorded as unreachable and served as a failed request, so both
sides agree, and the run says how many at the end. It stays cached for the rest of that run — a 503
that clears halfway through must not hand the current capture a photograph the baseline capture never
got — but only a timeout survives into the next one. A refusal the server answered with is re-asked
every run, because a cached 403 outlives the broken URL that caused it and costs one round-trip to
re-ask (#236). `--refresh` retries the timeouts too.

### The shutter waits for the page, not for Storybook

`sb-show-main` lands on the body a beat before React has mounted the story, and on a heavy page with
four workers competing for the machine that beat can outlast the settle: one run in three,
`Pages/Software Engineering` came back as a 900px screenshot of an empty viewport against a 5383px
baseline. The capture now waits for the story's own tree — briefly, because `RichText/Empty` and
friends render nothing on purpose.

A story can also arrive in stages. `ListingSection/OnBone` painted its heading and, under ten
parallel workers, its cards a beat later. So after the settle the capture samples the page — image
count, height, element count — and only opens the shutter once two samples across a 150ms quiet
window agree.

Next's `<Image>` is `loading="lazy"`, so on the homepage twelve of twenty-three images had not been
requested at all when the shutter fired — and a full-page screenshot widens the capture viewport,
which starts those loads _while Chromium is painting_. Whichever won the race was in the PNG. Every
image is now forced eager and decoded before the shutter, which takes that page from fourteen
requests during the capture to none.

The same freeze that stops the page's animations is written into any SVG served to an `<img>`. An SVG
loaded as an image is its own document: the page's init script cannot reach it, and neither can
`prefers-reduced-motion` emulation, so one decorative illustration with four keyframe animations of
its own rasterised at a different phase in all six of six captures.

## Reading the report

Cards are grouped by verdict, worst first.

| verdict     | means                                                              |
| ----------- | ------------------------------------------------------------------ |
| `changed`   | pixels moved — slider and diff views are available                 |
| `added`     | the story does not exist on the baseline commit                    |
| `removed`   | the story existed on the baseline and this branch deleted it       |
| `error`     | the story failed to render on one side; the message is on the card |
| `unchanged` | identical, hidden by default                                       |

A story that got taller is diffed against the union of both sizes rather than the overlap, so growth
shows up as the difference it is instead of being cropped away. The header notes the size change.

## The Figma baseline

`pnpm vr --figma` compares against the design file instead of the merge base (spec #326). `--list`
prints the **pairing inventory** — every story that names a Figma node, joined to the tracked-nodes
manifest that watches the file it named — and stops. Without `--list` the run brings the **frame
export cache** up to date, then captures each paired story and **scores** it against its frame.

```
pnpm vr --figma --list                 the inventory, read-only: no token, no network
pnpm vr --figma --list --brand o3xo    one host and its manifest
pnpm vr --figma                        …fetch what the cache is missing, then score every pairing
pnpm vr --figma --story pages-home     score these stories against their frames
```

Three sections, plus a coverage count:

- **Pairings** — story id, node id, the hosts that serve the story, the design file it named, and
  what the manifest calls the node. `untracked` means the manifest does not watch that node, which
  is the ordinary case for a component-level pairing: the manifest tracks page frames and the
  component sets `docs/figma-components.md` maps, not every band in the file.
- **Page-level pairings** — the story cites a whole page frame. Fine for a page mockup story, a
  target for anything smaller: the tighter the node, the more a comparison means.
- **Uncovered component sets** — tracked in the manifest, paired by no story. Printed whole, never
  capped. Coverage is reported, never gated, so a missing pairing is a row and not a failure.

It needs no Storybook build and no browser. A pairing is declared by
`parameters: { design: figmaDesign('1710:2609') }`, and the node id is a string literal in every
call, so the run reads the story files as source rather than importing them. `pairing.ts` is the
whole model — source text and manifests in, inventory out — and `figma-inventory.ts` is the only
part that touches disk.

A story inherits its meta's `design` unless it sets its own, the way Storybook's parameters already
resolve. `figmaDesign`'s second argument picks the design file, so an O3XO pairing joins against
`tracked-nodes-o3xo.json` even when the story sits in a package both hosts serve.

### Frame exports

Each paired node is drawn once through Figma's images API and cached under
`.vr/figma/png-x1/<brand>/<node>@<hash>.png`. The hash is the node's own `figma:sync` baseline hash,
so the filename **is** the cache key: an unchanged node is a hit, a node the sync re-hashed misses
and re-fetches, and nothing else in the directory moves. Steady state is zero API calls, and the
token is read only when there is something to fetch — a warm run needs no key at all.

Scale 1: `vr` captures at `deviceScaleFactor: 1` with `scale: 'css'`, so one design pixel is one
capture pixel. Format and scale name the directory rather than the key, the way `captureKey` names
the screenshot cache, so changing either cannot be served out of the old one.

The run reports three numbers and lists the last two:

- **fetched / cache hits** — what it drew, and what was already there.
- **unknown to the baseline** — the node is paired but `figma:sync` does not track it, so nothing
  says when it changed. Reported by name, never guessed at.
- **missing from the Figma file** — the images API would not draw it. The design deleted the node,
  or the story cites a stale id. The ledger turns this into an `orphaned` red; here it is a named list.

A quota error fails the run with the node named. Exports are written one at a time, so a run that
dies partway keeps what it got and the next one asks only for the rest. `--refresh` empties the
directory.

`export-cache.ts` is the whole keying model — pairings, baselines and the directory listing in, a
plan out — and it is tested on fixtures with no network. `figma-exports.ts` reads, calls and
writes, reusing `@o3/figma-sync`'s client so there is one Figma token, one 429 retry, and one place
that knows `/images` answers `null` rather than failing.

### The score

Each pairing is captured and diffed against its frame, and the report is the same viewer — side by
side, slider, onion, diff — with the frame standing where the merge-base build stands.

```
story                                node       viewport    score   diff px  height Δ  width Δ
pages-home--desktop                  1680:2134  frame-1440  25.74%  4160422  +57px     +118px
pages-software-engineering--desktop  2360:2879  frame-1440  17.21%  1395102  +136px    —
```

Three decisions make that number mean something, and `frame-score.ts` states each one where it is
taken.

**The capture takes the frame's width; the frame is never resampled.** Frames are drawn at whatever
width the designer used — 1440, 402, 776 — and scaling one side to meet the other blurs every glyph
and puts a floor under every score that has nothing to do with the code. So the export is the
authority and the browser is told to match it. The floor is 320px, the narrowest width the layout
answers for: an icon set exports at 24px, and a 24px-wide browser renders a story no design ever
described.

**The score is the diff-pixel ratio over the comparison canvas**, through `compare.ts` unchanged —
same pixelmatch, same `--threshold`, same union canvas. Pixel identity is unreachable across two
renderers, so the number is relative: stable run to run under the existing freeze, and therefore
comparable against its own earlier self. That is all the ledger asks of it. Nothing in `frame-score`
decides whether a score is good; the ledger below does.

**The canvas is the union of the two sizes, and the deltas are reported beside the score.** A band
200px shorter than its frame is the drift, not an obstacle to measuring it, so the shorter image is
padded transparent and those pixels count. `height Δ` and `width Δ` carry the difference out
separately — and because the shutter is full-page, a `width Δ` on a page frame means the story is
overflowing sideways past its own viewport.

Three lists follow the scores, all uncapped:

- **unkeyed** — the story names a node, but no export is keyed to it (usually: `figma:sync` does not
  track that node). Listed, not failed.
- **unscorable** — the pairing's two sides are not the same subject, so a number would only mislead.
  Two shapes qualify. A story citing a **component set** is a whole page measured against a strip: a
  24px icon frame against a 320×844 capture scores 99.96% and says nothing, and it stays listed until
  a component story is captured at its own bounds. A **mobile story citing a desktop frame** is
  captured at 1440 — the frame's width is what the browser is told — so it scores whatever its
  desktop sibling scores; two identical rows are the tell, and the pairing is at fault, not the code.
- **unpaired** — the story names no node at all. Only `--story` runs can produce these; an
  unqualified `--figma` scopes itself to the paired stories.

A pairing is only as good as the node it cites. A page-mockup story against a page frame is the
comparison this was built for; the pairings that are not that are held out as `unscorable` above,
and the inventory's page-level and coverage sections are where they are chased down.

`frame-score.ts` is the model — index, pairings and exports in, a plan and scores out, tested on
committed 320px crops in `src/__fixtures__/frame-score/`. The CLI does the build, the captures and
the writes.

### The ledger and the four reds

A score on its own is a number. `data/figma-ledger.json` is what gives it consequence: one entry per
pairing, holding the score it was accepted at, the tolerance around that score, the node's
`figma:sync` hash and the design file's version at acceptance, and an optional one-line reason.

```json
"o3/pages-home--desktop/o3/1680:2134/frame-1440": {
  "score": 0.25743,
  "tolerance": 0.005,
  "nodeHash": "1e2f9f533105b10689d7a91395c4e65a13daf53dd2720d2161db085f6c1fa9ef",
  "fileVersion": "2391349966960467923",
  "acceptedAt": "2026-08-25"
}
```

It is committed, sorted-key JSON — the philosophy `tools/migration/data/assets.json` and the sync
baselines already use. Acceptance is a decision reviewed in a diff, never a prompt and never a run
that quietly moves the bar. The key is `<host>/<story>/<design brand>/<node>/<viewport>`: both
Storybook hosts serve the shared packages and give a shared story the same id, so the host is part
of the pairing's identity and not a detail of the run.

`unpairable` is the second map, keyed `<design brand>/<node>`. A node listed there — a pasted
capture with cursor pixels, a `ClaudeTest` frame, #308-ruling-9 material generally — is never
captured, never scored and never red. It is listed, with the reason the ledger gives.

**A run fails for exactly four reasons.**

| red                 | means                                                                    |
| ------------------- | ------------------------------------------------------------------------ |
| `worsened`          | the score is past its accepted score plus its tolerance                  |
| `unaccepted-change` | `figma:sync` re-hashed the node since acceptance and nobody re-accepted  |
| `orphaned`          | the Figma file will not draw the node any more — deleted, or a stale id  |
| `no-export`         | the node changed and no export could be obtained, so nothing can be said |

`unaccepted-change` is red even when the score passes: a score measured against a frame the design
has since replaced is not evidence about anything. Everything else is a row on a list — a pairing
nobody has accepted, a node `figma:sync` does not track, a story naming no node, a node marked
unpairable. Coverage is reported, never gated.

**A pairing with no ledger entry is listed as `new`, not red.** There is no accepted score for it to
have worsened past, and calling it drift would report a measurement nobody made. It is never silent:
`--strict` reds the `new` list, which is what a branch gate should run, while a local run stays
green so a first pairing can be looked at before it is judged.

`pnpm vr --figma` exits non-zero when any red exists and zero otherwise. `--list` is read-only and
always exits 0.

### Accepting

```bash
pnpm vr --figma --story pages-home--desktop --accept   # these pairings, at what they score today
pnpm vr --figma --accept                               # every pairing this run scored
```

`--accept` writes the run's scores into the ledger and prints what it added and re-accepted. It
never prompts and never tunes: the tolerance defaults to `0.005` and is yours to edit in the JSON,
and so is the one-line `reason` a deliberate departure deserves. Both survive a re-acceptance — the
score is the only thing a run knows better than the file.

The default tolerance is read off the scoring fixtures: a pair that matches scores 0.00% across the
two renderers, and the smallest drift those fixtures call real — the #325 padding miss — scores
5.80%. Half a point sits an order of magnitude under the drift and above the zero the capture freeze
produces run to run.

The writer is byte-stable — sorted keys, a fixed field order, a trailing newline — so two agents
accepting different pairings produce diffs that merge, and re-accepting a pairing nothing changed
about writes no diff at all.

`ledger.ts` is the whole model: the ledger shape, the acceptance, and one pure function from
(scores, ledger, sync baseline) to a verdict plan. It is tested on fixtures with no browser, no
network and no Figma token, which is what makes "is this run red?" answerable without asking anyone.
`ledger-file.ts` reads and writes the JSON and does nothing else.

## Tuning

`--threshold` (default `0.1`) is per-pixel colour tolerance — lower is stricter. `--max-diff`
(default `0`) is the fraction of pixels that still counts as unchanged; raise it to `0.0005` or so if
a font-rendering wobble is producing noise you have decided to live with. `--settle` (default 200ms)
is the pause between "rendered" and the shutter — raise it for a story that loads something after
mount. `--refresh` throws away the cached baseline screenshots and retakes them, retries the assets
an earlier run timed out on, and — under `--figma` — empties the frame export cache.

## Layout of `.vr/`

```
.vr/
  assets/                  remote images and fonts, fetched once and replayed
  base/                    detached worktree at the baseline commit
  figma/png-x1/<brand>/    frame exports, keyed by node id and sync baseline hash
  <brand>/
    build/current/         Storybook build of the working tree
    build/base-<sha>/      Storybook build of the baseline, cached per commit
    shots/<sha>/           baseline screenshots, cached per commit
    shots/current/         this run's screenshots
    shots/diff/            this run's diffs
    shots/figma/           captures taken at their frames' widths
    shots/figma-diff/      their diffs, one directory per node
    report/index.html      the report
    report-figma/index.html  the scored report
```

Everything that renders is under the brand, so running one host does not overwrite the other's
report or serve it the other's build. `assets/` and `base/` are brand-independent by nature: the
baseline checkout is one commit whichever host renders it, and a photograph off `cdn.sanity.io` is
the same bytes under either set of tokens — which is also what keeps the second brand's first run
from re-fetching 256 images.

Delete the whole directory to start clean; the next run rebuilds it. `git worktree prune` afterwards
if you removed it while `.vr/base` existed.
