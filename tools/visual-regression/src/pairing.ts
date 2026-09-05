/**
 * Which story claims which Figma node, and what the tracked-nodes manifest
 * says about that node (#336).
 *
 * The pairing is already declared: a story sets
 * `parameters: { design: figmaDesign('1710:2609') }`, and that parameter is
 * the only place code names its frame (spec #326 → Unit). Everything here
 * reads that declaration and joins it to
 * `tools/figma-sync/data/tracked-nodes*.json`, so the later tickets in the
 * chain — the frame exports, the `--figma` comparison — take their subject
 * from one model rather than each re-deriving it.
 *
 * Pure end to end. `extractPairings` takes a story file's source text rather
 * than a path, `buildInventory` takes manifests rather than filenames, and
 * `formatInventory` returns a string: the CLI in `figma-inventory.ts` supplies
 * the reads and the writes. That is what lets the whole model be tested with
 * no Storybook build, no browser and no network.
 */
import ts from 'typescript'

import { storyNameFromExport, toId } from 'storybook/internal/csf'

import type { Brand } from './storybook'

/** A manifest entry's kind, in `tools/figma-sync/src/types.ts`'s vocabulary. */
export type TrackedKind = 'pageFrame' | 'componentFrame' | 'componentSet'

/** The half of a manifest entry the pairing model reads. */
export interface TrackedEntry {
  readonly nodeId: string
  readonly kind: TrackedKind
  readonly name: string
  readonly route?: string
  readonly codeComponent?: string | null
}

/**
 * One brand's design file: the manifest that watches it, and the
 * `@o3/story-kit` export a story names to select it. `figmaDesign`'s second
 * argument is an identifier, not a literal, so the join runs on that
 * identifier — no file key is spelled out twice.
 */
export interface BrandDesignFile {
  readonly brand: Brand
  readonly fileKeyRef: string
  readonly fileKey: string
  readonly entries: readonly TrackedEntry[]
}

/** Whether the pairing came off the story or off the meta it inherits from. */
export type DeclaredOn = 'meta' | 'story'

/** One story↔node pairing, as the source declares it. */
export interface DeclaredPairing {
  /** Storybook's own id, or `null` when the file names no title. */
  readonly storyId: string | null
  readonly title: string | null
  readonly exportName: string
  /** Colon form, the one the manifest and `docs/figma-*.md` write. */
  readonly nodeId: string
  readonly fileKeyRef: string
  /** Repo-relative path of the story file. */
  readonly file: string
  readonly declaredOn: DeclaredOn
  /** The Storybook hosts that glob this file — a shared story is on both. */
  readonly hosts: readonly Brand[]
}

export type PairingMatch = TrackedKind | 'untracked'

export interface PairingRow extends DeclaredPairing {
  /** The brand whose design file the story named, `null` if nothing owns it. */
  readonly designBrand: Brand | null
  readonly match: PairingMatch
  /** The manifest's name for the node, when it tracks it. */
  readonly trackedName: string | null
  /** The route a page frame designs. */
  readonly route: string | null
}

export interface UncoveredEntry {
  readonly brand: Brand
  readonly nodeId: string
  readonly name: string
  readonly codeComponent: string | null
}

export interface BrandCoverage {
  readonly brand: Brand
  /** Component sets the brand's manifest tracks. */
  readonly tracked: number
  readonly paired: number
}

export interface Inventory {
  readonly pairings: readonly PairingRow[]
  /** The subset of `pairings` citing a whole page frame (spec #326 → Notes). */
  readonly pageLevel: readonly PairingRow[]
  readonly uncovered: readonly UncoveredEntry[]
  readonly coverage: readonly BrandCoverage[]
}

/** `figmaDesign`'s default second argument. */
const DEFAULT_FILE_KEY_REF = 'FIGMA_FILE_KEY'

/** Read CSF declarations as syntax; comments and unrelated calls are not design parameters. */
export function extractPairings(
  file: string,
  source: string,
  hosts: readonly Brand[],
): DeclaredPairing[] {
  const tree = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const variables = new Map<string, ts.Expression>()
  const stories: { name: string; value: ts.Expression }[] = []
  const names = new Set<string>()
  let meta: ts.Expression | undefined
  for (const statement of tree.statements) {
    if (
      ts.isImportDeclaration(statement) &&
      ts.isStringLiteral(statement.moduleSpecifier) &&
      statement.moduleSpecifier.text === '@o3/story-kit'
    ) {
      const bindings = statement.importClause?.namedBindings
      if (bindings && ts.isNamedImports(bindings))
        for (const binding of bindings.elements) {
          if ((binding.propertyName?.text ?? binding.name.text) === 'figmaDesign')
            names.add(binding.name.text)
        }
    }
    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (!ts.isIdentifier(declaration.name) || !declaration.initializer) continue
        variables.set(declaration.name.text, declaration.initializer)
        if (
          statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword) &&
          /^[A-Z]/.test(declaration.name.text)
        )
          stories.push({ name: declaration.name.text, value: declaration.initializer })
      }
    }
    if (ts.isExportAssignment(statement) && !statement.isExportEquals) meta = statement.expression
  }
  function unwrap(
    value: ts.Expression | undefined,
    seen = new Set<ts.Expression>(),
  ): ts.Expression | undefined {
    if (!value || seen.has(value)) return undefined
    seen.add(value)
    if (ts.isIdentifier(value)) return unwrap(variables.get(value.text), seen)
    if (
      ts.isAsExpression(value) ||
      ts.isSatisfiesExpression(value) ||
      ts.isParenthesizedExpression(value)
    )
      return unwrap(value.expression, seen)
    return value
  }
  function property(value: ts.Expression | undefined, name: string): ts.Expression | undefined {
    const object = unwrap(value)
    if (!object || !ts.isObjectLiteralExpression(object)) return undefined
    for (const prop of [...object.properties].reverse()) {
      if (
        ts.isPropertyAssignment(prop) &&
        (ts.isIdentifier(prop.name) || ts.isStringLiteral(prop.name)) &&
        prop.name.text === name
      )
        return prop.initializer
    }
    return undefined
  }
  function pairing(value: ts.Expression | undefined) {
    const call = unwrap(property(property(value, 'parameters'), 'design'))
    if (
      !call ||
      !ts.isCallExpression(call) ||
      !ts.isIdentifier(call.expression) ||
      !names.has(call.expression.text)
    )
      return null
    const node = call.arguments[0]
    if (!node || !ts.isStringLiteral(node) || !/^\d+[:-]\d+$/.test(node.text)) return null
    const ref = call.arguments[1]
    return {
      nodeId: node.text.replaceAll('-', ':'),
      fileKeyRef: ref && ts.isIdentifier(ref) ? ref.text : DEFAULT_FILE_KEY_REF,
    }
  }
  const titleValue = property(meta, 'title')
  const title = titleValue && ts.isStringLiteral(titleValue) ? titleValue.text : null
  const inherited = pairing(meta)
  return stories.flatMap(({ name, value }) => {
    const own = pairing(value)
    const pair = property(property(value, 'parameters'), 'design') === undefined ? inherited : own
    return pair
      ? [
          {
            ...pair,
            file,
            hosts,
            title,
            storyId: title ? toId(title, storyNameFromExport(name)) : null,
            exportName: name,
            declaredOn: own ? ('story' as const) : ('meta' as const),
          },
        ]
      : []
  })
}

/**
 * The inventory: every pairing joined to the manifest that watches the file it
 * names, every component set nobody paired, and the page-frame pairings.
 *
 * The inventory reports every uncovered set. The offline ledger gate applies
 * the reviewed coverage policy to those rows; this listing remains read-only.
 *
 * `files` is every design file the join may need; `report` is the subset the
 * run is about. The two differ under `--brand`: a shared story can name either
 * brand's file whichever host serves it, so the join has to see both even when
 * only one brand's pairings are being listed.
 */
export function buildInventory(
  pairings: readonly DeclaredPairing[],
  files: readonly BrandDesignFile[],
  report: readonly Brand[] = files.map((file) => file.brand),
): Inventory {
  const byRef = new Map(files.map((file) => [file.fileKeyRef, file]))
  const entriesByRef = new Map(
    files.map((file) => [file.fileKeyRef, new Map(file.entries.map((e) => [e.nodeId, e]))]),
  )
  const reported = new Set<Brand>(report)

  const rows: PairingRow[] = pairings
    .map((pairing) => {
      const file = byRef.get(pairing.fileKeyRef) ?? null
      const entry = entriesByRef.get(pairing.fileKeyRef)?.get(pairing.nodeId) ?? null
      return {
        ...pairing,
        designBrand: file?.brand ?? null,
        match: entry?.kind ?? ('untracked' as const),
        trackedName: entry?.name ?? null,
        route: entry?.route ?? null,
      }
    })
    // A pairing against a design file this run does not report is out of
    // scope, not missing. One that names no known file is kept: a mistyped
    // identifier is exactly the thing an inventory should surface.
    .filter((row) => row.designBrand === null || reported.has(row.designBrand))
    .sort(
      (a, b) =>
        (a.storyId ?? a.file).localeCompare(b.storyId ?? b.file) ||
        a.nodeId.localeCompare(b.nodeId),
    )

  const pairedNodes = new Map<Brand, Set<string>>()
  for (const row of rows) {
    if (!row.designBrand) continue
    const seen = pairedNodes.get(row.designBrand) ?? new Set<string>()
    seen.add(row.nodeId)
    pairedNodes.set(row.designBrand, seen)
  }

  const uncovered: UncoveredEntry[] = []
  const coverage: BrandCoverage[] = []
  for (const file of files) {
    if (!reported.has(file.brand)) continue
    const paired = pairedNodes.get(file.brand) ?? new Set<string>()
    const sets = file.entries.filter((entry) => entry.kind === 'componentSet')
    for (const entry of sets) {
      if (paired.has(entry.nodeId)) continue
      uncovered.push({
        brand: file.brand,
        nodeId: entry.nodeId,
        name: entry.name,
        codeComponent: entry.codeComponent ?? null,
      })
    }
    coverage.push({
      brand: file.brand,
      tracked: sets.length,
      paired: sets.filter((entry) => paired.has(entry.nodeId)).length,
    })
  }

  return {
    pairings: rows,
    pageLevel: rows.filter((row) => row.match === 'pageFrame'),
    uncovered,
    coverage,
  }
}

function pad(value: string, width: number): string {
  return value.length >= width ? value : value + ' '.repeat(width - value.length)
}

function table(header: readonly string[], rows: readonly (readonly string[])[]): string {
  const widths = header.map((cell, column) =>
    Math.max(cell.length, ...rows.map((row) => (row[column] ?? '').length)),
  )
  const line = (row: readonly string[]) =>
    row
      .map((cell, column) => pad(cell, widths[column]!))
      .join('  ')
      .trimEnd()
  return [line(header), line(widths.map((width) => '-'.repeat(width))), ...rows.map(line)].join(
    '\n',
  )
}

/**
 * The report. Three sections, in the order the acceptance criteria name them:
 * every pairing, the page-level ones, and the uncovered sets — printed whole,
 * because a capped adoption list is a list that hides the work.
 */
export function formatInventory(inventory: Inventory): string {
  const sections: string[] = []

  sections.push(
    `Pairings (${inventory.pairings.length})\n\n` +
      table(
        ['story', 'node', 'hosts', 'design', 'kind', 'frame'],
        inventory.pairings.map((row) => [
          row.storyId ?? `${row.file} · ${row.exportName}`,
          row.nodeId,
          row.hosts.join('+'),
          row.designBrand ?? '?',
          row.match === 'pageFrame' ? 'page-level' : row.match,
          row.trackedName ? `${row.trackedName}${row.route ? ` (${row.route})` : ''}` : '',
        ]),
      ),
  )

  sections.push(
    `Page-level pairings (${inventory.pageLevel.length})\n` +
      '  A story citing a whole page frame; the tightest node containing what it draws is the target.\n\n' +
      (inventory.pageLevel.length === 0
        ? '  none'
        : table(
            ['story', 'node', 'frame'],
            inventory.pageLevel.map((row) => [
              row.storyId ?? `${row.file} · ${row.exportName}`,
              row.nodeId,
              `${row.trackedName ?? ''}${row.route ? ` (${row.route})` : ''}`,
            ]),
          )),
  )

  sections.push(
    `Uncovered component sets (${inventory.uncovered.length})\n` +
      '  Tracked in the manifest, paired by no story.\n\n' +
      (inventory.uncovered.length === 0
        ? '  none'
        : table(
            ['brand', 'node', 'set', 'code'],
            inventory.uncovered.map((row) => [
              row.brand,
              row.nodeId,
              row.name,
              row.codeComponent ?? '—',
            ]),
          )),
  )

  sections.push(
    'Coverage\n\n' +
      table(
        ['brand', 'component sets', 'paired'],
        inventory.coverage.map((row) => [row.brand, String(row.tracked), String(row.paired)]),
      ),
  )

  return sections.join('\n\n')
}
