---
type: regex
pattern: '\((heroSection|ctaSection|railPanelsSection|layoutSection|featureGridSection|logoWallSection|caseShowcaseSection|quoteSection|mediaSection|personGridSection|inFlightSection|insightsCarouselSection|roleListSection|formSection|screenGridSection|card list|band)'
match: not_contains
target: { source: file, path: dataset/brief-eval-draft-insight-body-design-system-v2.json }
---

An insight body is a `bodyText` field, not a band array. Its only inline objects
are `figure`, `embed` and `pullQuote`, so those are the only labels it can
carry — a band name here is page vocabulary in a document that has no bands, and
typeset has nothing to convert it into.
