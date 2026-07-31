import Link from 'next/link'

import { ArrowLink, Stat } from '@o3/ui'
import type { CASE_STUDY_QUERY_RESULT } from '@o3/sanity/types/generated'

import { BlockRenderer } from '@/content/blocks/BlockRenderer'
import { ClientBlockRenderer } from '@/content/blocks/ClientBlockRenderer'
import { SanityImage } from '@/content/SanityImage'
import { PortableTextBody } from '@/content/portable-text/PortableTextBody'
import { hrefForDoc } from '@/content/documents/urls'

type CaseStudyDoc = NonNullable<CASE_STUDY_QUERY_RESULT>
export type CaseStudyViewProps = CaseStudyDoc & { readonly isDraft?: boolean }

function caseEyebrow(doc: Pick<CaseStudyDoc, 'industries' | 'industryDetail'>): string {
  const industries = (doc.industries ?? []).map((industry) => industry.title).filter(Boolean)
  return [...industries, doc.industryDetail].filter(Boolean).join(' · ')
}

/**
 * Detail view for a case study — fully structured (CONTEXT.md), not
 * section-built: hero, stats, numbered chapters, deliverables, then the
 * optional per-case extra sections through the block machinery.
 */
export function CaseStudyView(props: CaseStudyViewProps) {
  const {
    _id,
    title,
    client,
    narrativeHeadline,
    stats,
    heroMedia,
    chapters,
    deliverables,
    extraSections,
    next,
    isDraft,
  } = props
  const eyebrow = caseEyebrow(props)
  const SectionsRenderer = isDraft ? ClientBlockRenderer : BlockRenderer

  return (
    <article>
      {/* Hero — ink surface */}
      <header className="bg-ink text-white">
        <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 pb-20 pt-44">
          {eyebrow ? <p className="eyebrow text-brand-tint">{eyebrow}</p> : null}
          <h1 className="text-display-xl font-display text-balance">{title}</h1>
          {narrativeHeadline ? (
            <p className="text-display-md font-display text-fg-inverse-muted max-w-3xl">
              {narrativeHeadline}
            </p>
          ) : null}
          {client?.name ? <p className="text-fg-inverse-muted text-sm">for {client.name}</p> : null}
          {stats?.length ? (
            <dl className="mt-8 grid grid-cols-2 gap-8 border-t border-white/15 pt-8 lg:grid-cols-4">
              {stats.map((stat) => (
                <Stat key={stat._key} value={stat.value ?? ''} label={stat.label ?? ''} />
              ))}
            </dl>
          ) : null}
        </div>
      </header>

      {heroMedia?.image ? (
        <figure className="mx-auto max-w-6xl px-6 py-16">
          <SanityImage
            source={heroMedia.image}
            alt={heroMedia.alt ?? ''}
            width={2000}
            className="rounded-card w-full"
            sizes="(min-width: 1280px) 72rem, 100vw"
            priority
          />
        </figure>
      ) : null}

      {/* Chapters — numbering derived from order */}
      {chapters?.length ? (
        <div className="mx-auto flex max-w-3xl flex-col gap-20 px-6 py-16">
          {chapters.map((chapter, index) => (
            <section key={chapter._key}>
              <p className="eyebrow text-brand">
                {String(index + 1).padStart(2, '0')}
                {chapter.kicker ? ` — ${chapter.kicker}` : ''}
              </p>
              <h2 className="text-display-lg font-display mt-4">{chapter.title}</h2>
              <div className="mt-6">
                <PortableTextBody value={chapter.body} />
              </div>
            </section>
          ))}
        </div>
      ) : null}

      {/* What we shipped */}
      {deliverables?.length ? (
        <section className="bg-bone">
          <div className="mx-auto max-w-3xl px-6 py-20">
            <p className="eyebrow text-brand">What we shipped</p>
            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {deliverables.map((deliverable) => (
                <li key={deliverable} className="border-line text-fg border-t pt-3">
                  {deliverable}
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {/* Optional per-case flourishes */}
      {extraSections?.length ? (
        <SectionsRenderer
          blocks={extraSections}
          documentId={_id}
          documentType="caseStudy"
          fieldPath="extraSections"
        />
      ) : null}

      {/* Next case */}
      {next?.slug ? (
        <footer className="bg-ink text-white">
          <div className="mx-auto flex max-w-5xl flex-col gap-4 px-6 py-20">
            <p className="eyebrow text-brand-tint">Next case</p>
            <Link href={hrefForDoc({ _type: 'caseStudy', slug: next.slug })}>
              <span className="text-display-lg font-display">{next.title}</span>
            </Link>
            <ArrowLink href={hrefForDoc({ _type: 'caseStudy', slug: next.slug })}>
              Read the case
            </ArrowLink>
          </div>
        </footer>
      ) : null}
    </article>
  )
}
