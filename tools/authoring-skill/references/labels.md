# Label grammar

`draft.body` is markdown, and a **label** is the stage direction beside a
passage: which block it becomes, and what it is made of. Three skills meet here.
`draft` writes by this file, `review` reads a label as a theater direction, and
`typeset` converts by it — so this is a contract, and it is written for
precision rather than for brevity.

## The shape

A label is a **line of its own**:

```
(<name>[: <knob>=<value>, …]) [<part>, <part>, …]
```

- **The name** comes first, inside the parentheses, always. It is the schema's
  own type name.
- **Knobs** follow a colon, inside the parentheses, as `key=value` pairs. Keys
  and values are the schema's own — `get_schema` and `composition.md` are where
  they come from, and a knob invented here is a knob typeset cannot set.
- **Parts** follow the closing parenthesis, comma-separated. They **name** the
  repeated elements; they never carry their copy.

The label governs everything under it until the next label or the next heading.

```
(railPanelsSection: surface=bone, layout=cards) Audit, Build, Steward
```

That is the whole fidelity being asked for. "(card list) card 1, card 2" is a
complete label: which block, and that there are two of them in that order.

## Read it aloud

**Delete every line that begins with `(` and the piece reads aloud unbroken** —
in order, nothing missing, nothing dangling. That is the test the grammar
exists to pass, and every rule below follows from it.

So a label is never inline in a sentence, never inside a paragraph, and never
carries a word a reader is meant to see. Copy that only exists inside a label
is copy that vanishes when the labels are stripped, which is how a heading
nobody wrote reaches a published page.

## A label is a direction, not a deed

`(caseShowcaseSection) Northstar, 1682` says which band goes here and what it
will reference. It does not make those documents exist, and writing it is not
evidence that anyone checked. Review reads labels this way — as directions to be
tested against the dataset and the brief — and typeset resolves the references
rather than trusting the names.

The same holds one level down: `(figure)` does not conjure an image.

## An insight body

Clean markdown, and almost no labels. Headings (`##`, `###`), paragraphs, `>`
blockquotes, `**bold**`, `_italic_` and inline `` `code` `` all convert without
help, because they are the styles and decorators `bodyText` already has.

`bodyText`'s inline object set is closed at three, so three labels exist and
nothing else in an insight is labelled:

| Label         | What follows it                                                               |
| ------------- | ----------------------------------------------------------------------------- |
| `(pullQuote)` | one `>` blockquote — a sentence **lifted from the prose**, not written for it |
| `(figure)`    | one line: what the image shows, then `Caption:` and the caption               |
| `(embed)`     | one line: the URL, then what it is                                            |

A band name in an insight body is page vocabulary in a document that has no
bands. There is nothing for typeset to convert it into.

**A `(figure)` with no asset behind it is a gap**, not a placeholder to be
filled later in silence. Write the label, describe the image, and put a line on
`gaps` naming what the piece needs and who has it.

## A case study

Strict, because its shape is the schema's rather than the argument's.
`caseStudy.story` is one interleaved array of chapters and bands, so a case-study
draft carries both kinds of label:

```
(chapter: kicker=Overview) The Starting Line

Prose for the chapter body, ordinary markdown.

(details) Strategy, Design, Research, Technology
```

- **`(chapter: kicker=…)`** — the part is the chapter's title. Its number is
  derived from its position among the other chapters and is never written.
- **`(details)`** — the hairline rows under a chapter's body. The parts are the
  row labels; each row's copy is one paragraph under the label, in that order.
  The shipped studies label them Strategy / Design / Research / Technology.
- **A band between two chapters** is labelled exactly as a page's band is, with
  the vocabulary below.

## A page

Every band carries a label, in order, and nothing sits between two labels
unlabelled. Names are the section types from `composition.md`'s catalog —
`heroSection`, `railPanelsSection`, `layoutSection` and the rest — and the
knobs are that catalog's knobs: `surface` on every band, then `layout`, `rail`,
`columns`, `variant` or `decoration` where the block has one.

```
(heroSection: surface=ink) heading, body

## A design system is a product with a second version

You are hired for the first one. The second is where systems go.

(layoutSection: surface=bone, columns=2) richText, figure
```

Two fixtures, both from the corpus and both decided at the outline rather than
applied afterwards: the first label is `heroSection` on `surface=ink`, and the
last is `ctaSection` on `surface=ink`.

Where a band holds base blocks rather than a repeating item — `layoutSection` is
the usual one — the parts name those base blocks in order, and no label nests
inside another.

## Parts and passages line up

A label with _n_ parts is followed by _n_ passages, in order, one per part. A
passage is a paragraph, or a heading with the paragraphs under it.

Where the count disagrees, **the label is the error and the prose is the truth**
— the writer wrote three panels and named two. Review reports the mismatch;
typeset stops rather than dropping the third.

## Where the grammar runs out

Write the label anyway, naming what you meant in the plainest word available,
and put a line on `gaps` saying the grammar had no name for it. An unlabelled
passage reaches typeset as prose with no block to become, and it becomes a
paragraph — silently, and in the middle of a page where a paragraph is not a
band anyone can lay out.
