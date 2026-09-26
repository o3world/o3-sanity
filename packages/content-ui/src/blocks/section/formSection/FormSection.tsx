import { DisplayHeading, Eyebrow, SectionShell, surfaceAttrs } from '@o3/ui'
import { stegaClean } from '@sanity/client/stega'
import { cn } from '@o3/ui/lib/utils'
import type { SectionProps } from '@o3/content-runtime/blocks'
import { fieldAttr } from '@o3/content-runtime/data-attribute'

import { SanityImage } from '../../../SanityImage'
import { resolveSurface } from '../../surface'
import { MoleculeDecoration } from '../../MoleculeDecoration'
import './form-section.css'

import { InquiryForm, type FormStatus } from './InquiryForm'

type FormSectionProps = SectionProps<'formSection'> & {
  /**
   * Which state the card opens in. Stories only, so the sent and failed
   * answers are visible without a network; a page always opens on `idle` and
   * the schema has no field for it.
   */
  initialStatus?: FormStatus
}

/** Contact composition: 2960:7792 desktop and 3754:78225 mobile. */
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
  variant,
  decoration,
  loc,
  initialStatus,
}: FormSectionProps) {
  const resolved = resolveSurface(surface, 'formSection')
  const rail = Boolean(media || quote || attribution || details?.length)
  const hero = stegaClean(variant) === 'hero'
  const header =
    eyebrow || heading || note ? (
      <header data-sanity={fieldAttr(loc, 'heading')} className="flex min-w-0 flex-col gap-2">
        {eyebrow ? (
          <Eyebrow size="lg" tone="brand" className="pb-4">
            {eyebrow}
          </Eyebrow>
        ) : null}
        {heading ? (
          <DisplayHeading as={hero ? 'h1' : 'h2'} level="hero" className="whitespace-pre-line">
            {heading}
          </DisplayHeading>
        ) : null}
        {note ? <p className="text-lead text-fg-body">{note}</p> : null}
      </header>
    ) : null

  return (
    <SectionShell
      surface={resolved}
      top="none"
      bottom="none"
      className={cn(
        'relative isolate overflow-hidden max-lg:px-4 lg:px-24',
        hero ? 'form-section-texture pb-16 pt-32 lg:pb-32 lg:pt-64' : 'py-16 lg:py-32',
      )}
    >
      <MoleculeDecoration
        decoration={decoration}
        block="formSection"
        surface={resolved}
        visibleFrom="base"
        className="right-[-449px] top-[367px] w-[900px] opacity-10 lg:right-[-329px] lg:top-[-223px] lg:w-[1100px]"
      />
      <div className="flex flex-col gap-16 lg:gap-32">
        <div className={cn('grid items-center gap-16 lg:gap-8', header && 'lg:grid-cols-2')}>
          {header}
          {/*
            The card declares `white` because it paints white: the text roles
            inherit, so a card on an ink band keeps the band's on-ink alphas
            until it says otherwise (tokens/color.css).
          */}
          <div
            {...surfaceAttrs('white')}
            className="text-fg min-w-0 rounded-2xl bg-white p-8 shadow-[0_32px_64px_0_rgb(0_0_0/0.2)]"
          >
            {/* The submit's fill is not passed down: the submit is an ordinary
                button instance, so it resolves from the surface it stands on
                the way every other button does. */}
            <InquiryForm
              reasons={reasons ?? []}
              consentLabel={consentLabel}
              button={button}
              initialStatus={initialStatus}
            />
          </div>
        </div>

        {rail ? (
          <div className="border-line grid gap-16 border-t pt-16 lg:grid-cols-2">
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
 * (`2960:7838`, `2960:7842`) — but a printed address is not a way to reach
 * anyone from a phone, and these are the two routes a reader who does not want
 * to fill in a form has. The value's own shape decides, so nothing is authored
 * twice; an address matches neither pattern.
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
