import o3Config from '@o3/eslint-config'
import nextPlugin from '@next/eslint-plugin-next'

/**
 * Draft-preview boundary (issue #15). Everything either app renders must
 * fetch through `sanityFetch` from `@o3/content-runtime/live` and mount
 * visual editing through `@/sanity/VisualEditing` — a bare Sanity client
 * (published insight, CDN, cached) or the raw next-sanity `<VisualEditing />`
 * (declines mutation refreshes) silently freezes content in the
 * Presentation tool. Only `src/sanity/` may touch the low-level pieces.
 */
const draftBoundaryPaths = [
  {
    name: '@sanity/client',
    importNames: ['createClient'],
    message:
      'Fetch through sanityFetch from @o3/content-runtime/live — a bare client serves stale published content in Presentation (issue #15).',
  },
  {
    name: 'next-sanity',
    importNames: ['createClient'],
    message:
      'Fetch through sanityFetch from @o3/content-runtime/live — a bare client serves stale published content in Presentation (issue #15).',
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
      'Fetch through sanityFetch from @o3/content-runtime/live — a bare client serves stale published content in Presentation (issue #15).',
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

/**
 * Sanity image boundary: a content component renders a Sanity image through
 * `SanityImage`, never raw `next/image` or the low-level helpers — the
 * wrapper is what wires hotspot/crop and the CDN params. It applies wherever
 * content components live, which since #212 is two places: the shared
 * renderer package and the app's own views.
 */
const imageBoundaryPaths = [
  {
    name: 'next/image',
    message: 'Use SanityImage — it wires hotspot/crop and CDN params.',
  },
]
const imageBoundaryPatterns = [
  {
    group: ['@o3/sanity/image'],
    message: 'Use SanityImage instead of the low-level image helpers.',
  },
]

/**
 * One app's three boundary blocks, in the order flat config resolves them.
 *
 * Flat config resolves a same-rule collision by last-object-wins, not by
 * merging, so each block has to carry EVERY restriction for the files it
 * matches — which is why the content blocks repeat the draft-preview paths
 * rather than adding to them.
 *
 *   src/**          the draft-preview boundary, except `src/sanity/` (the one
 *                   place allowed to touch the low-level client and visual
 *                   editing) and `src/content/` (its own blocks below)
 *   src/content/**  the same, plus the Sanity image boundary — document views,
 *                   route entries, card consumers
 *   src/content/blocks/**
 *                   the registry binding and the renderers that read it, so it
 *                   drops the "render through Blocks" restriction and keeps
 *                   the rest
 */
function appBoundaries(app) {
  return [
    {
      files: [`${app}/src/**/*.{ts,tsx}`],
      ignores: [`${app}/src/content/**`, `${app}/src/sanity/**`],
      rules: {
        'no-restricted-imports': [
          'error',
          { paths: draftBoundaryPaths, patterns: draftBoundaryPatterns },
        ],
      },
    },
    {
      files: [`${app}/src/content/**/*.{ts,tsx}`],
      ignores: [`${app}/src/content/blocks/**`],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            paths: [...imageBoundaryPaths, ...draftBoundaryPaths],
            patterns: [...imageBoundaryPatterns, ...draftBoundaryPatterns],
          },
        ],
      },
    },
    {
      files: [`${app}/src/content/blocks/**/*.{ts,tsx}`],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            paths: [...imageBoundaryPaths, ...draftBoundaryPaths],
            patterns: [
              ...imageBoundaryPatterns,
              ...draftBoundaryPatterns.filter(
                (p) => !p.group.some((g) => g.includes('BlockRenderer')),
              ),
            ],
          },
        ],
      },
    },
  ]
}

export default [
  ...o3Config,
  // Captured prototypes are third-party artifacts frozen as a record (ADR
  // 0010) — their bundled runtime JS is not ours to lint or fix, and editing
  // one to satisfy a rule ends its usefulness as a record. Only the set
  // directories are ignored; `frame.tsx` and the story files that wrap them
  // sit one level up and are linted normally.
  { ignores: ['apps/storybook/prototypes/*/**'] },
  // eslint-config-next scoped to the Next surfaces — the app and the shared
  // renderers it mounts (@o3/content-ui uses next/image and next/link).
  // Registering it repo-wide clashes with the shared config's react/jsx-a11y
  // plugin registrations.
  {
    files: [
      'apps/web/**/*.{ts,tsx}',
      'apps/o3xo/**/*.{ts,tsx}',
      'packages/content-ui/**/*.{ts,tsx}',
    ],
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
  // `@sanity/icons` is the one exception, decided out loud rather than by
  // deleting a line. A knob carries its own icon because that is what lets
  // ADR 0020 delete vtx-web's `KNOB_ICONS` — a table in a different package
  // that silently decided whether an option was editable at all. Putting the
  // icon anywhere but the knob rebuilds that mirror.
  //
  // It is safe to allow here: the package is a leaf React icon library with no
  // Studio runtime, `packages/editor-chrome` already depends on it, and
  // ADR 0009 governs *site* icons (the Figma glyph inventory) rather than
  // Studio chrome. Import the subpath, never the barrel — `@sanity/icons` v5
  // dropped barrel exports, which `OpenInPresentationAction.tsx` found first.
  //
  // The cost is real but small and paid only in draft mode: the icons a knob
  // names are bundled wherever knobs are read. If that ever stops being true,
  // narrow this rule rather than moving the icons.
  {
    files: ['packages/sanity/src/knobs/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              // A regex, not a `group`: gitignore-style negation inside a
              // single group array does not un-match in this rule (verified —
              // `!@sanity/icons/**` still reported). The lookahead is the only
              // form that carves out the one allowed scope.
              regex: '^(sanity(/.*)?|@sanity/(?!icons/).*)$',
              message:
                'A knob declaration may not import the Studio runtime — the preview bundle and Storybook read this directory (ADR 0020). `@sanity/icons/<Name>` is allowed; the Sanity adapter lives in schemas/blocks/knobFields.ts.',
            },
          ],
        },
      ],
    },
  },
  // Both apps' boundaries, from one declaration. A rule scoped to a path stops
  // applying the moment a second app appears at a different path, and it stops
  // silently — the same trap #212 hit when the renderers moved out. Called per
  // app rather than matched with a glob so each app's `ignores` stay its own.
  ...appBoundaries('apps/web'),
  ...appBoundaries('apps/o3xo'),
  // The shared renderer package (#212). The block renderers, the site chrome
  // and the cards left apps/web/src/content/, and both boundaries left with
  // them — a rule scoped to a path stops applying the moment the path moves,
  // and it stops silently.
  {
    files: ['packages/content-ui/src/**/*.{ts,tsx}'],
    rules: {
      // A package has no app router to scan, and the rule prints a "Pages
      // directory cannot be found" warning on every run when it cannot find
      // one. The routes these components link to belong to the app.
      '@next/next/no-html-link-for-pages': 'off',
      'no-restricted-imports': [
        'error',
        {
          paths: [...imageBoundaryPaths, ...draftBoundaryPaths],
          patterns: [...imageBoundaryPatterns, ...draftBoundaryPatterns],
        },
      ],
    },
  },
]
