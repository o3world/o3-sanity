/**
 * The block layer an app binds its own renderers into: the per-block dispatch
 * loop both renderers share, the `defineBlockRender` binding helper the
 * registries are authored with, and the generated-type pin points a registry
 * is compile-checked against.
 */
export { ANCHOR_OFFSET_CLASS, sectionAnchors } from './anchors'
export {
  bindingsToRecord,
  defineBlockRender,
  type BlockRenderBinding,
  type ClientBlockRenderBinding,
} from './defineBlockRender'
export { renderDispatchedBlocks, type DispatchedBlockWrapperProps } from './dispatchBlocks'
export type {
  BaseBlockData,
  BaseProps,
  BlockLocProps,
  ButtonData,
  LayoutItem,
  PageSection,
  SectionBlockData,
  SectionProps,
} from './sectionTypes'
