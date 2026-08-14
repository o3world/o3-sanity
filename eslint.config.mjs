import o3Config from '@o3/eslint-config'
import nextPlugin from '@next/eslint-plugin-next'

/**
 * Draft-preview boundary (issue #15). Everything the web app renders must
 * fetch through `sanityFetch` from `@/sanity/live` and mount visual editing
 * through `@/sanity/VisualEditing` — a bare Sanity client (published
 * insight, CDN, cached) or the raw next-sanity `<VisualEditing />`
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
  {
    name: 'next-sanity',
    importNames: ['stegaClean'],
    message:
      "Import stegaClean from '@sanity/client/stega'. The next-sanity barrel drags in @portabletext/react, whose react/compiler-runtime import cannot resolve under Storybook's Next preset — which breaks every story for the block that imports it (ADR 0004).",
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
  // Captured prototypes are third-party artifacts frozen as a record (ADR
  // 0010) — their bundled runtime JS is not ours to lint or fix, and editing
  // one to satisfy a rule ends its usefulness as a record. Only the set
  // directories are ignored; `frame.tsx` and the story files that wrap them
  // sit one level up and are linted normally.
  { ignores: ['apps/storybook/prototypes/*/**'] },
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
  // Knob purity (ADR 0020). Knob declarations are read by the Presentation
  // overlay inside the site bundle and by Storybook, neither of which can
  // carry the Studio runtime — so this directory has no edge to `sanity`, and
  // the package boundary that would otherwise enforce it is replaced by this
  // rule. It fails at lint time with a one-line fix instead of at bundle time
  // with a stack trace, which is the whole reason it is a rule and not a test.
  //
  // `@sanity/icons` is inside the ban, and no knob declares an icon yet. When
  // one wants to (#106), that is a decision to make out loud rather than by
  // deleting a line: icons on the knob are what let ADR 0020 remove vtx-web's
  // KNOB_ICONS mirror, and the package is a leaf React library with no Studio
  // runtime in it — but it is still weight in the site bundle, and this rule
  // is the only thing that would have said so.
  {
    files: ['packages/sanity/src/knobs/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['sanity', 'sanity/*', '@sanity/*'],
              message:
                'A knob declaration may not import the Studio runtime — the preview bundle reads this directory (ADR 0020). The Sanity adapter lives in schemas/blocks/knobFields.ts.',
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
