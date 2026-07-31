import type { ComponentType } from 'react'
import type { Meta, StoryObj } from '@storybook/nextjs-vite'

type AnyStory = StoryObj<Record<string, unknown>>

export interface DefineVariantStoriesOptions<P extends object> {
  component: ComponentType<P>
  title: string
  /** Flat prop name → allowed values; becomes native select controls. */
  knobs: Readonly<Record<string, readonly (string | number | boolean)[]>>
  defaultArgs: Partial<P>
  /** One or two knob names to grid in the Matrix story: [rows, cols?]. */
  matrix?: readonly string[]
  parameters?: Record<string, unknown>
}

export interface VariantStories {
  meta: Meta
  Playground: AnyStory
  Matrix: AnyStory
}

export function defineVariantStories<P extends object>(
  opts: DefineVariantStoriesOptions<P>,
): VariantStories {
  const Component = opts.component as ComponentType<Record<string, unknown>>

  const meta: Meta = {
    title: opts.title,
    component: Component,
    args: opts.defaultArgs as Record<string, unknown>,
    argTypes: Object.fromEntries(
      Object.entries(opts.knobs).map(([prop, options]) => [
        prop,
        { control: 'select', options: [...options] },
      ]),
    ),
    parameters: opts.parameters,
  }

  // Flat props: Storybook's native args/controls do the work — no render fn.
  const Playground: AnyStory = {}

  const [rowKnob, colKnob] = opts.matrix ?? Object.keys(opts.knobs).slice(0, 2)
  const rows = rowKnob ? (opts.knobs[rowKnob] ?? []) : []
  const cols = colKnob ? (opts.knobs[colKnob] ?? [undefined]) : [undefined]

  const Matrix: AnyStory = {
    parameters: { controls: { disable: true }, layout: 'padded' },
    render: () => (
      <div className="flex flex-col gap-4">
        {rows.map((rowValue) => (
          <div key={String(rowValue)} className="flex items-center gap-4">
            <span className="text-fg-muted w-32 shrink-0 font-mono text-xs">
              {String(rowValue)}
            </span>
            {cols.map((colValue) => (
              <Component
                key={`${String(rowValue)}-${String(colValue)}`}
                {...(opts.defaultArgs as Record<string, unknown>)}
                {...(rowKnob ? { [rowKnob]: rowValue } : {})}
                {...(colKnob && colValue !== undefined ? { [colKnob]: colValue } : {})}
              />
            ))}
          </div>
        ))}
      </div>
    ),
  }

  return { meta, Playground, Matrix }
}
