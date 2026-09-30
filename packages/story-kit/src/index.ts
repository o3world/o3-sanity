/**
 * `@o3/story-kit` — the small shared pieces every story file reaches for. The
 * Storybook config builders are exported by subpath.
 *
 * `defineVariantStories` grids a UI primitive's flat props
 * (`packages/ui/.../button.stories.tsx`); its "knobs" are prop names, not the
 * knob declarations in `@o3/sanity/knobs`.
 */

export * from './defineVariantStories'
export * from './figma'
