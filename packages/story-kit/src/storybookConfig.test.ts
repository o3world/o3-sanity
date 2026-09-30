import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { defineStorybookConfig } from './storybookConfig'

/**
 * A stand-in for a host's `.storybook` directory. The builder reads disk only
 * for the prototype mounts, so a bare tree is enough to exercise both the
 * globs (string math) and the mounts (a directory scan).
 */
let host: string
let configDir: string

beforeAll(() => {
  host = fs.mkdtempSync(path.join(os.tmpdir(), 'story-kit-host-'))
  configDir = path.join(host, '.storybook')
  fs.mkdirSync(configDir)
  fs.mkdirSync(path.join(host, 'prototypes', 'has-entry'), { recursive: true })
  fs.writeFileSync(path.join(host, 'prototypes', 'has-entry', 'index.html'), '<!doctype html>')
  fs.mkdirSync(path.join(host, 'prototypes', 'no-entry'), { recursive: true })
})

afterAll(() => {
  fs.rmSync(host, { recursive: true, force: true })
})

const SUFFIX = '**/*.stories.@(js|jsx|mjs|ts|tsx)'

describe('defineStorybookConfig', () => {
  it('globs a prototypes directory last and mounts the sets inside it', () => {
    const config = defineStorybookConfig({
      configDir,
      appStoryRoots: ['apps/web/src'],
      prototypesDir: '../prototypes',
    })

    // The prototypes root globs last, because it sorts last in the sidebar.
    expect(config.stories).toEqual([
      `../../../packages/ui/src/${SUFFIX}`,
      `../../../packages/content-ui/src/${SUFFIX}`,
      `../../../apps/web/src/${SUFFIX}`,
      `../prototypes/${SUFFIX}`,
    ])
    // A set is a directory with an `index.html`; a directory without one is
    // assets belonging to a set, not a set.
    expect(config.staticDirs).toEqual([
      { from: '../prototypes/has-entry', to: '/prototypes/has-entry' },
    ])
  })
})
