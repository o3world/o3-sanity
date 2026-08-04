import { describe, expect, it } from 'vitest'

import { buildPersonDirectory, normalizeName, type WpPerson, type WpTeamMember } from './person'
import type { ExtractMeta } from './types'

const META: ExtractMeta = { type: 'person' }

function user(overrides: Partial<WpPerson> & Pick<WpPerson, 'wpId' | 'name'>): WpPerson {
  return { _meta: META, slug: overrides.name.toLowerCase(), ...overrides }
}

function member(
  overrides: Partial<WpTeamMember> & Pick<WpTeamMember, 'wpId' | 'name'>,
): WpTeamMember {
  return { _meta: META, slug: overrides.name.toLowerCase(), ...overrides }
}

describe('normalizeName', () => {
  it('is case- and whitespace-insensitive', () => {
    // WordPress team records are hand-entered and carry stray spaces.
    expect(normalizeName('  Nick   Lewis ')).toBe('nick lewis')
    expect(normalizeName('NICK LEWIS')).toBe('nick lewis')
  })
})

describe('buildPersonDirectory', () => {
  it('merges a user and a team member who share a name', () => {
    const dir = buildPersonDirectory(
      [user({ wpId: 18, name: 'Mike Gadsby' })],
      [member({ wpId: 672, name: 'Mike Gadsby', jobTitle: 'Co-Founder' })],
    )
    expect(dir.docs).toHaveLength(1)
    expect(dir.docs[0]).toMatchObject({ _id: 'person-wp-18', name: 'Mike Gadsby' })
  })

  it('merges on email when the account never got a display name', () => {
    // Three real accounts are like this: `display_name` is the login, so a
    // name join finds nothing and the byline would read "handler".
    const dir = buildPersonDirectory(
      [user({ wpId: 3, name: 'handler', email: 'handler@o3world.com' })],
      [
        member({
          wpId: 936,
          name: 'Justin Handler',
          email: 'Handler@o3world.com',
          jobTitle: 'Managing Director',
        }),
      ],
    )
    expect(dir.docs).toHaveLength(1)
    expect(dir.docs[0]?.name).toBe('Justin Handler')
    expect(dir.docs[0]?.title).toBe('Managing Director')
  })

  it('keeps the user id, so already-converted documents keep resolving', () => {
    const dir = buildPersonDirectory(
      [user({ wpId: 3, name: 'handler', email: 'handler@o3world.com' })],
      [member({ wpId: 936, name: 'Justin Handler', email: 'handler@o3world.com' })],
    )
    expect(dir.docs[0]?._id).toBe('person-wp-3')
    // The ACF byline is the only lookup, and it lands on the user's id.
    expect(dir.refForTeam(936)).toBe('person-wp-3')
  })

  it('gives a team-only person their own document', () => {
    // Former staff and contributors who never had an account still wrote
    // things, and the ACF author field still points at them.
    const dir = buildPersonDirectory(
      [],
      [member({ wpId: 8146, name: 'Alan Cho, CPACC', jobTitle: 'Senior UX Designer' })],
    )
    expect(dir.docs[0]).toMatchObject({ _id: 'person-wp-8146', name: 'Alan Cho, CPACC' })
    expect(dir.refForTeam(8146)).toBe('person-wp-8146')
  })

  it('takes role and headshot from the team record, never the account', () => {
    const dir = buildPersonDirectory(
      [user({ wpId: 11, name: 'Jay Forbes', email: 'jay@o3world.com' })],
      [
        member({
          wpId: 125,
          name: 'Jay Forbes',
          email: 'jay@o3world.com',
          jobTitle: 'Director of Engineering',
          photo: 'http://www.o3world.com/up/jay-768x432.jpg',
        }),
      ],
    )
    expect(dir.docs[0]).toMatchObject({
      title: 'Director of Engineering',
      // https, full-size — the same normalization every migrated image gets.
      headshot: { _type: 'image', _wpSrc: 'https://www.o3world.com/up/jay.jpg' },
    })
  })

  it('leaves an unmatched account alone rather than inventing a name', () => {
    const dir = buildPersonDirectory(
      [user({ wpId: 20, name: 'jennifero3', email: 'jennifer@thegardellagroup.com' })],
      [member({ wpId: 936, name: 'Justin Handler', email: 'handler@o3world.com' })],
    )
    expect(dir.docs.find((d) => d._id === 'person-wp-20')?.name).toBe('jennifero3')
  })

  it('returns null for a team id it has never seen, rather than a broken ref', () => {
    // The seven posts whose ACF byline names a deleted team post take this
    // path: no reference at all, rather than one that resolves to nothing.
    expect(buildPersonDirectory([], []).refForTeam(99)).toBeNull()
  })

  it('is deterministic across runs', () => {
    const build = () =>
      buildPersonDirectory(
        [user({ wpId: 16, name: 'Brian Crumley', email: 'brian@o3world.com' })],
        [member({ wpId: 921, name: 'Keith Scandone', email: 'keith@o3world.com' })],
      )
    expect(JSON.stringify(build().docs)).toBe(JSON.stringify(build().docs))
  })

  // Users and team posts are separate WordPress id spaces sharing one
  // `person-wp-<id>` namespace. They do not overlap today (users ≤ 22, team
  // ≥ 125) but nothing enforces that in WordPress, so the directory does.
  it('refuses to build an ambiguous id namespace', () => {
    expect(() =>
      buildPersonDirectory(
        [user({ wpId: 16, name: 'Brian Crumley', email: 'brian@o3world.com' })],
        [member({ wpId: 16, name: 'Someone Else', email: 'someone@o3world.com' })],
      ),
    ).toThrow(/collides with a WP user id/)
  })
})
