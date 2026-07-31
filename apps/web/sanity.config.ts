import { defineConfig } from 'sanity'
import { presentationTool } from 'sanity/presentation'
import { structureTool, type StructureResolver } from 'sanity/structure'

import { PROJECT_ID } from '@o3/sanity/constants'
import { schemaTypes } from '@o3/sanity/schemas'

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
      previewUrl: {
        preview: '/',
        previewMode: { enable: '/api/draft-mode/enable' },
      },
    }),
  ],
})
