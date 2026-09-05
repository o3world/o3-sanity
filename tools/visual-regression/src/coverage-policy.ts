import fs from 'node:fs'
import path from 'node:path'

/** Reviewed references never masquerade as measured coverage. Keys name exact nodes or pairs. */
export interface CoveragePolicy {
  readonly componentCoverage: readonly { componentSet: string; nodeId: string; reason: string }[]
  readonly inactiveSets: Readonly<Record<string, string>>
  readonly referenceOnly: Readonly<Record<string, string>>
  /** Design hashes at the review that established inactive sets and ancestry. */
  readonly designHashes?: Readonly<Record<string, string>>
}

export const EMPTY_COVERAGE: CoveragePolicy = {
  componentCoverage: [],
  inactiveSets: {},
  referenceOnly: {},
}

export function readCoveragePolicy(root: string): CoveragePolicy {
  return JSON.parse(
    fs.readFileSync(path.join(root, 'tools/visual-regression/data/figma-coverage.json'), 'utf8'),
  ) as CoveragePolicy
}
