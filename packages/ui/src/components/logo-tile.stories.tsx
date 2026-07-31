import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { LogoTile } from './logo-tile'

/** Offline-safe stand-in for a client logo (real usage passes src or an <img>). */
function PlaceholderLogo({ label, width = 180 }: { label: string; width?: number }) {
  return (
    <svg width={width} height={48} viewBox={`0 0 ${width} 48`} role="img" aria-label={label}>
      <rect width={width} height={48} rx={6} fill="#DDDDDB" />
      <text
        x={width / 2}
        y={30}
        textAnchor="middle"
        fontFamily="inherit"
        fontSize={16}
        fontWeight={600}
        fill="#6E6E6E"
      >
        {label}
      </text>
    </svg>
  )
}

const meta = {
  title: 'UI/LogoTile',
  component: LogoTile,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof LogoTile>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  globals: { backgrounds: { value: 'bone' } },
  render: () => (
    <LogoTile>
      <PlaceholderLogo label="AmeriGas" />
    </LogoTile>
  ),
}

/** The homepage logo wall: auto-fit grid of tiles on the bone band. */
export const LogoWall: Story = {
  globals: { backgrounds: { value: 'bone' } },
  render: () => (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] items-center gap-x-6 gap-y-8">
      {['AmeriGas', 'Aramark', 'Caron', 'CHOP', 'Ironman', 'La Colombe'].map((name) => (
        <LogoTile key={name}>
          <PlaceholderLogo label={name} />
        </LogoTile>
      ))}
    </div>
  ),
}
