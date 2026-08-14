import { describe, expect, it } from 'vitest'

import { componentName, lastFieldSegment, subjectName } from './identity'

describe('componentName', () => {
  it('humanises the stored block type', () => {
    expect(componentName({ storedType: 'railPanelsSection' })).toBe('Rail panels section')
    expect(componentName({ storedType: 'heroSection' })).toBe('Hero section')
  })

  it('keeps the Section suffix — it is the tier marker, not noise', () => {
    // Unlike the prior art's `Block` suffix, `Section` says "full-width strip",
    // which is exactly what the bar is docked to.
    expect(componentName({ storedType: 'quoteSection' })).toContain('section')
  })

  it('falls back to the comlink title before the snapshot settles', () => {
    expect(componentName({ schemaTitle: 'Rail + panels' })).toBe('Rail + panels')
  })

  it('prefers the stored type once there is one', () => {
    // The snapshot is the identity of record: it is the only source available
    // at every zone, so letting it win keeps one name across all of them.
    expect(componentName({ storedType: 'heroSection', schemaTitle: 'Hero' })).toBe('Hero section')
  })

  it('names nothing when nothing can name it', () => {
    expect(componentName({})).toBeUndefined()
    expect(componentName({ storedType: '' })).toBeUndefined()
    expect(componentName({ storedType: 42 })).toBeUndefined()
  })
})

describe('subjectName', () => {
  const itemPath = 'sections[_key=="a"].panels[_key=="p1"]'

  it('prefers the resolved schema title', () => {
    expect(subjectName({ path: itemPath, storedType: 'panel', schemaTitle: 'Panel' })).toBe('Panel')
  })

  it('humanises the stored type when the comlink resolved no title', () => {
    expect(subjectName({ path: itemPath, storedType: 'panel' })).toBe('Panel')
    expect(
      subjectName({ path: 'sections[_key=="a"].screens[_key=="s"]', storedType: 'screen' }),
    ).toBe('Screen')
  })

  it('names a reference slot by its array field, not by its storage', () => {
    // An array of references stores `_type: 'reference'`. "Reference" names
    // the mechanism; "People" names the slot the editor is pointing at.
    expect(
      subjectName({ path: 'sections[_key=="a"].people[_key=="r1"]', storedType: 'reference' }),
    ).toBe('People')
  })

  it('names a header by its field', () => {
    expect(subjectName({ path: 'sections[_key=="a"].heading' })).toBe('Heading')
  })

  it('has no name for a path with no field in it', () => {
    expect(subjectName({ path: '' })).toBeUndefined()
  })
})

describe('lastFieldSegment', () => {
  it('ignores keyed segments', () => {
    expect(lastFieldSegment('sections[_key=="a"].panels[_key=="b"]')).toBe('panels')
    expect(lastFieldSegment('sections[_key=="a"].heading')).toBe('heading')
    expect(lastFieldSegment('sections')).toBe('sections')
  })

  // It is the LAST-RESORT label, so it has to answer for the paths nothing else
  // can name. A stega'd run inside `heroSection.headlineLines` arrives with a
  // numeric index, has no stored `_type` and no schema title — this used to
  // return undefined there and the identity chip rendered blank.
  it('reads a name off a numeric index too', () => {
    expect(lastFieldSegment('sections[_key=="a"].headlineLines[0]')).toBe('headlineLines')
    expect(lastFieldSegment('sections[0]')).toBe('sections')
  })

  it('has no answer only when there is no field name at all', () => {
    expect(lastFieldSegment('')).toBeUndefined()
  })
})
