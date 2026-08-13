import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { CaseChapter } from './case-chapter'

const meta = {
  title: 'Case Study/CaseChapter',
  component: CaseChapter,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof CaseChapter>

export default meta
type Story = StoryObj<typeof meta>

const body = (
  <>
    <p className="my-5 leading-relaxed">
      La Colombe has set the precedent for America’s artisanal coffee revolution for both in-cafe
      and at-home experiences with its proprietary, globally sourced blends. Its in-store experience
      and wholesale products make for an overall outstanding brand experience that needs to be
      translated into the digital space.
    </p>
    <p className="my-5 leading-relaxed">
      Just as every sip of coffee has a certain familiarity to it, so should every visit to the site
      — which meant rebuilding the storefront around the way people actually shop for coffee.
    </p>
  </>
)

/** The band as the frame draws it — kicker, title, prose in the 822px measure. */
export const Default: Story = {
  args: {
    number: '01',
    kicker: 'Opportunity',
    title: 'Translating a cafe experience into a digital one',
    children: body,
  },
}

/**
 * The frame's breakdown rows under the prose (`2274:4009`) — a fixed 180px
 * term column at desktop, stacking below `lg`.
 */
export const WithDetails: Story = {
  args: {
    number: '01',
    kicker: 'Opportunity',
    title: 'Translating a cafe experience into a digital one',
    children: body,
    details: [
      {
        label: 'Strategy',
        body: 'We have led La Colombe’s online strategy since 2014 — new product launches, and a growing online customer base.',
      },
      {
        label: 'Design',
        body: 'A multi-channel digital commerce experience, designed and built to bring La Colombe into many more American homes.',
      },
      {
        label: 'Research',
        body: 'Continuous user research, and new concepts that extend the digital platform.',
      },
    ],
  },
}

/**
 * Numbering derives from a chapter's order among the chapter members of
 * `caseStudy.story`, so a later chapter differs only in its numeral
 * (CONTEXT.md, ADR 0018).
 */
export const LaterChapter: Story = {
  args: {
    number: '03',
    kicker: 'Outcome',
    title: 'A storefront that finally sounds like the cafe',
    children: body,
  },
}

/** A chapter with no kicker keeps its number; the title carries the band. */
export const NumberOnly: Story = {
  args: {
    number: '02',
    title: 'Rebuilding the path from shelf to cart',
    children: body,
  },
}
