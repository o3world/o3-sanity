import { defineArrayMember, defineField, defineType } from 'sanity'
import { COLLECTION_TYPES } from '../../constants'
import { blockArrayMembers, type BlockArrays } from '../blocks/registry'

/**
 * The editable chrome for a collection's index route — the bands above and
 * below a feed the route itself owns.
 *
 * A collection index is the one page shape whose middle cannot be authored.
 * A page is one path per document, so two paginated listings on a page
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
        /**
         * Required AND unique. The route matches on this value and takes the
         * first document that answers, so a second index claiming the same
         * collection would decide the page by whichever the dataset returned
         * first — the seeded hero and closer disappearing with no error and no
         * way to tell why.
         *
         * `reportSlugCollisions` is what catches this shape for routable types
         * and cannot cover this one: it keys on `slug.current`, and this
         * document deliberately has none. So the check is here, where the
         * value that identifies the document actually is.
         */
        validation: (rule) =>
          rule.required().custom(async (value, context) => {
            if (!value) return true
            const id = context.document?._id?.replace(/^drafts\./, '')
            const taken = await context
              .getClient({ apiVersion: '2024-10-01' })
              .fetch<boolean>(
                `defined(*[_type == "collectionIndex" && collection == $value && !(_id in $ids)][0]._id)`,
                { value, ids: [id, `drafts.${id}`] },
              )
            return taken ? `Another collection index already covers "${value}".` : true
          }),
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
      /**
       * The index's own search and social tags — they beat the route's static
       * fallbacks (#349).
       *
       * `canonical` is the one field here that does nothing. The route
       * canonicalizes every paginated and filtered page back to the bare
       * index, so a URL typed here would redirect the whole collection's crawl
       * at once; `buildIndexRoute` drops it. Said in the description rather
       * than hidden, because `seo` is one shared object on every document and
       * forking it to gate one field would cost more than the sentence.
       */
      defineField({
        name: 'seo',
        type: 'seo',
        description:
          'Search and social tags for this index. The Canonical URL field does not apply here — the route always points a paginated or filtered page back at the bare index.',
      }),
      defineField({ name: 'migration', type: 'migration' }),
    ],
    preview: {
      select: { title: 'title', subtitle: 'collection' },
    },
  })
