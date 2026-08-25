import { defineArrayMember, defineField } from 'sanity'
import { defineArrayItem } from './defineArrayItem'
import { defineSectionBlock } from './defineBlocks'
import { detailsField } from './fields'
import { hiddenUnless } from './knobFields'
import { blockArrayMembers, BLOCK_ARRAYS } from './registry'
import { PAGE_TYPES } from '../../constants'
import { caseShowcaseSectionKnobs } from '../../knobs/caseShowcaseSection'
import { ctaSectionKnobs } from '../../knobs/ctaSection'
import { faqSectionKnobs } from '../../knobs/faqSection'
import { featureGridSectionKnobs, featureKnobs } from '../../knobs/featureGridSection'
import { formSectionKnobs } from '../../knobs/formSection'
import { heroSectionKnobs } from '../../knobs/heroSection'
import { inFlightSectionKnobs } from '../../knobs/inFlightSection'
import { insightsCarouselSectionKnobs } from '../../knobs/insightsCarouselSection'
import { layoutSectionKnobs } from '../../knobs/layoutSection'
import { listingSectionKnobs } from '../../knobs/listingSection'
import { logoWallSectionKnobs } from '../../knobs/logoWallSection'
import { mediaSectionKnobs } from '../../knobs/mediaSection'
import { personGridSectionKnobs } from '../../knobs/personGridSection'
import { quoteSectionKnobs } from '../../knobs/quoteSection'
import { railPanelsSectionKnobs } from '../../knobs/railPanelsSection'
import { roleListSectionKnobs } from '../../knobs/roleListSection'
import { screenGridSectionKnobs, screenKnobs } from '../../knobs/screenGridSection'

/**
 * The first block whose design options are declared rather than written out
 * (ADR 0020). `variant`, `decoration` and `surface` live in
 * `src/knobs/heroSection.ts`; the strings in `fields` say where their
 * generated fields sit. Everything else here is editorial and stays
 * hand-written.
 */
export const heroSection = defineSectionBlock({
  name: 'heroSection',
  description:
    'The page’s opening claim: one to three headline lines, a subheading, and a single call to action. Reach for it once, at the top — it is where the page states the tension it intends to turn. Lines animate in separately, so write them as beats rather than a sentence that happens to wrap.',
  title: 'Hero',
  knobs: heroSectionKnobs,
  fields: [
    'variant',
    defineField({
      name: 'eyebrow',
      type: 'string',
      description: 'Band variant only — the uppercase kicker ("WORK", "ABOUT O3").',
      // Was `({parent}) => parent?.variant !== 'band'`. The gate is the same;
      // it is now written down, so the canvas toolbar can read it instead of
      // guessing at a closure it cannot call (ADR 0020).
      hidden: hiddenUnless({ at: 'variant', mode: 'oneOf', values: ['band'] }),
    }),
    /**
     * The partner lockup — O3's mark, a ×, and the partner's (`2479:2205`),
     * #92. Only the partner half is content: the mark and the × are the
     * lockup's own chrome and the renderer draws them, the same call
     * `LogoKnockout` already makes about which half of a pairing is data.
     *
     * `logo` rather than `media` or a new word: `railPanelsSection.panel.logo`
     * is already an optional image that stands in a place a heading would
     * otherwise be, which is exactly what this is.
     */
    defineField({
      name: 'logo',
      type: 'image',
      description:
        'Band variant only — the partner mark, locked up with O3’s. Upload the mark alone; the renderer draws the O3 half and the ×.',
      hidden: hiddenUnless({ at: 'variant', mode: 'oneOf', values: ['band'] }),
    }),
    defineField({
      name: 'headlineLines',
      title: 'Headline lines',
      type: 'array',
      of: [{ type: 'string' }],
      description:
        'Each line animates in separately; on the orbital variant the last line renders set back. The band variant joins them into one headline.',
      validation: (rule) => rule.required().min(1).max(3),
    }),
    defineField({ name: 'subheading', type: 'text', rows: 2 }),
    // The band's right-hand column, when what belongs there is a credential
    // list rather than a standfirst (`2401:3196` — "O3 EXPERTISE:" over three
    // lines). The two are alternatives, not a stack: the frame draws one 394px
    // column and only ever puts one thing in it, so a hero carrying both
    // renders the details and the standfirst is what an editor removes.
    detailsField({
      description:
        'Band variant only — the labelled list pinned right, where a standfirst would otherwise sit. One label, its lines under it.',
    }),
    defineField({ name: 'button', type: 'button' }),
    'decoration',
  ],
  preview: { select: { title: 'headlineLines.0' } },
})

/** `layout` and `surface` are declared in `src/knobs/logoWallSection.ts` (ADR 0020). */
export const logoWallSection = defineSectionBlock({
  name: 'logoWallSection',
  description:
    'Proof by association — a heading and standfirst over a centred row of client marks. Reach for it when the argument needs borrowed credibility rather than explanation, early on a page that is about to ask for trust. Plates give each mark a hairlined square and make the row the band’s subject; bar sets the same marks in a short unplated strip under the heading. Six is what the frames draw, but the row takes whatever it is given.',
  title: 'Logo wall',
  knobs: logoWallSectionKnobs,
  fields: [
    defineField({ name: 'eyebrow', type: 'string' }),
    'layout',
    // The single `statement` this band shipped with split in two on the
    // 2026-08 frame (`1864:2390`, #89): a 48px heading over a 24px standfirst,
    // both centred. They are `heading` + `body` rather than a second
    // statement field because that is what the lexicon calls them — the
    // block's primary display text and the prose under it.
    defineField({
      name: 'heading',
      type: 'string',
      description: 'The section headline above the logos (`1864:2393`).',
    }),
    defineField({
      name: 'body',
      type: 'text',
      rows: 3,
      description: 'The standfirst under the heading (`2250:1307`).',
    }),
    defineField({
      name: 'clients',
      type: 'array',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'client' }] })],
      description:
        'Six is what the frame draws — one centred row of square tiles, wrapping below lg. The row takes whatever it is given.',
      validation: (rule) => rule.required().min(1),
    }),
    defineField({ name: 'button', type: 'button' }),
  ],
  preview: { select: { title: 'heading' } },
})

/** `surface` is declared in `src/knobs/caseShowcaseSection.ts` (ADR 0020). */
export const caseShowcaseSection = defineSectionBlock({
  name: 'caseShowcaseSection',
  description:
    'Proof by work — sticky-stacking cards for referenced case studies, each projecting that document’s narrative headline and headline stat. Reach for it when a claim needs evidence that actually shipped. There is nothing to write here: the band renders only what the referenced case studies already say.',
  title: 'Case study showcase',
  knobs: caseShowcaseSectionKnobs,
  fields: [
    defineField({ name: 'heading', type: 'string', initialValue: 'Our Work' }),
    defineField({ name: 'button', type: 'button' }),
    defineField({
      name: 'caseStudies',
      type: 'array',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'caseStudy' }] })],
      description:
        'Sticky-stacking cards; each pulls its narrative headline and headline stat from the case study.',
      validation: (rule) => rule.required().min(1),
    }),
  ],
  preview: { select: { title: 'heading' } },
})

/**
 * `layout`, `rail` and `surface` are declared in
 * `src/knobs/railPanelsSection.ts` (ADR 0020), including the gate that offers
 * `rail` only on the rail layout. Everything here is editorial.
 */
export const railPanelsSection = defineSectionBlock({
  name: 'railPanelsSection',
  description:
    'An ordered set of parallel things — offers, platforms, ways of working — as a labelled rail, a row of cards, numbered rows, side-by-side columns of details, or a track of numbered columns that scrolls sideways. Reach for it when several options differ in kind rather than degree and each needs its own short pitch and a quieter “Best when…” line. Two panels minimum; a rail panel can carry a CTA and media, a card carries a mark and one line of body, and a track column carries neither.',
  title: 'Rail + panels',
  knobs: railPanelsSectionKnobs,
  fields: [
    defineField({ name: 'heading', type: 'string', validation: (rule) => rule.required() }),
    defineField({ name: 'intro', type: 'text', rows: 3 }),
    'layout',
    'rail',
    defineField({
      name: 'panels',
      type: 'array',
      validation: (rule) =>
        rule
          .required()
          .min(2)
          .custom((panels, context) => {
            const layout = (context.parent as { layout?: string } | undefined)?.layout
            if (layout !== 'grid') return true
            // The grid draws one row of columns (`2358:2788`); a fourth panel
            // wraps outside the two explicit rows its subgrid aligns on.
            return ((panels as unknown[] | undefined)?.length ?? 0) <= 3
              ? true
              : 'The grid layout holds at most three panels.'
          }),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'panel',
          fields: [
            defineField({
              name: 'railLabel',
              type: 'string',
              validation: (rule) => rule.required(),
            }),
            defineField({ name: 'heading', type: 'string' }),
            defineField({
              name: 'logo',
              type: 'image',
              description: 'Optional logo shown instead of the heading (platform panels).',
            }),
            defineField({
              name: 'body',
              type: 'text',
              rows: 3,
              description:
                'The panel’s prose. On a card it is the single line under the heading ("Senior hands, inside your team.") — the card has room for one.',
            }),
            defineField({
              name: 'note',
              type: 'string',
              description: 'The quieter "Best when…" line — the foot of a card.',
            }),
            // `button` and `media` are rail-layout elements like the `rail` knob,
            // but a panel field's `hidden` callback sees only the panel it
            // sits in, not the section's `layout` — and a `showWhen` reads
            // block-relative paths for the same reason. So these two carry the
            // gate as prose where `rail` gets the declared one.
            defineField({
              name: 'button',
              type: 'button',
              description: 'Rail layout only. The frame’s cards carry no button.',
            }),
            defineField({
              name: 'media',
              type: 'figure',
              description: 'Rail layout only. A card draws its mark instead.',
            }),
            defineField({
              name: 'mark',
              type: 'mark',
              description:
                'Cards and grid layouts only — the circle the frame centres on the card, or sets beside a grid column’s heading. An orb unless set to disc.',
            }),
            // Rows layout only (`2334:2165`, `2334:2166`) — the same gate as
            // `button` and `media`, carried as prose for the same reason: a
            // panel field's `hidden` callback sees only the panel it sits in,
            // not the section's `layout`.
            detailsField({
              description:
                'Rows and grid layouts. Labelled breakdowns under the panel’s body — "Migration targets we’ve handled", then what the client ends up with. The rows frame draws the LAST one as the promise, in brand red; the grid stacks them plain.',
            }),
          ],
          preview: { select: { title: 'railLabel' } },
        }),
      ],
    }),
  ],
  preview: { select: { title: 'heading' } },
})

/**
 * `decoration` and `surface` are declared in `src/knobs/quoteSection.ts`
 * (ADR 0020), including the `molecule` value and the frame it came from.
 * Everything here is editorial.
 */
export const quoteSection = defineSectionBlock({
  name: 'quoteSection',
  description:
    'One borrowed voice, given a whole band. Reach for it to let someone outside the studio make the claim the page would sound boastful making itself. Quotes are inline rather than documents, so the same words used twice are two separate edits.',
  title: 'Quote',
  knobs: quoteSectionKnobs,
  fields: [
    defineField({
      name: 'eyebrow',
      type: 'string',
      description:
        'The label over the quote — "Trusted by leading organizations". O3XO draws it as the kit’s pill (`4414:8100`); O3’s band draws no label above a quote and leaves this empty.',
    }),
    defineField({ name: 'quote', type: 'text', rows: 4, validation: (rule) => rule.required() }),
    defineField({
      name: 'attribution',
      type: 'string',
      description: 'e.g. "Business Leader, Global Health Brand".',
    }),
    'decoration',
  ],
  preview: { select: { title: 'quote' } },
})

/**
 * `surface` is declared in `src/knobs/insightsCarouselSection.ts` (ADR 0020).
 * `category`'s gate stays a closure: it reads whether `insights` holds
 * anything, which no `showWhen` mode says, and an editorial field is allowed
 * one where a knob is not.
 */
export const insightsCarouselSection = defineSectionBlock({
  name: 'insightsCarouselSection',
  description:
    'Thinking, as a carousel of insights — hand-picked, or filled automatically with the most recent. Reach for it late on a page, where a reader who is now interested should be given somewhere further to go. Leave the list empty and it self-fills, optionally within one category, and stays current without anyone maintaining it.',
  title: 'Insights carousel',
  knobs: insightsCarouselSectionKnobs,
  fields: [
    defineField({ name: 'heading', type: 'string', initialValue: 'The thinking behind the work.' }),
    defineField({
      name: 'insights',
      type: 'array',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'insight' }] })],
      description: 'Leave empty to show the latest insights automatically.',
    }),
    defineField({
      name: 'category',
      type: 'reference',
      to: [{ type: 'category' }],
      description: 'When auto-filling, limit to this category.',
      hidden: ({ parent }) => Boolean(parent?.insights?.length),
    }),
  ],
  preview: { select: { title: 'heading' } },
})

/**
 * `decoration` and `surface` are declared in `src/knobs/ctaSection.ts`
 * (ADR 0020).
 */
export const ctaSection = defineSectionBlock({
  name: 'ctaSection',
  description:
    'The ask: a heading, up to two lines of body, and one call to action. Reach for it to close a page, or to break a long one at the point a reader might reasonably act. One CTA — a band offering two next steps offers none.',
  title: 'CTA',
  knobs: ctaSectionKnobs,
  fields: [
    defineField({ name: 'heading', type: 'string', validation: (rule) => rule.required() }),
    defineField({ name: 'body', type: 'text', rows: 2 }),
    defineField({ name: 'button', type: 'button' }),
    'decoration',
  ],
  preview: { select: { title: 'heading' } },
})

/**
 * `layout`, `decoration` and `surface` are declared in
 * `src/knobs/featureGridSection.ts` (ADR 0020), and so is `icon` — a feature's
 * own design option, declared against the member because an array member is its
 * own knob root (ADR 0021). The `features` length rule still reads `layout`
 * from the form value, because what a choice requires of the rest of the
 * document is validation rather than a knob.
 *
 * **Named for the composition, not for the first page that used it.** It was
 * `disciplineGridSection` while About's four disciplines were its only caller;
 * the partner page draws the same {mark, heading, body} set three more times
 * as reasons, enablements and use cases (#92), and "discipline" told an editor
 * adding "Multi-channel publishing from one source" the wrong thing about what
 * they were authoring. `feature` is the design-system word for it — the
 * category Tailwind Plus and most marketing-component libraries file it under.
 */
export const featureGridSection = defineSectionBlock({
  name: 'featureGridSection',
  description:
    'A set of parallel short claims, each a mark with a heading and optional body — capabilities, reasons to pick you, what a platform enables, the situations a reader might be in. Reach for it when several things are true in the same way and none needs a whole band. Four arrangements: paired two across, stacked three across, hairlined full-width rows, or the orbital diagram, which takes exactly four and derives each position from array order.',
  title: 'Feature grid',
  knobs: featureGridSectionKnobs,
  fields: [
    defineField({ name: 'heading', type: 'string' }),
    'layout',
    defineField({
      name: 'features',
      type: 'array',
      description:
        'Order is meaningful on the orbital layout: the first is the apex, the rest take the base ring left → right → front. Positions derive from order, never from the author.',
      validation: (rule) =>
        rule
          .required()
          .min(1)
          .custom((features, context) => {
            const layout = (context.parent as { layout?: string } | undefined)?.layout
            if (layout !== 'orbital') return true
            // The diagram has exactly four nodes drawn into it (`1928:6526`);
            // a fifth feature has nowhere to stand.
            return (features as unknown[] | undefined)?.length === 4
              ? true
              : 'The orbital layout places exactly four features.'
          }),
      of: [
        defineArrayItem({
          knobs: featureKnobs,
          fields: [
            defineField({ name: 'heading', type: 'string', validation: (rule) => rule.required() }),
            defineField({
              name: 'body',
              type: 'text',
              rows: 3,
              description:
                'Optional — `2334:2122` draws a whole band of features that are a heading and nothing else.',
            }),
            defineField({
              name: 'mark',
              type: 'mark',
              description:
                'The dotted circle the frame sets with the copy — an orb unless set to disc. Drawn by every layout except orbital, which places its own nodes.',
            }),
            // Beside `mark`, because the two fill one position: a feature that
            // names an icon has the glyph where the disc would have been.
            'icon',
          ],
          preview: { select: { title: 'heading', subtitle: 'body' } },
        }),
      ],
    }),
    'decoration',
  ],
  preview: { select: { title: 'heading', subtitle: 'layout' } },
})

/** `surface` is declared in `src/knobs/personGridSection.ts` (ADR 0020). */
export const personGridSection = defineSectionBlock({
  name: 'personGridSection',
  description:
    'The people behind the work, as a grid. Reach for it when credibility rests on who is in the room. People are referenced rather than typed in, so a title fixed here is fixed everywhere that person appears.',
  title: 'Person grid',
  knobs: personGridSectionKnobs,
  fields: [
    defineField({ name: 'eyebrow', type: 'string' }),
    defineField({ name: 'heading', type: 'string' }),
    defineField({
      name: 'people',
      type: 'array',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'person' }] })],
      description:
        'Referenced, not inlined — a person is already a document (they author insights), so the About band points at the same record rather than re-typing it.',
      validation: (rule) => rule.required().min(1),
    }),
  ],
  preview: { select: { title: 'heading', subtitle: 'eyebrow' } },
})

/** `surface` is declared in `src/knobs/roleListSection.ts` (ADR 0020). */
export const roleListSection = defineSectionBlock({
  name: 'roleListSection',
  description:
    'Open roles, as rows with their own Apply buttons. Reach for it on a page that is recruiting. Roles are authored inline and exist nowhere else, so there is no role page to link to and the list is only as current as someone keeps it.',
  title: 'Role list',
  knobs: roleListSectionKnobs,
  fields: [
    defineField({ name: 'eyebrow', type: 'string' }),
    defineField({ name: 'heading', type: 'string' }),
    defineField({
      name: 'roles',
      type: 'array',
      validation: (rule) => rule.required().min(1),
      /**
       * ROLES ARE INLINE OBJECTS, NOT A DOCUMENT TYPE — decided here (#56).
       *
       * A `role` document would buy exactly one thing: a URL to link to. The
       * Careers band (`1925:6061`) links out instead — every row's Apply
       * button is a `button`, and the frame draws no role detail page, no
       * listing of roles anywhere else, and no cross-reference to one. A
       * document type also costs a routable slug, a card projection and a
       * Studio section per ADR 0001, for content that turns over every few
       * months and is authored in one place.
       *
       * Promote it the day something needs to link to a role — an /apply
       * route, a role referenced from an insight, or an ATS feed with its
       * own ids. Until then this is the cheaper half of a reversible choice.
       */
      of: [
        defineArrayMember({
          type: 'object',
          name: 'role',
          fields: [
            defineField({ name: 'heading', type: 'string', validation: (rule) => rule.required() }),
            defineField({
              name: 'eyebrow',
              type: 'string',
              description: 'The row’s small label — the frame reads "REMOTE · PHILADELPHIA".',
            }),
            defineField({ name: 'button', type: 'button', description: 'The row’s Apply button.' }),
            defineField({
              name: 'mark',
              type: 'mark',
              description: 'The circle at the head of the row — an orb unless set to disc.',
            }),
          ],
          preview: { select: { title: 'heading', subtitle: 'eyebrow' } },
        }),
      ],
    }),
  ],
  preview: { select: { title: 'heading', subtitle: 'eyebrow' } },
})

/**
 * `layout` and `surface` are declared in `src/knobs/inFlightSection.ts`
 * (ADR 0020). Everything here is editorial.
 */
export const inFlightSection = defineSectionBlock({
  name: 'inFlightSection',
  description:
    'What the studio is working on now — anonymous in-progress cards, or dated rows for appearances and ideas. Reach for it when the job is showing current momentum rather than finished results; nothing here has shipped, which is why a card names no client. An entry with a date draws the date marker, one without draws its mark.',
  title: 'In flight',
  knobs: inFlightSectionKnobs,
  fields: [
    defineField({ name: 'heading', type: 'string', validation: (rule) => rule.required() }),
    defineField({
      name: 'subheading',
      type: 'text',
      rows: 2,
      description: 'The 24px standfirst beside the heading. The Ideas band has none.',
    }),
    'layout',
    defineField({
      name: 'entries',
      type: 'array',
      validation: (rule) => rule.required().min(1),
      /**
       * ENTRIES ARE INLINE OBJECTS, NOT REFERENCES — decided here (#50).
       *
       * The obvious reading of the studio band is "reference the case studies
       * that are in progress". The frame says otherwise, in its own copy: "not
       * the polished case study, the part where it's still being figured out".
       * Every card is anonymous (no client, no logo), carries no link, and its
       * kicker is a bare sector pair — "FINTECH · ONBOARDING" — where a real
       * case-study card draws `industry · industryDetail` from the document
       * (`1883:3561`). Pointing these at `caseStudy` documents would publish
       * client work that has not shipped, which is the exact thing ADR 0007
       * exists to stop.
       *
       * The appearances band has the same shape and no document behind it
       * either: the content model has no `event` type, and inventing one for
       * four rows on one page is the trade `roleListSection` already declined.
       * Promote it the day an appearance needs a URL of its own, or the day a
       * second surface needs the same list.
       */
      of: [
        defineArrayMember({
          type: 'object',
          name: 'entry',
          fields: [
            defineField({ name: 'heading', type: 'string', validation: (rule) => rule.required() }),
            defineField({
              name: 'eyebrow',
              type: 'string',
              description: 'The entry’s small label — "FINTECH · ONBOARDING", "WORKSHOP · ONLINE".',
            }),
            defineField({
              name: 'media',
              type: 'figure',
              description: 'The card image. Ignored by the rows layout, which draws no media.',
            }),
            defineField({
              name: 'date',
              type: 'date',
              description:
                'When it happens — the rows layout draws it as the red MON / DD marker. Leave it empty and the row leads with its copy.',
            }),
            defineField({
              name: 'button',
              type: 'button',
              description:
                'Where the row goes. The label is never drawn — it names the arrow control for a screen reader.',
            }),
          ],
          preview: { select: { title: 'heading', subtitle: 'eyebrow', media: 'media.image' } },
        }),
      ],
    }),
  ],
  preview: { select: { title: 'heading', subtitle: 'layout' } },
})

/**
 * The inquiry form band — the block `/contact` was missing (#58).
 *
 * **The field set is code, the words around it are content.** The inputs
 * this block draws (first name, last name, email, reason, message, the
 * newsletter opt-in) are fixed in `FormSection.tsx`, transcribed from the
 * Gravity Form 1 that WordPress serves on `/contact` today. They are not
 * editor-authorable, and that is the decision rather than an omission: a
 * field set is a contract with whatever receives a submission, and an editor
 * who could delete `email` could break the form for everyone. Making them
 * content would mean building a form builder — a much larger thing, for a
 * destination nobody has chosen yet (ADR 0014).
 *
 * `reasons` is the exception, and shows where the line falls: the dropdown's
 * options are studio taxonomy that changes when the business changes
 * ("Ventures request", "Labs request"), and every value is just a string to
 * any handler. So they are content; the input that carries them is not — and
 * for the same reason they are **not a knob** (#120): an editor editing them is
 * authoring the form, not making a design decision on the canvas. `surface` is
 * the block's whole roster, declared in `src/knobs/formSection.ts`.
 *
 * The submit is an ordinary `button` instance, so it carries the same fields
 * and the same knob as a button in a hero or a nav — an instance is configured
 * by its component, and a form button that re-declared its own words would be
 * a second declaration of one (ADR 0023).
 *
 * **The band is a card beside a rail** (`2960:7792`). The form is the left
 * column; `media`, `quote`, `attribution` and `details` are the right one — a
 * portrait over a caption-sized pull quote, then the studio's address and the
 * two ways to reach it under red micro-kickers. Every one of them is optional,
 * and a band with none draws the card alone.
 *
 * ⚠️ **There is no submission handler and no destination.** #58's other two
 * halves are open, so the renderer disables its submit and says so on the
 * page. This block is honest scaffolding, not a working form.
 */
export const formSection = defineSectionBlock({
  name: 'formSection',
  description:
    'The inquiry band: a form card beside a rail carrying a portrait, a short quote and the ways to reach the studio. Reach for it on a page whose purpose is to start a conversation. The reasons list is the only part of the form’s shape an editor owns — and no submission handler exists yet, so the renderer disables the submit and says so on the page.',
  title: 'Form',
  knobs: formSectionKnobs,
  fields: [
    defineField({ name: 'eyebrow', type: 'string' }),
    // Optional: `2960:7792` opens the card at the first name field, so the
    // whole header is absent on the band the frame draws.
    defineField({ name: 'heading', type: 'string' }),
    defineField({
      name: 'note',
      type: 'text',
      rows: 2,
      description: 'The quieter line under the heading, above the first field.',
    }),
    defineField({
      name: 'reasons',
      type: 'array',
      of: [defineArrayMember({ type: 'string' })],
      description:
        'The options in the “Reason” dropdown, in the order they are shown. Carried from Gravity Form 1.',
      validation: (rule) => rule.required().min(1),
    }),
    defineField({
      name: 'consentLabel',
      type: 'string',
      description:
        'The opt-in checkbox beside the submit. Leave empty and no checkbox is drawn — an opt-in nobody asked for is worse than none.',
    }),
    defineField({
      name: 'button',
      type: 'button',
      description:
        'The submit. Leave its destination empty and it stays a control; give it one and it becomes a link like any other button. Disabled until #58 has a handler behind it.',
      // Optional, not required(): the renderer absorbs absence with the same
      // 'Send message' fallback, so a missing value costs nothing (skill rule:
      // fields the renderer can absorb stay optional).
      initialValue: { _type: 'button', label: 'Send message' },
    }),
    defineField({
      name: 'media',
      type: 'figure',
      title: 'Portrait',
      description:
        'The face at the top of the rail, drawn as a 120px circle. Leave it empty and the quote starts the rail.',
    }),
    defineField({
      name: 'quote',
      type: 'text',
      rows: 3,
      description:
        'A short quote in the rail beside the form, set at caption size. Keep it to a couple of sentences — this is a note beside the form, not the page’s statement.',
    }),
    defineField({
      name: 'attribution',
      type: 'string',
      description: 'Who said the quote. A line break separates their name from their role.',
    }),
    detailsField({
      description:
        'The rail’s lower half: a red kicker over the lines under it. “Visit us” over the address, “Reach us” over the phone and email. An email or a phone number becomes a link.',
    }),
  ],
  preview: { select: { title: 'heading', subtitle: 'eyebrow' } },
})

/**
 * `columns`, `decoration` and `surface` are declared in
 * `src/knobs/layoutSection.ts` (ADR 0020). `columns` is the repo's only
 * number-valued knob: it declares `valueType: 'number'`, which is what keeps
 * the generated field `type: 'number'` and `generated.ts` publishing
 * `columns?: 1 | 2 | 3`.
 *
 * `items` is not a knob and is not one waiting to happen — it is the block's
 * content. The design options an editor might want on an individual item wait
 * on #122 (an array member as its own knob root).
 */
export const layoutSection = defineSectionBlock({
  name: 'layoutSection',
  description:
    'The general-purpose prose band — one to three columns of base blocks under an optional eyebrow, heading and subheading. Reach for it whenever a page needs words, a figure, an embed or a stat group and no bespoke band is already doing that job. It is the block to try before concluding the design system is missing one.',
  title: 'Layout section',
  knobs: layoutSectionKnobs,
  fields: [
    // The interior frames head almost every band with the same three-part
    // stack — eyebrow, heading, and a set-back second line (`1924:5344`'s
    // "WHY O3 / Built to go end to end — on purpose."). Added in #42 so the
    // About and Solutions layers can be composed from this block instead of
    // needing one of their own.
    defineField({ name: 'eyebrow', type: 'string' }),
    defineField({ name: 'heading', type: 'string' }),
    defineField({
      name: 'subheading',
      type: 'text',
      rows: 2,
      description: 'The quieter second line under the heading.',
    }),
    'columns',
    'decoration',
    defineField({
      name: 'items',
      type: 'array',
      // Derived from `BLOCK_ARRAYS`, not restated — the same declaration the
      // canvas insert menu reads (#112). A base block registered but missing
      // from here is a block an editor cannot author, which is the state #58
      // spent three files finding out about. `mark` arrives through it, which
      // is why the column's picker says "Mark" rather than "Orb": a member
      // title here would be the one hand-kept fact in a derived list.
      //
      // The model's own arrays, and not a brand's: the base tier is one list
      // for both brands, so every roster answers this key identically.
      of: blockArrayMembers('layoutSection.items', BLOCK_ARRAYS).map((member) =>
        defineArrayMember(member),
      ),
      validation: (rule) => rule.required().min(1),
    }),
  ],
  preview: {
    select: { title: 'heading' },
    prepare: (sel) => ({ title: sel.title ?? 'Layout section' }),
  },
})

/**
 * `variant`, `width` and `surface` are declared in `src/knobs/mediaSection.ts`
 * (ADR 0020), including the gate that withholds `width` from a capture.
 * `media` is the only editorial field the band has.
 */
export const mediaSection = defineSectionBlock({
  name: 'mediaSection',
  description:
    'A figure given a whole band. Reach for it when an image or video carries the argument rather than decorating it. The plain variant is a contained or full-bleed figure; the capture variant is a tall dark stage that crops a long screenshot rather than fitting it.',
  title: 'Media section',
  knobs: mediaSectionKnobs,
  fields: [
    defineField({ name: 'media', type: 'figure', validation: (rule) => rule.required() }),
    'variant',
    'width',
  ],
  preview: { select: { title: 'media.alt', subtitle: 'variant' } },
})

/**
 * Tiled product screenshots on gradient plates — the case-study frame's screen
 * bands (`2230:3315`, `2230:7559`), #97.
 *
 * Registered as an ordinary section block rather than a case-study element:
 * ADR 0018's showcase rule is that every band the case study needs is a block
 * any content type can compose, so this is available to `page.sections` on the
 * day it lands.
 *
 * Two design options per screen and no more. The frame's plates differ in
 * exactly two ways — the colour behind the screenshot (`tone`) and whether the
 * tile takes one column or both (`span`) — and everything else about a tile
 * (32px radius, the 12px-radius screenshot inside it, the crop) is composition
 * the renderer owns. Plate HEIGHT is deliberately not a field: `2230:7559`
 * draws 716 for a wide tile and 342 for a small one, so height follows `span`
 * (ADR 0006 — renderers decide).
 *
 * Both of those belong to the SCREEN rather than to the band, so they are
 * declared against the member and their fields come from `defineArrayItem` —
 * the first item-surface knobs in the repo (#118, ADR 0021). The block's own
 * roster is `surface` and nothing else, which is why its declaration looks
 * thin: the knobs an editor reaches for on this band are on the tiles.
 */
export const screenGridSection = defineSectionBlock({
  name: 'screenGridSection',
  description:
    'Product screenshots on gradient plates, tiled two to a row. Reach for it to show an interface actually existing, usually in more than one state. Each screen picks its plate tone and whether it spans one column or both; plate height follows the span and is not something to set.',
  title: 'Screen grid',
  knobs: screenGridSectionKnobs,
  fields: [
    defineField({
      name: 'screens',
      type: 'array',
      description: 'Tiles fill the two-column grid in order; a wide screen takes both columns.',
      validation: (rule) => rule.required().min(1),
      of: [
        defineArrayItem({
          knobs: screenKnobs,
          fields: [
            defineField({ name: 'media', type: 'figure', validation: (rule) => rule.required() }),
            'tone',
            'span',
          ],
          preview: { select: { title: 'media.alt', subtitle: 'tone', media: 'media.image' } },
        }),
      ],
    }),
  ],
  preview: {
    // The lead tile stands for the band in the array, the way `figure` previews
    // on its own `alt`. A grid whose first screen has no alt yet falls back to
    // the block's name rather than showing an empty row.
    select: { alt: 'screens.0.media.alt', media: 'screens.0.media.image', screens: 'screens' },
    prepare: (sel) => ({
      title: (sel.alt as string | undefined) ?? 'Screen grid',
      subtitle: `${((sel.screens as unknown[] | undefined) ?? []).length} screens`,
      media: sel.media,
    }),
  },
})

/**
 * `surface` is declared in `src/knobs/listingSection.ts` (ADR 0020).
 *
 * **`pageType` is a closed enum and deliberately not a knob** — it names a
 * content category, not a design option, so an editor changing it is choosing
 * what the band is about rather than how it looks (#120). It is the one
 * editorial closed set on a converted block, which means `knobGuard.test.ts`
 * has to be told about it by name; the reasoning is written down there and in
 * the knobs file rather than remembered.
 */
export const listingSection = defineSectionBlock({
  name: 'listingSection',
  description:
    'Pages of one type, listed as cards drawn from their card fieldset. It currently reaches no rendered route and lists a page type nothing uses, so a page being composed today should not reach for it.',
  title: 'Listing',
  knobs: listingSectionKnobs,
  fields: [
    defineField({ name: 'heading', type: 'string' }),
    defineField({
      name: 'pageType',
      type: 'string',
      options: { list: [...PAGE_TYPES] },
      initialValue: 'service',
      description: 'Lists pages of this type via their card fieldset.',
      validation: (rule) => rule.required(),
    }),
  ],
  preview: { select: { title: 'heading', subtitle: 'pageType' } },
})

/**
 * O3XO's alone (ADR 0028): the kit draws an FAQ accordion (`4406:7288`) and
 * O3's design file has no band like it. `surface` is declared in
 * `src/knobs/faqSection.ts`; everything here is editorial.
 *
 * A row is `heading` + `body`, the pair `panel` and `feature` already use for
 * "the item's own title, and the prose under it" — a question is a heading that
 * happens to end in a question mark, and inventing `question` / `answer` fields
 * would put two more synonyms in the lexicon for concepts it already names.
 */
export const faqSection = defineSectionBlock({
  name: 'faqSection',
  description:
    'The objections a reader is holding, answered in their own words — one heading, a standfirst, and a column of questions that open. Reach for it late on a page that has already made its case, where the remaining obstacle is doubt rather than ignorance. Every row starts closed, so nothing here can be the first time a reader meets an idea.',
  title: 'FAQ',
  knobs: faqSectionKnobs,
  fields: [
    defineField({ name: 'heading', type: 'string', validation: (rule) => rule.required() }),
    defineField({
      name: 'subheading',
      type: 'text',
      rows: 2,
      description: 'The standfirst under the heading — what this set of questions is about.',
    }),
    defineField({
      name: 'questions',
      type: 'array',
      validation: (rule) => rule.required().min(1),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'question',
          fields: [
            defineField({
              name: 'heading',
              type: 'string',
              description: 'The question, as a reader would ask it.',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'body',
              type: 'text',
              rows: 4,
              description:
                'The answer. One paragraph — a row that opens onto an essay is one nobody reads.',
              validation: (rule) => rule.required(),
            }),
          ],
          preview: { select: { title: 'heading', subtitle: 'body' } },
        }),
      ],
    }),
  ],
  preview: { select: { title: 'heading' } },
})
