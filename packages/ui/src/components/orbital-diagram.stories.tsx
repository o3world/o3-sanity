import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { OrbitalDiagram } from './orbital-diagram'

const meta = {
  title: 'UI/OrbitalDiagram',
  component: OrbitalDiagram,
  parameters: { layout: 'fullscreen' },
  globals: { backgrounds: { value: 'ink' } },
  render: (args) => (
    <div className="bg-ink px-gutter py-16 text-white">
      <OrbitalDiagram {...args} />
    </div>
  ),
} satisfies Meta<typeof OrbitalDiagram>

export default meta
type Story = StoryObj<typeof meta>

/**
 * The Solutions centrepiece as `1928:6524` draws it — Strategy at the apex,
 * then AI, Engineering and Design around the base ring. The order of the array
 * is the order of the positions.
 */
export const FourDisciplines: Story = {
  args: {
    items: [
      {
        heading: 'Strategy',
        body: 'The root of every engagement. We find the real problem and the move worth making — before a line of code is written.',
      },
      {
        heading: 'AI',
        body: 'Applied where it compounds the work, not where it decorates it — our O3XO practice, embedded where it earns its keep.',
      },
      {
        heading: 'Engineering',
        body: 'Senior engineers who build it to last and to scale — the fix that ships, not a prototype to hand off.',
      },
      {
        heading: 'Design',
        body: 'Product-grade design that gives the move a form people actually want to use.',
      },
    ],
  },
}

/** Fewer than four leaves the net intact and the empty positions unlabelled. */
export const PartiallyFilled: Story = {
  args: {
    items: [{ heading: 'Strategy', body: 'The root of every engagement.' }, { heading: 'AI' }],
  },
}
