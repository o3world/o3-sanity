import { isGenerated, type AnyFixture } from './types'

interface VariantLabelProps {
  fixture: AnyFixture<object>
}

/** Thin provenance strip above each fixture in a Variants gallery. */
export function VariantLabel({ fixture }: VariantLabelProps) {
  const source = isGenerated(fixture) ? fixture.source : undefined
  return (
    <div className="bg-bone text-fg-muted flex items-center gap-2 px-4 py-1 font-mono text-xs">
      <span>{fixture.name}</span>
      {source?.kind === 'document' && source.liveUrl ? (
        <a href={source.liveUrl} target="_blank" rel="noreferrer" className="underline">
          {source.liveUrl}
        </a>
      ) : null}
      {source?.kind === 'document' ? <span>{source.urn}</span> : null}
      {source?.kind === 'placeholder' ? <span>placeholder · {source.schemaType}</span> : null}
      {source?.kind === 'placeholder' ? <span>{source.registry}</span> : null}
    </div>
  )
}
