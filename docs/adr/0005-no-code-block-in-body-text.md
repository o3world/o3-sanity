# 0005. No `codeBlock` in `bodyText` — the archive has no code in it

- **Status:** Accepted
- **Date:** 2026-07-31
- **Deciders:** NickO3 + Claude
- **Related:** [issue #17](https://github.com/o3world/o3-sanity/issues/17), [issue #6](https://github.com/o3world/o3-sanity/issues/6)

## Context

The schema spec (#6) left one inline-object question open, and `bodyText` still
carries the note: _"A codeBlock is added only if extraction finds code in the
migrated WordPress bodies."_ It was deliberately deferred to evidence rather
than guessed at — a consultancy that writes about engineering plausibly posts
code samples, and a Portable Text array cannot render a block type it has no
member for.

#17 extracted all 272 perspectives, which is the whole evidence base that
question was waiting on.

## Decision

**No `codeBlock`.** `bodyText` keeps its closed set: `block`, `figure`,
`embed`, `pullQuote`, plus the inline `code` decorator that already exists for
naming a function or a flag mid-sentence.

The evidence, across all 272 extracted post bodies:

| Signal                                   | Occurrences                                                                                          |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `<pre>`                                  | 0                                                                                                    |
| `<code>`                                 | 0                                                                                                    |
| `wp-block-code` (Gutenberg's code block) | 0                                                                                                    |
| `language-*` (Prism/highlight.js class)  | 0 — both matches are prose ("language-based applications", "large-language-model powered pipelines") |

Not "rare". Zero. Six years of publishing, 272 posts, and the archive contains
no code sample of any kind — the writing is strategy, research and event
recaps, not engineering how-tos.

## Alternatives considered

### Add `codeBlock` anyway, for future authors

- **Pros:** cheap now, and a future engineering post would need it.
- **Cons:** an unused block type is not free. It appears in the Studio's insert
  menu, in the generated types, in the renderer registry, and in every "which
  block do I use?" decision an editor makes — and it needs a syntax
  highlighter, a copy button, and a theme to be worth using at all.
- **Why not:** the deferral in #6 was explicitly conditional on evidence, and
  the evidence came back empty. Adding it now would be answering the question
  the opposite way from how it was asked. If O3 starts publishing engineering
  content, this is a small, additive change made with a real example in hand.

### Leave the question open

- **Pros:** no decision to revisit.
- **Cons:** the note in `bodyText` reads as unfinished work, and the next
  person to touch the schema has to re-run the same investigation to find out
  it was already answered.
- **Why not:** the migration is the only moment the whole archive is in one
  place and greppable. Not recording the answer wastes that.

## Consequences

- `bodyText`'s comment changes from a deferred question to a settled one,
  pointing here.
- A perspective body containing `<pre>` or `<code>` would now fail loud in
  conversion as an unmapped element rather than being silently flattened —
  which is the correct behaviour for content nobody has seen yet.
- Reversing this is additive and cheap: one array member, one renderer, one
  registry line.
