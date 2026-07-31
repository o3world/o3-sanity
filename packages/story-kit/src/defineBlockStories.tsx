import type { ComponentType } from 'react'
import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { applyKnobs, FIXTURE_VALUE, knobId, setAtPath } from './knobs'
import { assertStoryName, resolveStoryTitle } from './factoryHelpers'
import { liftStoryAssets } from './liftStoryAssets'
import {
  toProps,
  type AnyFixture,
  type ApplyPatchesFn,
  type BlockFixtureModule,
  type CatalogLike,
  type NamedFixture,
} from './types'
import { VariantLabel } from './VariantLabel'

export interface DefineBlockStoriesOptions<T extends object> {
  component: ComponentType<Omit<T, '_type' | '_key' | 'scheduling'>>
  /** Pass import.meta.url — the title derives from the content-tree path. */
  from?: string
  /** Explicit title (required when the file is outside apps/web/src/content). */
  title?: string
  /** A committed schema-meta snapshot module (hand-authored or generated). */
  generated?: BlockFixtureModule<T>
  /** Catalog entry (from the schema package). Placeholder/preset/variant tier. */
  catalog?: CatalogLike
  /** REQUIRED with `catalog`: pass the schema package's `applyPresetPatches`. */
  applyPatches?: ApplyPatchesFn
  /** Hand fixtures added to the Playground select but excluded from Variants. */
  edgeFixtures?: readonly NamedFixture<T>[]
  /** Dot-path → allowed values, surfaced as flattened select controls. */
  knobs?: Readonly<Record<string, readonly string[]>>
  /** Field the schema's variant value is stored on (default 'variant'). */
  variantField?: string
  parameters?: Record<string, unknown>
}

// Loose CSF story shape: stories here are framework-generic data; the
// consuming .stories.tsx re-exports them under its own typed Meta.
type AnyStory = StoryObj<Record<string, unknown>>

export interface BlockStories {
  meta: Meta
  Playground: AnyStory
  Variants: AnyStory
  /**
   * One story per declared variant, keyed by the contract story export name.
   * Story files re-export each: `export const ImageRight = kit.variants.ImageRight`.
   * Sourced from `catalog.variants` when a catalog is given, otherwise from
   * `generated.variantStories`. Rendered from the catalog placeholder fixture
   * when present, else the named generated 'placeholder' fixture, else the
   * first generated fixture — with `variantField` set to the variant value.
   */
  variants: Record<string, AnyStory>
  /** Present when a catalog was given: the lifted storyPlaceholder rendered plain. */
  Placeholder?: AnyStory
  /** One story per catalog preset, keyed by the preset's declared `story` export name. */
  presets: Record<string, AnyStory>
}

export function defineBlockStories<T extends object>(
  opts: DefineBlockStoriesOptions<T>,
): BlockStories {
  const title = resolveStoryTitle('defineBlockStories', opts)

  // The component's concrete props vary per block (optional extras like
  // `sanity` attrs); render with a single controlled widening instead of
  // `any` throughout.
  const Component = opts.component as ComponentType<Record<string, unknown>>

  const typeName = opts.generated?.type ?? opts.catalog?.type ?? 'unknown'
  if (!opts.generated && !opts.catalog) {
    throw new Error(
      `defineBlockStories(${typeName}): pass \`generated\` (a committed fixtures module) and/or \`catalog\` (from the schema package).`,
    )
  }
  if (opts.catalog && !opts.applyPatches) {
    throw new Error(
      `defineBlockStories(${typeName}): \`catalog\` requires \`applyPatches\` — pass the schema package's applyPresetPatches (story-kit cannot depend on @o3/sanity).`,
    )
  }
  const generatedFixtures = opts.generated?.fixtures ?? []
  const edgeFixtures = opts.edgeFixtures ?? []

  // Catalog placeholder joins the fixture pool (Playground select + variant base).
  const placeholderFixture: NamedFixture<T> | null = opts.catalog
    ? { name: 'placeholder', data: liftStoryAssets(opts.catalog.storyPlaceholder) as T }
    : null
  // When a catalog placeholder is present it is the authoritative 'placeholder'
  // (the typed source of truth). Drop a generated fixture of the same name so it
  // can't shadow the catalog one in the Playground select — matches how
  // variantBase already prefers the catalog placeholder.
  const generatedForPool = placeholderFixture
    ? generatedFixtures.filter((f) => f.name !== 'placeholder')
    : generatedFixtures
  const all: readonly AnyFixture<T>[] = [
    ...(placeholderFixture ? [placeholderFixture] : []),
    ...generatedForPool,
    ...edgeFixtures,
  ]
  if (all.length === 0) {
    throw new Error(
      `defineBlockStories(${typeName}): no fixtures available — pass \`generated\` and/or \`catalog\`.`,
    )
  }

  const variantField = opts.variantField ?? 'variant'
  // Catalog contract validation: preset story names are PascalCase, preset
  // variant pins reference a declared variant, and preset/variant story
  // names don't collide (both key into the same story-export namespace).
  if (opts.catalog) {
    const declaredVariants = new Set(opts.catalog.variants.map((v) => v.value))
    for (const p of opts.catalog.presets) {
      assertStoryName(p.story, `defineBlockStories(${typeName}) preset`)
      for (const patch of p.patches)
        if (
          patch.op === 'set' &&
          patch.path.length === 1 &&
          patch.path[0] === variantField &&
          !declaredVariants.has(String(patch.value))
        )
          throw new Error(
            `defineBlockStories(${typeName}): preset "${p.name}" pins undeclared variant "${String(patch.value)}" — declare it in the catalog's variants.`,
          )
    }
    const names = [
      ...opts.catalog.presets.map((p) => p.story),
      ...opts.catalog.variants.map((v) => v.story),
    ]
    const dupes = names.filter((n, i) => names.indexOf(n) !== i)
    if (dupes.length)
      throw new Error(`defineBlockStories(${typeName}): story-name collision: ${dupes.join(', ')}.`)
  }

  const byName = new Map(all.map((f) => [f.name, f]))

  const knobEntries = Object.entries(opts.knobs ?? {})
  const idToPath = Object.fromEntries(knobEntries.map(([path]) => [knobId(path), path]))

  const meta: Meta = {
    title,
    component: Component,
    parameters: { layout: 'fullscreen', ...opts.parameters },
  }

  const Playground: AnyStory = {
    argTypes: {
      fixture: {
        control: 'select',
        options: [...byName.keys()],
        description: 'Which content instance to render',
      },
      ...Object.fromEntries(
        knobEntries.map(([path, options]) => [
          knobId(path),
          {
            name: path,
            control: 'select',
            options: [FIXTURE_VALUE, ...options],
            table: { category: 'Knobs' },
          },
        ]),
      ),
    },
    args: {
      fixture: all[0]?.name,
      ...Object.fromEntries(knobEntries.map(([path]) => [knobId(path), FIXTURE_VALUE])),
    },
    render: (args: Record<string, unknown>) => {
      const fixture = byName.get(args.fixture as string) ?? (all[0] as AnyFixture<T>)
      const data = applyKnobs(fixture.data, args, idToPath)
      return <Component {...(toProps(data) as Record<string, unknown>)} />
    },
  }

  const Variants: AnyStory = {
    parameters: { controls: { disable: true } },
    render: () => (
      <div className="flex flex-col">
        {generatedForPool.map((f) => (
          <section key={f.name}>
            <VariantLabel fixture={f} />
            <Component {...(toProps(f.data) as Record<string, unknown>)} />
          </section>
        ))}
      </div>
    ),
  }

  // Variant base prefers the catalog placeholder, then the named generated
  // placeholder, then the first generated fixture (unchanged generated-only
  // behavior).
  const variantBase =
    placeholderFixture ??
    generatedFixtures.find((f) => f.name === 'placeholder') ??
    generatedFixtures[0]
  // Variant specs source from the catalog (key = declared story name) when a
  // catalog is present; otherwise the generated module's schema-meta contract.
  const variantSpecs = opts.catalog
    ? opts.catalog.variants.map((v) => ({ value: v.value, story: v.story }))
    : (opts.generated?.variantStories ?? [])
  const variants: Record<string, AnyStory> = variantBase
    ? Object.fromEntries(
        variantSpecs.map(({ value, story }) => [
          story,
          {
            render: () => {
              const data = setAtPath(variantBase.data, variantField, value)
              return <Component {...(toProps(data) as Record<string, unknown>)} />
            },
          } satisfies AnyStory,
        ]),
      )
    : {}

  const Placeholder: AnyStory | undefined = placeholderFixture
    ? {
        render: () => (
          <Component {...(toProps(placeholderFixture.data) as Record<string, unknown>)} />
        ),
      }
    : undefined
  const presets: Record<string, AnyStory> = opts.catalog
    ? Object.fromEntries(
        opts.catalog.presets.map((p) => [
          p.story,
          {
            render: () => {
              // Non-null: this closure only runs when `opts.catalog` was truthy
              // above (it's what produced `opts.catalog.presets` to map over),
              // and the earlier guard throws at call time if `catalog` is
              // present without `applyPatches` — so both are guaranteed set here.
              const patched = opts.applyPatches!(opts.catalog!.storyPlaceholder, p.patches)
              return (
                <Component
                  {...(toProps(liftStoryAssets(patched) as T) as Record<string, unknown>)}
                />
              )
            },
          } satisfies AnyStory,
        ]),
      )
    : {}

  return { meta, Playground, Variants, variants, Placeholder, presets }
}
