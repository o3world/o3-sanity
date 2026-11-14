import { defineArrayMember, defineField, defineType } from 'sanity'

/**
 * The priced offer a coded landing page sells: its packages, add-ons and FAQ,
 * and where its booking buttons go. The page around it — hero, review cards,
 * steps, promise — is code in `apps/web`; this document is the part marketing
 * changes without a deploy.
 *
 * NOT ROUTABLE. `slug` is the URL segment of the coded route that renders the
 * offer, and the route fetches by it; the catch-all never sees this type, so a
 * slug no route asks for renders nowhere. `RESERVED_PAGE_SLUGS` keeps a page
 * from claiming the same URL.
 */
export const serviceOffer = defineType({
  name: 'serviceOffer',
  title: 'Service offer',
  type: 'document',
  description:
    'The packages, add-ons and FAQ a coded service landing page shows. The rest of that page is built in code.',
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      description:
        'The service’s name — "AI Visibility Review". Names the Service in search results.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      options: { source: 'title' },
      description:
        'The URL of the coded landing page this offer belongs to, without the slash — "ai-visibility-review". A slug no landing page is built for shows nowhere.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'bookingUrl',
      title: 'Booking URL',
      type: 'url',
      description:
        'Where every "Book a call", "Let’s talk" and package button goes — a scheduling link. Leave it empty and they jump to the contact band at the foot of the page.',
      validation: (rule) => rule.uri({ scheme: ['http', 'https', 'mailto'], allowRelative: true }),
    }),
    defineField({
      name: 'packages',
      type: 'array',
      description:
        'The priced tiers, in the order they are shown. Each is numbered on the page by its place here.',
      of: [
        defineArrayMember({
          name: 'servicePackage',
          title: 'Package',
          type: 'object',
          fields: [
            defineField({
              name: 'heading',
              type: 'string',
              description: 'The package’s name — "AI Visibility Check".',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'subheading',
              type: 'string',
              description: 'The line under the name — "A fast read on where you stand."',
            }),
            defineField({
              name: 'price',
              type: 'string',
              description: 'The price as the card prints it — "$2,500".',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'priceAmount',
              title: 'Price in USD',
              type: 'number',
              description:
                'The same price as a plain number — 2500. Never shown; it is what search engines read as the offer’s price.',
              validation: (rule) => rule.required().min(0),
            }),
            defineField({
              name: 'featuredLabel',
              type: 'string',
              description:
                'A pill on the card — "Most popular". Filling it in also makes this the dark, featured card.',
            }),
            defineField({
              name: 'note',
              type: 'string',
              description:
                'The line above the list when this package builds on another — "Everything in the Check, plus:".',
            }),
            defineField({
              name: 'features',
              type: 'array',
              of: [defineArrayMember({ type: 'string' })],
              description: 'What the package includes, one line each.',
              validation: (rule) => rule.min(1),
            }),
            defineField({
              name: 'button',
              type: 'button',
              description:
                'The button’s words — "Start with a Check". Leave its destination empty and it goes to the offer’s Booking URL. Contrast and icon follow the card, whatever is set here.',
              validation: (rule) => rule.required(),
            }),
          ],
          preview: { select: { title: 'heading', subtitle: 'price' } },
        }),
      ],
      validation: (rule) => rule.min(1),
    }),
    defineField({
      name: 'addOns',
      title: 'Add-ons',
      type: 'array',
      description: 'Extras sold beside any package.',
      of: [
        defineArrayMember({
          name: 'addOn',
          title: 'Add-on',
          type: 'object',
          fields: [
            defineField({
              name: 'label',
              type: 'string',
              description: 'What it is — "Quarterly re-check".',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'price',
              type: 'string',
              description: 'The price as printed — "$1,500 per quarter".',
              validation: (rule) => rule.required(),
            }),
          ],
          preview: { select: { title: 'label', subtitle: 'price' } },
        }),
      ],
    }),
    defineField({
      name: 'faqs',
      title: 'FAQ',
      type: 'array',
      description:
        'Questions and answers, in the order they are shown. The first one opens on load.',
      of: [
        defineArrayMember({
          name: 'faq',
          title: 'Question',
          type: 'object',
          fields: [
            defineField({
              name: 'question',
              type: 'string',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'answer',
              type: 'array',
              description: 'Paragraphs. Bold is for a term the paragraph defines.',
              of: [
                defineArrayMember({
                  type: 'block',
                  styles: [{ title: 'Normal', value: 'normal' }],
                  lists: [],
                  marks: {
                    decorators: [
                      { title: 'Bold', value: 'strong' },
                      { title: 'Italic', value: 'em' },
                    ],
                  },
                }),
              ],
              validation: (rule) => rule.required().min(1),
            }),
          ],
          preview: { select: { title: 'question' } },
        }),
      ],
    }),
    defineField({ name: 'seo', type: 'seo' }),
    defineField({ name: 'migration', type: 'migration' }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'slug.current' },
  },
})
