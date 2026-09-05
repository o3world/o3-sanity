import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { CaseChapter } from '@o3/ui'
import { figmaDesign } from '@o3/story-kit'
import { PortableTextBody } from '@o3/content-ui/portable-text'
import ironman from '../../../../../../tools/migration/data/translated/caseStudy/case-studies-ironman-digital-experience-drupal-acquia.json'

const chapter = ironman.story.find((member) => member._type === 'chapter')!
const body = chapter.body ?? []

const meta = {
  title: 'Case Study/IRONMAN chapter entry',
  component: CaseChapter,
  parameters: { layout: 'fullscreen', design: figmaDesign('2274:4004') },
  args: {
    number: '01',
    kicker: chapter.kicker,
    title: chapter.title,
    sequence: true,
    children: <PortableTextBody value={body} revealLead className="max-w-none" />,
    details: chapter.details,
  },
  decorators: [
    (Story) => (
      <div className="bg-white">
        <div className="px-gutter flex min-h-screen items-center">
          <p className="text-body">Scroll to the chapter. Reduced motion keeps it still.</p>
        </div>
        <Story />
        <div className="h-screen" />
      </div>
    ),
  ],
} satisfies Meta<typeof CaseChapter>
export default meta
type Story = StoryObj<typeof meta>

/** The accepted heading/lead cadence; details enter at their own boundary. */
export const Narrative: Story = {}
/** Same content and geometry with no motion enhancement. */
export const Still: Story = { args: { sequence: false } }
export const Mobile: Story = {
  globals: { viewport: { value: 'mobile' } },
  parameters: { design: figmaDesign('1906:878') },
}
