import { describe, expect, it } from 'vitest'

import { affectedStoryFiles, entryPath, removedStories, storiesFor } from './affected'
import { hostDir, type StatsModule, type StoryEntry } from './storybook'

/**
 * Module ids as Storybook writes them: relative to `apps/storybook`, with
 * `reasons` naming the modules that import each one.
 */
const modules: StatsModule[] = [
  { id: './globals.css', reasons: [{ moduleName: './.storybook/preview.ts' }] },
  {
    id: './.storybook/preview.ts',
    reasons: [{ moduleName: '/virtual:/@storybook/builder-vite/storybook-config-entry.js' }],
  },
  {
    id: './../../packages/ui/src/components/stat.tsx',
    reasons: [
      { moduleName: './../../packages/ui/src/components/stat.stories.tsx' },
      { moduleName: './../../packages/ui/src/index.ts' },
    ],
  },
  {
    id: './../../packages/ui/src/index.ts',
    reasons: [{ moduleName: './../../apps/web/src/ui/SiteNav.stories.tsx' }],
  },
  {
    id: './../../packages/ui/src/components/stat.stories.tsx',
    reasons: [{ moduleName: '/virtual:/@storybook/builder-vite/storybook-stories.js' }],
  },
  {
    id: './../../apps/web/src/ui/SiteNav.stories.tsx',
    reasons: [{ moduleName: '/virtual:/@storybook/builder-vite/storybook-stories.js' }],
  },
  { id: './../../packages/ui/src/lib/unused.ts', reasons: [] },
]

const STAT_STORY = 'packages/ui/src/components/stat.stories.tsx'
const NAV_STORY = 'apps/web/src/ui/SiteNav.stories.tsx'

describe('affectedStoryFiles', () => {
  it('climbs from a component to every story that renders it', () => {
    // stat.tsx is imported by its own story and by the barrel the nav story
    // imports — the second one is the reason a graph beats a filename guess.
    expect(affectedStoryFiles(modules, ['packages/ui/src/components/stat.tsx'])).toEqual({
      storyFiles: [NAV_STORY, STAT_STORY],
      everything: false,
    })
  })

  it('selects a changed story file itself', () => {
    expect(affectedStoryFiles(modules, [STAT_STORY]).storyFiles).toEqual([STAT_STORY])
  })

  it('selects a story file that is too new to be in the graph', () => {
    expect(affectedStoryFiles(modules, ['packages/ui/src/components/brand.stories.tsx'])).toEqual({
      storyFiles: ['packages/ui/src/components/brand.stories.tsx'],
      everything: false,
    })
  })

  it('treats a global as reaching everything', () => {
    expect(affectedStoryFiles(modules, ['apps/storybook/globals.css']).everything).toBe(true)
    expect(affectedStoryFiles(modules, ['apps/storybook/.storybook/preview.ts']).everything).toBe(
      true,
    )
  })

  it('selects nothing for a file no story imports', () => {
    expect(affectedStoryFiles(modules, ['tools/migration/src/load.ts', 'README.md'])).toEqual({
      storyFiles: [],
      everything: false,
    })
    expect(affectedStoryFiles(modules, ['packages/ui/src/lib/unused.ts']).storyFiles).toEqual([])
  })

  it('reaches every story from the builder the host’s preview shells over', () => {
    // Both hosts are ~15-line shells over `@o3/story-kit` (#240). The builder
    // is a plain import of `preview.ts`, so the climb reaches a global module
    // the way an inline edit to `preview.ts` used to.
    const shell: StatsModule[] = [
      ...modules,
      {
        id: './../../packages/story-kit/src/storybookPreview.ts',
        reasons: [{ moduleName: './.storybook/preview.ts' }],
      },
    ]
    expect(
      affectedStoryFiles(shell, ['packages/story-kit/src/storybookPreview.ts']).everything,
    ).toBe(true)
  })
})

/**
 * The second host (#242). Storybook writes module ids relative to the host
 * that built them, so the same `./globals.css` means a different file on each
 * — and a brand's run must read its own.
 */
describe('affectedStoryFiles, against the o3xo host', () => {
  const O3XO = hostDir('o3xo')
  const MARK_STORY = 'apps/o3xo/src/components/brand/O3xoMark.stories.tsx'

  const o3xoModules: StatsModule[] = [
    { id: './globals.css', reasons: [{ moduleName: './.storybook/preview.ts' }] },
    {
      id: './.storybook/preview.ts',
      reasons: [{ moduleName: '/virtual:/@storybook/builder-vite/storybook-config-entry.js' }],
    },
    {
      id: './../../apps/o3xo/src/components/brand/O3xoMark.tsx',
      reasons: [{ moduleName: `./../../${MARK_STORY}` }],
    },
    {
      id: `./../../${MARK_STORY}`,
      reasons: [{ moduleName: '/virtual:/@storybook/builder-vite/storybook-stories.js' }],
    },
  ]

  it('climbs to a story the o3xo app owns', () => {
    expect(
      affectedStoryFiles(o3xoModules, ['apps/o3xo/src/components/brand/O3xoMark.tsx'], O3XO),
    ).toEqual({
      storyFiles: [MARK_STORY],
      everything: false,
    })
  })

  it('reads this host’s globals as global', () => {
    expect(affectedStoryFiles(o3xoModules, [`${O3XO}/globals.css`], O3XO).everything).toBe(true)
    expect(
      affectedStoryFiles(o3xoModules, [`${O3XO}/.storybook/preview.ts`], O3XO).everything,
    ).toBe(true)
  })

  it('leaves the other host’s globals to the other host', () => {
    expect(affectedStoryFiles(o3xoModules, ['apps/storybook/globals.css'], O3XO)).toEqual({
      storyFiles: [],
      everything: false,
    })
  })

  it('resolves an index entry against the host that indexed it', () => {
    const entry: StoryEntry = {
      id: 'brand-o3xomark--default',
      name: 'Default',
      title: 'Brand/O3xoMark',
      importPath: '../../apps/o3xo/src/components/brand/O3xoMark.stories.tsx',
      type: 'story',
    }
    expect(entryPath(entry, O3XO)).toBe(MARK_STORY)
    expect(storiesFor([entry], { storyFiles: [MARK_STORY], everything: false }, O3XO)).toHaveLength(
      1,
    )
    expect(
      removedStories(
        [entry],
        new Set(),
        new Set([MARK_STORY]),
        {
          storyFiles: [MARK_STORY],
          everything: false,
        },
        O3XO,
      ),
    ).toHaveLength(1)
  })
})

describe('storiesFor', () => {
  const index: StoryEntry[] = [
    {
      id: 'ui-stat--default',
      name: 'Default',
      title: 'UI/Stat',
      importPath: '../../packages/ui/src/components/stat.stories.tsx',
      type: 'story',
    },
    {
      id: 'ui-sitenav--default',
      name: 'Default',
      title: 'UI/SiteNav',
      importPath: '../../apps/web/src/ui/SiteNav.stories.tsx',
      type: 'story',
    },
  ]

  it('resolves an index entry to its repo-relative file', () => {
    expect(entryPath(index[0] as StoryEntry)).toBe(STAT_STORY)
  })

  it('keeps only the stories whose file is affected', () => {
    const stories = storiesFor(index, { storyFiles: [STAT_STORY], everything: false })
    expect(stories.map((entry) => entry.id)).toEqual(['ui-stat--default'])
  })

  it('keeps every story when the change is global', () => {
    expect(storiesFor(index, { storyFiles: [], everything: true })).toHaveLength(2)
  })
})

describe('removedStories', () => {
  const story = (id: string, name: string, importPath: string): StoryEntry => ({
    id,
    name,
    title: 'UI/Stat',
    importPath,
    type: 'story',
  })

  const STAT_IMPORT = '../../packages/ui/src/components/stat.stories.tsx'
  const baseline: StoryEntry[] = [
    story('ui-stat--default', 'Default', STAT_IMPORT),
    story('ui-stat--large', 'Large', STAT_IMPORT),
  ]
  const scoped = { storyFiles: [STAT_STORY], everything: false }

  it('reports a deleted export from a file that still exists', () => {
    // The whole bug: the file is `M`, not `D`, so a file-deletion test misses
    // it and `Large` disappears from the report rather than from the run.
    const gone = removedStories(
      baseline,
      new Set(['ui-stat--default']),
      new Set([STAT_STORY]),
      scoped,
    )
    expect(gone.map((entry) => entry.id)).toEqual(['ui-stat--large'])
  })

  it('reports every story in a file this branch deleted outright', () => {
    const gone = removedStories(baseline, new Set(), new Set([STAT_STORY]), scoped)
    expect(gone.map((entry) => entry.id)).toEqual(['ui-stat--default', 'ui-stat--large'])
  })

  it('reads a rename as one removed, leaving the new id to be added', () => {
    const gone = removedStories(
      baseline,
      new Set(['ui-stat--default', 'ui-stat--huge']),
      new Set([STAT_STORY]),
      scoped,
    )
    expect(gone.map((entry) => entry.id)).toEqual(['ui-stat--large'])
  })

  it('reports nothing when the baseline and this checkout agree', () => {
    const current = new Set(['ui-stat--default', 'ui-stat--large'])
    expect(removedStories(baseline, current, new Set([STAT_STORY]), scoped)).toEqual([])
  })

  it('leaves a story alone when the diff never mentions its file', () => {
    // Someone else's removed carousel is not this run's business.
    expect(removedStories(baseline, new Set(), new Set(['README.md']), scoped)).toEqual([])
  })

  it('takes every missing story once the scope is explicit', () => {
    const everything = { storyFiles: [], everything: true }
    const gone = removedStories(baseline, new Set(), new Set(), everything)
    expect(gone).toHaveLength(2)
  })
})
