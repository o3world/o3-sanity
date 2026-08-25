import { defineArrayMember, defineField, defineType } from 'sanity'
import { COLLECTION_TYPES } from '../../constants'
import { blockArrayMembers, type BlockArrays } from '../blocks/registry'

/**
 * The editable chrome for a collection's index route — the bands above and
 * below a feed the route itself owns.
 *
 * A collection index is the one page shape whose middle cannot be authored.
 * `?page=` is one parameter per document, so two paginated listings on a page
 * have no coherent answer to what page 3 means; the feed — chips, grid and
 * pager — therefore stays with the route, and this document holds everything
 * around it. `sectionsAbove` and `sectionsBelow` are named against that feed.
 *
 * A function rather than a constant for the same reason `page` is: the two
 * arrays take whichever roster the caller builds with (ADR 0028), so one
 * declaration serves both brands' Studios and the whole-model typegen.
 *
 * NOT ROUTABLE, and deliberately without a slug: the route owns the URL, and
 * this document is addressed by its `collection`. Adding it to `ROUTABLE_TYPES`
 * would put it in the catch-all's dispatch and hand it a URL of its own.
 */
export const collectionIndex = (arrays: BlockArrays) =>
  defineType({
    name: 'collectionIndex',
    title: 'Collection index',
    type: 'document',
    fields: [
      defineField({
        name: 'title',
        type: 'string',
        description: 'What this document is called in Studio — "Insights index". Not page copy.',
        validation: (rule) => rule.required(),
      }),
      /**
       * Which route this document is the chrome for.
       *
       * A closed enum and NOT a knob: an editor setting it is saying which
       * page the document belongs to, not picking a look on the canvas. Same
       * category as `listingSection.pageType` (CONTEXT.md → Knobs).
       */
      defineField({
        name: 'collection',
        type: 'string',
        options: { list: [...COLLECTION_TYPES] },
        initialValue: 'insight',
        validation: (rule) => rule.required(),
      }),
      defineField({
        name: 'sectionsAbove',
        title: 'Sections above the feed',
        type: 'array',
        of: blockArrayMembers('collectionIndex.sectionsAbove', arrays).map((member) =>
          defineArrayMember(member),
        ),
      }),
      defineField({
        name: 'sectionsBelow',
        title: 'Sections below the feed',
        type: 'array',
        of: blockArrayMembers('collectionIndex.sectionsBelow', arrays).map((member) =>
          defineArrayMember(member),
        ),
      }),
      defineField({ name: 'seo', type: 'seo' }),
      defineField({ name: 'migration', type: 'migration' }),
    ],
    preview: {
      select: { title: 'title', subtitle: 'collection' },
    },
  })
