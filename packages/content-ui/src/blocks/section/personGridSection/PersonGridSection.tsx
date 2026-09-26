import { DisplayHeading, Eyebrow, PortraitTile, SectionShell } from '@o3/ui'
import type { SectionProps } from '@o3/content-runtime/blocks'
import { fieldAttr, itemAttr } from '@o3/content-runtime/data-attribute'

import { SanityImage } from '../../../SanityImage'
import { PERSON_GRID_COLUMN } from '../../../imageSizes'
import { resolveSurface } from '../../surface'

type PersonGridSectionProps = SectionProps<'personGridSection'>

/**
 * Section block: the current About team cards (`3771:80239`, `3883:16545`).
 *
 * ```
 * header  padding-left 96, gap 8    18px eyebrow #757575 | 48px heading
 * rows    gap 32, three up          card 394.67 wide, gap 24
 *   tile  square, black + red arc, greyscale portrait
 *   meta  gap 8                     Figtree name 20/26 → 24/34, then 13px role
 * ```
 *
 * **This is the block the 12 migrated `person` documents existed for.** They
 * came in with #17 and were rendered nowhere until this band; that is why the
 * people are **referenced**, not inlined. A person is already a document —
 * they author insights — so inlining names here would have created a
 * second, drifting copy of the same fact. The reference goes both ways now:
 * since #32 dropped the `post_author` byline, this band is the *only* thing
 * keeping Kelly Navari (`person-wp-4`) in the corpus.
 *
 * The frame draws six cards, all the same placeholder, so the count is the
 * editor's rather than the design's: whatever is referenced renders, three to
 * a row.
 *
 * The role sits in a `title` field on `person` (WordPress's user title), which
 * is the one place this band reads a document field whose name the block
 * lexicon would otherwise reserve for a document's own name.
 */
export function PersonGridSection({
  eyebrow,
  heading,
  people,
  surface,
  loc,
}: PersonGridSectionProps) {
  // `people[]{_key, ...@->{…}}` spreads nothing when the reference is dangling,
  // so a slot pointing at a deleted person arrives as `{_key}` alone and would
  // render a tile with no portrait and no name. Typegen assumes the dereference
  // succeeds, which is why the guard reads as redundant and is not.
  const members = (people ?? []).filter((person) => person._id)

  return (
    <SectionShell surface={resolveSurface(surface, 'personGridSection')} top="md" bottom="md">
      <div className="flex flex-col gap-10 lg:gap-12">
        {eyebrow || heading ? (
          <header data-sanity={fieldAttr(loc, 'heading')} className="flex flex-col gap-2">
            {/* Brand red — "LEADERSHIP TEAM" is #EB1000 on About (`1927:6436`). */}
            {eyebrow ? (
              <Eyebrow size="lg" tone="brand">
                {eyebrow}
              </Eyebrow>
            ) : null}
            {heading ? <DisplayHeading className="font-normal">{heading}</DisplayHeading> : null}
          </header>
        ) : null}

        <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((person) => (
            <li
              // The slot's key, not the person's: two slots may reference one
              // person, and a duplicate React key mis-reconciles the `<li>`s —
              // which would dock the overlay below to the wrong card.
              key={person._key}
              /*
               * The **reference's** path, not the person document's: what an
               * editor changes on this card is which person occupies the slot,
               * and the slot is a `sections[…].people[_key=="…"]` array item.
               * Editing the person themselves is a different document, which
               * is why the card does not point at one.
               */
              data-sanity={itemAttr(loc, 'people', person._key)}
              className="flex flex-col gap-6"
            >
              <PortraitTile>
                {/*
                 * Empty alt, deliberately. The portrait carries nothing the
                 * name below it does not already say, so alt text here makes a
                 * screen reader announce "Mike Gadsby, image, Mike Gadsby" —
                 * axe's `image-redundant-alt`, which the `Missing Role` story
                 * caught. A decorative image beside its own caption takes
                 * `alt=""` and lets the caption speak.
                 */}
                <SanityImage
                  source={person.headshot}
                  alt=""
                  ratio="fill"
                  width={800}
                  /*
                   * The tile is a grid cell, fluid at every width: three up
                   * from `lg` ((column − 64) / 3), two up from `sm`
                   * ((column − 32) / 2 ≈ 44vw),
                   * one up below that (the column itself ≈ 90vw). The column
                   * and the 90vw stand-in are derived in `imageSizes.ts`.
                   */
                  sizes={PERSON_GRID_COLUMN}
                />
              </PortraitTile>
              <div className="flex flex-col gap-2">
                <p className="text-lead text-balance font-sans">{person.name}</p>
                {person.title ? (
                  <p className="text-meta text-fg-muted uppercase leading-[15px]">{person.title}</p>
                ) : null}
                {person.bio ? <p className="text-body text-fg-body mt-1">{person.bio}</p> : null}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </SectionShell>
  )
}
