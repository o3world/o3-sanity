import o3Config from '@o3/eslint-config'
import nextPlugin from '@next/eslint-plugin-next'

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
  // Sanity image boundary: content components render Sanity images through
  // SanityImage, not raw next/image or the low-level image helpers.
  {
    files: ['apps/web/src/content/**/*.{ts,tsx}'],
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
          ],
          patterns: [
            {
              group: ['@o3/sanity/image'],
              message:
                'Use SanityImage inside src/content/ instead of the low-level image helpers.',
            },
          ],
        },
      ],
    },
  },
]
