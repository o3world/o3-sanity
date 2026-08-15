import { DisplayHeading, Eyebrow, SectionShell } from '@o3/ui'

import { resolveSurface } from '@/content/blocks/surface'
import type { SectionProps } from '@/content/blocks/sectionTypes'
import { fieldAttr } from '@/sanity/dataAttribute'

import { InquiryForm } from './InquiryForm'

type FormSectionProps = SectionProps<'formSection'>

/**
 * Section block: the inquiry form band — `/contact`'s conversion path (#58).
 *
 * **`/contact` has no canonical Figma frame** (`docs/content-sourcing.md`),
 * so nothing here is transcribed. The band is assembled from parts other
 * frames authored — `SectionShell`'s gutter and rhythm, `Eyebrow`,
 * `DisplayHeading`, `Button / Solid` — and the one new piece is `FormField`
 * in `packages/ui`, which is a labelled control and no more. Nothing about
 * the composition is claimed as designed; when a contact frame is
 * commissioned, this is the band it replaces.
 *
 * ```
 * band            gap 64
 *   header        eyebrow | 48px heading in 640 | note
 *   form          one column to 640; the two names share a row from sm
 * ```
 *
 * A single measure rather than the two-column split WordPress draws (form
 * beside the Handler portrait): the portrait and its pull quote already have
 * their own bands on the seeded page, and a form narrow enough to sit beside
 * an image is a form nobody finishes on a phone.
 *
 * The heading, the note, the dropdown's options and the submit button are the
 * editor's — the submit is an ordinary `button` instance, so it offers
 * everything any other button does. **The fields are not** — see the schema's
 * doc comment and ADR 0014. The submit is disabled; #58 has neither a handler
 * nor a destination, and `InquiryForm` says so on the page rather than
 * pretending.
 */
export function FormSection({
  eyebrow,
  heading,
  note,
  reasons,
  consentLabel,
  button,
  surface,
  loc,
}: FormSectionProps) {
  const resolved = resolveSurface(surface, 'bone')

  return (
    <SectionShell surface={resolved} top="sm" bottom="sm">
      <div className="max-w-160 flex flex-col gap-10 lg:gap-16">
        {eyebrow || heading || note ? (
          <header data-sanity={fieldAttr(loc, 'heading')} className="flex flex-col gap-4">
            {eyebrow ? <Eyebrow size="lg">{eyebrow}</Eyebrow> : null}
            {heading ? <DisplayHeading>{heading}</DisplayHeading> : null}
            {note ? <p className="text-lead text-current/70">{note}</p> : null}
          </header>
        ) : null}

        {/* The submit's fill is not passed down: `SectionShell` declares this
            band's surface and the submit is an ordinary button instance, so it
            resolves from the band the way every other button does. */}
        <InquiryForm reasons={reasons ?? []} consentLabel={consentLabel} button={button} />
      </div>
    </SectionShell>
  )
}
