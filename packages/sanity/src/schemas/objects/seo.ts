import { defineField, defineType } from 'sanity'

export const seo = defineType({
  name: 'seo',
  title: 'SEO',
  type: 'object',
  fields: [
    defineField({ name: 'title', type: 'string', description: 'Overrides the document title in search results and tabs.' }),
    defineField({ name: 'description', type: 'text', rows: 3 }),
    defineField({ name: 'ogImage', title: 'Social share image', type: 'image' }),
    defineField({ name: 'noIndex', type: 'boolean', initialValue: false }),
  ],
})
