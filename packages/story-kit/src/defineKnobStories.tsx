import type { ComponentType } from 'react'
import type { BlockKnobs, BlockTier } from '@o3/block-spec'
import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { applyKnobArgs, knobControls, matrixAxes, matrixCells, type KnobArgType } from './knobArgs'
import { toProps } from './types'

/**
 * A block's Storybook stories, derived from its knobs (ADR 0020, #106).
 *
 * The block declares its design options once, in
 * `packages/sanity/src/knobs/<blockName>.ts`; the Sanity field, the canvas
 * toolbar and these stories are all generated from that one object. So a knob
 * appears in Storybook because it exists, not because someone remembered to
 * add it here — and a knob the form gates cannot be set from a control the
 * form would have hidden.
 *
 * What this factory does NOT generate is the block's content edge cases — one
 * headline line, no subheading, an empty array. Those are facts about the
 * fixture rather than about the knobs, so they stay hand-written beside the
 * generated pair, which is also what keeps them readable.
 */

// Loose CSF story shape: these are framework-generic data, re-exported by the
// consuming .stories.tsx under its own typed Meta.
type AnyStory = StoryObj<Record<string, unknown>>

export interface DefineKnobStoriesOptions<T extends object> {
  /** The block's knob declaration — `heroSectionKnobs` from `@o3/sanity/knobs`. */
  spec: BlockKnobs
  component: ComponentType<Omit<T, '_type' | '_key' | 'scheduling'>>
  /**
   * One document state to render. Typed as the component's props, so a schema
   * change that alters the block's shape breaks the story file at compile
   * time — the same guarantee the hand-written args gave.
   */
  fixture: T
  /**
   * The block sits inside another block's array rather than forming its own
   * band, so its band knobs belong to the host. Passed through to
   * `visibleKnobs`.
   */
  nested?: boolean
  /** Knob paths to grid. Defaults to the first two knobs that offer a choice. */
  matrix?: { rows?: string; cols?: string }
  /** Overrides the title derived from the spec's tier and type. */
  title?: string
  parameters?: Record<string, unknown>
  /** Storybook globals for every story here — e.g. pinning the backgrounds surface. */
  globals?: Record<string, unknown>
}

export interface KnobStories {
  meta: Meta
  /** Every knob as a control, gated the way the form gates it. */
  Playground: AnyStory
  /** The two default axes gridded against each other. */
  Matrix: AnyStory
  /** The derived controls, for a story file that wants to add its own args. */
  argTypes: Record<string, KnobArgType>
}

const TIER_TITLES: Record<BlockTier, string> = {
  section: 'Content/Blocks/Section',
  base: 'Content/Blocks/Base',
}

/**
 * The story-group title, from the spec rather than from the file's path.
 *
 * The path-derived version this replaces had to re-derive the schema name from
 * a directory name and could only work for files under `apps/web/src/content`.
 * The spec already carries both facts the title needs — which tier the block
 * registers in, and its `_type` — so the title comes from the same declaration
 * everything else does.
 */
export function titleForSpec(spec: BlockKnobs): string {
  const pascal = spec.type.charAt(0).toUpperCase() + spec.type.slice(1)
  return `${TIER_TITLES[spec.tier]}/${pascal}`
}

/** Thin label strip above each Matrix cell, naming the axis values it renders. */
function CellLabel({ text }: { text: string }) {
  return <div className="bg-bone text-fg-muted px-4 py-1 font-mono text-xs">{text}</div>
}

export function defineKnobStories<T extends object>(
  opts: DefineKnobStoriesOptions<T>,
): KnobStories {
  const { spec, fixture, nested = false } = opts

  // The component's concrete props vary per block (optional `loc`, block-shaped
  // extras); render through one controlled widening rather than `any`
  // throughout. The typed edge is `opts.component`, which the caller's fixture
  // has to satisfy.
  const Component = opts.component as ComponentType<Record<string, unknown>>
  const render = (data: T) => <Component {...(toProps(data) as Record<string, unknown>)} />

  const { knobs, argTypes, args, idToPath } = knobControls({ spec, fixture, nested })

  const meta: Meta = {
    title: opts.title ?? titleForSpec(spec),
    component: Component,
    parameters: { layout: 'fullscreen', ...opts.parameters },
    ...(opts.globals ? { globals: opts.globals } : {}),
  }

  const Playground: AnyStory = {
    argTypes,
    args,
    render: (storyArgs: Record<string, unknown>) =>
      render(applyKnobArgs({ spec, fixture, args: storyArgs, idToPath, nested })),
  }

  const cells = matrixCells({
    spec,
    fixture,
    axes: matrixAxes({ knobs, matrix: opts.matrix }),
    nested,
  })

  const Matrix: AnyStory = {
    parameters: { controls: { disable: true } },
    // Stacked rather than side by side: a section block is full-bleed, and
    // half-width columns would grid the knobs at a width the block is never
    // drawn at. Each cell carries both axis values in its label, so the cross
    // product is still readable as one.
    render: () => (
      <div className="flex flex-col">
        {cells.map((cell) => (
          <div key={cell.key}>
            <CellLabel text={cell.label} />
            {render(cell.data)}
          </div>
        ))}
      </div>
    ),
  }

  return { meta, Playground, Matrix, argTypes }
}
