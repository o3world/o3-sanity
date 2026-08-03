import { defineConfig } from 'sanity'
import {
  defineDocuments,
  defineLocations,
  presentationTool,
  type PresentationPluginOptions,
} from 'sanity/presentation'
import { structureTool, type StructureResolver } from 'sanity/structure'

import { COLLECTION_PREFIXES, PROJECT_ID } from '@o3/sanity/constants'
import { schemaTypes } from '@o3/sanity/schemas'

import { mainDocumentRoutes } from './src/sanity/presentationRoutes'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production'

/**
 * Desk structure: the siteSettings singleton pinned first, then the three
 * routable collections, then supporting types. `documentTypeListItems()`
 * would also surface siteSettings as a list — the explicit item list keeps
 * it a single pinned document.
 */
const structure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      S.listItem()
        .title('Site Settings')
        .id('siteSettings')
        .child(S.document().schemaType('siteSettings').documentId('siteSettings')),
      S.divider(),
      S.documentTypeListItem('page').title('Pages'),
      S.documentTypeListItem('caseStudy').title('Work'),
      S.documentTypeListItem('perspective').title('Perspectives'),
      S.divider(),
      S.documentTypeListItem('person').title('People'),
      S.documentTypeListItem('client').title('Clients'),
      S.documentTypeListItem('category').title('Categories'),
      S.documentTypeListItem('industry').title('Industries'),
    ])

/**
 * Presentation route <-> document wiring. `mainDocuments` lets the tool
 * resolve the edited document from any preview URL (and offer to create one
 * when none exists yet — the new-page flow); `locations` gives every
 * routable document its "Used on" links so a freshly created draft can be
 * opened in preview immediately. URL shapes mirror
 * `src/content/documents/urls.ts` (hrefForDoc) — keep the two in sync.
 *
 * The route patterns themselves live in `src/sanity/presentationRoutes.ts`,
 * where a test can compile them.
 */
const pageHref = (slug: string | undefined | null) => (!slug || slug === 'index' ? '/' : `/${slug}`)

const resolve: PresentationPluginOptions['resolve'] = {
  mainDocuments: defineDocuments(mainDocumentRoutes),
  locations: {
    page: defineLocations({
      select: { title: 'title', slug: 'slug.current' },
      resolve: (doc) => ({
        locations: [{ title: doc?.title || 'Untitled', href: pageHref(doc?.slug) }],
      }),
    }),
    caseStudy: defineLocations({
      select: { title: 'title', slug: 'slug.current' },
      resolve: (doc) => ({
        locations: [
          {
            title: doc?.title || 'Untitled',
            href: `${COLLECTION_PREFIXES.caseStudy}/${doc?.slug ?? ''}`,
          },
        ],
      }),
    }),
    perspective: defineLocations({
      select: { title: 'title', slug: 'slug.current' },
      resolve: (doc) => ({
        locations: [
          {
            title: doc?.title || 'Untitled',
            href: `${COLLECTION_PREFIXES.perspective}/${doc?.slug ?? ''}`,
          },
          { title: 'All perspectives', href: COLLECTION_PREFIXES.perspective },
        ],
      }),
    }),
    siteSettings: defineLocations({
      message: 'Site settings are used on every page',
      tone: 'caution',
    }),
  },
}

/**
 * The embedded Studio (mounted at /studio by `app/studio/[[...tool]]`).
 * Same-origin with the site on every deploy, which is what makes
 * Presentation live editing work on unpredictable preview URLs
 * (scaffold plan: embedded-only, no standalone studio app).
 */
export default defineConfig({
  name: 'o3',
  title: 'O3',
  basePath: '/studio',
  projectId,
  dataset,
  schema: { types: schemaTypes },
  plugins: [
    structureTool({ structure }),
    presentationTool({
      resolve,
      previewUrl: {
        preview: '/',
        previewMode: { enable: '/api/draft-mode/enable' },
      },
    }),
  ],
})
