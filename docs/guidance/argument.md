# Long-form argument

An insight or a case-study narrative is not made of bands. It is one argument,
and it either has a shape or it is a set of correct observations in no
particular order. Arranging the page around it is a different job, and that one
is `o3-composition`.

This document opens with the standards the brief applies before a word is
drafted — what a claim has to be, what carries it, what counts as enough
evidence. Then the shape: how the piece opens, how the argument moves, where it
turns, how it ends, and how long it runs.

**Where the authority comes from.** The craft claims answer to the published
corpus, the decade of real writing `o3-voice` was calibrated against. The
argument-shaping standards answer to neither the corpus nor a Figma frame: "a
warrant somebody could disagree with" is a criterion borrowed from rhetoric,
not an observation about how O3 writes. It is the test the brief applies. Read
it as the test, and do not go looking for the pages that prove it.

## The claim

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

## The warrant

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

## The evidence

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

## The first two paragraphs

The reader arrived having already read the title and the excerpt. Both made a
promise. The opening starts paying it; it does not restate it.

"Nothing warms up" is `o3-composition`'s rule for a page. In prose it means:

- **The first sentence is already inside the argument.** Not the industry, not
  the year, not what everyone knows. `the-design-team-moved-the-file` opens on
  a claim the previous post made and the condition that claim quietly rests on.
  `how-we-redesigned-our-website-in-a-single-weekend` opens by conceding what
  its own title oversold.
- **The excerpt is spent.** Whatever it promised, the opening pays out rather
  than repeating it. A first paragraph that paraphrases the excerpt has taught
  the reader, in their first fifteen seconds, that the piece repeats itself.
- **Plant the number early so the turn can call it back.** 69 commits and 272
  posts; 527 prompts and $127. Each lands in the first three paragraphs, plainly
  and without ceremony — and the strongest of them return at the turn carrying
  more than they did at the start. "The thousand dollars bought the typing" only
  works because the thousand dollars was stated flatly, 900 words earlier.
- **Context is not an opening.** Background and history are load-bearing in the
  middle, where the reader has a reason to want them. In the first two
  paragraphs they read as delay.

## How the argument moves

Three arcs the corpus actually uses. Naming one at the outline step is the
point: a second draft should be a **different shape**, not the same paragraphs
reordered.

**The dependency underneath** — `the-design-team-moved-the-file`. Open on a
claim already made and in force. Name the condition it quietly rests on: "It
stays true only while someone notices when the file changes." Show the
condition was not being met. Build the thing that meets it. Test it against one
dated event. State plainly what it still cannot do. End on what has changed
hands. Reach for it when the subject is a system you built and the honest
subject underneath is the assumption it repairs.

**Concede, then reframe** — `how-we-redesigned-our-website-in-a-single-weekend`.
Grant the objection the title invites, in the first line: "Start with the part
that makes that title honest: the design took a month." Put the facts down,
dated and numbered. Then say what actually changed, which is never what the
reader assumed — "What changed is not that machines write code now… What
changed is what we spent the weekend on." The middle runs the mechanism in the
order the work happened. Reach for it when the headline is true and sounds like
a boast.

**The number is not the story** — `we-replaced-a-35000-saas-tool-in-527-prompts`.
Lead with the figure, then refuse the story it invites, inside two paragraphs:
"The savings are real. But the money is not the most interesting part of this
story." Spend the piece on the harder thing underneath — there, the distance
between a working prototype and something a company runs its finances on.
Reach for it when you have one striking fact whose obvious reading is thin.

### The shuffle test

What the three arcs share is one test: **every section is only readable in its
place.** Move the fourth above the second in any of them and the piece stops
working. Sections that survive shuffling are a list, not an argument.

## The turn

The sentence that reframes the piece. It is not the thesis — the thesis was
settled in the brief, and the reader has met it already in the title. The turn
is the moment the evidence stops accumulating and starts meaning something.

Where it sits: **after the mechanism, before the general claim.** All three
arcs put it in the last third, and none of them put it at the end.

> The machines typed. We decided. The thousand dollars bought the typing. The
> month bought the design. The weekend bought nothing but decisions, made in
> order, out loud.

That earns its place because the preceding 800 words are the mechanism — the
maps, the tickets, the reviews, the tests. The turn does not introduce
anything. It names what the reader has just been shown and could not yet have
put into words. If it could have been written before the middle, the middle is
not doing any work.

Usually the turn is **the warrant, said out loud for the first time.** The
brief already made you write it down; the draft withholds it until the evidence
has been laid out, then states it. It is also the sentence a pull quote reaches
for, so it has to exist in the prose before there is anything to lift.

## The ending

The turned observation is not invented at the end. It is **the consequence of
the turn, stated as a fact or a cost** — what changed hands, what was actually
bought, what no longer belongs to anyone:

> Moving the file is still the design team's job. Noticing no longer belongs to
> anyone.

> We didn't buy a website for a thousand dollars. We bought the ability to keep
> changing it for about that much, forever.

Both restate the turn one level up, and both are shorter than the paragraph
before them. `o3-slop` says what an ending is not; this says where the good one
comes from. If you cannot derive the last paragraph from the turn, the turn was
decorative.

Two endings the corpus does have and should not repeat. The **sales line** —
"If you're trying to figure out which tool in your stack is worth replacing,
let's talk" — which converts an argument into a pitch in its last sentence. And
the **register lift**: an abstract noun raised at the close to sound conclusive,
as in "that's the real transformation hiding in plain sight." Both are the same
move, reaching for a feeling because the argument has run out.

## Length and proportion

Measured across all 275 published insights: median **498 words**. Sixty-eight
run past 800, thirty-four past 1,000, eleven past 1,200, two past 1,500, and
**none reaches 2,000**. The median insight is an announcement, not an argument;
this document is about the top of that distribution rather than the middle of
it.

A long argument here is **1,100–1,400 words** — the three arc pieces are 1,164,
1,340 and 1,374. Past 1,500 you are outside all but two pieces in a decade,
which is not forbidden but is worth stopping over: usually it means the claim
is two claims that have not been separated yet.

The middle is most of it. Eyeballing the three arc pieces by section, the split
runs roughly **15% opening, 60% mechanism, 25% turn and ending together**. So:

- **The middle spends its words on mechanism, in an order the argument
  requires** — how the thing works, what it cost, what happened when. Not more
  reasons the claim is true.
- **A section that could be cut without breaking the next one should be cut.**
  That is the shuffle test, applied section by section.
- **The ending is short.** Both endings quoted above are two sentences. An
  ending that needs a paragraph to land is still arguing.

## Mush

The failure this whole document exists to prevent: a claim with grounds and no
arguable warrant. Every sentence is true, every paragraph is competent, and
there is nothing at stake anywhere in it.

The tells, in the order they show up:

- The claim nobody would contest, so nothing in the piece has to work.
- Evidence that illustrates instead of supports.
- A middle that changes subject rather than advancing — three sections that
  could be read in any order. This is the shuffle test failing: no arc was
  chosen, so the sections are a list of correct observations and the reader is
  the one being asked to assemble them.
- No turn. The evidence accumulates to the last paragraph and then stops.
- An ending that restates the opening in warmer words, because there was no
  turn for it to be a consequence of.

A piece that fails this is not fixed by editing sentences, and it is not fixed
by adding an arc on top of it. It goes back to the brief.
