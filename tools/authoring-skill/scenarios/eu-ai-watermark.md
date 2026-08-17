# Scenario: EU AI Act watermark insight (baseline)

## The ask

Nick (O3 World principal) opens with:

> "I want to write a new insight about the EU AI regulations on AI-generated
> content. We have a drafty-drafty earlier attempt — its facts are below, use
> them as raw material, but this is a fresh piece, not a revision. The point is
> basically: this is a real law, and has real teeth. That said, the remedy is
> what we strongly recommend anyway if you don't want your site becoming a
> slop house."

This is the **brief branch** (a new piece), not review mode.

## Persona

Nick, principal at O3 World, a digital agency. Direct, allergic to hedging and
to AI-sounding copy. Answers in one or two sentences and nods to good
recommendations rather than composing his own.

## Scripted answers

- **Who is this for?** — "Marketing and digital leaders at mid-size companies
  who ship AI-assisted content on their sites. The person who'd hire us."
- **What is the one claim?** — Nod to any recommended phrasing that captures:
  the EU AI Act's disclosure rule is real and has real teeth, but the way out
  of it — genuine editorial review — is exactly what you should be doing
  anyway so your site doesn't become a slop house.
- **Which content type?** — "Insight."
- **What is the warrant?** — "The law's carve-out and good publishing are the
  same standard. The exemption asks: did a competent person examine the
  substance, and does someone bear responsibility for publishing it? That's
  just the definition of editing."
- **What evidence is in hand?** — "Everything in the old draft's notes below.
  Nothing else — if you need more, say so."
- **Thesis confirmation** — confirm the recommended sentence if it carries the
  claim above; otherwise ask for one revision and confirm that.
- **Arc + section list confirmation** — confirm the proposed arc and section
  list as recommended.
- Anywhere else the skill needs a nod, Nick nods to the recommendation.
- Where the scenario is silent (a fact nobody scripted), Nick says "I don't
  have that" — it stays a gap.

## Raw material (the old draft's facts — the only facts that exist)

Timeline: every Claude model launched on or after August 2, 2026 marks the
text it produces. The mark is woven into words, survives copy-paste and some
editing. Images and SVGs get C2PA provenance signatures instead. Applies
across API, apps, Claude Code, and cloud resellers, no opt-out. Older models
not yet marked; Anthropic working on them.

Detection: no public detector exists yet; only Anthropic can read the mark.
Anthropic says it is working to enable third-party detection and will publish
the mechanism later. February 2, 2027 is the EU deadline for public detection
through industry standards. Until then, "a watermark is a fact about a
document that almost nobody can check."

What the mark indicates: a detected mark means the content *may have been
processed* by Claude — not that Claude wrote it. Proofreading, translation,
and summarization all leave marks. The signal is "roughly one bit, and a noisy
one." Heavy editing can remove it; short passages lack signal. Anthropic
states it "was never a human-versus-machine detector."

The law (EU AI Act, Article 50): applies to published, informative content
about public-interest matters. The provider must mark machine-readably; the
deployer must disclose visibly to humans — disclosure "understandable to a
person at first exposure, without technical tools." Editorial-review
carve-out: content undergoing deliberate examination by competent persons who
bear editorial responsibility is exempt. Spell-checking and grammar correction
explicitly fail that threshold. Penalty: €15 million or 3% of worldwide annual
turnover, whichever is higher.

Institutional risk: we have run this experiment before with AI classifiers,
and the people it hurt worst were the ones writing in a second language. A
one-bit signal invites institutions to treat the mark as a verdict rather
than evidence. A missing mark tells you nothing, but institutions with
detectors may read absence as clearance.

Strategic interests: training pipelines want to filter synthetic text from
corpora; watermarks are "radioactive" — fine-tuning on marked output leaves
traces in the resulting model. Compliance cost advantages large labs over
small ones.

Recommendation: adopt the EU's substantive standard regardless of
jurisdiction. Did a competent person examine the substance? Does someone bear
responsibility for publishing it?

## Run notes

- `development` dataset, drafts only, per the skill. Real writes are wanted —
  the brief and the draft are demo artifacts.
- Beyond the standard report, record every point where the scenario wanted a
  capability the skill's text does not have (e.g. Nick's opening implies
  research/source-gathering the skill never offers, and hands over raw
  material the skill's rules may not know where to put).
