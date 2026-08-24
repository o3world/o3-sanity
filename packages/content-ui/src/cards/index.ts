/**
 * The card layer: the compact form a document takes inside someone else's
 * band. Client-safe by construction — section blocks render inside
 * `ClientBlockRenderer`, so a card may not pull the server view graph.
 */
export {
  CARD_PROJECTIONS,
  CARD_TYPES,
  defineCardRender,
  getCard,
  type AppFirstCardComponents,
  type AppFirstCardName,
  type CardComponents,
  type CardComponentsFor,
  type CardRenderBinding,
  type CardSlot,
  type CardTypeName,
} from './card-registry'
export { type CaseStudyCardData } from './cardData'
export { InsightCard, type InsightCardData } from './InsightCard'
export { PageCard, type PageCardData } from './PageCard'
