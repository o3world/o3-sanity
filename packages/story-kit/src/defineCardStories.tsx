import type { ComponentType } from 'react'
import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { assertStoryName, resolveStoryTitle } from './factoryHelpers'
import type { NamedFixture } from './types'
import { VariantLabel } from './VariantLabel'

// Loose CSF story shape: stories here are framework-generic data; the
// consuming .stories.tsx re-exports them under its own typed Meta.
type AnyStory = StoryObj<Record<string, unknown>>

export interface CardVariantLike {
  readonly value: string
  readonly title: string
  readonly story?: string
}

export interface CardKnobLike {
  readonly key: string
  readonly title: string
  readonly kind: 'boolean' | 'enum'
  readonly options?: ReadonlyArray<{ readonly title: string; readonly value: string }>
  readonly default: string | boolean
  readonly variants?: readonly string[]
}

/**
 * Structural mirror of the schema package's CardFamilyDefinition — story-kit
 * must not depend on @o3/sanity (workspace cycle), so the stories file
 * imports the real family and passes it in (same injection pattern as
 * CatalogLike in defineBlockStories).
 */
export interface CardFamilyLike {
  readonly name: string
  readonly variants: readonly CardVariantLike[]
  readonly defaultVariant: string
  readonly knobs: readonly CardKnobLike[]
}

/** The loose style shape handed to buildArgs — families narrow it themselves. */
export type CardStyleArgs = { variant: string } & Record<string, unknown>

export interface DefineCardStoriesOptions<T extends object, P extends object> {
  component: ComponentType<P>
  family: CardFamilyLike
  /** Hand-authored fixtures; the FIRST one is the canonical render subject. */
  fixtures: readonly NamedFixture<T>[]
  /** Family-specific prop shaping (e.g. a card family nests {card, style}). */
  buildArgs: (card: T, style: CardStyleArgs) => P
  /** variant story export name → fixture name, when a variant needs a specific fixture. */
  fixtureForVariant?: Readonly<Record<string, string>>
  from?: string
  title?: string
  parameters?: Record<string, unknown>
}

export interface CardStories {
  meta: Meta
  Playground: AnyStory
  Variants: AnyStory
  /** Keyed by the family's variant `story` export names — re-export each verbatim. */
  variants: Record<string, AnyStory>
}

/** A knob applies to a variant iff it has no variants list or the list names it. */
function knobApplies(knob: CardKnobLike, variantValue: string): boolean {
  return !knob.variants || knob.variants.includes(variantValue)
}

function styleFor(family: CardFamilyLike, variantValue: string): CardStyleArgs {
  const style: CardStyleArgs = { variant: variantValue }
  for (const knob of family.knobs) {
    if (knobApplies(knob, variantValue)) style[knob.key] = knob.default
  }
  return style
}

export function defineCardStories<T extends object, P extends object>(
  opts: DefineCardStoriesOptions<T, P>,
): CardStories {
  const title = resolveStoryTitle('defineCardStories', opts)

  // The component's concrete props vary per card family; render with a single
  // controlled widening instead of `any` throughout (mirrors defineBlockStories).
  const Component = opts.component as ComponentType<Record<string, unknown>>

  if (opts.fixtures.length === 0) {
    throw new Error(`defineCardStories(${opts.family.name}): at least one fixture is required`)
  }
  const fixtureByName = new Map<string, NamedFixture<T>>()
  for (const fixture of opts.fixtures) {
    if (fixtureByName.has(fixture.name)) {
      throw new Error(`defineCardStories(${opts.family.name}): duplicate fixture "${fixture.name}"`)
    }
    fixtureByName.set(fixture.name, fixture)
  }

  const contractVariants = opts.family.variants.filter(
    (v): v is CardVariantLike & { story: string } => typeof v.story === 'string',
  )
  const storyNames = new Set<string>()
  for (const variant of contractVariants) {
    assertStoryName(variant.story, `defineCardStories(${opts.family.name})`)
    if (storyNames.has(variant.story)) {
      throw new Error(
        `defineCardStories(${opts.family.name}): duplicate variant story "${variant.story}"`,
      )
    }
    storyNames.add(variant.story)
  }
  for (const [storyName, fixtureName] of Object.entries(opts.fixtureForVariant ?? {})) {
    if (!storyNames.has(storyName)) {
      throw new Error(
        `defineCardStories(${opts.family.name}): fixtureForVariant names unknown variant story "${storyName}"`,
      )
    }
    if (!fixtureByName.has(fixtureName)) {
      throw new Error(
        `defineCardStories(${opts.family.name}): fixtureForVariant["${storyName}"] names unknown fixture "${fixtureName}"`,
      )
    }
  }

  // Non-null: length checked above.
  const canonicalFixture = opts.fixtures[0]!

  const meta: Meta = {
    title,
    component: Component,
    parameters: { layout: 'padded', ...opts.parameters },
  }

  const variants: Record<string, AnyStory> = Object.fromEntries(
    contractVariants.map((variant) => {
      const fixtureName = opts.fixtureForVariant?.[variant.story]
      // Non-null: fixtureForVariant entries validated against fixtureByName above.
      const fixture = fixtureName ? fixtureByName.get(fixtureName)! : canonicalFixture
      return [
        variant.story,
        {
          args: opts.buildArgs(fixture.data, styleFor(opts.family, variant.value)) as Record<
            string,
            unknown
          >,
        } satisfies AnyStory,
      ]
    }),
  )

  const knobArgTypes = Object.fromEntries(
    opts.family.knobs.map((knob) => [
      knob.key,
      knob.kind === 'boolean'
        ? { control: 'boolean' as const, name: knob.title }
        : {
            control: 'select' as const,
            name: knob.title,
            options: (knob.options ?? []).map((o) => o.value),
          },
    ]),
  )

  const Playground: AnyStory = {
    args: {
      fixture: canonicalFixture.name,
      variant: opts.family.defaultVariant,
      ...Object.fromEntries(
        opts.family.knobs
          .filter((knob) => knobApplies(knob, opts.family.defaultVariant))
          .map((knob) => [knob.key, knob.default]),
      ),
    },
    argTypes: {
      fixture: { control: 'select', options: opts.fixtures.map((f) => f.name) },
      variant: { control: 'select', options: opts.family.variants.map((v) => v.value) },
      ...knobArgTypes,
    },
    render: (args: Record<string, unknown>) => {
      const { fixture: fixtureName, variant, ...knobArgs } = args
      const fixture = fixtureByName.get(String(fixtureName)) ?? canonicalFixture
      const variantValue = typeof variant === 'string' ? variant : opts.family.defaultVariant
      const style: CardStyleArgs = { variant: variantValue }
      for (const knob of opts.family.knobs) {
        if (knobApplies(knob, variantValue) && knob.key in knobArgs) {
          style[knob.key] = knobArgs[knob.key]
        }
      }
      return <Component {...(opts.buildArgs(fixture.data, style) as Record<string, unknown>)} />
    },
  }

  const Variants: AnyStory = {
    parameters: { controls: { disable: true } },
    render: () => (
      <div className="flex flex-col gap-8">
        {contractVariants.map((variant) => {
          const fixtureName = opts.fixtureForVariant?.[variant.story]
          // Non-null: validated against fixtureByName above.
          const fixture = fixtureName ? fixtureByName.get(fixtureName)! : canonicalFixture
          return (
            <div key={variant.story}>
              <VariantLabel
                fixture={{ name: `${variant.story} · ${fixture.name}`, data: fixture.data }}
              />
              <Component
                {...(opts.buildArgs(fixture.data, styleFor(opts.family, variant.value)) as Record<
                  string,
                  unknown
                >)}
              />
            </div>
          )
        })}
      </div>
    ),
  }

  return { meta, Playground, Variants, variants }
}
