/**
 * Every shared object, in one barrel.
 *
 * A shared object is a registered type with no tier: it is placed as a field on
 * a block, as a member of an array, or — for the three that double as base
 * blocks — as a block in its own right. Because the name is registered
 * globally, an instance is reached by its `_type` and configured by its
 * component's own declaration (ADR 0023).
 *
 * Barrelled so that `knobGuard.test.ts` can walk them the way it already walks
 * the two block barrels — a shared object is found by the name its declaration
 * answers to, and adding one costs the guard nothing.
 */
export { bodyText } from './bodyText'
export { button } from './button'
export { chapter } from './chapter'
export { embed } from './embed'
export { figure } from './figure'
export { mark } from './mark'
export { migration } from './migration'
export { pullQuote } from './pullQuote'
export { seo } from './seo'
export { stat } from './stat'
