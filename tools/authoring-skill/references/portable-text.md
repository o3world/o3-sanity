# Portable text, and how a draft becomes one

Every write mechanic stage 5 needs. `labels.md` says what a passage means;
this says what to send. Nothing else in the plugin carries any of it, so a
change here is a change to how every piece is built.

**Portable text is raw JSON you build by hand.** There is no markdown
convenience tool, no importer, and no conversion library — the block array is
composed to match the schema, item by item. Which schema is `get_schema`'s
answer, per type, before the type is built.

## Three write mechanics

- **Author `_key` on every array member yourself** — every block, every span,
  every band, every panel, every base block, every reference. The Content Lake
  mints none on create and then mints one on the _next_ write, derived from that
  revision's id. An item you left unkeyed is unaddressable by `_key` until
  something names it a value you could not have predicted, and the copy in your
  context is stale for exactly those items. A short unique string is enough;
  keys are addresses, not names.
- **Re-fetch before patching, and pass `ifRevisionId`.** Keys you authored
  survive a patch unchanged — only the index moves — so the reason to re-fetch
  is a concurrent edit. The guard turns a silent clobber into a failed call, and
  a `_rev` you are already holding from three turns ago is the one it cannot
  catch. On a rejection: abort, re-fetch, re-derive. Never retry blind.
- **`markDefs: []` and `marks: []` are a convention**, not a requirement —
  stored when supplied, absent when not. Include them, for the Studio editor and
  for typegen.

## An insight or a case-study chapter

`bodyText` is the array, and clean markdown maps into it with no help:

| In the draft            | In the array                                                    |
| ----------------------- | --------------------------------------------------------------- |
| a paragraph             | a block, `style: "normal"`                                      |
| `##` / `###`            | a block, `style: "h2"` / `"h3"`                                 |
| `>`                     | a block, `style: "blockquote"`                                  |
| `**bold**` / `_italic_` | a span carrying `marks: ["strong"]` / `["em"]`                  |
| inline `` `code` ``     | a span carrying `marks: ["code"]`                               |
| `(pullQuote)`           | a `pullQuote` member — the quote itself, not a blockquote block |
| `(figure)`              | a `figure` member — its `alt` and its `caption`                 |
| `(embed)`               | an `embed` member, the URL and what it is                       |

One block per paragraph and per heading. A heading converted to a normal block
in bold renders as a paragraph in a heavier font, and is invisible to every
reader who navigates by structure.

```json
{
  "_key": "b1",
  "_type": "block",
  "style": "normal",
  "markDefs": [],
  "children": [{ "_key": "s1", "_type": "span", "marks": [], "text": "The audit came back clean." }]
}
```

## A page or a case study's bands

The label's three parts each land somewhere different, and the mapping is
mechanical rather than a judgement:

- **The name** is the member's `_type`, character for character. It is the
  schema's own type name, so there is nothing to translate.
- **The knobs** are fields on that member. `surface=ink` is `"surface": "ink"`.
- **The parts** are the member's repeated elements, in order — a
  `railPanelsSection`'s `panels`, a `layoutSection`'s `items`. One part, one
  array member, in the order they were written.

A label with _n_ parts produces _n_ members. **Where the draft's passages and
the label's parts disagree, stop and say so** — the label is the error and the
prose is the truth, and a converter that drops the third passage has resolved an
editorial question by deleting the evidence for it.

Every field the schema marks required and the draft did not decide is filled
from the passage under the label. Where no passage answers it, it is a gap.

## A part with nothing behind it

**Write the member anyway, and record what it needs.** A `(figure)` with no
asset becomes a figure whose `caption` is the caption and whose `alt` is what
the draft says the image shows, with `image` left empty — plus a line on `gaps`
naming what the piece needs and who has it.

A draft is allowed to be invalid — Studio shows the empty required field to the
human who fills it, which is the whole point of leaving the run at a draft. The
tempting alternative is to delete the passage, and it is the wrong one twice
over: the human approved a band with two parts in it, and the missing asset
stops being a gap anybody can see.

The rule that governs this is the one it looks like it breaks. Never invent the
asset, the number or the name. **Recording a gap is not inventing anything; it
is the only move that leaves the gap visible.**

## The document itself

- **`_id` is `<type>-<slug>`**, hyphens throughout — `insight-a-library-hands-over-files`,
  `page-services-design-system-handover`. It deliberately misses the migration
  pipeline's `<type>-(wp|seed)-` ownership contract, so `load` never writes or
  retires a piece the authoring run made.
- **The slug is lowercase-hyphenated and checked for collisions before you
  create anything.** A page's slug carries its URL prefix —
  `services/design-system-handover` — and the id flattens the slash to a hyphen.
  A free slug is not a free subject: the subject check belongs to stage 1 and
  its answer was taken at the gather gate.
- **The `briefs` reference is weak and keyed like any other array item:**

  ```json
  { "_type": "reference", "_ref": "brief-<key>", "_weak": true, "_key": "<key>" }
  ```

  The published id, even though the brief is still a draft — that is how a
  reference addresses a document, and weak is why it costs nothing while the
  human has yet to publish either one.

- **Fill the fields the piece decided; leave the rest as gaps.** `seo` is the
  recurring example: a field nobody asked about and no gate read, filled from
  inference, is copy a search engine shows and no human ever approved.
