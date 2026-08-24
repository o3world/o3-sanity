import { defineConfig } from 'sanity'
import {
  defineDocuments,
  defineLocations,
  presentationTool,
  type PresentationPluginOptions,
} from 'sanity/presentation'
import { structureTool, type StructureResolver } from 'sanity/structure'

import {
  defaultToolFirst,
  DEFAULT_PRESENTATION_TOOL_NAME,
  editorChrome,
} from '@o3/editor-chrome/studio'
import { collectionPrefixes, resolveDataset, resolveProjectId } from '@o3/sanity/brand'
import { ROUTABLE_TYPES } from '@o3/sanity/constants'
import { schemaTypesFor } from '@o3/sanity/schemas'

import { previewPathForDoc } from '@o3/content-runtime/urls'
import { mainDocumentRoutes } from './src/sanity/presentationRoutes'

const projectId = resolveProjectId()
const dataset = resolveDataset()
const prefixes = collectionPrefixes()

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
      S.documentTypeListItem('insight').title('Insights'),
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
 * `@o3/content-runtime/urls` (hrefForDoc) — keep the two in sync.
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
            href: `${prefixes.caseStudy}/${doc?.slug ?? ''}`,
          },
        ],
      }),
    }),
    insight: defineLocations({
      select: { title: 'title', slug: 'slug.current' },
      resolve: (doc) => ({
        locations: [
          {
            title: doc?.title || 'Untitled',
            href: `${prefixes.insight}/${doc?.slug ?? ''}`,
          },
          { title: 'All insights', href: prefixes.insight },
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
 *
 * **Presentation is the default tool** (#99, ADR 0019). `sanity@6.8` has no
 * `defaultTool` option — the default is the first entry of the resolved
 * `tools` array — so the `tools` callback below is the whole mechanism, and
 * the `plugins` order stays as it reads: structure, then presentation.
 */
export default defineConfig({
  name: 'o3',
  title: 'O3',
  basePath: '/studio',
  projectId,
  dataset,
  // O3's roster, named out loud: the section tier is a core list plus per-brand
  // extensions (ADR 0028), and a Studio offers the blocks its own app can
  // render. Reading the brand from the environment would offer this one every
  // block in the model whenever `NEXT_PUBLIC_BRAND` went unset, which is the
  // default a local checkout runs on.
  schema: { types: schemaTypesFor('o3') },
  plugins: [
    structureTool({ structure }),
    presentationTool({
      resolve,
      previewUrl: {
        preview: '/',
        previewMode: { enable: '/api/draft-mode/enable' },
      },
    }),
    // Every routable document gets a door into Presentation, opened on its own
    // page. `previewPathForDoc` is the app's own link builder — the route table
    // it reads is the one `hrefForDoc` and `mainDocumentRoutes` read.
    editorChrome({ types: ROUTABLE_TYPES, previewPath: previewPathForDoc }),
  ],
  tools: (prev) => defaultToolFirst(prev, DEFAULT_PRESENTATION_TOOL_NAME),
})
