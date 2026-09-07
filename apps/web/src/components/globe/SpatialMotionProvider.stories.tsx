import { StrictMode, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { MobileNavMenu } from '@o3/content-ui/chrome'
import {
  SpatialMotionControl,
  SpatialMotionProvider,
  useSpatialMotion,
} from './SpatialMotionProvider'
import type { SpatialMotionRoot } from './spatial-motion'

class MotionPreference extends EventTarget {
  matches = false
  subscriptions = 0

  override addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject | null,
    options?: boolean | AddEventListenerOptions,
  ) {
    if (type === 'change') this.subscriptions++
    super.addEventListener(type, listener, options)
  }

  change(matches: boolean) {
    this.matches = matches
    this.dispatchEvent(new Event('change'))
  }
}

let preference: MotionPreference

function Placement({ generation }: { generation: number }) {
  const motion = useSpatialMotion()
  return (
    <section className="hero-band" aria-label="Animated placement">
      <div data-generation={generation} data-motion={!!motion} className="h-12 w-12" />
    </section>
  )
}

function ProviderLifecycle() {
  const [generation, setGeneration] = useState(0)
  const [shown, setShown] = useState(true)
  return (
    <StrictMode>
      <SpatialMotionProvider>
        <header>
          <MobileNavMenu items={[]} utilities={<SpatialMotionControl />} />
        </header>
        <main>
          <button type="button" onClick={() => setGeneration((value) => value + 1)}>
            Replace placement
          </button>
          <button type="button" onClick={() => setShown((value) => !value)}>
            Toggle placement
          </button>
          {shown && <Placement key={generation} generation={generation} />}
        </main>
        <footer>
          <SpatialMotionControl />
        </footer>
      </SpatialMotionProvider>
    </StrictMode>
  )
}

const meta = {
  title: 'Motion/SpatialMotionProvider',
  component: ProviderLifecycle,
  parameters: { layout: 'fullscreen', nextjs: { appDirectory: true } },
  beforeEach: () => {
    const nativeMatchMedia = window.matchMedia
    const originalUrl = location.href
    preference = new MotionPreference()
    window.matchMedia = (query) =>
      query === '(prefers-reduced-motion: reduce)'
        ? (preference as unknown as MediaQueryList)
        : nativeMatchMedia.call(window, query)
    return () => {
      window.matchMedia = nativeMatchMedia
      history.replaceState(history.state, '', originalUrl)
    }
  },
} satisfies Meta<typeof ProviderLifecycle>

export default meta
type Story = StoryObj<typeof meta>

export const PreferencesSurvivePlacementChanges: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const footer = canvas.getByRole('button', { name: 'Reduce motion' })
    await waitFor(() => expect(footer).toBeEnabled())
    await expect(footer).toHaveAttribute('aria-pressed', 'false')
    footer.focus()
    await userEvent.keyboard(' ')
    await expect(footer).toHaveFocus()
    await expect(footer).toHaveAttribute('aria-pressed', 'true')
    const subscriptions = preference.subscriptions
    const root = document.documentElement as SpatialMotionRoot
    const clock = root.__o3SpatialMotion
    const pausedTime = clock!.now(performance.now())

    // A second control mounts with the real drawer and shares the existing choice.
    await userEvent.click(canvas.getByRole('button', { name: 'Open menu' }))
    const menu = await within(document.body).findByRole('dialog', { name: 'Menu' })
    const menuSetting = within(menu).getByRole('button', { name: 'Reduce motion' })
    await expect(menuSetting).toHaveAttribute('aria-pressed', 'true')
    await expect(clock!.now(performance.now())).toBe(pausedTime)
    menuSetting.focus()
    await userEvent.keyboard('{Enter}')
    await expect(menuSetting).toHaveAttribute('aria-pressed', 'false')
    await expect(footer).toHaveAttribute('aria-pressed', 'false')
    await expect(root).not.toHaveAttribute('data-spatial-paused')
    await waitFor(() => expect(clock!.now(performance.now())).toBeGreaterThan(pausedTime))
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(within(document.body).queryByRole('dialog')).toBeNull())
    await userEvent.click(footer)
    const frozenTime = clock!.now(performance.now())

    for (let generation = 1; generation <= 4; generation++) {
      await userEvent.click(canvas.getByRole('button', { name: 'Replace placement' }))
      await waitFor(() => {
        expect(canvasElement.querySelector(`[data-generation="${generation}"]`)).not.toBeNull()
        expect(footer).toHaveAttribute('aria-pressed', 'true')
      })
      // Placement churn must not tear down and republish environmental preferences.
      await expect(preference.subscriptions).toBe(subscriptions)
      await expect(root.__o3SpatialMotion).toBe(clock)
      await expect(clock!.now(performance.now())).toBe(frozenTime)
      await expect(root).toHaveAttribute('data-spatial-paused', 'true')
    }

    await userEvent.click(canvas.getByRole('button', { name: 'Toggle placement' }))
    await expect(canvas.queryByRole('region', { name: 'Animated placement' })).toBeNull()
    await expect(footer).toBeVisible()
    await expect(footer).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(canvas.getByRole('button', { name: 'Toggle placement' }))
    await expect(preference.subscriptions).toBe(subscriptions)
    await userEvent.click(footer)
    await expect(footer).toHaveAttribute('aria-pressed', 'false')

    preference.change(true)
    await waitFor(() => expect(footer).toBeDisabled())
    await expect(footer).toHaveAttribute('aria-pressed', 'true')
    preference.change(false)
    await waitFor(() => expect(footer).toBeEnabled())
    await expect(footer).toHaveAttribute('aria-pressed', 'false')

    const originalUrl = location.href
    const stillUrl = new URL(originalUrl)
    stillUrl.searchParams.set('spatial-still', '')
    history.replaceState(history.state, '', stillUrl)
    window.dispatchEvent(new PopStateEvent('popstate'))
    await waitFor(() => expect(footer).toBeDisabled())
    await expect(footer).toHaveAttribute('aria-pressed', 'true')
    await expect(root).toHaveAttribute('data-spatial-still')
    history.replaceState(history.state, '', originalUrl)
    window.dispatchEvent(new PopStateEvent('popstate'))
    await waitFor(() => expect(footer).toBeEnabled())
    await expect(footer).toHaveAttribute('aria-pressed', 'false')
    await expect(root).not.toHaveAttribute('data-spatial-still')
    await expect(root).not.toHaveAttribute('data-spatial-paused')
    await expect(preference.subscriptions).toBe(subscriptions)
  },
}
