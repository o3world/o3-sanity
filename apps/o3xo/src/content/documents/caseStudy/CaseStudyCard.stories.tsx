import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import type { Figure } from '@o3/sanity/types/generated'
import { aCaseStudyCard } from '@o3/render-kit/fixtures'

import { CaseStudyCard } from './CaseStudyCard'

/**
 * The kit's `Case Study Cards` set (`4404:3072`, Cards canvas `340:1577` of
 * the _O3XO: UI kit_ file) as this app draws it.
 *
 * **The brand is pinned.** The card is O3XO's alone — O3's index draws the
 * same content as a photograph with the copy over it — so there is nothing for
 * the Brand toolbar to ask here. The toolbar stays live on the shared-package
 * stories, where flipping the brand is the standing paint-leak test (ADR
 * 0028).
 *
 * **The photograph is O3's**, and only the photograph. This Storybook resolves
 * O3's Sanity project for image URLs, so an O3XO asset id renders a broken
 * box; the copy below is the migrated O3XO document's, word for word.
 */
const meta = {
  title: 'Content/Cards/CaseStudyCard',
  component: CaseStudyCard,
  globals: { brand: 'o3xo' },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof CaseStudyCard>

export default meta
type Story = StoryObj<typeof meta>

const photograph: Figure = {
  _type: 'figure',
  alt: 'Construction team reviewing architectural blueprints',
  image: {
    _type: 'image',
    asset: {
      _type: 'reference',
      _ref: 'image-c7356fe3c2fad2e379631ef4d6ff484f7b82193c-2500x1448-png',
    },
  },
}

const buffalo = aCaseStudyCard({
  _id: 'caseStudy-framer-buffalo-construction',
  slug: 'buffalo-construction',
  title: 'From “where do we start?” to AI across the project lifecycle in under six months',
  client: { name: 'Buffalo Construction', logo: null },
  narrativeHeadline:
    'Buffalo Construction had the ambition and the executive support, but no clear path to AI adoption. Here’s how we helped them go from a workshop to three working AI solutions spanning estimating, closeout, and proposals.',
  headlineStat: {
    _key: 'k0011',
    _type: 'stat',
    value: '2X',
    label: 'Revenue capacity from 3 AI solutions in < 6 months',
  },
  heroMedia: photograph,
  industries: null,
  industryDetail: null,
})

/**
 * What `/case-studies` renders today: no industry line, because none of the
 * six migrated case studies carries one, and a narrative that runs past the
 * two lines the frame draws — the clamp is what holds the card's proportions.
 */
export const AsMigrated: Story = {
  args: buffalo,
  parameters: { layout: 'centered' },
}

/**
 * The full anatomy the kit draws — the client over a subject line, which is
 * `industryDetail` here. o3xo.ai sets one on every card ("Automating
 * closeout"); the migration had nowhere to put it, so this is the shape the
 * cards take once that copy lands.
 */
export const WithIndustry: Story = {
  args: {
    ...buffalo,
    industries: [{ title: 'Construction' }],
    industryDetail: 'AI-powered operations',
  },
  parameters: { layout: 'centered' },
}

/** A card whose case study has no stat yet: the rule and the copy hold. */
export const WithoutStat: Story = {
  args: { ...buffalo, headlineStat: null },
  parameters: { layout: 'centered' },
}

/**
 * The kit's `Case Study Group` (`4404:3398`) — three across, 32 apart, which
 * is the row the index lays out. The three narratives are different lengths on
 * purpose: the stats have to sit on one line at the floor of all three cards.
 */
export const Row: Story = {
  args: buffalo,
  render: (args) => (
    <ul className="grid max-w-[1200px] grid-cols-3 gap-8">
      {[
        args,
        aCaseStudyCard({
          ...args,
          _id: 'caseStudy-framer-tyndale',
          slug: 'tyndale',
          client: { name: 'Tyndale', logo: null },
          narrativeHeadline:
            'Tyndale’s extensive library of safety knowledge wasn’t reaching the people who needed it most. Here’s how we helped them bridge that gap.',
          headlineStat: {
            _key: 'k0011',
            _type: 'stat',
            value: '20+ new contacts',
            label: 'Created on average per week',
          },
        }),
        aCaseStudyCard({
          ...args,
          _id: 'caseStudy-framer-e-hazard',
          slug: 'e-hazard',
          client: { name: 'e-Hazard', logo: null },
          narrativeHeadline:
            'When industry leaders need to modernize operations while staying focused on their core mission, AI can bridge the gap between legacy processes and future efficiency.',
          headlineStat: {
            _key: 'k0011',
            _type: 'stat',
            value: '70%',
            label: 'Reduction in hours spent per week',
          },
        }),
      ].map((card) => (
        <li key={card._id}>
          <CaseStudyCard {...card} />
        </li>
      ))}
    </ul>
  ),
}
