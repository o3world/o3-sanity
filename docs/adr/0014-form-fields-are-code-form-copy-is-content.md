# 0014. The form's field set is code; the words around it are content

- **Status:** Accepted
- **Date:** 2026-08-02
- **Deciders:** NickO3 + Claude
- **Related:** [issue #58](https://github.com/o3world/o3-sanity/issues/58), [issue #48](https://github.com/o3world/o3-sanity/issues/48), [ADR 0001](./0001-component-routing-port.md), [ADR 0007](./0007-content-sourcing-and-provenance.md), [ADR 0008](./0008-shadcn-anatomy-not-theme.md)

## Context

WordPress serves **Gravity Form 1** on `/contact`. The rebuilt page (#48,
`page-seed-contact`) stood in with a mailto CTA because the schema had no form
block, no submission handler existed, and nobody had said where a submission
should land. `docs/specs/schema.md` recorded the gap as map fog: "No
`formBlock` — forms strategy is map fog (what replaces Gravity Forms, where
submissions go)."

#58 asked three questions. **The owner rescoped it to one:** build the fields.
The mechanism (what receives a POST, how spam is handled) and the destination
(inbox, CRM, storage) stay open, and the ticket stays open with them. So this
ADR settles only #58's second question — the schema — and the shape of the
thing that has to survive the other two being answered later.

Two facts constrain the answer.

**The field set is not editorial.** Recovered from the live markup (the WP
extract stored `{ acf_fc_layout: "form", form_id: "1" }` and never captured the
fields), Gravity Form 1 draws six inputs a person fills in: first name and last
name at half width, email, a required **Reason** dropdown, a message, and a
newsletter opt-in — plus a hidden `input_8` carrying the constant `"O3 Website"`
as a source tag. Those six are a contract with whatever eventually receives a
submission. An editor who could delete `email` could break the only way a reply
gets back to anyone.

**The composition is content.** `/contact` has no bespoke route. It resolves
through the catch-all page route (ADR 0001) against `page-seed-contact`, whose
`sections` array _is_ the page. There is nowhere for a form to live in code
without inventing a special case.

## Decision

**A `formSection` section block, whose fields are the copy around the form and
never the form's own inputs.**

### 1. `formSection`, in `SECTION_BLOCKS`

Named per CONTEXT.md — camelCase, `Section` suffix, generic noun. It carries
`eyebrow`, `heading`, `note`, `reasons`, `consentLabel`, `submitLabel`, plus the
`surface` the factory injects.

Section tier rather than a base block inside `layoutSection`, even though
WordPress composes the form in a two-column module beside a portrait. A base
block would inherit the column grid it sits in, and the band needs its own
internal two-across for the name pair; more plainly, a conversion path is a band
of the page and every other band on these seeded pages is a section block.

### 2. The inputs live in `InquiryForm.tsx`, not in the schema

The six fields, their labels, their required rules and their validation
messages are code. `reasons` is the single exception, and it marks where the
line falls: the dropdown's options are studio taxonomy that changes when the
business changes ("Ventures request", "Labs request"), and every value is just a
string to any handler. The options are content; the input carrying them is not.

The consequence to be honest about: **this block draws one form.** A second one
(the newsletter signup, Gravity Form 9, which the extract _did_ capture) would
arrive as a `variant` or `layout` enum on this block — the call
`disciplineGridSection`, `railPanelsSection` and `inFlightSection` have each
already made — not as a field-builder.

### 3. The submit is disabled and says so

#58's other two halves are open, so there is nothing to submit to. The button
is `disabled`, `onSubmit` calls `preventDefault()` regardless (Enter in a text
input submits a form whose button is disabled), and a visible notice wired to
the button as its `aria-describedby` says the form is not connected and points
at the email and phone that are. There is no success state and nothing that can
be mistaken for "sent".

A form that silently discards what it collects is worse than no form — that is
the functional regression #58 exists to close, not to deepen.

### 4. One new primitive: `FormField`

`packages/ui/src/components/form-field.tsx` — a labelled control with its note,
its required marker in both halves (asterisk and off-screen word), and an alert
node that is always in the DOM so the first error of a session is announced.
A render prop, so `id` / `aria-required` / `aria-invalid` / `aria-describedby`
are wired once rather than repeated per field.

Bespoke, not `ui/`: ADR 0008 admits a component to `ui/` only when shadcn
supplies real behaviour, and shadcn's `input`/`label`/`textarea` are styled
elements. The Reason dropdown is a **native `<select>`** for the same reason —
a phone draws a better picker than any listbox we would ship.

## Alternatives considered

### The form is code, with only its surrounding copy in content

- **Pros:** zero schema surface; the field set is unambiguously not an editor's; no chance of a half-authored form reaching production.
- **Cons:** `/contact` has no route file — it is a Page resolved by slug — so this needs either a bespoke route for one page (against ADR 0001's routing contract) or a `slug === 'contact'` special case in the page view. It also leaves `page-seed-contact` composing a page that is not what the page shows, which is precisely the gap #48's provisional marker was raised against.
- **Why not:** it buys field-set safety with a hole in the composition model, and the chosen split gets the same safety for free.

### A full `formSection` with an editor-authored `fields[]` array

- **Pros:** genuinely reusable; a second form costs no code; matches what a CMS is usually expected to do with forms.
- **Cons:** it is a form builder — field types, per-field validation rules, conditional logic, and a handler that can accept an arbitrary payload. Every one of those is work in service of a destination nobody has chosen. And an editor can delete `email`.
- **Why not:** the largest possible answer to the smallest confirmed need. One form exists. Build for one form.

### A base block inside `layoutSection`, matching WordPress's two-column module

- **Pros:** faithful to the source composition — form beside the Handler portrait; composes with anything.
- **Cons:** the form inherits the column grid, so the name pair cannot go two-across without fighting it, and a form narrow enough to sit beside an image is a form nobody finishes on a phone. The portrait and its pull quote already have their own bands on the seeded page.
- **Why not:** ADR 0007 gives Figma the page and WordPress the facts. There is **no frame** here, so the composition is a renderer decision either way — and the better one is a full-measure band.

### Keep Gravity Forms headless, or embed a hosted form service

- **Pros:** submissions, spam handling and a destination all arrive already solved.
- **Cons:** it answers #58's _first_ and _third_ questions, which the owner explicitly left open, and it would decide them by default — the exact move the ticket says not to make. A hosted embed also imports its own markup and cannot be made to look like the rest of the site.
- **Why not:** out of scope by decision, not by difficulty. Reopen it when the mechanism is chosen.

## Consequences

- **`/contact` stops being a functional regression in shape and stays one in
  fact.** The page draws the real field set; it still cannot send. The
  `provisionalNote` now names both halves separately, and `page-seed-contact`
  remains provisional against #48's launch gate.
- **The stub is asserted, not just written.** `interiorPages.render.test.tsx`
  fails if the button is not disabled or the notice disappears. That test is the
  one that _should_ fail when #58's handler lands.
- **`sectionBlockMembers` is now derived from `SECTION_BLOCKS`.** It was a
  second hand-maintained copy of the same list, and `formSection` was
  registered, defined, rendered and bound while still being unauthorable
  because this list had not heard of it. The failure surfaced three files away,
  as a typecheck error in the renderer. A registered block an editor cannot
  author is no longer expressible.
- **Copy note.** The Reason options are Gravity's, with one typo corrected —
  the live site's `"1682 inquires"` is seeded as `"1682 inquiries"`. A typo is
  not a fact, so ADR 0007's "migration wins the facts" does not protect it.
- **Open, and owned by #58:** the mechanism (route, spam story) and the
  destination. Also unresolved: `/contact` has no canonical Figma frame, so the
  band's composition is unsourced and flagged as such in the renderer's doc
  comment.
