import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Button } from './button'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from './sheet'
import { MenuIcon } from '../menu-icon'

const meta = {
  title: 'UI/Sheet',
  component: Sheet,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Sheet>

export default meta
type Story = StoryObj<typeof meta>

/** The NavBar's five, as `1710:2271` reads them. */
const LINKS = [
  { label: 'Work', href: '/work' },
  { label: 'Live', href: '/live' },
  { label: 'Insights', href: '/insights' },
  { label: 'Solutions', href: '/solutions' },
  { label: 'About', href: '/about' },
]

/**
 * The 402 nav's menu panel, which has **no Figma frame** — `1814:1636` draws
 * only the closed affordance (ADR 0006). The panel below therefore invents no
 * new visual language: it reuses the bar's `ink-deep` surface and the same
 * `text-button` link treatment the pill uses at 1440.
 */
export const MobileNavMenu: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger aria-label="Open menu" className="text-on-ink bg-ink-deep p-2">
        <MenuIcon />
      </SheetTrigger>
      <SheetContent side="right" className="bg-ink-deep text-white">
        <SheetTitle className="sr-only">Menu</SheetTitle>
        <nav className="flex flex-col gap-6 px-6 pt-20">
          {LINKS.map(({ label, href }) => (
            <a key={label} href={href} className="text-button">
              {label}
            </a>
          ))}
          <Button variant="light" arrow className="mt-4 self-start">
            Let’s talk
          </Button>
        </nav>
      </SheetContent>
    </Sheet>
  ),
}

/** The untranslated default surface, for anything that isn't the nav. */
export const LightPanel: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button>Open</Button>
      </SheetTrigger>
      <SheetContent side="right">
        <SheetTitle className="px-6 pt-6">Panel</SheetTitle>
        <p className="text-fg-muted px-6">
          `SheetContent` defaults to the light band; callers pass a surface.
        </p>
      </SheetContent>
    </Sheet>
  ),
}
