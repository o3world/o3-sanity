# 0007. Migration wins the facts, Figma wins the page

- **Status:** Accepted
- **Date:** 2026-08-01
- **Deciders:** NickO3 + Claude
- **Related:** [issue #40](https://github.com/o3world/o3-sanity/issues/40), [issue #33](https://github.com/o3world/o3-sanity/issues/33), [issue #22](https://github.com/o3world/o3-sanity/issues/22), [issue #32](https://github.com/o3world/o3-sanity/issues/32)

## Context

Map #33 says **"Figma wins on everything — visual language, page composition,
component inventory, and copy. Where Figma disagrees with shipped content,
Figma is right and the shipped content changes."**

Read literally that is dangerous, and the danger is concrete rather than
theoretical. The Case Study frame (`1710:2300`) contains a fully written case
study — narrative headline, stats, outcomes — as **demo copy**. Applying the
blanket rule would let a designer's placeholder overwrite what a real client
engagement actually achieved. "89% → 114% NRR" is a claim about a business, not
a type specimen.

The reverse failure has already happened in the other direction. The homepage
showcase needed three case-study cards before any had been translated, so three
were hand-authored (#20). Auditing them against WordPress:

| Seed                     | WordPress case study                                                                  |
| ------------------------ | ------------------------------------------------------------------------------------- |
| `caseStudy-seed-aramark` | **None.** Real client, invented engagement write-up.                                  |
| `caseStudy-seed-chop`    | **None.** Real client, invented engagement write-up.                                  |
| `caseStudy-seed-ironman` | Exists, not yet translated (`case-studies-ironman-digital-experience-drupal-acquia`). |

#32 §1.3 flagged `aramark`. **`chop` is the same problem and was not flagged** —
found by diffing the three seeds against the 20 extracted case studies. Both
describe work for real, named clients that O3 has never published a case study
about.

So the question this ADR answers is not "which source wins" but "which source
wins _about what_".

## Decision

### The conflict rule

**Migration wins the facts. Figma wins the page.**

| Figma is authoritative for                                       | WordPress is authoritative for                                   |
| ---------------------------------------------------------------- | ---------------------------------------------------------------- |
| Page composition — which sections, in what order                 | Facts about real client engagements: stats, outcomes, dates      |
| Visual language, component inventory, variants                   | Published editorial: perspective bodies, bylines, categories     |
| **Copy it authors** — greenfield pages the frames actually write | **Copy about the world** — anything asserting something happened |

The split follows from what each source _is_. A Figma frame is a design
artefact: its copy is authored to show the design working, and for a greenfield
page like About that copy **is** the content, because nothing else wrote it. A
WordPress case study is a record of an engagement, reviewed by the people who
did the work and often by the client. Figma cannot outrank it on the facts
because Figma was never asserting them.

This is a **refinement of #33, not a contradiction of it.** Figma still wins
every design question and every piece of copy it is the only author of.

### Sourcing order

Per route, in order: **migrate** from WordPress where the content exists →
**seed from the frame's own copy** where Figma authored it → **seed
provisionally** where neither exists, so the link still resolves.

Seeding from a frame is a **transcription** job with a provenance trail, not a
writing job — the frames carry finished copy.

### Provenance mechanism

Two additive fields on the existing `migration` object, chosen over overloading
`sourceId` because a document can be both seeded and Figma-transcribed and
`sourceId` already means "which pipeline lane produced this":

- **`figmaNode`** — the canonical frame the copy was transcribed from
  (`1680:2134`). Node ids use `:`, as the MCP tools do; a share URL's
  `?node-id=` uses `-` and is frequently a _child_ of the frame.
- **`provisional`** + **`provisionalNote`** — the coverage-gap marker, and what
  would clear it.

`provisional` is enforced mechanically rather than by convention.
`seed.test.ts` fails if a **case study not sourced from WordPress** is missing
it, which is exactly the class the audit above found. `verify` lists every
provisional document each run as a **notice, not a finding** — placeholders are
how a route resolves before its content exists, so failing on them would keep
`verify` red for the entire build-out, and a red check nobody can fix is a check
nobody reads.

### The three placeholders

All three are marked provisional and **carried forward**, not deleted — the
homepage showcase is a canonical frame and needs three cards. `ironman` clears
when #22 translates its real source; `aramark` and `chop` have no source to
translate and need either a real case study or replacement by a client that has
one. Nine of the 20 extracted case studies could back that third card today.

## Alternatives considered

### Take #33 literally — Figma wins copy outright

- **Pros:** one rule, no per-field judgement, exactly what the map says.
- **Cons:** lets demo copy overwrite real client outcomes. The Case Study frame's stats are a design specimen; publishing them as a client's results is a factual claim nobody made.
- **Why not:** the map's author was settling _design_ authority. Reading it as authority over facts about the world is a scope it was never asserting.

### Delete the fabricated seeds

- **Pros:** invented client work cannot ship if it does not exist.
- **Cons:** the homepage showcase is a canonical frame with three cards; deleting two leaves a designed section unrenderable, and the gap is invisible until someone loads the page.
- **Why not:** provisional-and-visible beats absent-and-forgotten. The marker makes them impossible to publish accidentally and lists them every `verify` run.

### Overload `sourceId` with a `figma:` prefix

- **Pros:** no new fields; matches the existing `wp:` / `seed:` namespacing.
- **Cons:** a Figma-transcribed seed is genuinely both — `seed:` describes the lane that produced it, `figma:1680:2134` describes where its words came from. One string cannot hold both without inventing a compound grammar, and `seed.test.ts` already asserts `sourceId` starts with `seed:`.
- **Why not:** the two facts are independent, so they are two fields.

### Make `provisional` a `verify` failure

- **Pros:** impossible to ignore; forces resolution.
- **Cons:** `verify` would be red from now until launch, through every ticket that has nothing to do with content sourcing.
- **Why not:** a check that is always red is a check that gets ignored, and then the real findings under it get ignored too.

## Consequences

- `migration` gains three readOnly fields. Additive — every existing document
  stays valid, and `load.ts` already spreads the object so nothing changes in
  the loader.
- **A hand-authored case study now fails the suite unless marked provisional.**
  That is the point: the next person to fill a gap with plausible copy is
  stopped by a test rather than by review.
- `provisionalNote` is required whenever `provisional` is set. A bare boolean
  says something is wrong but not what would fix it, and "no WordPress source
  exists" and "waiting on #22" call for opposite actions.
- The per-route table lives in
  [`docs/content-sourcing.md`](../content-sourcing.md), not here — it changes
  as pages get built, and an ADR should not.
- **Launch gate:** no document may be `provisional` at launch. That belongs to
  #48 ("every top-level link resolves"), which now has a machine-checkable
  definition of the content half of its job.
