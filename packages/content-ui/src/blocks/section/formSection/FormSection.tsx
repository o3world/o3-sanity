import { DisplayHeading, Eyebrow, SectionShell, surfaceAttrs } from '@o3/ui'
import type { SectionProps } from '@o3/content-runtime/blocks'
import { fieldAttr } from '@o3/content-runtime/data-attribute'

import { SanityImage } from '../../../SanityImage'
import { resolveSurface } from '../../surface'

import { InquiryForm } from './InquiryForm'

type FormSectionProps = SectionProps<'formSection'>

/**
 * Section block: the inquiry form band — `/contact`'s conversion path (#58),
 * drawn from `2960:7792` (1440) and `2975:10195` (402).
 *
 * ```
 * band            140/140 at 1440, 48/48 at 402
 *   card 673      white, radius 16, 44 padding, field gap 20
 *   rail 481      portrait → quote → attribution, then the address
 * ```
 *
 * The two columns sit side by side above `lg` and stack at 402, which is how
 * the frame answers the objection to a split layout: the form is never narrow
 * on a phone, it is the full width with the rail under it.
 *
 * The band's vertical padding is a call-site literal because 140px is not a
 * step on the band scale (tokens/layout.css) — solved across the two frame
 * widths the way those tokens are.
 *
 * `eyebrow`, `heading` and `note` are optional and the frame sets none of
 * them; the header they compose is drawn above the split when a document does.
 *
 * The submit is an ordinary `button` instance, so it offers everything any
 * other button does. **The fields are not** — see the schema's doc comment and
 * ADR 0014. The submit is disabled; #58 has neither a handler nor a
 * destination, and `InquiryForm` says so on the page rather than pretending.
 */
export function FormSection({
  eyebrow,
  heading,
  note,
  reasons,
  consentLabel,
  button,
  media,
  quote,
  attribution,
  details,
  surface,
  loc,
}: FormSectionProps) {
  const resolved = resolveSurface(surface, 'formSection')
  const rail = Boolean(media || quote || attribution || details?.length)

  return (
    <SectionShell
      surface={resolved}
      top="none"
      bottom="none"
      // 140/48 vertical and a 16px mobile gutter (`2960:7792` / `2975:10195`);
      // the band draws its own gutter for the same reason the interior hero
      // does.
      className="px-gutter-tight py-[clamp(48px,calc(8.863vw+12.37px),140px)]"
    >
      <div className="flex flex-col gap-10 lg:gap-16">
        {eyebrow || heading || note ? (
          <header data-sanity={fieldAttr(loc, 'heading')} className="flex flex-col gap-4">
            {eyebrow ? <Eyebrow size="lg">{eyebrow}</Eyebrow> : null}
            {heading ? <DisplayHeading>{heading}</DisplayHeading> : null}
            {note ? <p className="text-lead text-current/70">{note}</p> : null}
          </header>
        ) : null}

        {/* 673 + 481 either side of an 86px gutter (`2960:7793`), which is also
            the gap the two columns keep once they stack (`2975:10196`). */}
        <div className="grid gap-[86px] lg:grid-cols-[673fr_481fr]">
          {/*
            The card declares `white` because it paints white: the text roles
            inherit, so a card on an ink band keeps the band's on-ink alphas
            until it says otherwise (tokens/color.css).
          */}
          <div
            {...surfaceAttrs('white')}
            className="text-fg flex flex-col gap-5 rounded-2xl bg-white p-11"
          >
            {/* The submit's fill is not passed down: the submit is an ordinary
                button instance, so it resolves from the surface it stands on
                the way every other button does. */}
            <InquiryForm reasons={reasons ?? []} consentLabel={consentLabel} button={button} />
          </div>

          {rail ? (
            <div className="flex flex-col gap-10">
              {media || quote || attribution ? (
                <div className="flex flex-col gap-[18px]">
                  {media?.image ? (
                    <SanityImage
                      source={media.image}
                      alt={media.alt ?? ''}
                      ratio="1/1"
                      width={240}
                      sizes="120px"
                      className="size-30 rounded-full"
                    />
                  ) : null}
                  {quote ? (
                    <blockquote data-sanity={fieldAttr(loc, 'quote')} className="text-lead text-fg">
                      {`“${quote}”`}
                    </blockquote>
                  ) : null}
                  {attribution ? (
                    <p
                      data-sanity={fieldAttr(loc, 'attribution')}
                      className="text-body text-fg-muted whitespace-pre-line"
                    >
                      {attribution}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {details?.length ? (
                // One flat 14px rhythm under a 32px hairline: `2960:7834` is a
                // single stack of kicker, lines, kicker, lines at gap 14.
                <div
                  data-sanity={fieldAttr(loc, 'details')}
                  className="border-line flex flex-col gap-[14px] border-t pt-8"
                >
                  {details.map((detail) => (
                    <div key={detail._key} className="flex flex-col gap-[14px]">
                      <p className="text-brand text-[11px]/[13.2px] font-bold uppercase tracking-[0.14em]">
                        {detail.label}
                      </p>
                      {(detail.items ?? []).map((item, index) => (
                        <p
                          key={`${detail._key}-${index}`}
                          className="text-fg-body whitespace-pre-line text-[15px]/[27px]"
                        >
                          <ContactLine value={item} />
                        </p>
                      ))}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </SectionShell>
  )
}

/** An `@` with something either side of it and a dot after it. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
/** Ten or more digits, however they are punctuated: `(215) 592-4739`. */
const PHONE = /^[+(]?[\d\s().+-]{10,}$/

/**
 * One line of the rail's lower half, as a link when it is reachable.
 *
 * The frame draws the address, the phone and the email as flat text
 * (`2960:7838`, `2960:7842`) — but the form cannot send yet (#58), so those
 * two are the page's only working conversion path and a printed one is not
 * one. The value's own shape decides, so nothing is authored twice; an address
 * matches neither pattern.
 */
function ContactLine({ value }: { value: string }) {
  const trimmed = value.trim()
  if (EMAIL.test(trimmed)) {
    return (
      <a
        href={`mailto:${trimmed}`}
        className="hover:text-brand duration-(--duration-hover) transition-colors ease-out"
      >
        {value}
      </a>
    )
  }
  if (PHONE.test(trimmed)) {
    return (
      <a
        href={`tel:${trimmed.replace(/[^\d+]/g, '')}`}
        className="hover:text-brand duration-(--duration-hover) transition-colors ease-out"
      >
        {value}
      </a>
    )
  }
  return <>{value}</>
}
