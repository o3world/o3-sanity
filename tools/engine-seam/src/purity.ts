/**
 * The pure half of the engine-purity seam (#287): every function here maps
 * (roster, snapshot of the repo) to a list of findings, with no filesystem
 * access. The test file is the shell that feeds it the real repo.
 *
 * The roster is the one declaration of the boundary — see ../README.md for
 * its rules. This module only makes the roster enforceable.
 */

export type Verdict = 'engine' | 'product-shared' | 'product-brand'

type Override = { path: string; verdict: Verdict; why: string }
type Impurity = { where: string; what: string; fix: string }
type Row = {
  path: string
  verdict: Verdict
  why: string
  overrides?: Override[]
  impurities?: Impurity[]
  fused?: { path: string; split: string }[]
}
export type Roster = { rows: Row[] }

/** A workspace as the resolver needs it: name, directory, exports map, deps. */
export type WorkspacePackage = {
  name: string
  dir: string
  exports: Record<string, string>
  dependencies: string[]
}

/**
 * Blanks comments in a `.ts`/`.tsx` source, keeping the line count. Line-based
 * rather than string-aware, the same trade the brand-token seam makes: an
 * apostrophe in JSX prose would leave a string scanner mid-string for the rest
 * of the file.
 */
function stripComments(source: string): string {
  let inBlock = false
  return source
    .split('\n')
    .map((line) => {
      let out = line
      if (inBlock) {
        const end = out.indexOf('*/')
        if (end === -1) return ''
        inBlock = false
        out = out.slice(end + 2)
      }
      out = out.replace(/\/\*.*?\*\//g, ' ')
      const open = out.indexOf('/*')
      if (open !== -1) {
        inBlock = true
        out = out.slice(0, open)
      }
      // `(?<!:)` keeps a URL in a string from blanking the rest of its line.
      return out.replace(/(?<!:)\/\/.*$/, '')
    })
    .join('\n')
}

/**
 * Every module specifier a source file names: static imports, re-exports,
 * dynamic `import()` and `require()`. Commented-out code does not count.
 */
export function parseImports(source: string): string[] {
  const code = stripComments(source)
  const found = code.matchAll(
    /(?:\b(?:import|export)\b[^'"]*?\bfrom\s*|\bimport\s*|\bimport\s*\(\s*|\brequire\s*\(\s*)['"]([^'"]+)['"]/g,
  )
  return [...found].map((match) => match[1] ?? '')
}

/** `a/b/../c` → `a/c`, with no filesystem involved. */
function normalize(path: string): string {
  const out: string[] = []
  for (const part of path.split('/')) {
    if (part === '' || part === '.') continue
    if (part === '..') out.pop()
    else out.push(part)
  }
  return out.join('/')
}

/** The first candidate that is a real file, trying the extensions a bare specifier omits. */
function guessFile(base: string, files: ReadonlySet<string>): string | null {
  const candidates = [base, `${base}.ts`, `${base}.tsx`, `${base}/index.ts`, `${base}/index.tsx`]
  return candidates.find((candidate) => files.has(candidate)) ?? null
}

/**
 * Where a specifier lands in the repo: a source file where one can be found, a
 * workspace directory where only the package is known, null for anything
 * external (npm, node builtins). Relative specifiers resolve against the
 * importing file; workspace specifiers follow the package's exports map.
 */
export function resolveSpecifier(
  fromFile: string,
  specifier: string,
  packages: WorkspacePackage[],
  files: ReadonlySet<string>,
): string | null {
  if (specifier.startsWith('.')) {
    const base = normalize(`${fromFile}/../${specifier}`)
    return guessFile(base, files) ?? base
  }

  const pkg = packages.find(
    (candidate) => specifier === candidate.name || specifier.startsWith(`${candidate.name}/`),
  )
  if (!pkg) return null

  const sub = specifier === pkg.name ? '.' : `./${specifier.slice(pkg.name.length + 1)}`

  const exact = pkg.exports[sub]
  if (exact) return normalize(`${pkg.dir}/${exact}`)

  for (const [pattern, target] of Object.entries(pkg.exports)) {
    if (!pattern.endsWith('/*')) continue
    const prefix = pattern.slice(0, -1)
    if (!sub.startsWith(prefix)) continue
    const filled = normalize(`${pkg.dir}/${target.slice(0, -1)}${sub.slice(prefix.length)}`)
    return guessFile(filled, files) ?? filled
  }

  return guessFile(normalize(`${pkg.dir}/src/${sub}`), files) ?? pkg.dir
}

/**
 * Every repo source file reachable from an entry by following its imports —
 * the module set a bundler pulls in when the entry lands in a client bundle.
 * External specifiers (npm, node builtins) end the walk; the entry itself is
 * included. Sorted for stable failure output.
 */
export function moduleClosure(
  entry: string,
  sources: ReadonlyMap<string, string>,
  packages: WorkspacePackage[],
): string[] {
  const files = new Set(sources.keys())
  const reached = new Set([entry])
  const queue = [entry]
  while (queue.length > 0) {
    const file = queue.pop() as string
    const source = sources.get(file)
    if (source === undefined) continue
    for (const specifier of parseImports(source)) {
      const target = resolveSpecifier(file, specifier, packages, files)
      if (target === null || reached.has(target)) continue
      reached.add(target)
      queue.push(target)
    }
  }
  return [...reached].sort()
}

/** True when a source reads the process environment; comments do not count. */
export function readsProcessEnv(source: string): boolean {
  return /\bprocess\.env\b/.test(stripComments(source))
}

function isUnder(path: string, prefix: string): boolean {
  return path === prefix || path.startsWith(`${prefix}/`)
}

/**
 * What the roster says a repo-relative path is. The workspace row carries the
 * default; an override — file or directory — re-labels the path it names.
 * Null for a path no row covers.
 */
export function verdictOf(roster: Roster, path: string): Verdict | null {
  const row = roster.rows.find((candidate) => isUnder(path, candidate.path))
  if (!row) return null

  const inside = path.slice(row.path.length + 1)
  const override = (row.overrides ?? []).find((candidate) => isUnder(inside, candidate.path))
  return override?.verdict ?? row.verdict
}

/** A brand token named in engine code: the file scan's answer, line by line. */
export type TokenOffence = { file: string; specifier: string; line: number; token: string }

export type ColorVocabulary = {
  properties: Set<string>
  colorRoles: Set<string>
  hexes: Set<string>
}

/**
 * The utility prefixes Tailwind generates from `--color-*` — the brand token
 * seam's list, reused unchanged.
 */
const COLOR_UTILITIES =
  'bg|text|border|ring|ring-offset|inset-ring|fill|stroke|from|via|to|outline|divide|shadow|text-shadow|accent|caret|decoration|placeholder'

/** Blanks CSS comments, keeping every other character where it was. */
function stripCssComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, (block) => block.replace(/[^\n]/g, ' '))
}

/** `#fff` → `#ffffff`; longer forms pass through lowercased. */
function longHex(hex: string): string {
  const lower = hex.toLowerCase()
  return /^#[0-9a-f]{3}$/.test(lower)
    ? `#${[...lower.slice(1)].map((digit) => digit + digit).join('')}`
    : lower
}

/** White and black paint the same in any host — they are not brand facts. */
const NOT_BRAND = new Set(['white', 'black'])
const NOT_BRAND_HEXES = new Set(['#ffffff', '#000000'])

/**
 * The brand vocabulary engine code may not name, derived from the token
 * packages' stylesheets rather than listed: every declared colour and
 * gradient custom property, the colour roles' utility classes, and the hex
 * values the declarations paint.
 */
export function colorVocabulary(cssSources: string[]): ColorVocabulary {
  const properties = new Set<string>()
  const colorRoles = new Set<string>()
  const hexes = new Set<string>()

  for (const css of cssSources) {
    const found = stripCssComments(css).matchAll(/(?<![\w-])(--[a-z0-9-]+)\s*:\s*([^;}]*)/gi)
    for (const { 1: property = '', 2: value = '' } of found) {
      const role = property.toLowerCase()
      const name = role.replace(/^--[a-z]+-/, '')
      if (NOT_BRAND.has(name)) continue
      if (!role.startsWith('--color-') && !role.startsWith('--gradient-')) continue

      properties.add(role)
      if (role.startsWith('--color-')) colorRoles.add(name)
      for (const hex of value.matchAll(/#[0-9a-f]{3,8}\b/gi)) {
        const long = longHex(hex[0])
        if (!NOT_BRAND_HEXES.has(long)) hexes.add(long)
      }
    }
  }
  return { properties, colorRoles, hexes }
}

/**
 * Every place a source file names the brand vocabulary: a utility class built
 * from a colour role, a custom property by name (covering `var()`, arbitrary
 * values and `bg-(image:--role)` alike), or a declared hex pasted in place of
 * the token. Comments are blanked first — naming a role in prose is how a
 * module explains why it does not paint with it.
 */
export function tokenOffences(source: string, vocabulary: ColorVocabulary): TokenOffence[] {
  const { properties, colorRoles, hexes } = vocabulary
  const utility =
    colorRoles.size > 0
      ? new RegExp(`(?<![\\w-])(?:${COLOR_UTILITIES})-(?:${[...colorRoles].join('|')})(?![\\w-])`)
      : null

  return stripComments(source)
    .split('\n')
    .flatMap((line, i) => {
      const tokens = [
        ...[...line.matchAll(/--[a-z0-9-]+/gi)]
          .map(([property]) => property.toLowerCase())
          .filter((property) => properties.has(property)),
        ...(utility?.exec(line) ?? []),
        ...[...line.matchAll(/#[0-9a-f]{3,8}\b/gi)]
          .map(([hex]) => longHex(hex))
          .filter((hex) => hexes.has(hex)),
      ]
      const token = tokens[0]
      return token === undefined ? [] : [{ file: '', specifier: token, line: i + 1, token }]
    })
}

/** One engine file reaching product: where, via which specifier, into what. */
export type Violation = {
  file: string
  specifier: string
  target: string
  targetVerdict: Verdict
}

/**
 * Every place an engine file imports product code. Sources hold the whole
 * repo — product files included, they are what specifiers resolve against —
 * and only files the roster labels `engine` are scanned. Sorted by file then
 * specifier for stable output.
 */
export function importViolations(
  roster: Roster,
  sources: ReadonlyMap<string, string>,
  packages: WorkspacePackage[],
): Violation[] {
  const files = new Set(sources.keys())

  return [...sources]
    .filter(([file]) => verdictOf(roster, file) === 'engine')
    .flatMap(([file, source]) =>
      parseImports(source).flatMap((specifier) => {
        const target = resolveSpecifier(file, specifier, packages, files)
        if (target === null) return []
        const targetVerdict = verdictOf(roster, target)
        if (targetVerdict === 'engine' || targetVerdict === null) return []
        return [{ file, specifier, target, targetVerdict }]
      }),
    )
    .sort((a, b) => a.file.localeCompare(b.file) || a.specifier.localeCompare(b.specifier))
}

/**
 * Every runtime dependency an engine workspace declares on a product one. The
 * import scan sees the reach; this sees the extractability claim the manifest
 * makes. `devDependencies` stay out — they are the test harness, not what
 * extraction would take.
 */
export function dependencyViolations(roster: Roster, packages: WorkspacePackage[]): Violation[] {
  const byName = new Map(packages.map((pkg) => [pkg.name, pkg]))

  return packages
    .filter((pkg) => verdictOf(roster, pkg.dir) === 'engine')
    .flatMap((pkg) =>
      pkg.dependencies.flatMap((dependency) => {
        const target = byName.get(dependency)
        if (!target) return []
        const targetVerdict = verdictOf(roster, target.dir)
        if (targetVerdict === 'engine' || targetVerdict === null) return []
        return [
          {
            file: `${pkg.dir}/package.json`,
            specifier: dependency,
            target: target.dir,
            targetVerdict,
          },
        ]
      }),
    )
    .sort((a, b) => a.file.localeCompare(b.file) || a.specifier.localeCompare(b.specifier))
}

/** The row-relative paths an impurity's `where` names — `src/urls.ts`, `package.json`. */
function wherePaths(where: string): string[] {
  const found = where.match(/[\w./-]+\.[a-z]+/gi) ?? []
  return found.filter((path) => !path.startsWith('@'))
}

/**
 * Splits violations into the leaks the roster's impurity ledgers already
 * carry — matched by file, so a ledger entry covers the module it names and
 * nothing else — and the new ones the suite fails on.
 */
export function partitionPermitted<T extends Pick<Violation, 'file' | 'specifier'>>(
  roster: Roster,
  violations: T[],
): { permitted: T[]; unpermitted: T[] } {
  const permitted: T[] = []
  const unpermitted: T[] = []

  for (const violation of violations) {
    const row = roster.rows.find((candidate) => isUnder(violation.file, candidate.path))
    const inside = row ? violation.file.slice(row.path.length + 1) : violation.file
    // A manifest entry is coarser than a module, so a dependency violation
    // must also be named: one ledger entry cannot blanket-permit every
    // product package the manifest could come to declare.
    const covered = (row?.impurities ?? []).some(
      (impurity) =>
        wherePaths(impurity.where).includes(inside) &&
        (inside !== 'package.json' ||
          `${impurity.where} ${impurity.what}`.includes(violation.specifier)),
    )
    ;(covered ? permitted : unpermitted).push(violation)
  }
  return { permitted, unpermitted }
}

/** `KNOB* names` → does the file contain a token the fragment describes? */
function hintInSource(fragment: string, source: string): boolean {
  if (source.includes(fragment)) return true
  const token = fragment.split(/\s+/)[0] ?? ''
  if (token === '') return false
  const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, (ch) => (ch === '*' ? '§' : `\\${ch}`))
  return new RegExp(escaped.replaceAll('§', '[\\w-]*')).test(source)
}

/**
 * The entries whose leak is gone. The ledger permits listed leaks so the label
 * can state intent — but a fixed leak must leave the ledger, or the allowance
 * outlives the debt. An entry is stale when a file it names no longer exists,
 * or when it neither permits a detected violation nor names (in its
 * parenthetical hint) anything still present in the file — the latter keeps
 * the value-shaped leaks no scanner sees, like a derived tint, honest too.
 */
export function staleImpurities(
  roster: Roster,
  permittedFiles: ReadonlySet<string>,
  read: (path: string) => string | null,
): string[] {
  return roster.rows.flatMap((row) =>
    (row.impurities ?? []).flatMap((impurity) => {
      const paths = wherePaths(impurity.where).map((path) => `${row.path}/${path}`)
      const sources = paths.map((path) => read(path))

      const gone = paths.filter((_, i) => sources[i] === null)
      if (gone.length > 0)
        return [`${row.path}: "${impurity.where}" names a file that is gone: ${gone.join(', ')}`]

      if (paths.some((path) => permittedFiles.has(path))) return []

      const hints = [...impurity.where.matchAll(/\(([^)]*)\)/g)]
        .flatMap((match) => (match[1] ?? '').split(','))
        .map((fragment) => fragment.trim())
        .filter((fragment) => fragment !== '')
      const found = hints.some((fragment) =>
        sources.some((source) => source !== null && hintInSource(fragment, source)),
      )
      return found
        ? []
        : [`${row.path}: "${impurity.where}" no longer matches a leak — fixed? Remove the entry.`]
    }),
  )
}

/**
 * The roster is closed: a directory that exists under one of the workspace
 * roots and has no row is a failure, not a default. Returns the paths with no
 * row, sorted for a stable failure message.
 */
export function uncoveredDirs(roster: Roster, dirs: string[]): string[] {
  const covered = new Set(roster.rows.map((row) => row.path))
  return dirs.filter((dir) => !covered.has(dir)).sort()
}

/**
 * The inverse drift: a row or override whose path no longer exists on disk.
 * `exists` receives repo-relative paths.
 */
export function missingPaths(roster: Roster, exists: (path: string) => boolean): string[] {
  return roster.rows
    .flatMap((row) => [
      row.path,
      ...(row.overrides ?? []).map((override) => `${row.path}/${override.path}`),
    ])
    .filter((path) => !exists(path))
    .sort()
}
