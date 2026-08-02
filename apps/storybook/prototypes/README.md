# Captured prototypes

A prototype is throwaway code that answers a question. This directory is where
the ones worth showing someone go to stay findable.

Storybook is already the deployed, shareable surface for O3 design work, so a
captured prototype lands in the sidebar next to the components it argued for —
one URL, no attachments, no third-party viewer, no account. That is the whole
reason this directory exists rather than a branch nobody checks out.

## What belongs here, and what doesn't

**Here:** a prototype that makes an argument someone needs to see — a proposal
awaiting a decision, an interaction, a layout, a page-level narrative — and
whose reasoning is not recoverable from the component library. Typically a
Claude artifact: one self-contained HTML page, its own CSS and JS, no build
step.

A set does not have to _come from_ claude.ai — `2026-08-mobile-menu-variants`
was authored in-repo, against `packages/tailwind-config` and the frames, and
committed directly. The shape is identical (self-contained page, no build step,
frozen once committed); it just skips step 1–2 below, has no runtime to strip,
and says so in its own header comment instead. Two things get easier when a set
is written here rather than imported: it can **self-host Figtree** beside its
`index.html`, so the letterforms are the real ones rather than a fallback, and
its values can be read straight out of the token files instead of retyped.

A prototype does **not** have to be settled to belong here. A proposal is
exactly when a link is worth the most, and the mobile-menu capture is one:
#51 is open, and the page is how the argument gets reviewed. What makes it
capturable is that it has stopped moving, not that it has been accepted.

**Not here:**

- **Anything that is still the answer.** Once a decision is validated it gets
  folded into `packages/ui` and Figma. The prototype records _why_; the
  components record _what_. A capture is not retired when its proposal is
  accepted — it becomes the record of how.
- **Design source of record.** Figma outranks everything in this directory
  (`AGENTS.md` → Design source of record, map #33). A prototype is where an
  idea was argued, not where it is specified. Take intent from a prototype;
  take measurements, tokens, and variant axes from Figma. A prototype that
  fills a gap Figma leaves — as the mobile menu does — is still a proposal
  about that gap, not an answer to it.
- **Anything still being iterated.** Keep those on claude.ai until they settle.
  Capturing a moving target means recapturing it every day, and a stale capture
  is worse than no capture.
- **Prototypes that answered a _logic_ question.** A throwaway terminal app
  exercising a state machine has no visual surface and gains nothing from an
  iframe. Commit it to a throwaway branch and point the issue at it.

## Layout

```
apps/storybook/prototypes/
  README.md                              this file
  frame.tsx                              the shared iframe renderer + parameters
  <yyyy-mm>-<slug>.stories.tsx           one story file per set
  <yyyy-mm>-<slug>/                      the artifact set
    index.html                             entry page — REQUIRED, it's the contract
    <other>.html                           sibling pages, if the artifact has them
    assets/                                images the set references, if any
    *.js  .*                               runtime and sidecar state, if any
```

A **set** is one body of work, not one page. A single-page artifact still gets
its own directory — that's what makes the mount, the assets, and any future
sibling pages hang together. A multi-page artifact goes in one directory, not
several: its pages link to each other by filename, and splitting them breaks
every link.

Date-prefix the slug. These are snapshots, and the month is the most useful
thing about one two years from now.

`.storybook/main.ts` mounts every directory containing an `index.html` at
`/prototypes/<dir>`. There is no registry to update — the directory _is_ the
registry. `storyRoots.ts` includes this directory, so a `*.stories.tsx` here is
picked up like any other.

## Adding one

1. **Get the source HTML.** For a claude.ai artifact, `WebFetch` its
   `claude.ai/code/artifact/<uuid>` URL — that returns the raw document. `curl`
   does not; it gets the SPA shell or a 403.
2. **Strip the host's runtime, keep everything else.** A claude.ai artifact
   opens with a `<!-- frame-runtime -->` script block that only talks to the
   artifact shell — postMessage handshakes, capability shims, iframe resize
   reporting. It is dead weight outside claude.ai and noise in a diff. Drop
   everything between the `frame-runtime` comments; keep the small base reset
   after it, because the page was authored against it. Note what you changed in
   an HTML comment at the top, as
   [`2026-08-o3-mobile-menu/index.html`](./2026-08-o3-mobile-menu/index.html)
   does.
3. **Copy the set in**, into `<yyyy-mm>-<slug>/`, with its assets. The entry
   page is `index.html`; siblings get clean lowercase names.
4. **If it has sibling pages, rewrite the cross-links** to match the new
   filenames. Exported artifacts link by their original names, spaces and all —
   fix them once, on the way in, or the set silently 404s inside the frame.
   `grep -o 'href="\./[^"]*"' *.html` is the check.
5. **Drop what isn't referenced — but check the dotfiles first.** Source
   screenshots and scratch folders are not part of the prototype and are
   usually most of its weight. Ship what the HTML actually _loads_, which is
   not the same as what it _links_: some artifact runtimes keep their imagery
   in a hidden sidecar file, and leaving it behind renders blank slots with no
   error. `ls -A` the source, and load the copy in a browser before you trust
   it.
6. **Write the story file.** Copy an existing one. Give it
   `parameters: prototypeParameters` and one story per page.
7. **Write down the question it answers** in the meta docblock — in one
   sentence, plus what decides it and what supersedes it. A prototype with no
   recorded question is a screenshot, and there are cheaper ways to store
   screenshots.

Then `pnpm storybook`. That is the only command.

## Using one

Read a prototype for **the argument** — what it proposes, what it deliberately
refused, what it decided that no frame decided. That is what it is good for and
what nothing else in the repo carries. The mobile-menu capture spends more room
on _what it refuses from Facebook_ than on what it takes, and that half is the
part a component file could never hold.

Be careful with values. A capture may cite tokens by name and still not be
bound to them — the mobile-menu page hard-codes `--o3-*` variables copied from
`packages/tailwind-config` at capture time, which is honest but frozen. If a
token moves, the page keeps the old number and says nothing. Check values
against `packages/tailwind-config/tokens/` and Figma, never the other way
round. If a prototype and Figma disagree, Figma wins and the prototype is
stale — say so in its docblock rather than quietly leaving both.

The frames render exactly as delivered: their own styles, their own fonts,
their own layout code. Nothing here imports `@o3/ui`, and nothing here should
be refactored to. Editing a captured prototype makes it stop being a record of
anything — if the artifact changes, capture the new version beside the old one
rather than editing in place.

## Two things that are deliberately off

**Accessibility checks.** The suite runs axe as an error on every story (ADR
0004), and axe traverses same-origin iframes — so an unsuppressed prototype
reports the artifact's violations as failures of this repo. `prototypeParameters`
sets `a11y: { test: 'off' }`, on prototype stories only. Components keep the
rule. Fixing a capture's a11y would mean editing a historical record to pass a
test about code we don't ship.

**Access control.** These inherit whatever protects the deployed Storybook —
they are not separately gated. Anything that shouldn't be publicly linkable
shouldn't be captured here.
