import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, within } from 'storybook/test'
import { figmaDesign } from '@o3/story-kit'

import { seededSectionArgs } from '@o3/content-ui/testing/seed'

import { NextCaseBand } from './NextCaseBand'

/**
 * The band that closes a case study (`1710:2609`, mobile `1906:1039`).
 *
 * The pair of stories is the point: the two widths differ in **kind**, not in
 * degree. At 1440 the neighbour is a whole Case Study Card — logo, eyebrow,
 * narrative line, stat and CTA on the photograph (`2250:1564`). At 402 the
 * same photograph is bare, and the only thing over it is nothing.
 *
 * The neighbour is a real seeded case study, dereferenced from the committed
 * translations: `CASE_STUDY_QUERY`'s `next` is the card projection, so what
 * the Home showcase hands its cards is exactly what this band receives.
 */
const meta = {
  title: 'Content/Documents/CaseStudy/NextCaseBand',
  component: NextCaseBand,
  parameters: {
    layout: 'fullscreen',
    design: figmaDesign('1710:2609'),
  },
} satisfies Meta<typeof NextCaseBand>

export default meta
type Story = StoryObj<typeof meta>

const [firstCase] = seededSectionArgs('index', 'caseShowcaseSection').caseStudies ?? []

/** Structural-width card under a 634px heading row pinned flush right. */
export const Desktop: Story = {
  args: { next: firstCase! },
  globals: { viewport: { value: 'desktop' } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // THE CHIP GOES WHERE THE CARD GOES. It reads as a control, so a click on
    // it cannot be inert — but the card below is already an anchor to the same
    // href, so the chip is hidden from the keyboard and from assistive
    // technology and the band stays at one tab stop and one announcement.
    const card = canvas.getByRole('link')
    const chip = canvasElement.querySelector('a[aria-hidden="true"]')
    await expect(chip).not.toBeNull()
    await expect(chip).toHaveAttribute('tabindex', '-1')
    await expect(chip?.getAttribute('href')).toBe(card.getAttribute('href'))
    const title = canvas.getByText(firstCase!.title!)
    await expect(title.parentElement!.getBoundingClientRect().width).toBe(576)
    await expect(getComputedStyle(title).fontWeight).toBe('400')
    await expect(getComputedStyle(chip!).borderRadius).toBe('0px')
  },
}

/**
 * `1906:1039` — the heading stacks flush left, the arrow chip is absent, and
 * the media is a 362 square of open photograph. Nothing of the card survives
 * here; the whole square is the tap target.
 */
export const Mobile: Story = {
  args: { next: firstCase! },
  globals: { viewport: { value: 'mobile' } },
  parameters: { design: figmaDesign('1906:1039') },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const title = canvas.getByText(firstCase!.title!)
    await expect(getComputedStyle(title).fontSize).toBe('36px')
    await expect(getComputedStyle(title).fontWeight).toBe('400')
    await expect(canvas.getByRole('link')).toHaveAccessibleName(
      ['Next project', firstCase!.client?.name].filter(Boolean).join(' — ') +
        ': ' +
        firstCase!.title,
    )
  },
}
