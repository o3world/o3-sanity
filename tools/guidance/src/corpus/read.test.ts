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

  /**
   * Git does not track an empty directory, so deleting the last markdown file
   * deletes the corpus directory with it, and a fresh checkout has nothing to
   * read. That is exactly when sync has to run — the dataset still holds the
   * document the deleted file left behind — so an absent directory is a corpus
   * of nothing rather than a crash.
   */
  it('reads a directory that is not there as no sources at all', () => {
    expect(readGlobbedSources(FIXTURE_ROOT, 'briefs-that-were-deleted')).toEqual([])
  })

  it('refuses a markdown file that registers nothing', () => {
    expect(() => readGlobbedSources(FIXTURE_ROOT, 'unregistered')).toThrow(
      'unregistered/no-key.md has no `key` in its frontmatter',
    )
  })

  // The key becomes half of a deterministic id, and every matcher of those
  // ids (`brief-<key>`) speaks lowercase kebab — a key outside that grammar
  // would sync a document nothing can validate against.
  it('refuses a key outside the id grammar', () => {
    expect(() => readGlobbedSources(FIXTURE_ROOT, 'misdeclared')).toThrow(
      'misdeclared/underscored.md declares key "Agent_Tooling", which is not lowercase kebab-case',
    )
  })

  // Two sources with one key map to one _id — sync would last-write-win
  // silently and check would report a drift naming neither file.
  it('refuses two files claiming one key', () => {
    expect(() => readGlobbedSources(FIXTURE_ROOT, 'duplicated')).toThrow(
      'duplicated/second.md and duplicated/first.md both declare key "copied-brief"',
    )
  })

  // Quotes strip only as a matched pair; a lone apostrophe is content.
  it('unquotes frontmatter values without eating unmatched quotes', () => {
    const titles = readGlobbedSources(FIXTURE_ROOT, 'quoting').map((source) => source.title)
    expect(titles).toEqual(["The agents' brief", "St James'"])
  })

  // A dash run longer than the fence must not close the frontmatter mid-line
  // and silently swallow body text; the file fails registration instead.
  it('treats an unterminated frontmatter block as no frontmatter at all', () => {
    expect(() => readGlobbedSources(FIXTURE_ROOT, 'unterminated')).toThrow(
      'unterminated/dashes.md has no `key` in its frontmatter',
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
