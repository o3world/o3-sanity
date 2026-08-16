import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { readDeclaredSources, readGlobbedSources } from './read'

/** Stands in for the repo root, so a fixture's `sourcePath` reads the way a real one does. */
const FIXTURE_ROOT = join(dirname(fileURLToPath(import.meta.url)), '__fixtures__')

describe('readGlobbedSources', () => {
  it('registers a markdown file from its frontmatter alone', () => {
    expect(readGlobbedSources(FIXTURE_ROOT, 'briefs')).toEqual([
      {
        key: 'agent-tooling',
        title: 'What agents changed about delivery',
        body: 'Notes from the three builds that ran with agents in the loop.',
        sourcePath: 'briefs/agent-tooling.md',
      },
      {
        key: 'gwynedd-rebrand',
        title: 'Gwynedd Mercy rebrand',
        body: 'The enrolment numbers, the interviews, and what the president asked for.',
        sourcePath: 'briefs/gwynedd-rebrand.md',
      },
    ])
  })

  it('refuses a markdown file that registers nothing', () => {
    expect(() => readGlobbedSources(FIXTURE_ROOT, 'unregistered')).toThrow(
      'unregistered/no-key.md has no `key` in its frontmatter',
    )
  })
})

describe('readDeclaredSources', () => {
  it('takes key and title from the row and the body from the file, without its frontmatter', () => {
    expect(
      readDeclaredSources(FIXTURE_ROOT, [
        { key: 'o3-voice', title: 'O3 voice guide', sourcePath: 'declared/docs/voice.md' },
      ]),
    ).toEqual([
      {
        key: 'o3-voice',
        title: 'O3 voice guide',
        body: '# O3 World copy\n\nSay the specific thing.',
        sourcePath: 'declared/docs/voice.md',
      },
    ])
  })

  it('refuses a file that is nothing but frontmatter', () => {
    expect(() =>
      readDeclaredSources(FIXTURE_ROOT, [
        { key: 'hollow', title: 'Hollow', sourcePath: 'declared/docs/hollow.md' },
      ]),
    ).toThrow('declared/docs/hollow.md is empty after stripping frontmatter')
  })
})
