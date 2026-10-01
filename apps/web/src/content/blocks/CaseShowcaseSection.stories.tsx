import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { figmaDesign } from '@o3/story-kit'
import { expect, waitFor, within } from 'storybook/test'

import { CaseShowcaseSection } from '@o3/content-ui'
import { seededSectionArgs } from '@o3/content-ui/testing/seed'

import { SECTION_CLIENT_COMPONENTS } from './clientComponents'

/** Home showcase with the existing sticky card motion. */
const meta = {
  title: 'Content/Blocks/Section/CaseShowcaseSection',
  component: CaseShowcaseSection,
  parameters: {
    layout: 'fullscreen',
    design: figmaDesign('3720:60492'),
  },
} satisfies Meta<typeof CaseShowcaseSection>

export default meta
type Story = StoryObj<typeof meta>

/** Three real case studies, dereferenced from the committed translations. */
export const AsSeeded: Story = {
  args: {
    ...seededSectionArgs('index', 'caseShowcaseSection'),
    eyebrow: 'Our work',
    body: 'A selection of recent work.',
  },
  render: (args) => <SECTION_CLIENT_COMPONENTS.caseShowcaseSection {...args} />,
  globals: { viewport: { value: 'desktop' } },
  play: async ({ canvasElement }) => {
    const cards = within(canvasElement)
      .getAllByRole('link')
      .filter((link) => link.getAttribute('href')?.startsWith('/work/'))
    await expect(cards.length).toBeGreaterThan(1)
    for (const card of cards) {
      await expect(getComputedStyle(card.parentElement!).position).toBe('sticky')
      await expect(getComputedStyle(card).clipPath).toBe('none')
      await expect(getComputedStyle(card).boxShadow).not.toBe('none')
      await expect(getComputedStyle(card.querySelector('h3')!).maxWidth).toBe('472px')
      // The card's name is its client and headline, not every line of copy on it.
      const mark = card.querySelector(':scope > span')!
      const client = mark.querySelector('img')?.alt ?? mark.textContent
      await expect(card).toHaveAccessibleName(`${client} ${card.querySelector('h3')!.textContent}`)
    }
    await expect(canvasElement.querySelector('.work-organic-card')).toBeNull()
    await expect(canvasElement.querySelector('canvas')).toBeNull()
    const heading = within(canvasElement).getByRole('heading', { level: 2 })
    await expect(heading.getBoundingClientRect().width).toBe(821)
    const section = heading.closest('section')!
    await expect(getComputedStyle(section).paddingTop).toBe('128px')
    await expect(getComputedStyle(section).backgroundColor).toBe('rgb(247, 247, 246)')
    await expect(within(canvasElement).getByText('Our work')).toBeVisible()
    await expect(getComputedStyle(within(canvasElement).getByText('Our work')).color).toBe(
      'rgb(201, 14, 0)',
    )
    const stack = cards[0]!.parentElement!.parentElement!
    await expect(getComputedStyle(stack).gap).toBe('48px')
    for (const card of cards) {
      await expect(card.getBoundingClientRect().width).toBe(stack.getBoundingClientRect().width)
      // Figma I3720:60502;3629:35573: the card container's `spacing-xl` padding.
      await expect(getComputedStyle(card).padding).toBe('64px')
    }
    await expect(within(canvasElement).getByText('A selection of recent work.')).toBeVisible()
  },
}

/** Short desktop windows must allow the full card to scroll into view. */
export const ShortViewport: Story = {
  ...AsSeeded,
  globals: { viewport: { value: 'shortDesktop' } },
  parameters: {
    viewport: {
      options: {
        shortDesktop: { name: 'Short desktop', styles: { width: '1440px', height: '550px' } },
      },
    },
  },
  play: async ({ canvasElement }) => {
    const win = canvasElement.ownerDocument.defaultView!
    const card = canvasElement.querySelector<HTMLAnchorElement>('a[data-surface="ink"]')!
    const cta = within(card).getByText('View the work')
    await waitFor(() => expect(getComputedStyle(card.parentElement!).position).toBe('static'))
    try {
      cta.scrollIntoView({ block: 'center' })
      await waitFor(() => {
        const rect = cta.getBoundingClientRect()
        expect(rect.top).toBeGreaterThanOrEqual(0)
        expect(rect.bottom).toBeLessThanOrEqual(win.innerHeight)
        expect(
          card.contains(
            canvasElement.ownerDocument.elementFromPoint(
              rect.left + rect.width / 2,
              rect.top + rect.height / 2,
            ),
          ),
        ).toBe(true)
      })
    } finally {
      win.scrollTo(0, 0)
    }
  },
}

/**
 * Full-column cards with 48px gaps (1814:1618). The mobile card instances in
 * that frame are desktop-width and overflow, so the 24px side padding is the
 * site's own value, not one read from Figma.
 */
export const Mobile: Story = {
  args: seededSectionArgs('index', 'caseShowcaseSection'),
  render: AsSeeded.render,
  globals: { viewport: { value: 'mobile' } },
  play: async ({ canvasElement }) => {
    const card = canvasElement.querySelector('a[data-surface="ink"]')!
    await expect(getComputedStyle(card).paddingLeft).toBe('24px')
    const stack = card.parentElement!.parentElement!
    await expect(getComputedStyle(stack).gap).toBe('48px')
    await expect(card.getBoundingClientRect().width).toBe(stack.getBoundingClientRect().width)
    const stat = card.querySelector('p > span')!
    await expect(getComputedStyle(stat).fontSize).toBe('32px')
    await expect(parseFloat(getComputedStyle(stat).lineHeight)).toBeCloseTo(38.4, 1)
    await expect(getComputedStyle(stat.parentElement!).gap).toBe('16px')
    await expect(document.documentElement.scrollWidth).toBe(document.documentElement.clientWidth)
  },
}

/** The section CTA keeps its single-line label at the annotated 1026px width. */
export const IntermediateViewport: Story = {
  ...AsSeeded,
  globals: { viewport: { value: 'intermediate' } },
  parameters: {
    viewport: {
      options: {
        intermediate: {
          name: 'Intermediate desktop',
          styles: { width: '1026px', height: '1000px' },
        },
      },
    },
  },
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('link', { name: 'View our work' })
    const style = getComputedStyle(button)
    const labelHeight =
      button.getBoundingClientRect().height -
      parseFloat(style.paddingTop) -
      parseFloat(style.paddingBottom)
    await expect(labelHeight).toBeCloseTo(parseFloat(style.lineHeight), 1)
    await expect(document.documentElement.scrollWidth).toBe(document.documentElement.clientWidth)
  },
}

/**
 * The heading row is `space-between` aligned to **flex-end**, so the 48px
 * headline and the Size=Large button share a baseline. With no button the
 * headline should not recentre itself.
 */
export const NoButton: Story = {
  args: { ...seededSectionArgs('index', 'caseShowcaseSection'), button: null },
}

/** One card — the band still has to hold its 64px top and bottom. */
export const SingleCase: Story = {
  args: {
    ...seededSectionArgs('index', 'caseShowcaseSection'),
    caseStudies: (seededSectionArgs('index', 'caseShowcaseSection').caseStudies ?? []).slice(0, 1),
  },
}
