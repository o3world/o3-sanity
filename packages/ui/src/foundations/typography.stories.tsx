import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { figmaDesign } from '@o3/story-kit'
import { expect } from 'storybook/test'

import { Mono, Page, Section } from './spec-ui'

const meta = {
  title: 'Foundations/Typography',
  parameters: { layout: 'fullscreen', design: figmaDesign('3720:60473') },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

/** These specimens consume the same responsive utilities as the site. */
const specimens = [
  ['Home hero', 'font-display text-hero-xl', 'Ideas made real.'],
  ['Hero', 'font-display text-hero', 'Strategy, design, engineering, and AI.'],
  ['Interior hero', 'font-display text-interior-hero', 'The model is the story.'],
  ['Detail hero', 'font-display text-detail-hero', 'The problems behind the problems.'],
  ['CTA', 'font-display text-cta', 'Tell us about you.'],
  ['Quote', 'font-sans text-quote', 'The best partnerships do not have an end date.'],
  ['Small quote', 'font-sans text-quote-sm', 'Senior people, on your problem.'],
  ['Display XL', 'font-display text-display-xl', 'A new perspective.'],
  ['Display large', 'font-display text-display-lg', 'Built around your team.'],
  ['Display medium', 'font-display text-display-md', 'What comes next.'],
  ['Display small', 'font-sans text-display-sm', 'Structured content and real-time editing.'],
  ['Body heading', 'font-display text-body-heading', 'From the first conversation.'],
  ['Lead', 'font-sans text-lead', 'We love a new challenge.'],
  ['Body', 'font-sans text-body', 'Strategy, design, engineering, and AI under one roof.'],
  ['Button', 'font-sans text-button', 'View our work'],
  ['Eyebrow', 'font-sans eyebrow', 'Our partners'],
  ['Large eyebrow', 'font-sans eyebrow-lg', 'About O3'],
  ['Navigation', 'font-sans text-nav', 'Company'],
  ['Metadata', 'font-sans text-meta', '3 mins'],
  ['Legal', 'font-sans text-legal', '© 2026 O3 World, LLC. All rights reserved.'],
] as const

export const Scale: Story = {
  globals: { viewport: { value: 'desktop' } },
  render: () => (
    <Page
      title="Typography"
      intro="Newsreader for display text; Figtree for body copy and controls. Resize the viewport to inspect the live responsive tokens."
    >
      <Section
        title="Current type roles"
        note="Each specimen uses the site's font and type utilities; no frozen measurements override them."
      >
        {specimens.map(([name, className, sample]) => (
          <div key={name} className="border-line flex min-w-0 flex-col gap-4 border-b pb-8">
            <div className="flex flex-wrap items-baseline gap-4">
              <h4 className="text-body font-sans">{name}</h4>
              <Mono>{className}</Mono>
            </div>
            <p data-type-role={name} className={className}>
              {sample}
            </p>
          </div>
        ))}
      </Section>
    </Page>
  ),
  play: async ({ canvasElement }) => {
    await document.fonts.ready
    const hero = canvasElement.querySelector('[data-type-role="Home hero"]')!
    const body = canvasElement.querySelector('[data-type-role="Body"]')!
    await expect(getComputedStyle(hero).fontFamily).toContain('Newsreader')
    await expect(getComputedStyle(hero).fontSize).toBe('72px')
    await expect(getComputedStyle(body).fontFamily).toContain('Figtree')
    for (const role of ['Quote', 'Small quote']) {
      const quote = canvasElement.querySelector(`[data-type-role="${role}"]`)!
      await expect(getComputedStyle(quote).fontFamily).toContain('Figtree')
    }
  },
}

export const Mobile: Story = {
  ...Scale,
  globals: { viewport: { value: 'mobile' } },
  parameters: { design: figmaDesign('1814:1618') },
  play: async ({ canvasElement }) => {
    const hero = canvasElement.querySelector('[data-type-role="Home hero"]')!
    await expect(getComputedStyle(hero).fontFamily).toContain('Newsreader')
    await expect(getComputedStyle(hero).fontSize).toBe('42px')
    await expect(document.documentElement.scrollWidth).toBe(document.documentElement.clientWidth)
  },
}
