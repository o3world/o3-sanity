# Composition catalog

Two parts. **Part one — composing a page** is which band follows which. **Part
two — composing a piece** is how a long argument moves inside one body.

They ground differently, and reading one part's authority into the other is the
mistake to avoid:

- Part one is counted against the nine built pages, and **a canonical Figma
  frame outranks all of it**.
- Part two's craft claims answer to the published corpus — the decade of real
  writing the voice guide was calibrated against. A Figma frame has nothing to
  say about where an essay turns.
- **Part two's argument-shaping standards answer to neither.** "A warrant
  somebody could disagree with" is a criterion borrowed from rhetoric, not an
  observation about how O3 writes. It is the test the brief applies. Do not
  read it as a description of the corpus, and do not go looking for the nine
  pages that prove it.

## Part one — composing a page

How o3world.com pages are put together: what order bands go in, which surfaces
they paint, and which block carries which job. Read this with the schema — the
per-block descriptions in `get_schema` say what one block is for, and this says
how blocks sit next to each other.

**A canonical Figma frame outranks everything here.** These are the conventions
for assembling a page nobody has drawn yet. When a frame exists for the page,
transcribe the frame: it wins on composition, visual language, and the copy it
authors. The observed exceptions to almost every rule below are all in pages
transcribed from frames, which is exactly as it should be.

Every claim here is counted against the nine built pages. Where the evidence is
one or two instances, it says so — treat those as precedent, not law.

### The spine

Every page is a flat, ordered array of full-width bands. A reader meets them in
order, so composition is the argument's shape: what is claimed, what proves it,
what to do about it.

```
heroSection            the claim              always first, always ink
  …the body…           proof, then substance
ctaSection             the ask                 last, always ink
```

- **`heroSection` opens every page.** 9 of 9, always `surface: ink`. Nothing
  else opens a page.
- **`ctaSection` closes it.** 8 of 9, always `ink`. The exception is `/contact`,
  which has no CTA anywhere and ends on a quote — a page the reader was already
  sent to has nowhere further to send them. If a page's whole purpose is the
  action, it does not also need to ask.
- **Ink bookends.** The dark hero and the dark close frame everything between
  them. This is the single most reliable shape in the corpus.
- Four to eight bands. The transcribed frames run longest (About is eight);
  assembled pages settle at four or five.

### Surface rhythm

Three surfaces: `white`, `bone`, `ink`. Every band in every page sets one
explicitly — no page leans on the default.

- **`bone` is the band-after-hero surface** (5 of 9). It softens the step down
  from the ink hero before the page gets to work.
- **Mid-page `ink` is a feature moment, not a normal band.** Three instances in
  the whole corpus, each one the page's centrepiece: the homepage's case
  showcase, the Solutions diagram, the 1682 video. Reach for a third ink band
  and you are claiming this is the thing the page is about.
- **`ctaSection` never follows another ink band** (8 of 8). The close needs the
  contrast to land; give it a lighter band to rise out of.
- **Two bands may share a surface.** "Never repeat" is not a rule and is broken
  on three pages — usually when one block repeats to continue a single idea
  (the homepage's two rail bands, Live's three in-flight bands). What breaks a
  long run is a change of subject: Live's third band switches to `bone` where
  the content stops being the studio's own work.

### The opening

The hero states the claim; the band under it has to pay something back
immediately. There is no single block for this — there is a job. Observed:

| Second band          | Pays back with            | Seen on               |
| -------------------- | ------------------------- | --------------------- |
| `logoWallSection`    | borrowed credibility      | home                  |
| `layoutSection`      | the positioning statement | About, Ventures, 1682 |
| `formSection`        | the action itself         | Contact               |
| `inFlightSection`    | the actual list           | Live                  |
| `featureGridSection` | the diagram               | Solutions             |
| `mediaSection`       | the subject, shown        | both venture pages    |

What none of them do is warm up. Background, history and context do not go
here; if the page needs them, they come after the payoff.

**The intro molecule** (3 instances — a real idiom): `layoutSection` at
`columns: 2` holding `richText` + `figure` + `cta`. A statement, a picture, and
one link out. It is the default second band for a page with something to
explain rather than something to show.

### Choosing the block

Match the job the band has to do, not the shape you imagine:

| The band's job                  | Block                               |
| ------------------------------- | ----------------------------------- |
| State the claim                 | `heroSection`                       |
| Borrow credibility              | `logoWallSection`                   |
| Prove it with work that shipped | `caseShowcaseSection`               |
| Let someone else say it         | `quoteSection`                      |
| Lay out parallel options        | `railPanelsSection`                 |
| Show the shape of the practice  | `featureGridSection`                |
| Show who does it                | `personGridSection`                 |
| Show current momentum           | `inFlightSection`                   |
| Show the thing existing         | `mediaSection`, `screenGridSection` |
| Send them somewhere to read     | `insightsCarouselSection`           |
| Recruit                         | `roleListSection`                   |
| Start a conversation            | `formSection`                       |
| Say words no band is built for  | `layoutSection`                     |
| Close                           | `ctaSection`                        |

`layoutSection` is the honest answer more often than it looks — it carries nine
instances across five pages, doing prose, multi-column lists, an intro
statement and a video stage. Try it before concluding the design system is
missing a block.

### Sequences worth reusing

- **Rail into the close** (3 instances): a `railPanelsSection` immediately
  before `ctaSection`. Laying out the options and then asking is a complete
  small page on its own — it is the whole body of Solutions and of the venture
  pages.
- **Show, then explain** (2 instances, both venture pages):
  `mediaSection → railPanelsSection`. The subject, then what it is made of.
- **Read on, then ask** (2 instances, and both of the corpus's carousels):
  `insightsCarouselSection → ctaSection`. The carousel is always the last band
  before the close, never buried mid-page.
- **The proof triptych** (1 instance, the homepage): `logoWallSection →
caseShowcaseSection → quoteSection` — who trusts us, what we did, what they
  said. Three kinds of proof escalating from association to evidence to voice.
  One instance, so precedent rather than convention, but the escalation is
  worth stealing.

### One block, more than one job

Five blocks change job with a knob rather than being two blocks. Recognising
this is what stops a page proposing a block that already exists:

- **`railPanelsSection`** — `layout: rail` with `rail: label` is the default
  list of parallel things; `rail: number` makes it a sequence of steps;
  `layout: cards` makes it a row of ink cards; `layout: rows` gives each one a
  numbered full-width row with room for labelled breakdowns under its prose. Surface tracks the job: `white`
  when the band leads the page's argument and carries an intro, `bone` when it
  is a secondary list.
- **`featureGridSection`** — a set of parallel short claims, each a mark with a
  heading and optional body. `grid` pairs mark and copy two across; `stack`
  sets the mark above the copy three across, and is the one to reach for when
  the features are single lines; `rows` gives each a hairlined full-width row
  with the body pinned right; `orbital` puts four on the diagram and takes
  exactly four. Reach for it whenever several things are true in the same way
  and none needs a band of its own.
- **`inFlightSection`** — `cards` for work in progress, `rows` for dated
  appearances and ideas. The same entry, two compositions.
- **`logoWallSection`** — `plates` gives each mark a hairlined 280px square
  and makes the row the band's subject; `bar` drops the plate and shortens the
  strip, so the logos read as a footnote to the heading above them. Reach for
  `bar` when the band is naming someone else's customers rather than claiming
  them.
- **`ctaSection`** — with `body` it makes a closing argument; heading and
  button alone is a quieter "back up one level" link, which is what both
  venture detail pages use.

### What the built pages do not show

Being honest about the gaps, so an author does not read absence as prohibition:

- **`screenGridSection`** appears on no page, only inside case studies, always
  as the final band. A page needing tiled product screens is new ground.
- **`statGroup`** is used by no page seed at all, and **`mark` never appears as
  a column item** — it is used only as a field inside other blocks' items.
- **`listingSection` has no rendered route.** Do not compose it.
- **`buttonGroup` and the jump-link idiom are authorable and unused.** Every
  band takes an `anchor` — a name the editor writes, never derived from the
  heading — and a `buttonGroup` holds a row of buttons pointed at those names.
  A long page can be made navigable without anyone shipping code. No page seed
  does it yet.
- Several knob values are unexercised: the `capture` media variant, full-bleed
  media, the `molecule` quote decoration, and `disc` marks. Available, unproven.

### Anti-patterns

- **A page with two asks.** One `ctaSection`, at the end. A second CTA band
  mid-page competes with the close.
- **Warming up.** Background before the payoff band. If the reader has to get
  through context to find the point, the point is in the wrong place.
- **A third ink band.** Ink is the frame and the one feature moment. A page
  where everything is emphasised has emphasised nothing.
- **Reaching for a new block.** Before concluding one is missing, check whether
  a knob on an existing block does the job, and whether `layoutSection` carries
  it. The design system is deliberately small — ten well-known blocks beat
  twenty half-known ones.
- **Inventing proof.** `caseShowcaseSection` and `logoWallSection` render only
  what the referenced documents already say. If the proof does not exist as a
  document, the band cannot fake it.

## Part two — composing a piece

An insight or a case-study narrative is not made of bands. It is one argument,
and it either has a shape or it is a set of correct observations in no
particular order.

This part opens with the standards the brief applies before a word is drafted:
what a claim has to be, what carries it, and what counts as enough evidence.
They are the test, not a description of the corpus — read the note at the top
of the file before treating any of it as precedent.

### The claim

One sentence, and it has to be **arguable**. State its opposite out loud. If
the opposite is something nobody would ever say — "shipping working software
matters", "clients want value" — the sentence is a platitude wearing a claim's
clothes, and everything built on it will read as filler however well written.

- A claim names a subject and asserts something about it. "AI and delivery" is
  a topic; "the tools are new and the management is old" is a claim.
- A claim the reader already agrees with is not worth 2,000 words. A claim the
  reader would refuse outright is a different piece — one that has to earn the
  disagreement rather than assume it.
- Narrow beats broad. "Design systems fail" is unwinnable. "A design system
  fails when nobody owns the second version" can be argued in one piece.

### The warrant

The unstated principle that carries the evidence to the claim. Toulmin's term,
and the one thing an interview can extract that a draft cannot invent.

Evidence says _what happened_. The claim says _what is true_. The warrant is
the sentence in between, and it is usually the sentence nobody writes down:

> We rebuilt the site in a weekend (grounds), so the bottleneck was never
> typing speed (claim) — because the work that takes the time is deciding, not
> producing (warrant).

- **A defensible warrant is one somebody could disagree with.** Same test as
  the claim, applied one level down. "Deciding is the slow part" is arguable;
  a reasonable person can hold that the producing was always the slow part and
  the tools just got faster.
- **A warrant is a warrant _for_ something.** It cannot be settled before the
  claim exists, which is why the brief asks for it in the second round.
- **One warrant per piece.** If two are load-bearing, one of them is the real
  subject and the other is a second piece.
- If the warrant only holds for this one case, the claim is a story, not an
  argument. Write it as a story — that is an honest piece — but stop calling it
  a thesis.

### The evidence

Named, dated, numbered, or attributable. What O3 did, what it cost, who said
so, what the number was.

Evidence is **too thin** when:

- The only support is the author's confidence. "We've seen this again and
  again" with no instance behind it.
- The instances are illustrations rather than support — they show what the
  claim would look like if true, and would look identical if it were false.
- It is one case carrying a general claim. One project is a story; the general
  claim needs either a second instance or a narrower claim.
- The number has no denominator, no baseline, or no source. "41% fewer missed
  appointments" is evidence; "significantly fewer" is a mood.

When the evidence is thin, there are three honest moves and one dishonest one.
Narrow the claim until the evidence carries it; say plainly what would change
your mind; or write the smaller piece you can actually support. The dishonest
move is to raise the register until the prose sounds like proof.

### Mush

The failure this whole part exists to prevent: a claim with grounds and no
arguable warrant. Every sentence is true, every paragraph is competent, and
there is nothing at stake anywhere in it.

The tells, in the order they show up:

- The claim nobody would contest, so nothing in the piece has to work.
- Evidence that illustrates instead of supports.
- A middle that changes subject rather than advancing — three sections that
  could be read in any order.
- An ending that restates the opening in warmer words.

A piece that fails this is not fixed by editing sentences. It goes back to the
brief.
