/**
 * `@o3/story-kit` — the Storybook adapter for the knob vocabulary (ADR 0020),
 * plus the small shared pieces every story file reaches for.
 *
 * `defineKnobStories` is the one a block uses: hand it the block's knob
 * declaration, its component and one fixture, and the controls, the gating and
 * the Matrix all come out of the declaration.
 *
 * `defineVariantStories` is unrelated and older. It grids a UI primitive's flat
 * props (`packages/ui/.../button.stories.tsx`) and its "knobs" are prop names,
 * not the knobs above. It is not the migration path for a block.
 */

export { defineKnobStories, titleForSpec } from './defineKnobStories'
export type { DefineKnobStoriesOptions, KnobStories } from './defineKnobStories'
export * from './defineVariantStories'
export * from './figma'
export * from './knobArgs'
export * from './knobs'
export * from './types'
