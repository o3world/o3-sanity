import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, beforeEach, expect, it } from 'vitest'

import { readRouteBundles } from './build-output'

let dist: string

beforeEach(() => {
  dist = mkdtempSync(join(tmpdir(), 'build-output-'))
  mkdirSync(join(dist, 'diagnostics'))
})

afterEach(() => rmSync(dist, { recursive: true, force: true }))

function writeStats(contents: string): void {
  writeFileSync(join(dist, 'diagnostics', 'route-bundle-stats.json'), contents)
}

/**
 * A baseline the budget compares against has to be one it can trust, so the
 * reader fails closed: a shape it does not recognise is an error, never an
 * empty comparison that lets any growth through.
 */
it('reads only nonempty, unique, well-formed route stats', () => {
  const home = { route: '/', firstLoadUncompressedJsBytes: 696_786, firstLoadChunkPaths: [] }
  writeStats(JSON.stringify([home]))
  expect(readRouteBundles(dist)).toEqual([home])

  const malformed = [
    [],
    null,
    {},
    [{ route: '/', firstLoadChunkPaths: [] }],
    [{ route: '/', firstLoadUncompressedJsBytes: '696786', firstLoadChunkPaths: [] }],
    [{ route: '/', firstLoadUncompressedJsBytes: -1, firstLoadChunkPaths: [] }],
    [home, { ...home, firstLoadUncompressedJsBytes: 716_786 }],
  ]
  const accepted = malformed.filter((stats) => {
    writeStats(JSON.stringify(stats))
    try {
      readRouteBundles(dist)
      return true
    } catch (error) {
      return !String(error).includes('Invalid route bundle stats')
    }
  })
  expect(accepted).toEqual([])
})

it('rejects stats that are not JSON', () => {
  writeStats('{')
  expect(() => readRouteBundles(dist)).toThrow(SyntaxError)
})
