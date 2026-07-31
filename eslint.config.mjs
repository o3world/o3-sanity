import o3Config from '@o3/eslint-config'
import nextPlugin from '@next/eslint-plugin-next'

/**
 * Draft-preview boundary (issue #15). Everything the web app renders must
 * fetch through `sanityFetch` from `@/sanity/live` and mount visual editing
 * through `@/sanity/VisualEditing` — a bare Sanity client (published
 * perspective, CDN, cached) or the raw next-sanity `<VisualEditing />`
 * (declines mutation refreshes) silently freezes content in the
 * Presentation tool. Only `src/sanity/` may touch the low-level pieces.
 */
const draftBoundaryPaths = [
  {
    name: '@sanity/client',
    importNames: ['createClient'],
    message:
      'Fetch through sanityFetch from @/sanity/live — a bare client serves stale published content in Presentation (issue #15).',
  },
  {
    name: 'next-sanity',
    importNames: ['createClient'],
    message:
      'Fetch through sanityFetch from @/sanity/live — a bare client serves stale published content in Presentation (issue #15).',
  },
]
const draftBoundaryPatterns = [
  {
    group: ['@o3/sanity/client'],
    message:
      'Fetch through sanityFetch from @/sanity/live — a bare client serves stale published content in Presentation (issue #15).',
  },
  {
    group: ['next-sanity/visual-editing'],
    message:
      'Use VisualEditing from @/sanity/VisualEditing — the raw component declines mutation refreshes (issue #15).',
  },
  {
    group: [
      '@/content/blocks/BlockRenderer',
      '@/content/blocks/ClientBlockRenderer',
      '**/blocks/BlockRenderer',
      '**/blocks/ClientBlockRenderer',
    ],
    message:
      'Render section arrays through Blocks from @/content/blocks/Blocks — it resolves draft mode and keeps the Presentation editing path (issue #15).',
  },
]

export default [
  ...o3Config,
  // eslint-config-next scoped to apps/web only — registering it wider clashes
  // with the shared config's react/jsx-a11y plugin registrations.
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    plugins: {
      '@next/next': nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
    },
  },
  // Storybook cold-crash guard: stories must never import Studio-runtime code.
  {
    files: ['**/*.stories.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['sanity', 'sanity/*', '@o3/sanity/studio*'],
              message: 'Stories must not import Sanity Studio runtime code.',
            },
          ],
        },
      ],
    },
  },
  // Draft-preview boundary for the whole web app (content/ gets its own
  // merged object below — flat config resolves same-rule collisions by
  // last-object-wins, so the rule must carry every restriction for the
  // files it matches). src/sanity/ is the one place allowed to touch the
  // low-level client/visual-editing pieces; content/blocks/ composes the
  // renderers themselves.
  {
    files: ['apps/web/src/**/*.{ts,tsx}'],
    ignores: ['apps/web/src/content/**', 'apps/web/src/sanity/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        { paths: draftBoundaryPaths, patterns: draftBoundaryPatterns },
      ],
    },
  },
  // Sanity image boundary: content components render Sanity images through
  // SanityImage, not raw next/image or the low-level image helpers. Also
  // carries the draft-preview boundary (see above for why they merge).
  {
    files: ['apps/web/src/content/**/*.{ts,tsx}'],
    ignores: ['apps/web/src/content/blocks/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'next/image',
              message:
                'Use SanityImage inside src/content/ — it wires hotspot/crop and CDN params.',
            },
            ...draftBoundaryPaths,
          ],
          patterns: [
            {
              group: ['@o3/sanity/image'],
              message:
                'Use SanityImage inside src/content/ instead of the low-level image helpers.',
            },
            ...draftBoundaryPatterns,
          ],
        },
      ],
    },
  },
  // content/blocks/ composes the renderers, so it skips the renderer
  // restriction but keeps the image + client boundaries.
  {
    files: ['apps/web/src/content/blocks/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'next/image',
              message:
                'Use SanityImage inside src/content/ — it wires hotspot/crop and CDN params.',
            },
            ...draftBoundaryPaths,
          ],
          patterns: [
            {
              group: ['@o3/sanity/image'],
              message:
                'Use SanityImage inside src/content/ instead of the low-level image helpers.',
            },
            ...draftBoundaryPatterns.filter(
              (p) => !p.group.some((g) => g.includes('BlockRenderer')),
            ),
          ],
        },
      ],
    },
  },
]
