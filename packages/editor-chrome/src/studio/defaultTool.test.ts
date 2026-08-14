import { describe, expect, it } from 'vitest'

import { defaultToolFirst } from './defaultTool'

const tools = [{ name: 'structure' }, { name: 'presentation' }, { name: 'vision' }]

describe('defaultToolFirst', () => {
  it('moves the named tool to the front, where Studio looks for the default', () => {
    expect(defaultToolFirst(tools, 'presentation').map((t) => t.name)).toEqual([
      'presentation',
      'structure',
      'vision',
    ])
  })

  it('keeps every other tool in the order the config registered it', () => {
    expect(defaultToolFirst(tools, 'vision').map((t) => t.name)).toEqual([
      'vision',
      'structure',
      'presentation',
    ])
  })

  it('leaves a list that already starts with the tool alone', () => {
    expect(defaultToolFirst(tools, 'structure').map((t) => t.name)).toEqual([
      'structure',
      'presentation',
      'vision',
    ])
  })

  it('changes nothing when the tool is absent — a renamed tool must not empty the studio', () => {
    expect(defaultToolFirst(tools, 'nope').map((t) => t.name)).toEqual([
      'structure',
      'presentation',
      'vision',
    ])
  })

  it('returns a new array rather than sorting the config in place', () => {
    const result = defaultToolFirst(tools, 'presentation')
    expect(result).not.toBe(tools)
    expect(tools.map((t) => t.name)).toEqual(['structure', 'presentation', 'vision'])
  })
})
