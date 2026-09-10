import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { afterEach, expect, it } from 'vitest'

import { captureSourceEvidence, checkLedger, readSourceState } from './ledger-check'
import type { Ledger } from './ledger'
import { buildInventory, extractPairings } from './pairing'

const roots: string[] = []
afterEach(() =>
  roots.splice(0).forEach((root) => fs.rmSync(root, { recursive: true, force: true })),
)

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'figma-ledger-'))
  roots.push(root)
  const story = 'packages/ui/src/card.stories.tsx'
  const component = 'packages/ui/src/card.tsx'
  const write = (file: string, text: string) => {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true })
    fs.writeFileSync(path.join(root, file), text)
  }
  write(
    story,
    "import { figmaDesign } from '@o3/story-kit'; const meta = {title:'UI/Card', parameters: {design: figmaDesign('1:1')}}; export default meta; export const Default = {}",
  )
  write(component, 'export const Card = () => <div style={{padding: 0}}>Card</div>')
  const inventory = buildInventory(
    extractPairings(
      story,
      fs.readFileSync(path.join(root, story), 'utf8').replace('; export', ';\nexport'),
      ['o3'],
    ),
    [
      {
        brand: 'o3',
        fileKey: 'file',
        fileKeyRef: 'FIGMA_FILE_KEY',
        entries: [{ nodeId: '1:1', name: 'Card', kind: 'componentSet' }],
      },
    ],
  )
  const sources = captureSourceEvidence(
    root,
    [
      {
        id: './../../packages/ui/src/card.tsx',
        reasons: [{ moduleName: './../../packages/ui/src/card.stories.tsx' }],
      },
      { id: './../../packages/ui/src/card.stories.tsx' },
    ],
    [story],
    'o3',
  )
  const ledger: Ledger = {
    sources: { fixture: sources[story]! },
    pairs: {
      'o3/ui-card--default/o3/1:1/frame-320': {
        score: 0.01,
        tolerance: 0.005,
        nodeHash: 'design-v1',
        fileVersion: 'v1',
        acceptedAt: '2026-09-05',
        reason: 'Fixture text differs from its reference.',
        source: 'fixture',
      },
    },
    unpairable: {},
  }
  const baselines = [
    { brand: 'o3' as const, fileKey: 'file', version: 'v1', hashes: { '1:1': 'design-v1' } },
  ]
  return { root, host: 'o3' as const, inventory, ledger, baselines, write, story, component }
}

it('names a paired story when its rendered component gains 10px padding after acceptance', () => {
  const test = fixture()
  const { write, component } = test
  expect(checkLedger(test)).toEqual([])
  write(component, 'export const Card = () => <div style={{padding: 10}}>Card</div>')
  expect(checkLedger(test).join('\n')).toContain('ui-card--default')
  expect(checkLedger(test).join('\n')).toContain(component)
})

it('rejects changed design hashes and missing accepted source evidence without scoring old numbers again', () => {
  const test = fixture()
  expect(
    checkLedger({
      ...test,
      baselines: [{ ...test.baselines[0]!, hashes: { '1:1': 'design-v2' } }],
    }).join('\n'),
  ).toContain('ui-card--default: design changed')
  const entry = Object.values(test.ledger.pairs)[0]!
  expect(
    checkLedger({
      ...test,
      ledger: {
        ...test.ledger,
        pairs: { 'o3/ui-card--default/o3/1:1/frame-320': { ...entry, source: undefined } },
      },
    }).join('\n'),
  ).toContain('ui-card--default: acceptance has no source evidence')
})

it('fails closed on an empty inventory, uncovered component set and unaccepted pairing', () => {
  const test = fixture()
  expect(
    checkLedger({ ...test, inventory: { ...test.inventory, pairings: [] } }).join('\n'),
  ).toContain('refusing an empty gate')
  expect(
    checkLedger({
      ...test,
      inventory: {
        ...test.inventory,
        uncovered: [{ brand: 'o3', nodeId: '2:2', name: 'New card', codeComponent: 'Card' }],
      },
    }).join('\n'),
  ).toContain('New card (2:2): tracked component set has no paired story')
  expect(checkLedger({ ...test, ledger: { pairs: {}, unpairable: {} } }).join('\n')).toContain(
    'ui-card--default: 1:1 has never been accepted',
  )
})

it('invalidates changes and additions to global tokens and missing dependency files', () => {
  const test = fixture()
  test.write('packages/tailwind-config/tokens/layout.css', ':root{--gutter:75px}')
  expect(checkLedger(test).join('\n')).toContain(
    'ui-card--default: global rendering inputs changed',
  )
  fs.unlinkSync(path.join(test.root, test.component))
  expect(checkLedger(test).join('\n')).toContain(
    'source changed or missing: packages/ui/src/card.tsx',
  )
})

it('requires a one-line review reason for a measured departure beyond tolerance', () => {
  const test = fixture()
  const entry = Object.values(test.ledger.pairs)[0]!
  const ledger = {
    ...test.ledger,
    pairs: { 'o3/ui-card--default/o3/1:1/frame-320': { ...entry, reason: undefined } },
  }
  expect(checkLedger({ ...test, ledger }).join('\n')).toContain(
    'ui-card--default: measured departure has no review reason',
  )
})

it('ignores generated package build products when comparing source acceptance with CI', () => {
  const test = fixture()
  test.write('packages/ui/dist/theme.css', 'generated{padding:10px}')
  expect(checkLedger(test)).toEqual([])
})

it('keeps reference freshness separate from visual scores and fails a changed reference by story name', () => {
  const test = fixture()
  const canonical = test.inventory.pairings[0]!
  const source = Object.values(test.ledger.pairs)[0]!.source!
  const inventory = {
    ...test.inventory,
    pairings: [canonical, { ...canonical, storyId: 'ui-card--stress' }],
  }
  const policy = {
    componentCoverage: [],
    inactiveSets: {},
    referenceOnly: { 'ui-card--stress/1:1': 'Stress fixture; measured in the default example.' },
  }
  const ledger = {
    ...test.ledger,
    references: { 'ui-card--stress/1:1': { source, nodeHash: 'design-v1' } },
  }
  expect(checkLedger({ ...test, inventory, policy, ledger })).toEqual([])
  test.write(test.story, 'export const Stress = {args:{padding:10}}')
  expect(checkLedger({ ...test, inventory, policy, ledger }).join('\n')).toContain(
    'ui-card--stress: source changed',
  )
})

it('credits verified component ancestry only through a currently accepted measurement', () => {
  const test = fixture()
  const inventory = {
    ...test.inventory,
    uncovered: [{ brand: 'o3' as const, nodeId: '2:2', name: 'Buttons', codeComponent: 'Button' }],
  }
  const baselines = [{ ...test.baselines[0]!, hashes: { '1:1': 'design-v1', '2:2': 'buttons-v1' } }]
  const policy = {
    componentCoverage: [
      {
        componentSet: '2:2',
        nodeId: '1:1',
        reason: 'The measured card contains the verified Button instance.',
      },
    ],
    inactiveSets: {},
    referenceOnly: {},
    designHashes: { '2:2': 'buttons-v1' },
  }
  expect(checkLedger({ ...test, inventory, baselines, policy })).toEqual([])
  expect(
    checkLedger({
      ...test,
      inventory,
      baselines,
      policy: { ...policy, designHashes: { '2:2': 'buttons-old' } },
    }).join('\n'),
  ).toContain('Buttons (2:2): component ancestry changed')
  expect(
    checkLedger({
      ...test,
      inventory,
      baselines,
      policy,
      ledger: { pairs: {}, unpairable: {} },
    }).join('\n'),
  ).toContain('Buttons (2:2): tracked component set has no paired story')
})

it('refuses to accept source evidence when the build module graph is absent', () => {
  const test = fixture()
  expect(() => captureSourceEvidence(test.root, [], [test.story], 'o3')).toThrow('module graph')
})

it('keeps an acceptance made after a global source deletion valid when that deletion is staged', () => {
  const test = fixture()
  const git = (...args: string[]) => execFileSync('git', args, { cwd: test.root, stdio: 'pipe' })
  git('init', '--quiet')
  test.write('packages/ui/obsolete.css', 'body{color:red}')
  git('add', '.')
  fs.unlinkSync(path.join(test.root, 'packages/ui/obsolete.css'))
  const source = captureSourceEvidence(
    test.root,
    [{ id: './../../packages/ui/src/card.stories.tsx' }],
    [test.story],
    'o3',
  )[test.story]!
  const entry = Object.values(test.ledger.pairs)[0]!
  const ledger = {
    ...test.ledger,
    sources: { updated: source },
    pairs: { 'o3/ui-card--default/o3/1:1/frame-320': { ...entry, source: 'updated' } },
  }
  expect(checkLedger({ ...test, ledger })).toEqual([])
  git('add', '--all')
  expect(checkLedger({ ...test, ledger })).toEqual([])
})

it('names an accepted pairing that was removed from source instead of silently shrinking coverage', () => {
  const test = fixture()
  const inventory = { ...test.inventory, pairings: [] }
  expect(checkLedger({ ...test, inventory }).join('\n')).toContain(
    'ui-card--default: accepted pairing was removed',
  )
})

it('rejects source changes during the build before associating its bundle with acceptance hashes', () => {
  const test = fixture()
  const before = readSourceState(test.root, 'o3')
  test.write(test.story, 'export const Default = {args:{padding:10}}')
  expect(() =>
    captureSourceEvidence(
      test.root,
      [{ id: './../../packages/ui/src/card.stories.tsx' }],
      [test.story],
      'o3',
      before,
    ),
  ).toThrow('changed during build')
})

it('does not treat an unrelated excluded prototype module as a changed paired renderer', () => {
  const test = fixture()
  const beforeBuild = readSourceState(test.root, 'o3')
  test.write('apps/storybook/prototypes/example.stories.tsx', 'export const Demo = {}')
  expect(() =>
    captureSourceEvidence(
      test.root,
      [
        { id: './../../packages/ui/src/card.stories.tsx' },
        { id: './prototypes/example.stories.tsx' },
      ],
      [test.story],
      'o3',
      beforeBuild,
    ),
  ).not.toThrow()
})

it('rejects a reachable renderer deleted during the build', () => {
  const test = fixture()
  const beforeBuild = readSourceState(test.root, 'o3')
  fs.unlinkSync(path.join(test.root, test.component))
  expect(() =>
    captureSourceEvidence(
      test.root,
      [
        { id: './../../packages/ui/src/card.stories.tsx' },
        {
          id: './../../packages/ui/src/card.tsx',
          reasons: [{ moduleName: './../../packages/ui/src/card.stories.tsx' }],
        },
      ],
      [test.story],
      'o3',
      beforeBuild,
    ),
  ).toThrow('Cannot accept missing source: packages/ui/src/card.tsx')
})
