import type { ServiceOffer } from './types'

import seed from '../../../../../../tools/migration/data/seed/serviceOffer/ai-visibility-review.json'

type Faq = NonNullable<ServiceOffer['faqs']>[number]

interface SeedBlock {
  readonly children?: readonly { readonly text?: string }[]
}

/** What GROQ's `pt::text` gives back: each block's spans joined, blocks a blank line apart. */
function plainText(blocks: readonly SeedBlock[]): string {
  return blocks
    .map((block) => (block.children ?? []).map((span) => span.text ?? '').join(''))
    .join('\n\n')
}

/**
 * The committed AI Visibility Review offer, shaped by hand into the query's
 * projection (`slug` flattened, `answerText` computed), so the render tests
 * and the stories draw the copy the dataset is loaded with. Statically imported, so it runs in the
 * browser as well as under Node. Pass overrides for the field a test is about.
 */
export function aSeededServiceOffer(overrides: Partial<ServiceOffer> = {}): ServiceOffer {
  return {
    _id: seed._id,
    _type: 'serviceOffer',
    title: seed.title,
    slug: seed.slug.current,
    bookingUrl: null,
    packages: seed.packages.map((pkg) => ({
      _key: pkg._key,
      heading: pkg.heading,
      subheading: pkg.subheading,
      price: pkg.price,
      priceAmount: pkg.priceAmount,
      featuredLabel: ('featuredLabel' in pkg && pkg.featuredLabel) || null,
      note: ('note' in pkg && pkg.note) || null,
      features: pkg.features,
      button: { _type: 'button', label: pkg.button.label, target: null },
    })),
    addOns: seed.addOns.map(({ _key, label, price }) => ({ _key, label, price })),
    faqs: seed.faqs.map((faq) => ({
      _key: faq._key,
      question: faq.question,
      answer: faq.answer as Faq['answer'],
      answerText: plainText(faq.answer),
    })),
    seo: seed.seo as ServiceOffer['seo'],
    ...overrides,
  }
}
