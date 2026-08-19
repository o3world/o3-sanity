# Visual regression

```bash
pnpm vr                       # the stories your change touches, vs the merge base with main
pnpm vr --base NickO3/toolbar # vs another ref
pnpm vr --story hero          # these stories, whatever the diff says
pnpm vr --all                 # every story
pnpm vr --list                # what would be compared, without comparing it
pnpm vr --help
```

A run builds Storybook twice — once for your working tree, once for the baseline commit — screenshots
the affected stories in headless Chromium at 390px and 1440px, diffs the pixels, and opens an HTML
report with side-by-side, slider, onion-skin, and diff views.

Nothing leaves the machine and nothing is committed. Everything lives in `.vr/`, which is gitignored.

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

Two viewports, `mobile` (390×844) and `desktop` (1440×900), full page. Override with
`--viewports mobile:390x844,wide:1920x1080` or just `--viewports 1440`.

To keep a rerun of the same commit byte-identical, every capture runs with animations and transitions
collapsed to 1ms, `prefers-reduced-motion`, a fixed device pixel ratio, a wait on
`document.fonts.ready`, and the two rules below. A story whose pixels are genuinely non-deterministic
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
sides agree; the run says how many at the end, and `--refresh` retries them.

### Every image is loaded before the shutter

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

## Tuning

`--threshold` (default `0.1`) is per-pixel colour tolerance — lower is stricter. `--max-diff`
(default `0`) is the fraction of pixels that still counts as unchanged; raise it to `0.0005` or so if
a font-rendering wobble is producing noise you have decided to live with. `--settle` (default 200ms)
is the pause between "rendered" and the shutter — raise it for a story that loads something after
mount. `--refresh` throws away the cached baseline screenshots and retakes them, and retries the
assets an earlier run could not fetch.

## Layout of `.vr/`

```
.vr/
  assets/                remote images and fonts, fetched once and replayed
  base/                  detached worktree at the baseline commit
  build/current/         Storybook build of the working tree
  build/base-<sha>/      Storybook build of the baseline, cached per commit
  shots/<sha>/           baseline screenshots, cached per commit
  shots/current/         this run's screenshots
  shots/diff/            this run's diffs
  report/index.html      the report
```

Delete the whole directory to start clean; the next run rebuilds it. `git worktree prune` afterwards
if you removed it while `.vr/base` existed.
