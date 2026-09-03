import { defineArrayMember, defineField, defineType } from 'sanity'

export const person = defineType({
  name: 'person',
  title: 'Person',
  type: 'document',
  fields: [
    defineField({ name: 'name', type: 'string', validation: (rule) => rule.required() }),
    defineField({ name: 'title', title: 'Role', type: 'string' }),
    defineField({ name: 'headshot', type: 'image', options: { hotspot: true } }),
    defineField({
      name: 'bio',
      type: 'text',
      rows: 3,
      description:
        'Two or three lines on what this person does — written for a card, not a profile page. A grid that draws bios draws them all at one height, so keep them the same length.',
    }),
    defineField({ name: 'migration', type: 'migration' }),
  ],
  preview: { select: { title: 'name', subtitle: 'title', media: 'headshot' } },
})

export const client = defineType({
  name: 'client',
  title: 'Client',
  type: 'document',
  fields: [
    defineField({ name: 'name', type: 'string', validation: (rule) => rule.required() }),
    defineField({ name: 'logo', type: 'image', validation: (rule) => rule.required() }),
    defineField({ name: 'migration', type: 'migration' }),
  ],
  preview: { select: { title: 'name', media: 'logo' } },
})

export const category = defineType({
  name: 'category',
  title: 'Category',
  type: 'document',
  fields: [
    defineField({ name: 'title', type: 'string', validation: (rule) => rule.required() }),
    defineField({
      name: 'slug',
      type: 'slug',
      options: { source: 'title' },
      validation: (rule) => rule.required(),
    }),
    defineField({ name: 'migration', type: 'migration' }),
  ],
  preview: { select: { title: 'title' } },
})

export const industry = defineType({
  name: 'industry',
  title: 'Industry',
  type: 'document',
  fields: [
    defineField({ name: 'title', type: 'string', validation: (rule) => rule.required() }),
    defineField({
      name: 'slug',
      type: 'slug',
      options: { source: 'title' },
      validation: (rule) => rule.required(),
    }),
    defineField({ name: 'migration', type: 'migration' }),
  ],
  preview: { select: { title: 'title' } },
})

/**
 * A nav item that opens a panel instead of going somewhere — the dropdown the
 * O3XO kit's `Navigation` (`4404:4146`) draws on three of its five items.
 *
 * Inline in `navItems` rather than a registered shared object, the way
 * `footerGroup` and `socialLink` below are inline in theirs: it has no
 * identity outside this array and no design options to declare, so it is an
 * item (CONTEXT.md → Component, instance, slot).
 *
 * Each entry is a `button` — the panel's cards are links, and where a link
 * goes is already a solved field — with the two lines the design draws around
 * it. The group's own `button` is the panel's last row, the "View all
 * industries →" that the trigger itself cannot be, because a trigger that also
 * navigates is a control with two jobs.
 */
const navGroup = {
  type: 'object' as const,
  name: 'navGroup',
  title: 'Nav dropdown',
  fields: [
    defineField({
      name: 'label',
      type: 'string',
      description: 'The word on the bar. It opens the panel; it goes nowhere.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'items',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'navGroupItem',
          fields: [
            defineField({
              name: 'button',
              type: 'button',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'eyebrow',
              type: 'string',
              description: 'A small label over the title. Set in caps by the renderer.',
            }),
            defineField({
              name: 'excerpt',
              type: 'string',
              description: 'The one line under the title saying what is there.',
            }),
          ],
          preview: { select: { title: 'button.label', subtitle: 'excerpt' } },
        }),
      ],
    }),
    defineField({
      name: 'button',
      title: 'Panel link',
      type: 'button',
      description: 'The row that closes the panel — "View all industries", and the like.',
    }),
  ],
  preview: { select: { title: 'label' } },
}

/**
 * A link the utility strip draws as its property's mark instead of its name —
 * the 1682 and O3XO logos the Home instance (`2250:1453`) places beside "O3
 * Family of Brands".
 *
 * Inline in `utilityNavItems` like `navGroup` is inline in `navItems`: it has
 * no identity outside that array and no design options to declare, so it is an
 * item (CONTEXT.md → Component, instance, slot). Its `button` carries the
 * destination and the label, because where a link goes and what it is called
 * are already solved fields — the label is what a screen reader reads in place
 * of the mark.
 *
 * No width field. Both marks are drawn 20px tall and let their own proportions
 * decide the rest (55 × 20 and 76 × 20), so height is the renderer's constant
 * and width is the file's.
 */
const brandLogo = {
  type: 'object' as const,
  name: 'brandLogo',
  title: 'Brand logo',
  fields: [
    defineField({
      name: 'button',
      title: 'Destination',
      type: 'button',
      description: 'Where the mark goes, and the name a screen reader reads instead of it.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'logo',
      type: 'image',
      description: 'The property’s mark, knocked out for a black bar.',
      validation: (rule) => rule.required(),
    }),
  ],
  preview: { select: { title: 'button.label', media: 'logo' } },
}

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  fields: [
    defineField({ name: 'title', type: 'string', initialValue: 'O3' }),
    // No collection-label field. It existed to render the collection as
    // "Insights" while the type was called `perspective`; now that the type is
    // `insight`, it translated a word into itself (ADR 0017). A nav item's own
    // `label` still overrides per link, like every other entry.
    /**
     * The brand-property strip above the nav pill (Figma `Utility Nav`,
     * `2250:1445`): a line of text naming the family, then one mark per
     * property. Its own field rather than a second `footerGroup` — the group's
     * label has nowhere to go on a bar that shows only its links, and the
     * strip's membership is the set of properties O3 runs, which is not the
     * nav's concern.
     *
     * A member is either a `button` — a word — or a `brandLogo`, which is the
     * same destination drawn as its mark. Additive, the way `navGroup` is
     * additive to `navItems`: a brand whose strip is three words authors no
     * logo, and the Home instance's own three members are one of each kind.
     */
    defineField({
      name: 'utilityNavItems',
      title: 'Utility nav',
      type: 'array',
      of: [defineArrayMember({ type: 'button' }), defineArrayMember(brandLogo)],
      description: 'The brand-property strip above the nav. Desktop only.',
    }),
    /**
     * The nav's own row. A member is either a plain link or a `navGroup` — a
     * label that opens a panel of links instead of going anywhere itself.
     *
     * The group exists because O3XO's nav has dropdowns and O3's does not
     * (`Navigation`, `4404:4146` of the _O3XO: UI kit_). It is additive on
     * purpose: an array that already holds buttons keeps holding them, and a
     * brand whose nav is five flat links authors no group.
     */
    defineField({
      name: 'navItems',
      type: 'array',
      of: [defineArrayMember({ type: 'button' }), defineArrayMember(navGroup)],
    }),
    defineField({
      name: 'primaryButton',
      type: 'button',
      description: 'The nav’s "Let’s talk" button.',
    }),
    defineField({ name: 'footerTagline', type: 'text', rows: 2 }),
    /**
     * The footer's labelled link columns, in order. The prototype's footer is
     * grouped ("Company", "Everything else"), not a flat list — a single
     * `footerLinks` array could not express it.
     */
    defineField({
      name: 'footerGroups',
      title: 'Footer link columns',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'footerGroup',
          fields: [
            defineField({ name: 'label', type: 'string', validation: (rule) => rule.required() }),
            defineField({
              name: 'links',
              type: 'array',
              of: [defineArrayMember({ type: 'button' })],
            }),
          ],
          preview: { select: { title: 'label' } },
        }),
      ],
    }),
    defineField({
      name: 'socialsLabel',
      type: 'string',
      initialValue: 'Socials',
      description: 'Heading over the social links column.',
    }),
    defineField({
      name: 'socialLinks',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'socialLink',
          fields: [
            defineField({ name: 'label', type: 'string', validation: (rule) => rule.required() }),
            defineField({ name: 'url', type: 'url', validation: (rule) => rule.required() }),
          ],
        }),
      ],
    }),
    defineField({
      name: 'legalLinks',
      type: 'array',
      of: [defineArrayMember({ type: 'button' })],
      description: 'Privacy, accessibility — the small print row beside the copyright.',
    }),
    defineField({
      name: 'legalName',
      type: 'string',
      description: 'The registered entity in the copyright line. The year is added automatically.',
    }),
    defineField({
      name: 'copyrightNote',
      type: 'string',
      description: 'Anything after "All rights reserved." — the prototype signs off "Go birds."',
    }),
    defineField({ name: 'defaultSeo', type: 'seo' }),
    defineField({ name: 'migration', type: 'migration' }),
  ],
  preview: {
    select: { title: 'title' },
    prepare: (sel) => ({ title: sel.title ?? 'Site Settings' }),
  },
})
