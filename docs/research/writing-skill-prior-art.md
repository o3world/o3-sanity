# Prior art for an O3 writing skill

Research for a proposed org-wide Claude Code plugin that helps a person author and edit pages on
o3world.com: hold the brand tone, prevent AI slop, choose the right block for the message, and get
from a fuzzy idea to a page that argues something. Primary sources only — official docs, skill
files read off disk, schema fetched live from the deployed workspace. Researched 2026-08-14/15.

**The headline: most of this is already built.** `tools/authoring-skill` is already a Claude Code
plugin, already installable from a repo-root marketplace, and the repo already fans its voice
knowledge into the dataset. Four things are missing: composition (which block carries which message),
argument shaping, a review mode for editing pages that already exist, and Portable Text mechanics
that a first-party Sanity plugin already ships. Building a new writing skill from scratch would
rebuild what works and still miss those four.

## What already exists here

### Four surfaces, one corpus

The voice knowledge is authored once as three markdown files and reaches agents through two doors.
A fourth surface — the schema — carries a different kind of knowledge through a third:

| Surface | Path | Reaches | Loaded by |
| ------- | ---- | ------- | --------- |
| Repo skill | [`.claude/skills/o3world-copy/`](../../.claude/skills/o3world-copy/) — `SKILL.md` (194 lines), `brand.md` (59), `slop.md` (192) | An agent working in this checkout | Claude Code's skill discovery, model-invoked |
| Guidance store | `guidance` documents `guidance-o3-voice`, `guidance-o3-brand`, `guidance-o3-slop` | Any MCP consumer of the dataset | `pnpm guidance:sync`, from the same three files |
| Authoring plugin | [`tools/authoring-skill/skills/o3-authoring/SKILL.md`](../../tools/authoring-skill/skills/o3-authoring/SKILL.md) (68 lines) | Claude Code (plugin) and Claude Desktop (ZIP) | `/plugin install`, or `pnpm build:skill` → upload |
| Schema descriptions | `packages/sanity/src/schemas/` field `description` strings | Any MCP consumer, via `get_schema` | Deployed with `sanity deploy` |

The direction of flow is already decided and it is the right one. `tools/guidance/src/sources.ts`
declares the corpus as three rows pointing at repo-relative paths; `sync.ts` writes one **published**
document per row with a deterministic id (`guidance-<key>`), deletes anything whose row is gone, and
strips the skill frontmatter on the way through because "frontmatter is packaging metadata for
Claude's skill loader, not guidance". `check.ts` exits non-zero on drift, and its comment names the
failure precisely: a stale guidance document does not error, it just makes everything written that
session slightly wrong. Every field on the `guidance` document type is `readOnly` in Studio for the
same reason.

**The `o3-authoring` skill carries no knowledge on purpose.** It is 68 lines of bootstrap: fetch
`*[_type == "guidance"]{key, title, body}`, fetch `get_schema` per type (the no-type overview omits
field descriptions, which is where the authoring guidance lives), fetch one or two exemplars, then
four hard rules — drafts only, never invent facts, reuse-or-flag imagery, portable text is raw JSON —
and a five-step workflow. If no guidance documents exist it stops rather than improvising the voice.
That contract is the thing worth protecting.

### The plugin already ships

[#95](https://github.com/o3world/o3-sanity/issues/95) closed COMPLETED on 2026-08-13 (commit
`8043cb1`). On disk today:

- [`tools/authoring-skill/.claude-plugin/plugin.json`](../../tools/authoring-skill/.claude-plugin/plugin.json) — `o3-authoring` v0.1.0, `license: UNLICENSED`.
- [`tools/authoring-skill/.mcp.json`](../../tools/authoring-skill/.mcp.json) — the hosted Sanity MCP at `https://mcp.sanity.io`, so installers get the Sanity tools on enable and OAuth as themselves via `/mcp`. No credentials distributed.
- [`.claude-plugin/marketplace.json`](../../.claude-plugin/marketplace.json) at the repo root — marketplace `o3world`, one plugin, `"source": "./tools/authoring-skill"`.

Install is `/plugin marketplace add o3world/o3-sanity` then `/plugin install o3-authoring@o3world`.
`claude plugin validate` passed on both manifests when it landed. What #95 explicitly did *not* do:
install it on anyone's machine, and prove the capability — the stage gates
[#69](https://github.com/o3world/o3-sanity/issues/69) (an insight),
[#71](https://github.com/o3world/o3-sanity/issues/71) (a page from scratch) are both still open.

### The open tickets are the actual gap

Map [#63](https://github.com/o3world/o3-sanity/issues/63) is the parent, and its founding decision is
the hybrid architecture: the skill carries workflow, Sanity carries knowledge. Two of its children
are exactly the user's aim #3:

- **[#66](https://github.com/o3world/o3-sanity/issues/66)** (open, `wayfinder:grilling`) — decide what
  goes in schema descriptions versus a composition catalog, what the writing standard for a
  block description written for an AI author is, and what stops it drifting as blocks are added.
- **[#73](https://github.com/o3world/o3-sanity/issues/73)** (open) — the execution follow-up: extract
  composition rules from the built pages, land them as an `o3-composition` guidance document (one
  row in `sources.ts`), write per-block descriptions, wire the drift rule.

Nothing is ticketed for aim #4 (fuzzy → argument). The `o3-authoring` workflow's step 1 is "ask the
two or three questions that pin down audience, the one point the piece makes, and which content type
fits" — one sentence, no method behind it.

### What an authoring agent actually sees today

Fetched live from the deployed `o3` workspace (`naorcr6k` / `production`), `get_schema` for
`railPanelsSection` returns every field with its `description`, a `title` of "Rail + panels", and
**no block-level description at all**. There is no sentence anywhere in that payload saying when a
page should reach for this band rather than `disciplineGridSection`. Two further facts:

- `packages/sanity/src/schemas/blocks/defineBlocks.ts` contains no `description` handling, so a
  block-level description is not currently expressible through the factory. #73's "write per-block
  descriptions" needs a factory change first.
- **The deployed schema is stale.** The repo's `railPanelsSection` panel carries a `mark` field
  ([`section.ts:180`](../../packages/sanity/src/schemas/blocks/section.ts)); the deployed schema does
  not, and its `media` description still reads "A card draws a halftone disc instead" where the repo
  says "A card draws its mark instead". `guidance:check` catches drift in the guidance corpus. There
  is no equivalent for the schema, which is the *other* half of what the skill fetches.

### The block inventory, as raw material for aim #3

Membership is declared once in
[`packages/sanity/src/schemas/blocks/registry.ts`](../../packages/sanity/src/schemas/blocks/registry.ts);
a block not listed there cannot be defined. Sixteen section blocks and six base blocks, and every
section block paints a band on one of three surfaces (`white | bone | ink`,
`packages/sanity/src/constants.ts:89`).

| Section block | The message it carries |
| ------------- | ---------------------- |
| `heroSection` | The page's opening claim — `headlineLines` (1–2), `subheading`, one `cta`. Tension → turn lives here, capped at one per page |
| `logoWallSection` | Proof by association — heading, standfirst, client marks |
| `caseShowcaseSection` | Proof by work — case-study refs, projecting `narrativeHeadline` + first stat |
| `railPanelsSection` | An ordered set of offers or platforms — `layout: rail \| cards`, panels with `railLabel`, `heading`, `body`, the quieter "Best when…" `note` |
| `quoteSection` | One borrowed voice — quote + attribution. No testimonial document type |
| `insightsCarouselSection` | Thinking, curated or latest-N by category |
| `ctaSection` | The ask — heading, two lines of body, one `cta` |
| `disciplineGridSection` | Capability as a set — `layout: grid \| orbital`; orbital takes exactly four |
| `personGridSection` | People, referenced never inlined |
| `roleListSection` | Open roles, inline objects |
| `inFlightSection` | What we're working on now — `layout: cards \| rows`, entries with an optional `date` |
| `formSection` | The inquiry band. Field set is code, `reasons` is content (ADR 0014). No handler exists |
| `layoutSection` | The one two-tier block: 1–3 columns of base blocks. The general-purpose prose band |
| `mediaSection` | A figure moment, or the case-study full-bleed capture stage |
| `screenGridSection` | Tiled product screenshots on gradient plates |
| `listingSection` | Lists pages by `pageType`. **Orphaned** — ADR 0013 removed its route |

Base blocks (`richText`, `figure`, `embed`, `cta`, `statGroup`, `mark`) compose inside
`layoutSection` columns.

**Most of the "when to use it" prose already exists** — in
[`docs/specs/schema.md`](../specs/schema.md), which explains that `disciplineGridSection` is one block
and not two because About draws four disciplines as a 2×2 grid and Solutions places the same four on
a tetrahedron, and that `inFlightSection`'s cards and rows are the same entry in two compositions.
That document is repo-only. It does not reach a Desktop session, and it is not in `GUIDANCE_SOURCES`.
This is the single largest piece of already-written material #73 can lift.

The other half — arcs, pairings, surface rhythm — is only in the built pages:
`tools/migration/data/seed/page/*.json` (nine seeds) and the per-route provenance table in
[`docs/content-sourcing.md`](../content-sourcing.md). #73 already scopes reading them.

## The platform, as the docs define it

### Agent Skills

A skill is a directory with `SKILL.md` and YAML frontmatter. `name` (max 64 chars, lowercase,
hyphens, no "claude"/"anthropic") and `description` (max 1,024 chars) are required; the optional
fields that matter here are `disable-model-invocation`, `user-invocable`, `allowed-tools`,
`disallowed-tools`, `context: fork` and `agent`
([overview](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview),
[Claude Code skills](https://code.claude.com/docs/en/skills.md)). Note the divergence from Desktop:
`build.mjs` enforces `description` ≤ 200 chars because that is the **Desktop ZIP** limit recorded in
[#65's research](https://github.com/o3world/o3-sanity/blob/research/claude-desktop-delivery/docs/research/claude-desktop-delivery.md);
Claude Code allows 1,024. A skill shared by both paths is bound by the tighter one.

Progressive disclosure is three levels: frontmatter always loaded (~100 tokens per skill), body loaded
on trigger, bundled files loaded only when referenced. Scripts under `scripts/` are executed rather
than read, so only their output enters context. Anthropic's
[best-practices page](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)
says: keep `SKILL.md` under 500 lines, keep references one level deep, name skills in gerund or
noun-phrase form, write the description in third person stating both what it does and when to use it,
give a default rather than a menu of options, and **build evaluations before writing extensive
documentation**.

`claude plugin eval` exists but is early-access and gated per organization; it was not enabled in the
session that checked. It runs each case in an isolated fresh session with only the plugin under test
loaded, supports `regex` / `tool_used` / `tool_order` / `file_exists` / `llm` / `baseline` graders,
and can A/B a with-plugin run against a without-plugin baseline. There is no public docs URL yet.
`/skill-doctor` (per-skill token cost and 7-day usage) is early-access too. **Treat both as
unavailable until someone confirms org enablement** — that is a question for Nick, not an assumption.

### Plugins

`.claude-plugin/plugin.json` takes `name` (required), `displayName`, `description`, `version`,
`author`, `homepage`, `repository`, `license`, and path fields — `skills`, `commands`, `agents`,
`hooks`, `mcpServers`, `lspServers` — plus `dependencies`, `userConfig`, `defaultEnabled` and
`renames` ([plugins reference](https://code.claude.com/docs/en/plugins-reference.md)). Paths are
relative, must start with `./`, and may not contain `..`. Default directories (`skills/`,
`commands/`, `agents/`) are scanned without declaration; the array fields *replace* the default rather
than adding to it. Our `plugin.json` declares none of them and relies on the default `skills/` scan,
which works. Matt Pocock's plugin declares an explicit `skills` array of 25 paths
(`/Users/nick/.claude/plugins/cache/mattpocock/mattpocock-skills/1.2.2/.claude-plugin/plugin.json`) —
a real example of the other style.

`.claude-plugin/marketplace.json` takes `name`, `owner`, `description`, `plugins[]`, and `renames`.
A plugin entry's `source` may be a relative path, or an object naming `github` / `git` / `npm` / a
remote `url`. If `version` is set in `plugin.json`, users get updates only when it is bumped; if
omitted, the version resolves from git tag, then `package.json`, then commit SHA
([marketplaces](https://code.claude.com/docs/en/plugin-marketplaces.md)). **Our `plugin.json` pins
`0.1.0` and has never been bumped** — every future skill edit needs a version bump or installers on
`/plugin marketplace update` may not see it.

Org distribution has two mechanisms. `/plugin marketplace add o3world/o3-sanity` is the manual path we
already document. The automatic one is settings: `extraKnownMarketplaces` and `enabledPlugins` (the
latter taking `"plugin-name@marketplace-name"` entries) are valid in user, project, local and managed
scope ([settings](https://code.claude.com/docs/en/settings.md)). A checked-in `.claude/settings.json`
therefore auto-enables a plugin for everyone who clones the repo. **This repo has no
`.claude/settings.json` at all** — only `.claude/skills/`. Managed settings (`~/.claude/managed-settings.d/`)
outrank everything and carry the enterprise controls (`strictKnownMarketplaces`,
`blockedMarketplaces`, `allowedChannelPlugins`); those are an IT decision, not an agent one.

## Prior art outside this repo

### `no-slop` — the closest overlap, and the sharpest conflict

Nick's personal install at `/Users/nick/.claude/skills/no-slop`, upstream
[`saschb2b/skills`](https://github.com/saschb2b/skills/blob/main/skills/productivity/no-slop/SKILL.md):
a 137-line `SKILL.md`, a 308-line
`slop-lint.mjs`, and 21 reference files under `references/` (ASD-STE100 in five files, the Microsoft
Writing Style Guide in seven, plus prose, structure, formatting, code comments, commits, code strings,
inclusive-and-accessible). It also carries a `CARD.md` / `CARD.manifest.json` / `CARD.svg` /
`permissions.yaml` set — a provenance card format worth noting but not adopting here.

Its architecture is genuinely excellent and worth stealing wholesale:

- **Top-down passes.** Restructure the document, rebuild paragraphs, build sentences by STE rules,
  kill word-level tells, check with the linter. The stated reason: "polishing sentences inside a
  structure that is itself slop is wasted work, so run the passes in order."
- **A real standard underneath.** ASD-STE100, standardised by the aerospace industry in 1986. The
  skill reports a measured result: "given only a banned-word list, Claude cut measured slop by 3%;
  given this system, 74%." That number is self-reported and I could not verify the methodology, but
  the claim's shape — a system beats a word list — matches what `slop.md` already discovered here.
- **A linter that scores deltas, not absolutes.** `slop-lint.mjs` emits violations per 100 words and
  says so plainly: "The absolute score means little. The delta between a draft and its revision is
  the signal." It handles overlap correctly (longest match wins, so "the utilization of" counts once)
  and explicitly hands structure back to a human read.
- **A "Don't over-correct" section** naming its own failure modes, including "chasing the score" and
  "a worse word to dodge a listed one".

**Where it pulls against us, measured.** Running its linter over the real, hand-reviewed, on-brand
homepage copy (every editorial string in `tools/migration/data/seed/page/index.json`, 394 words):

```
words=394  violations=10  score=2.50/100w  longest=25w  (flavored)
  em_dash        8
  passive_voice  1
  semicolon      1
```

Eight of ten violations are em dashes — which `slop.md` explicitly permits: "In body prose and essays,
one or two are fine where they clearly beat a comma." The linter is calibrated for a register that is
not ours. The register statement makes it explicit: no-slop targets "a German professional writing
English at C2 level… Reserved rather than enthusiastic," and its description says it is for text
"a person will read… cut the marketing voice." O3's house default is **warm-assured teaching**, with
a named openly-warm surface where "We're excited to share…" and an exclamation mark are on-brand.

Three direct collisions:

1. **`not X, but Y`.** no-slop kills it on sight. O3's signature move is tension → turn, and
   `slop.md` already spends a section distinguishing the two by testing whether both halves carry
   information. no-slop has no such reconciliation and would flatten the move.
2. **The kicker.** no-slop says end at the last real point. `slop.md` draws a finer line — a *turned
   observation* made of facts already in the draft stays; a kicker made of mood goes.
3. **Warmth.** no-slop's whole register is reserved. Aim #1 wants a distinctive voice, and aim #4
   wants an argument. Plain technical English is neither.

**And the conflict is live today.** Both `no-slop` and `o3world-copy` are model-invoked and both were
loaded in the session that wrote this. Anthropic's best-practices page warns about exactly this. On
Nick's machine, asking to write a headline can fire either.

### `writing-for-agents` (mattpocock-skills 1.2.2)

`skills/productivity/writing-for-agents/SKILL.md` (81 lines) plus `SKILL-MECHANICS.md` (22 lines).
This is the best available primary source on *how to write the thing we are about to write*, and its
vocabulary should govern the decomposition decision:

- **Context pointer** — a skill's description, or an `AGENTS.md` line naming a doc. "The pointer's
  wording, not its target, decides when the agent reaches the material." A must-have target behind a
  weak pointer is a variance bug.
- **The two loads.** *Context load* is what always-loaded material costs the window every turn.
  *Cognitive load* is what it costs the human to remember which document exists. "Not a cost to
  minimise — it is the price of human agency."
- **Information hierarchy** — in-file step, in-file reference, disclosed reference. Progressive
  disclosure is the move down the ladder, and "branching is the cleanest disclosure test: inline what
  every branch needs, and push behind a pointer what only some branches reach."
- **Completion criteria** — every step ends on a condition the agent can check. Vague bounds invite
  premature completion; "demand" ("every modified model accounted for") drives legwork.
- **Negation is a failure mode.** "Steering by prohibition drags the forbidden behaviour into context
  and makes it more available, not less… Prompt the positive." This is a direct criticism of how
  `o3world-copy` rule 7 and half of `slop.md` are written — long banned lists. Worth weighing, not
  worth panicking over: some of ours are hard guardrails, which the skill allows, but they should be
  paired with the positive target.
- **The invocation choice** (`SKILL-MECHANICS.md`): a model-invoked skill pays permanent context load
  for its description and can be reached by other skills; a user-invoked skill (`disable-model-invocation: true`)
  pays zero context load and spends cognitive load instead. "Pick model-invocation only when the agent
  must reach the skill on its own, or another skill must."

### `grilling` (mattpocock-skills 1.2.2)

`skills/productivity/grilling/SKILL.md`, 22 lines. Interview the user in **rounds**; the **frontier**
is every decision whose prerequisites are settled; ask the whole frontier at once, numbered, each with
a recommended answer; wait; recompute. "Finding facts is your job, never the user's… The decisions are
the user's." Map #63's tickets already used `/grilling` for its HITL decisions
([#66](https://github.com/o3world/o3-sanity/issues/66) and
[#68](https://github.com/o3world/o3-sanity/issues/68) both carry the `wayfinder:grilling` label).
This is the right shape for the editorial intake in aim #4 and it is already installed — there is no
reason to invent a second interview format.

### Anthropic's own published skills

[`github.com/anthropics/skills`](https://github.com/anthropics/skills) holds seventeen skills, a
`spec/` (a three-line pointer to agentskills.io) and a six-line `template/SKILL.md`. Three are
editorial, and each answers a different one of our aims.

**`internal-comms`** ([SKILL.md](https://github.com/anthropics/skills/blob/main/skills/internal-comms/SKILL.md),
32 lines) is the structural pattern worth copying. Its description:

> A set of resources to help me write all kinds of internal communications, using the formats that my
> company likes to use. Claude should use this skill whenever asked to write some sort of internal
> communications (status reports, leadership updates, 3P updates, company newsletters, FAQs, incident
> reports, project updates, etc.).

Thirty-two lines that do nothing but **classify and route**: identify which of six formats the request
is, then read the matching file under `examples/`. Each reference file is self-contained — `3p-updates.md`
is 46 lines running audience → what it is → where to gather from → workflow → a literal output template
with slots. All the knowledge is disclosed reference. That is exactly the shape a "which block carries
which message" catalog wants, and it is the shape `o3world-copy`'s "Registers by surface" table is
already reaching for. The one difference we must preserve: our per-block detail cannot sit in
`examples/` inside the skill, because the Desktop ZIP would freeze it. It sits in the dataset.

**`doc-coauthoring`** ([SKILL.md](https://github.com/anthropics/skills/blob/main/skills/doc-coauthoring/SKILL.md),
375 lines) is the closest published thing to aim #4, in three stages:

1. **Context gathering** — user dumps everything, skill generates 5–10 clarifying questions, exits when
   there is enough to proceed.
2. **Refinement** — per section: clarify, brainstorm 5–20 options, user curates, gap check, draft,
   iterate with `str_replace` edits only, never reprinting. Coherence review at about 80% done. And a
   stop rule worth stealing verbatim: after three iterations with no substantial change, ask what can
   be *removed*.
3. **Reader testing** — predict 5–10 realistic reader questions, then dispatch a **fresh subagent
   holding only the document** to answer them. Loop back to stage 2 on failure.

Stage 3 is the idea we do not have. It is a completion criterion with real demand in
`writing-for-agents`' sense: "the reader's five questions are answered" is checkable where "the draft
is good" is not, and the fresh-context subagent is the point — a reviewer that inherits the writer's
context cannot tell what the page actually says. It is the only mechanism found anywhere in this
survey that tests whether a piece *argues* something rather than whether it *sounds* right. Note the
divergence from `grilling`: `doc-coauthoring` front-loads one question batch, `grilling` recomputes a
frontier each round. Grilling is better when the decisions depend on each other, which an editorial
brief's do.

**`brand-guidelines`** ([SKILL.md](https://github.com/anthropics/skills/blob/main/skills/brand-guidelines/SKILL.md),
73 lines) is **not** a brand *voice* skill — it is hex codes and fonts. Nothing to take. Worth
recording because the name promises otherwise, and because its absence is the finding: Anthropic
publishes no brand-voice or editorial-tone skill.

**`skill-creator`** (485 lines) is the method for writing the thing, and its most useful line is a
correction to instinct: Claude tends to *under*-trigger skills, so descriptions should be a little
pushy. Its budget — metadata ~100 words, body under 500 lines, references unlimited — matches
Anthropic's best-practices page. **`docx`** (91 lines) contributes one transferable habit: after
writing the artifact, *render it and look at it*. That is the same rule AGENTS.md already states for
`pnpm --filter @o3/migration load`, and it belongs in the skill rather than only in AGENTS.md, because
the Desktop author never reads AGENTS.md.

`anthropics/skills` has no `plugin.json` at all — a single `.claude-plugin/marketplace.json` declares
three plugins (`document-skills`, `example-skills`, `claude-api`), each `"source": "./"`,
`"strict": false`, with an explicit `skills[]` array of paths. That is the reference shape for
grouping several skills into one plugin.

### Editorial and brand-voice skills in public marketplaces

A survey of 613 `SKILL.md` files across seventeen cloned repositories. The ones that matter:

| Skill | Lines | Bundles | Take |
| ----- | ----- | ------- | ---- |
| [`saschb2b/skills` → `no-slop`](https://github.com/saschb2b/skills/blob/main/skills/productivity/no-slop/SKILL.md) | 137 | 27 refs, 2 levels; `slop-lint.mjs` | The architecture, wholesale. This is the upstream of the copy installed at `~/.claude/skills/no-slop` |
| [`conorbronsdon/avoid-ai-writing`](https://github.com/conorbronsdon/avoid-ai-writing) | 813 | corpus + JS detector + Jest tests | The rigor — it measures its own false-positive rate. Skip the skill; 813 lines is over budget |
| [`coreyhaines31/marketingskills` → `copy-editing`](https://github.com/coreyhaines31/marketingskills/blob/main/skills/copy-editing/SKILL.md) | 457 | 3 refs + `evals/evals.json` | The Seven Sweeps and the eval file |
| [`coreyhaines31` → `copywriting`](https://github.com/coreyhaines31/marketingskills/blob/main/skills/copywriting/SKILL.md) | 252 | 2 refs + evals | The Core Sections table |
| [`obra/superpowers` → `writing-skills`](https://github.com/obra/superpowers/blob/main/skills/writing-skills/SKILL.md) | 679 | 6 refs | The spec for authoring a skill |
| [`rampstackco/claude-skills` → `brand-voice`](https://github.com/rampstackco/claude-skills/blob/main/skills/brand-voice/SKILL.md) | 180 | 2 refs | Only the de-confliction pattern |
| `rampstackco` → `vertical-site-conventions` | 213 | 11 `shape-*.md` | The fan-out shape — nearest public thing to block selection, but layout convention, not schema |

Four techniques worth taking:

- **The Seven Sweeps** (`copy-editing`): Clarity, Voice/Tone, So What, Prove It, Specificity,
  Heightened Emotion, Zero Risk — one named pass each. Named passes beat an unordered checklist for
  the same reason `no-slop`'s top-down order does. It also carries **Expert Panel Scoring**: 3–5
  personas score 1–10, revise the lowest first, iterate until all are ≥7 and the mean ≥8. Mechanical,
  and a cheap approximation of the reader test.
- **The Core Sections table** (`copywriting`): Social Proof, Problem-Pain, Solution-Benefits, How It
  Works, Objection Handling, Final CTA, each mapped to a purpose and a page type. **This is section
  selection done abstractly** — the shape of aim #3 minus the schema binding. Our version binds it:
  Problem-Pain is a `heroSection` headline, Social Proof is `logoWallSection` or `quoteSection`,
  Solution-Benefits is `railPanelsSection` or `disciplineGridSection`, Final CTA is `ctaSection`.
- **`evals/evals.json`** per skill: `{prompt, expected_output, assertions[]}`. A regression harness for
  a subjective skill that needs no early-access tooling. This is the fallback if `claude plugin eval`
  turns out not to be enabled.
- **De-confliction inside the description** (`rampstackco/brand-voice`): "this skill owns defining and
  documenting the voice system; use `editorial-qa` when a specific draft needs checking against an
  existing system before it publishes." An explicit ownership sentence in the trigger text. That is
  the cleanest available fix for the `no-slop` / `o3world-copy` collision, and better than anything in
  the official repo.

`obra/superpowers`' `writing-skills` corroborates `writing-for-agents` from a different direction, with
an observation from an actual A/B: the prohibition arm "produced clearly more of the unwanted content
than the recipe arm". It also states the description rule sharply — *description is when to use, not
what the skill does*, because a description summarising the workflow gives the agent a shortcut it
takes instead of reading the body. And a mechanical one: cross-reference skills **by name, never by an
`@`-path**, because `@` force-loads the target and burns context.

One dead end for the record: `timescale/marketing-skills` appears in search results with a
"brand-voice-writer" skill and 404s on both web and API. Treat it as vapor.

### CMS-aware authoring: the category is effectively empty

Grepping every `SKILL.md` and reference file across all seventeen repos for `which block|choose the
block|block type|block library|component catalog|section block|portable text` returns only Portable
Text *serialization* — an engineering concern — and SEO metadata. **No published skill couples brand
voice to component or block selection in a structured content system.**

The split is sharp and worth stating, because it explains why:

- **Sanity ships an official Claude Code plugin and it is voice-blind.**
  [`sanity-io/agent-toolkit`](https://github.com/sanity-io/agent-toolkit) carries seven skills —
  `sanity-best-practices`, `portable-text-serialization`, `portable-text-conversion`,
  `sanity-migration`, `content-modeling-best-practices`, `content-experimentation-best-practices`,
  `seo-aeo-best-practices` — plus a 307-line `references/page-builder.md` on page-builder patterns
  that is entirely schema shape: objects versus references, array validation, preview config. Grep the
  whole toolkit for copywriting and you get one line, in an EEAT reference: "Develop recognizable brand
  voice." **This is a real adopt candidate for the Portable Text mechanics we currently make the agent
  infer** — `o3-authoring` says only "portable text is raw JSON", which is true and unhelpful.
- **Copywriting skills are numerous and schema-blind.** Five collections surveyed (rampstackco 103
  skills, coreyhaines31 49, cognyai 53, arnab 29, plus a vendored fork). None knows what a block is.
  The best bridge anyone published is a cross-reference: coreyhaines31's `headless-cms.md` says "define
  fields that match your copy frameworks (headline, subheadline, social proof, CTA). See copywriting
  skill."

**One genuine near-miss, and it is worth reading before building anything.**
[`bex-sugartown/sugartown` → `red-pen`](https://github.com/bex-sugartown/sugartown/blob/main/.claude/skills/red-pen/SKILL.md)
is a one-star personal repo running a Sanity site, and it is the only skill found anywhere that treats
**block choice as an editorial finding**. Verified by fetch. Its description ends on a boundary we
should copy: "This is a reviewer, not a writer: it never rewrites without row-level approval." Three
things it does that nobody else does:

1. **Register detection by content type**, mapping type → voice → which guide to load → per-type
   exemptions. The same job as `o3world-copy`'s surface table, executed as a step rather than a table.
2. **Prose → block conversion as a finding.** A paragraph walking the reader across two or more
   options along two or more dimensions "is a table (`tableBlock`, already available in Portable Text
   for both nodes and articles — no schema work needed). Propose the table's rows/columns and a
   compressed version of the prose." It names real `_type`s from its own schema and files the change as
   an *advisory* finding, not a rewrite. **That is aim #3 in its most concrete published form**, and
   the advisory framing is right: the agent proposes the block, the human accepts the row.
3. **Portable Text patch mechanics as skill content**: "every block needs `markDefs: []` and every span
   needs `marks: []` even when empty, or the block renders read-only in Studio. Re-fetch the document
   before patching because `_key` values do not reliably survive prior patches." Both are traps we will
   hit; the second is a data-loss trap.

Its two-gate flow — a report with a findings table (ID, tier, location, current, proposed, why), then
row-level approval before any edit lands — is a better shape for *editing existing pages* than
`o3-authoring`'s draft-and-iterate, which was designed for creating new ones. Aim #4 says "author and
edit". We only have the author half.

So: `o3-authoring` plus a composition guidance document would be ahead of the public state of the art,
not behind it. That is a reason to finish it rather than shop for a replacement — and a reason to lift
`red-pen`'s review mode and `agent-toolkit`'s Portable Text mechanics rather than re-derive them.

## What a writing skill can actually do against Sanity

Verified against the live MCP server and Sanity's docs.

**Reads are free and unrestricted.** `get_schema` (per type — the no-type overview drops field
descriptions), `query_documents` (GROQ), `get_document`, `semantic_search`. The deployed schema for
this project resolves through the Studio-deployed workspace `o3`; `list_workspace_schemas` confirms
it exists, which settles a prerequisite for anything schema-aware.

**Writes are safe by construction, up to a point.** `create_documents` writes to `drafts.*` unless a
`releaseId` is passed. `patch_documents` — per the
[MCP docs](https://www.sanity.io/docs/ai/mcp-server) — states that "published content is never
modified directly": handing it a published id edits the draft, pinned to the source published
revision. It accepts `ifRevisionId` as an optimistic lock, which is the guard against clobbering a
human's concurrent edit and should be mandatory in any skill we write. Max 25 documents per call.

**Publishing must stay a human step, and the skill has to say so as a hard rule** — because
`publish_documents` exists, works, takes bare ids, and will comply. This is not a preference. Sanity
drew the same line for its own first-party agent: the
[Content Agent docs](https://www.sanity.io/docs/content-agent/introduction) state "the agent creates
drafts or adds the changes to a content release. Publishing is always a separate step that you take
yourself," and "for safety, the agent cannot delete documents." `o3-authoring`'s hard-rules block
already matches this exactly. Keep it.

**Content Releases are the natural propose/approve vehicle and may not be available.** The
[Releases API](https://www.sanity.io/docs/apis-and-sdks/content-releases-api) is documented as a paid
Enterprise feature; the Growth-plan fallback is
[Scheduled Drafts](https://www.sanity.io/docs/studio/scheduled-drafts) (single-document releases).
The plan tier for `naorcr6k` was not determined — `list_releases` returns zero either way. Usefully,
**MCP has no tool that publishes or schedules a release**: an agent can stage one completely and
cannot ship it. That is a free approval gate if we get the entitlement.

**Sanity ships its own Claude Code plugin, and we should install it.**
[`sanity-io/agent-toolkit`](https://github.com/sanity-io/agent-toolkit) carries seven skills, three of
which are Portable Text mechanics: `portable-text-serialization`, `portable-text-conversion`, and
`sanity-migration`. `o3-authoring` currently tells the agent "portable text is raw JSON — build block
arrays by hand to match the schema", which is true and gives it nothing to work with. That gap is
already filled by a first-party plugin, and installing it beside ours is cheaper than restating it.
The traps to confirm are covered: `markDefs: []` and `marks: []` are required even when empty or the
block renders read-only in Studio, and `_key` values do not reliably survive a prior patch, so
re-fetch before patching. Both come from `red-pen`, which learned them the hard way on a Sanity site.

**Agent Actions** (`client.agent.action.generate | transform | translate | prompt | patch`,
[docs](https://www.sanity.io/docs/agent-actions/introduction), still flagged Experimental) are the
server-side alternative. The guarantee worth knowing: "By default, Agent Actions will never mutate a
published document." `agent.action.patch` gives schema-validated writes with no LLM and no AI credits.
Limitations that matter for us: Generate cannot create annotations, custom marks, or inline blocks in
Portable Text, and won't write to statically `hidden`/`readOnly` fields — which is what protects the
`guidance` documents. **AI Assist** (Studio plugin, Growth plan) is a different product for a different
user; map #63 already put Studio-side AI out of scope and that holds.

## Editorial method with teeth (aim #4)

Aim #4 is the one with no prior art in the repo and the most folk wisdom around it. Being honest about
what is citable:

**Genuinely citable, and verified.** The [inverted pyramid](https://www.nngroup.com/articles/inverted-pyramid/)
(Amy Schade, NN/g, 2018-02-11): the first paragraph carries the key fact "even if they only read a
single paragraph or sentence on the page"; "the first sentence of every paragraph should be the most
important. The first words in each sentence should be information-carrying." That is a page-shape
prescription, and it maps directly onto a block-composed page: `heroSection` is the lede, and the
first band under it is the payoff, not the background.

**Citable, canonical, and not fetchable.** Stephen Toulmin, *The Uses of Argument* (1958) — claim,
grounds, warrant, backing, qualifier, rebuttal. The **warrant** is the load-bearing part for us: the
unstated principle connecting evidence to claim. Thought-leadership mush is almost always a claim with
grounds and no warrant anybody would defend out loud. Booth, Colomb & Williams, *The Craft of Research*
(University of Chicago Press) packages the same as claim + reasons + evidence + acknowledgment-and-response.
Both are books; I did not fetch either and am citing them from the record, not from a URL.

**Citable but I could not reach the text.** Gopen & Swan, "The Science of Scientific Writing,"
*American Scientist* 78 (Nov–Dec 1990), 550–558 — topic position, stress position, reader-expectation.
`americanscientist.org` served a browser check, and Duke's
[scientific writing course](https://sites.duke.edu/scientificwriting) acknowledges Gopen and Williams
as its basis but does not reproduce the numbered principles. Real paper, honestly unverified here.

**Practitioner lore with a named author, not research.** Barbara Minto's *Pyramid Principle* and its
SCQA opening (situation, complication, question, answer). Useful, widely used, and it should be
labelled as a house convention rather than dressed up as evidence.

**Already in the corpus and stronger than any of the above for our purposes**: `o3world-copy`'s
revision-pass step 4 — "could a competitor paste this sentence into their site? If yes, it isn't
done." That is a specificity test with a checkable bound, which is exactly what
`writing-for-agents` means by a completion criterion. The cheapest way to give aim #4 teeth is to add
one more of the same kind before drafting rather than after: **a one-sentence thesis with a warrant
somebody could disagree with**, written and agreed in chat before a single Sanity call.

## Adopt, adapt, skip

| Prior art | Verdict | Why |
| --------- | ------- | --- |
| `tools/authoring-skill` plugin + root `marketplace.json` | **Adopt** | Already built, already validated; this is the distribution channel, not a thing to rebuild |
| `o3-authoring` thin-bootstrap contract (knowledge behind the MCP seam) | **Adopt** | It is what stops the voice drifting across three delivery paths; every new knowledge item must go through it |
| `tools/guidance` sync/check pipeline | **Adopt** | Repo is source of truth, drift fails loudly. Add rows; do not add a second mechanism |
| `.claude/skills/o3world-copy/` (voice, brand, slop) | **Adopt as-is** | Two calibrations behind it (#64, then a full-corpus survey); the slop reconciliation section is better than anything found externally |
| `docs/specs/schema.md` block prose | **Adapt** | The "when to use it" knowledge for aim #3 is mostly written; it needs lifting into schema descriptions + an `o3-composition` guidance row (#73) |
| `no-slop` pass architecture (top-down, structure before sentences) | **Adopt** | Correct ordering principle; `slop.md` has the tells but no explicit pass order |
| `no-slop` linter *mechanism* (bundled script, delta scoring, structure left to a human) | **Adapt** | Build an O3-calibrated linter; the design is right, the rules are not |
| `no-slop` rule set, register, STE/Microsoft references | **Skip** | Targets reserved plain technical English; measured 8 false em-dash hits on approved on-brand copy. Wrong register for marketing |
| `no-slop` as an installed skill firing on O3 copy | **Skip, and actively resolve** | Live conflict with `o3world-copy` on Nick's machine today |
| `writing-for-agents` vocabulary (pointers, two loads, hierarchy, completion criteria, negation) | **Adopt** | The design language for the decomposition decision below |
| `grilling` rounds/frontier interview | **Adapt** | Right shape for editorial intake; reuse the pattern rather than inventing one. Already installed |
| `internal-comms` classifier-plus-`examples/` shape | **Adapt** | The right structure for a per-block composition catalog — but ours lives in the dataset, not in `examples/` |
| `doc-coauthoring` stage 3, reader testing | **Adopt** | The only checkable test found anywhere for whether a piece answers a reader; we have no equivalent |
| `doc-coauthoring` stages 1–2 | **Skip** | 375 lines of generic doc workflow; `o3-authoring`'s five steps plus `grilling` cover it more cheaply |
| `doc-coauthoring`'s "three iterations, no change → ask what to remove" | **Adopt** | A stop rule for the iterate loop, which we have none of |
| `brand-guidelines` (anthropics/skills) | **Skip** | Colors and typography, not voice. The name misleads |
| `skill-creator`'s "descriptions under-trigger, be pushy" | **Adopt** | Corrects the instinct to write a modest description |
| `docx`'s "render it and look at it" | **Adopt** | AGENTS.md already says this for `load`; the Desktop author never reads AGENTS.md |
| `red-pen`'s prose → block conversion as an advisory finding | **Adopt** | The most concrete published form of aim #3, and the advisory framing is right |
| `red-pen`'s two-gate review mode (findings table → row-level approval) | **Adopt** | Aim #4 says "author and edit"; we only have the author half |
| `red-pen`'s Portable Text patch traps (`markDefs: []`, re-fetch before patch) | **Adopt** | The `_key` one is a data-loss trap we will otherwise hit |
| `sanity-io/agent-toolkit` Portable Text skills | **Adopt** | First-party mechanics we currently make the agent infer from "portable text is raw JSON" |
| `sanity-io/agent-toolkit` `page-builder.md` | **Skip** | Schema shape, not composition. We already have ADR 0020/0021 and `content-naming` |
| `copy-editing`'s Seven Sweeps | **Adapt** | Named passes beat an unordered checklist; `slop.md`'s checks want this ordering |
| `copy-editing`'s Expert Panel Scoring | **Adapt** | A mechanical, cheap approximation of the reader test |
| `copywriting`'s Core Sections table | **Adapt** | Section selection done abstractly; our version binds each row to a block |
| `evals/evals.json` per skill (coreyhaines31) | **Adopt** | A regression harness that needs no early-access tooling — the fallback if `plugin eval` is unavailable |
| `rampstackco`'s ownership sentence inside the description | **Adopt** | The cleanest available fix for the `no-slop` / `o3world-copy` collision |
| `superpowers/writing-skills` on descriptions and prohibitions | **Adopt** | Independent corroboration of `writing-for-agents`, with an A/B behind it |
| `avoid-ai-writing` (813 lines) | **Skip the skill, adapt the rigor** | Over budget, but it measures its own false-positive rate — ours should too |
| `rampstackco/brand-voice`, `vertical-site-conventions` | **Skip** | `o3world-copy` is better on voice; the shape-file fan-out is layout convention, not schema |
| `anthropics/skills` `marketplace.json` shape (`skills[]`, `strict`, `source: "./"`) | **Adopt if we grow** | The reference manifest for grouping several skills in one plugin |
| Sanity Content Agent's boundaries (drafts only, no delete, no publish) | **Adopt** | First-party precedent that matches what `o3-authoring` already says |
| Sanity Content Releases as the approval gate | **Defer** | Enterprise-gated; entitlement for `naorcr6k` unknown. Draft/published is a complete workflow without it |
| Sanity Agent Actions (`agent.action.patch`) | **Watch** | Safest write path on paper, still Experimental, and needs a schema deploy discipline we don't have yet |
| Sanity AI Assist | **Skip** | Studio-side, different user; #63 already ruled it out of scope |
| NN/g inverted pyramid | **Adopt** | Verified, and it translates cleanly into band ordering |
| Toulmin warrant / *Craft of Research* | **Adapt** | One test — "state the warrant somebody could disagree with" — is worth more than the whole framework |
| Minto SCQA | **Adapt, labelled** | Fine as a house opening convention; do not present it as evidence-backed |
| `CARD.md` provenance format (from `no-slop`) | **Skip** | Solves a distribution-trust problem we don't have inside one org |

## One skill or several

**Recommendation: one model-invoked skill, one user-invoked command, and everything else as guidance
documents. Not four skills.**

The reason is `writing-for-agents`' two loads. Every model-invoked skill's description is permanent
context load in every session, and four skills covering brand voice, slop, block selection and
argument shaping would be four descriptions competing to fire on the same request — the overlapping-skills
failure Anthropic's best-practices page warns about, and the one we can already observe between
`no-slop` and `o3world-copy`.

| Piece | Form | Where | Trigger / rationale |
| ----- | ---- | ----- | ------------------- |
| Brand voice | **Guidance document** `o3-voice` | Already live | Fetched by `o3-authoring` step 1. Not a skill — it is reference the bootstrap pulls |
| Slop prevention | **Guidance document** `o3-slop` | Already live | Same. The reconciliation section only makes sense read next to the voice guide |
| Brand foundation | **Guidance document** `o3-brand` | Already live | Source material for claims |
| Block/design selection | **Guidance document** `o3-composition` + per-block schema descriptions | New row in `sources.ts`; #73 | Composition rules must reach Desktop too, so they go through the MCP seam, not into the plugin. Per-block "when to use" belongs in `get_schema` where it sits next to the fields |
| Authoring workflow | **Model-invoked skill** `o3-authoring` | Already live | Description stays roughly as written: "Draft or revise o3world.com content in Sanity… Use whenever asked to write, draft, or edit O3 World site content from an idea or notes." It is the single entry point |
| Fuzzy → argument | **User-invoked command** in the same plugin | New: `commands/brief.md` or a skill with `disable-model-invocation: true` | Zero context load; a human starts a brief deliberately. Runs a `grilling`-style round: audience, the one claim, its warrant, the evidence we actually have, the page shape. Ends with a written thesis before any Sanity call |
| Reader test | **A step inside `o3-authoring`** | Workflow step, before hand-off | Borrowed from `doc-coauthoring` stage 3: predict five reader questions, dispatch a **fresh** subagent holding only the draft, check it can answer them. A checkable completion criterion where "reads well" is not. This is the one place a subagent earns its keep — a reviewer inheriting the writer's context cannot see what the page actually says |
| Reviewing an existing page | **A second mode inside `o3-authoring`** | Workflow branch, not a second skill | `red-pen`'s two-gate flow: findings table (id, tier, location, current, proposed, why), then row-level approval before any patch. The same trigger, a different branch — an editor asking "does this read right?" should not have to know which skill to name |
| O3-calibrated slop linter | **Script bundled in the plugin** | `skills/o3-authoring/scripts/o3-lint.mjs` | Referenced from the skill, executed not read, so it costs nothing until used |

Why this beats the alternatives:

- **Beats four skills** on context load and on trigger collision — four descriptions, one request.
- **Beats one giant skill** because the knowledge that must reach *both* Claude Code and Claude Desktop
  cannot live in the skill body at all; the ZIP path would freeze it. That constraint is already the
  founding decision of map #63 and it has not changed.
- **Beats a subagent** for the argument work. A fork (`context: fork`) hides its tool output, which is
  the opposite of what an interview needs — the human has to see and answer the questions in the main
  thread. Use a subagent only for the #73 extraction job (read nine seed pages, report the arcs),
  which is read-heavy and produces one artifact.

One asymmetry to accept: a `commands/` entry is Claude Code only and does not ride the Desktop ZIP,
which packages a single skill folder. If the brief step has to work in Desktop too, write it as a
skill with `disable-model-invocation: true` inside `skills/` and add it to `build.mjs` — the build
currently hardcodes one `skillDir`. Cheaper alternative: fold the brief into `o3-authoring`'s step 1
as a named sub-procedure and let it fire on the same trigger. That is a real trade and #63's Desktop
commitment decides it, not this document.

The composition guidance is the item most likely to be built the wrong way. It is tempting to put
"when to use each block" in the skill, because that is where an author reads it. Don't: it has to be
in the dataset, or the Desktop path and any future MCP consumer never sees it, and #66 exists
precisely to settle the schema-description-versus-catalog split.

## The three-channel problem, named

The repo has `o3world-copy` (a skill loaded in-session, in this checkout), `guidance:sync` (the same
markdown pushed to the dataset), and now `o3-authoring` distributed org-wide as a plugin. A fourth
channel is one edit away at any time. Without a stated rule this rots — and the rot is silent, which
`check.ts`'s own comment already says.

**The rule, and it is already 90% implemented:**

> The markdown files under `.claude/skills/o3world-copy/` are the single source of truth for every
> word of O3 authoring knowledge. `pnpm guidance:sync` is the only fan-out. The plugin carries
> workflow and zero knowledge. Nothing else may restate the voice.

Flow, one direction only:

```
.claude/skills/o3world-copy/*.md        ← authored here, reviewed here, git-blamed here
        │
        ├── read directly by an agent in this checkout        (o3world-copy skill)
        └── pnpm guidance:sync → guidance documents in Sanity
                 └── read via MCP by o3-authoring             (plugin, and Desktop ZIP)
```

Three things this rule already forbids and one it doesn't yet:

- Editing a `guidance` document in Studio — blocked, every field is `readOnly`.
- Packaging voice in the ZIP — enforced by the skill being 68 lines of bootstrap.
- Two copies drifting — `pnpm guidance:check` exits non-zero.
- **Schema descriptions drifting from the repo — not enforced, and already drifted** (the missing
  `mark` field above). #73 adds a fourth knowledge surface to a pipeline that only guards one of
  them. A `schema:check` equivalent, or making `guidance:check` cover the deployed schema, is the
  missing piece.

**Sanity runs this exact pipeline backwards, at scale, and it is worth knowing before we commit.**
Their engineering post [Skills are how your company works](https://www.sanity.io/blog/skills-are-how-your-company-works)
describes roughly 60 internal skills authored **as Sanity documents** — types `skill` and
`skillReference`, fields `skillName`, `description`, `content`, `references`, plus category, tag,
visibility and owner metadata. A Sanity Function watches for changes, converts each to markdown,
commits atomically to GitHub through the Git Trees API, and rewrites `.claude-plugin/marketplace.json`
on every publish so a new skill needs no manual indexing. Users get updates on their next session
across Chat, Desktop and Cowork. None of the 60 are public.

That is our arrow reversed: they author in the CMS and sync to git; we author in git and sync to the
CMS. Theirs is better for non-engineers — a marketer can edit voice guidance in Studio without
cloning anything, which is exactly the audience this whole effort is for. Ours is better for review:
voice edits get a diff, a blame, and a PR, and `guidance:check` makes a skipped sync loud. **Do not
switch.** The reason is specific rather than aesthetic: the corpus is currently three files with two
calibrations behind them (#64, then a full-corpus survey), and that provenance lives in git history.
But the Sanity direction is the answer if the corpus ever grows past what one reviewer can hold, or if
authoring it becomes a marketing job rather than an engineering one. Record it as the known
alternative rather than rediscovering it in a year.

One structural wart worth deciding on: the guidance corpus lives *inside a Claude Code skill folder*.
That was fine for three files about copy. `o3-composition` is not copy voice, and putting
`composition.md` next to `brand.md` under `o3world-copy/` will read as a mistake within a month. Two
options, and this is Nick's call: move the corpus to a neutral home (`docs/guidance/` or
`content/guidance/`) with both the repo skill and `sources.ts` pointing at it, or accept the wart and
name `o3world-copy/` the corpus directory in `sources.ts`' comment. The first is cleaner and costs one
commit; the second costs nothing and pays interest.

## Distribution plan

The plugin exists and works. What is missing is that nobody has it installed, and there is no path by
which they get it without being told.

1. **Bump the version.** `plugin.json` pins `0.1.0` and has not moved since `8043cb1`. Per the
   [plugins reference](https://code.claude.com/docs/en/plugins-reference.md), a pinned version means
   installers only receive updates when it is bumped. Adopt semver and bump on every skill change, or
   drop `version` entirely and let it resolve from the git tag. Pick one; the current state is the
   worst of both.
2. **Add a repo `.claude/settings.json`.** The file does not exist today. Adding
   `extraKnownMarketplaces` for `o3world/o3-sanity` plus `enabledPlugins: ["o3-authoring@o3world"]`
   makes the plugin auto-enable for everyone who clones this repo
   ([settings](https://code.claude.com/docs/en/settings.md)). That covers engineers. It does **not**
   cover the marketing author who never clones anything.
3. **For non-cloners, the manual two-liner stays**: `/plugin marketplace add o3world/o3-sanity` then
   `/plugin install o3-authoring@o3world`, then `/mcp` to OAuth against Sanity as themselves. The
   README already documents it. That is the org-wide path until someone deploys managed settings.
4. **Updates ride `git push`.** `/plugin marketplace update o3world`, or marketplace auto-update in
   `/plugin` → Marketplaces. Combined with `guidance:sync`, a voice edit reaches an installed user in
   two steps: commit the markdown, run the sync. The skill itself only needs a push when the
   *workflow* changes.
5. **Keep `pnpm build:skill` alive** for the Desktop path, and keep its 200-character description
   check — it is the tighter of the two limits and the one that will break first.
6. **Evaluate before expanding.** Anthropic's best-practices page says build evals first. If
   `claude plugin eval` is enabled for the org, the stage gates #69/#71 are the eval suite,
   near-verbatim. If it is not, they stay manual sessions — which is what #63 already planned.

An honest note on scope: this repo's marketplace is named `o3world` and carries one plugin. If the
intent is genuinely org-wide across projects, the marketplace should probably move to its own repo
(`o3world/claude-plugins`) with `source: {"source": "github", "repo": "o3world/o3-sanity"}` pointing
back here, so a second plugin does not have to live in the Sanity monorepo. That is a decision, not a
finding.

## Open questions for Nick

1. **Is a new writing skill actually wanted, or is this map #63 finishing?** The four stated aims map
   onto #66, #73, #69 and #71 — three open tickets and one unticketed gap (argument shaping). The
   recommendation above assumes finishing the map. Starting a parallel effort would fork the voice
   corpus, which is the one thing the architecture was built to prevent.
2. **`no-slop` versus `o3world-copy` on your machine.** Both fire on "write this copy" today. Three
   options: disable `no-slop` for this repo, add an ownership sentence to one description the way
   `rampstackco/brand-voice` does ("this skill owns O3 site copy; use `no-slop` for engineering
   prose"), or accept that marketing copy sometimes gets the plain-technical register. A real,
   present defect, and no agent should pick the answer.
3. **Do we install [`sanity-io/agent-toolkit`](https://github.com/sanity-io/agent-toolkit) alongside
   ours?** It fills the Portable Text gap for free and it is first-party. The cost is a second plugin's
   worth of always-loaded descriptions, and seven more skills competing to fire. Probably yes, scoped
   to engineers rather than pushed to authors.
4. **Where does the guidance corpus live?** Keep it under `.claude/skills/o3world-copy/` and add
   `composition.md` there, or move it to a neutral directory. Costs one commit either way; the second
   option gets more expensive the longer it waits.
5. **What plan is `naorcr6k` on?** Decides whether Content Releases are available as the propose/approve
   vehicle, or whether draft/published is the whole workflow. Check sanity.io/manage.
6. **Is `claude plugin eval` enabled for the O3 org?** It is early-access and gated per organization.
   Changes whether the stage gates are automated or stay manual sessions.
7. **Does the marketplace stay in this repo?** One plugin today. An org-wide ambition probably wants
   `o3world/claude-plugins`.
8. **Is `.claude/settings.json` acceptable in this repo?** It auto-enables the plugin and its
   marketplace for everyone who clones. That is a change to what a checkout does on first run, and
   some people will consider that presumptuous.

## What could not be verified

- **Gopen & Swan's numbered principles.** The American Scientist page served a browser check; Duke's
  course credits the approach without reproducing it. The paper is real; the specific wording of its
  principles is cited here from the record, not from a fetch.
- **`no-slop`'s 74% claim.** Self-reported inside the skill, no methodology given.
- **`claude plugin eval` documentation.** No public docs URL exists; everything reported comes from
  early-access reference material, and the command was not enabled in the session that checked.
- **The Sanity plan tier for `naorcr6k`.** `list_releases` returns zero for both an entitled project
  with no releases and a non-entitled one.
- **`create_version` with an `instruction` parameter.** Sanity's MCP docs describe it; the schema
  served in this session has no such parameter. Treat AI-assisted `create_version` as unavailable.
- **Whether anyone has the plugin installed.** #95 explicitly left wire-up undone and there is no
  ticket for the Claude Code side of [#67](https://github.com/o3world/o3-sanity/issues/67).
- **The negative result on CMS-aware authoring** rests on grepping 613 `SKILL.md` files across
  seventeen repositories. That is a wide sweep, not an exhaustive one — read it as "nothing published
  and findable", not as proof of absence.
- **`timescale/marketing-skills`** appears in search results carrying a "brand-voice-writer" skill and
  404s on both web and API. Unreachable, possibly deleted or private.
