import { Mark, markProps, type MarkProps } from '../../base/mark/Mark'

interface PanelCard {
  key: string
  heading?: string | null
  body?: string | null
  note?: string | null
  /** The circle the frame centres on the card — an orb unless set to disc. */
  mark?: MarkProps | null
  /**
   * The panel's `data-sanity`, built by the section (#107). A pre-built
   * string rather than a location, so this presentational subcomponent stays
   * free of anything Sanity — it is handed one attribute value and stamps it.
   */
  dataSanity?: string
}

/**
 * The `cards` half of `railPanelsSection` — the Solutions frame's engagement
 * row (`1925:6112`), #47.
 *
 * ```
 * row  gap 39                       three cards, 394.67 × 526.23, #030303
 *   card  6 × 8 grid, content in cols 2–5 / rows 2–7  →  a flat 65.78 inset
 *     top     stack, gap 8    28/500 −0.0286em heading  |  18/1.2 line
 *     middle  mark, 132                                 (centred)
 *     bottom  20/1.2 "Best when…" line
 * ```
 *
 * The card is drawn as an **instance of `Case study cards`** (`1393:3025`) —
 * the one generation-1 component set a canonical frame reaches for. Its name
 * is the only thing case-study about it: `docs/figma-components.md` records
 * the set as non-canonical because Home draws its case-study cards as frames,
 * and nothing here references a `caseStudy`. So this is a local composition,
 * not a shared card component.
 *
 * The inset is one number at 1440 and the mark is fixed, so the only thing
 * that scales below `lg` is the padding — Solutions has **no 402 frame** (the
 * "Solutions section" at `1924:4768` is a generation-1 capture, 1920/390), so
 * the stack below `lg` is a renderer decision under ADR 0006 rather than a
 * read value: one column, cards keep their internal composition.
 */
export function PanelCards({ items }: { items: PanelCard[] }) {
  return (
    <div className="grid w-full gap-6 lg:grid-cols-3 lg:gap-[39px]">
      {items.map((item) => (
        <article
          key={item.key}
          data-sanity={item.dataSanity}
          className="bg-ink-deep flex flex-col items-center justify-between gap-10 p-8 text-white lg:aspect-[394.67/526.23] lg:gap-0 lg:p-[66px]"
        >
          <div className="flex w-full flex-col gap-2">
            {item.heading ? (
              // 28/500 at −0.0286em is `text-display-md` exactly, but the
              // token's weight is 400 and the frame's card is Medium.
              <h3 className="text-display-md font-display font-medium">{item.heading}</h3>
            ) : null}
            {/* 18px flat in the frame — the floor of every lead-sized token,
                so it does not scale rather than scaling to nothing. */}
            {item.body ? <p className="text-[18px] leading-[1.2]">{item.body}</p> : null}
          </div>

          {/* 132px, and the one element on the card the frame centres. The
              card is always ink, so the mark is always on ink. */}
          <Mark {...markProps(item.mark)} onInk className="w-[132px]" />

          {item.note ? (
            // 20/1.2 — `text-body` reaches 20 at 1440; the frame's line-height
            // is 1.2 rather than the token's reading 1.6.
            <p className="text-body w-full leading-[1.2]">{item.note}</p>
          ) : null}
        </article>
      ))}
    </div>
  )
}
