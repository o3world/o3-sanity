/**
 * The card layer: the compact form a document takes inside someone else's
 * band. Client-safe by construction — section blocks render inside
 * `ClientBlockRenderer`, so a card may not pull the server view graph.
 */
export { CARD_PROJECTIONS, getCard } from './card-registry'
export { CaseStudyCard, type CaseStudyCardData } from './CaseStudyCard'
export { DefaultCard, type DefaultCardProps } from './DefaultCard'
export { InsightCard, type InsightCardData } from './InsightCard'
export { PageCard, type PageCardData } from './PageCard'
