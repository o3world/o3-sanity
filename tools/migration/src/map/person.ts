import { z } from 'zod'

import { normalizeUploadUrl } from '../lib/htmlToPortableText'
import { migratableImage, type ExtractMeta } from './types'

export interface WpPerson {
  _meta: ExtractMeta
  wpId: number
  slug: string
  name: string
  email?: string
  bio?: string
}

/** A `team` post — WordPress's only record of a person's role and headshot. */
export interface WpTeamMember {
  _meta?: ExtractMeta
  wpId: number
  slug: string
  name: string
  jobTitle?: string
  bio?: string
  photo?: string
  email?: string
  linkedin?: string
}

export const personDoc = z.object({
  _id: z.string().regex(/^person-wp-\d+$/),
  _type: z.literal('person'),
  name: z.string().min(1),
  title: z.string().min(1).optional(),
  headshot: migratableImage.optional(),
  migration: z.object({ locked: z.boolean(), sourceId: z.string() }),
})

export type PersonDoc = z.infer<typeof personDoc>

/**
 * `  Nick   Lewis ` → `nick lewis`. WordPress team records are hand-entered
 * and carry stray trailing spaces in both `first_name` and `last_name`, so
 * the join has to be whitespace- and case-insensitive to land at all.
 */
export function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ')
}

/**
 * Who wrote a post, resolved once for the whole run (#17).
 *
 * WordPress splits one person across two unrelated records — a *user* (login,
 * display name, empty bio) and a *team* post (real name, role, headshot) —
 * and joins them with nothing. This directory does the join, and it is also
 * where the byline itself is decided:
 *
 * - A post's ACF `author` field points at a team post, and that is **the only
 *   byline**. `post_author` is just whoever hit publish — o3world.com renders
 *   nothing from it, so there is no `refForUser`: a lookup by WP user id
 *   exists only to answer "who published this", which is not a question the
 *   new model asks. Dropping it is why `perspective.author` is optional.
 * - A user and a team member are the same person when they share an email
 *   (case-insensitively) or a name. Email is the stronger key and comes
 *   first: three WP accounts never had a display name set, so their "name" is
 *   a login (`handler`, `kelly`) that matches nothing. The join still matters
 *   with the fallback gone — it is what gives an ACF-bylined person their
 *   `person-wp-<userId>` id and their curated name.
 * - Where they merge, the **team** record supplies the name. It is the
 *   curated, public-facing spelling; the user record is an account.
 */
export interface PersonDirectory {
  /** Every person any post attributes, ready to emit. */
  readonly docs: readonly PersonDoc[]
  /** Document id for a team post id, or `null` if that member is unknown. */
  refForTeam(wpTeamId: number): string | null
}

interface Merged {
  id: string
  name: string
  title?: string
  photo?: string
  sourceId: string
  teamIds: number[]
}

function emailKey(value: string | undefined): string | null {
  const trimmed = value?.trim().toLowerCase()
  return trimmed ? trimmed : null
}

export function buildPersonDirectory(
  users: readonly WpPerson[],
  team: readonly WpTeamMember[],
): PersonDirectory {
  const merged: Merged[] = []
  const byEmail = new Map<string, Merged>()
  const byName = new Map<string, Merged>()

  function findOrCreate(key: { email?: string; name: string }, create: () => Merged): Merged {
    const email = emailKey(key.email)
    const name = normalizeName(key.name)
    const existing = (email ? byEmail.get(email) : undefined) ?? byName.get(name)
    const person = existing ?? create()
    if (!existing) merged.push(person)
    if (email) byEmail.set(email, person)
    byName.set(name, person)
    return person
  }

  // Users first, so a person who has a WP account keeps `person-wp-<userId>`
  // — the id every already-converted perspective references.
  for (const user of users) {
    findOrCreate({ email: user.email, name: user.name }, () => ({
      id: `person-wp-${user.wpId}`,
      name: user.name.trim(),
      sourceId: `wp:user:${user.wpId}`,
      teamIds: [],
    }))
  }

  for (const member of team) {
    const person = findOrCreate({ email: member.email, name: member.name }, () => ({
      // Team-only people (former staff, contributors who never had an
      // account) get their team post id. Asserted disjoint from user ids
      // below, so the one `person-wp-<id>` namespace stays unambiguous.
      id: `person-wp-${member.wpId}`,
      name: member.name.trim(),
      sourceId: `wp:team:${member.wpId}`,
      teamIds: [],
    }))
    person.teamIds.push(member.wpId)
    // The team record is the curated public name, role and photo.
    person.name = member.name.trim()
    if (member.jobTitle?.trim()) person.title = member.jobTitle.trim()
    if (member.photo?.trim()) person.photo = member.photo.trim()
  }

  // Users and team posts are separate WordPress id spaces sharing one
  // `person-wp-<id>` namespace. They do not overlap today (users ≤ 22, team
  // ≥ 125) and nothing in WordPress enforces that, so this does: a person
  // whose id came from a team post must not land on a user's id.
  const userIdSpace = new Set(users.map((u) => u.wpId))
  for (const person of merged) {
    const teamId = /^wp:team:(\d+)$/.exec(person.sourceId)?.[1]
    if (teamId && userIdSpace.has(Number(teamId))) {
      throw new Error(
        `team post ${teamId} collides with a WP user id — the person-wp-<id> namespace is ambiguous`,
      )
    }
  }

  const teamIndex = new Map<number, string>()
  for (const person of merged) {
    for (const id of person.teamIds) teamIndex.set(id, person.id)
  }

  return {
    docs: merged.map((person) => ({
      _id: person.id,
      _type: 'person' as const,
      name: person.name,
      ...(person.title ? { title: person.title } : {}),
      ...(person.photo
        ? { headshot: { _type: 'image' as const, _wpSrc: normalizeUploadUrl(person.photo) } }
        : {}),
      migration: {
        locked: false,
        sourceId: person.sourceId,
      },
    })),
    refForTeam: (id) => teamIndex.get(id) ?? null,
  }
}
