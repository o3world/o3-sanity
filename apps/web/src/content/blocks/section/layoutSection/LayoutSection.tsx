import type { ComponentType } from 'react'

import { DisplayHeading, SectionShell } from '@o3/ui'
import { stegaClean } from '@sanity/client/stega'

import { BASE_BLOCK_COMPONENTS } from '../../base/baseComponents'
import { resolveSurface } from '@/content/blocks/surface'
import type { SectionProps } from '@/content/blocks/sectionTypes'

type LayoutSectionProps = SectionProps<'layoutSection'>

const COLUMN_CLASSES: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-3',
}

function resolveColumns(value: number | null | undefined): number {
  const clean = typeof value === 'number' ? value : Number(stegaClean(String(value ?? '')))
  return clean === 2 || clean === 3 ? clean : 1
}

/**
 * The one true two-tier block (ADR 0001): 1–3 columns of base-tier blocks.
 * Items dispatch through the typed base registry directly — the base tier
 * never contains sections, so the full registry isn't needed here.
 */
export function LayoutSection({ heading, columns, items, surface }: LayoutSectionProps) {
  const columnClass = COLUMN_CLASSES[resolveColumns(columns)]
  return (
    <SectionShell surface={resolveSurface(surface, 'white')}>
      <div className="flex flex-col gap-12 py-24">
        {heading ? <DisplayHeading>{heading}</DisplayHeading> : null}
        <div className={`grid items-start gap-10 ${columnClass}`}>
          {(items ?? []).map((item) => {
            const Component = Object.prototype.hasOwnProperty.call(
              BASE_BLOCK_COMPONENTS,
              item._type,
            )
              ? (BASE_BLOCK_COMPONENTS[item._type as keyof typeof BASE_BLOCK_COMPONENTS] as
                  ComponentType<Record<string, unknown>> | undefined)
              : undefined
            if (!Component) return null
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { _type, ...props } = item
            return <Component key={item._key} {...props} />
          })}
        </div>
      </div>
    </SectionShell>
  )
}
