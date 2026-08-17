#!/usr/bin/env node
// The mechanical half of the eval harness: read a case's graders, apply them to
// one finished run, and print the `graders` array that goes into the judged
// JSON. Every grader an agent could apply by eye is applied here instead, so a
// verdict is a property of the run rather than of the runner's mood.
//
// Grader types and their fields are `claude plugin eval`'s, so a case authored
// here runs unchanged once the early-access flag lands. `llm` and `baseline`
// are deferred to the runner — they are the two the CLI cannot do mechanically
// either.
//
//   node grade.mjs <case-dir> <run-dir>   grade one run, print JSON
//   node grade.mjs --validate <case-dir>  check the case format, exit 1 on error
//
// A run directory holds what the runner captured:
//   last-message.md   the run's final message
//   transcript.jsonl  one JSON object per line, tool_use entries included
//   workspace/        the files the run produced
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { basename, join, relative, sep } from 'node:path'
import { argv, exit } from 'node:process'
import { pathToFileURL } from 'node:url'

/** Grader types this engine decides. Anything else is deferred or invalid. */
const MECHANICAL = ['regex', 'tool_used', 'tool_order', 'file_exists']
const DEFERRED = ['llm', 'baseline']

/** Fields a case's `prompt.md` may declare, per the plugin-eval frontmatter. */
const PROMPT_FIELDS = [
  'name',
  'tags',
  'plugins',
  'runs',
  'max_turns',
  'timeout_seconds',
  'allowed_tools',
  'model',
  'append_system_prompt',
  'env',
]

/**
 * The frontmatter subset a case uses: scalars, inline arrays, and one level of
 * nesting for `env` and an inline `target` map. A YAML dependency would have to
 * be phantom-resolved from the repo root — this directory ships as a plugin and
 * has no package of its own.
 */
export function parseFrontmatter(source) {
  const block = source.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!block) return { fields: {}, body: source, hasFrontmatter: false }
  const fields = {}
  let nesting = null
  for (const line of unwrapFlow(block[1])) {
    if (!line.trim() || line.trim().startsWith('#')) continue
    const nested = line.match(/^\s+([A-Za-z0-9_]+):\s*(.*)$/)
    if (nested && nesting) {
      fields[nesting][nested[1]] = scalar(nested[2])
      continue
    }
    const entry = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/)
    if (!entry) continue
    const [, key, raw] = entry
    if (raw === '') {
      nesting = key
      fields[key] = {}
      continue
    }
    nesting = null
    fields[key] = value(raw)
  }
  return { fields, body: source.slice(block[0].length).trim(), hasFrontmatter: true }
}

/** Bracket depth of one line, blind to brackets inside a quoted scalar. */
function bracketDepth(line) {
  let depth = 0
  let quote = null
  for (const char of line) {
    if (quote) {
      if (char === quote) quote = null
      continue
    }
    if (char === '"' || char === "'") quote = char
    else if (char === '[' || char === '{') depth += 1
    else if (char === ']' || char === '}') depth -= 1
  }
  return depth
}

/**
 * Put a flow sequence prettier broke across lines back on one line, and pull a
 * block that follows a bare `key:` up onto the key. `allowed_tools` passes the
 * repo's 100-column print width the moment a case names MCP tools, and the
 * broken form reads to the loop above as an empty nested map — a tool budget
 * that vanishes without an error.
 */
function unwrapFlow(block) {
  const lines = []
  let pending = null
  let depth = 0
  for (const line of block.split(/\r?\n/)) {
    if (pending !== null) {
      pending += ` ${line.trim()}`
      depth += bracketDepth(line)
      if (depth <= 0) {
        lines.push(pending)
        pending = null
        depth = 0
      }
      continue
    }
    depth = bracketDepth(line)
    if (depth > 0) pending = line.trimEnd()
    else lines.push(line)
  }
  if (pending !== null) lines.push(pending)

  for (let index = 0; index < lines.length - 1; index += 1) {
    const bare = lines[index].match(/^([A-Za-z0-9_]+):\s*$/)
    if (bare && /^\s*[[{]/.test(lines[index + 1])) {
      lines[index] = `${bare[1]}: ${lines[index + 1].trim()}`
      lines.splice(index + 1, 1)
    }
  }
  return lines
}

function value(raw) {
  const trimmed = raw.trim()
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    const inner = trimmed.slice(1, -1).trim()
    return inner === '' ? [] : splitTopLevel(inner).map(scalar)
  }
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    const map = {}
    for (const pair of splitTopLevel(trimmed.slice(1, -1))) {
      const at = pair.indexOf(':')
      if (at === -1) continue
      map[pair.slice(0, at).trim()] = scalar(pair.slice(at + 1))
    }
    return map
  }
  return scalar(trimmed)
}

/** Split on commas that are not inside brackets or quotes. */
function splitTopLevel(input) {
  const parts = []
  let depth = 0
  let quote = null
  let current = ''
  for (const char of input) {
    if (quote) {
      if (char === quote) quote = null
      current += char
      continue
    }
    if (char === '"' || char === "'") quote = char
    if (char === '[' || char === '{') depth += 1
    if (char === ']' || char === '}') depth -= 1
    if (char === ',' && depth === 0) {
      parts.push(current)
      current = ''
      continue
    }
    current += char
  }
  if (current.trim()) parts.push(current)
  return parts.map((part) => part.trim())
}

function scalar(raw) {
  const trimmed = raw.trim()
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  )
    return trimmed.slice(1, -1)
  if (trimmed === 'true') return true
  if (trimmed === 'false') return false
  if (trimmed !== '' && !Number.isNaN(Number(trimmed))) return Number(trimmed)
  return trimmed
}

/** Every grader file in a case, in the order the report should list them. */
export function readGraders(caseDir) {
  const dir = join(caseDir, 'graders')
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter((file) => file.endsWith('.md'))
    .sort()
    .map((file) => {
      const { fields, body } = parseFrontmatter(readFileSync(join(dir, file), 'utf8'))
      return { name: basename(file, '.md'), rubric: body, ...fields }
    })
}

/**
 * The case format, checked the way `claude plugin eval` would reject a case —
 * plus this repo's model policy, which the CLI has no opinion about.
 * Returns the problems; an empty array is a valid case.
 */
export function validateCase(caseDir) {
  const problems = []
  const promptPath = join(caseDir, 'prompt.md')
  if (!existsSync(promptPath)) return [`${promptPath} is missing`]

  const { fields, body, hasFrontmatter } = parseFrontmatter(readFileSync(promptPath, 'utf8'))
  if (!hasFrontmatter) problems.push('prompt.md has no frontmatter')
  if (!body) problems.push('prompt.md has no prompt body')
  for (const key of Object.keys(fields))
    if (!PROMPT_FIELDS.includes(key)) problems.push(`prompt.md: unknown field \`${key}\``)
  if (fields.model !== 'sonnet')
    problems.push(`prompt.md: model must be pinned to sonnet, found \`${fields.model ?? 'none'}\``)
  for (const key of Object.keys(fields.env ?? {}))
    if (!key.startsWith('EVAL_'))
      problems.push(`prompt.md: env key \`${key}\` must be EVAL_-prefixed`)

  const graders = readGraders(caseDir)
  if (graders.length === 0) problems.push('graders/ holds no grader files')
  for (const grader of graders) {
    const where = `graders/${grader.name}.md`
    if (!grader.type) {
      problems.push(`${where}: no \`type\``)
      continue
    }
    if (![...MECHANICAL, ...DEFERRED].includes(grader.type)) {
      problems.push(`${where}: unknown type \`${grader.type}\``)
      continue
    }
    if (grader.type === 'regex') {
      if (!grader.pattern) problems.push(`${where}: regex grader needs a \`pattern\``)
      else
        try {
          new RegExp(grader.pattern, grader.flags ? String(grader.flags) : '')
        } catch (error) {
          problems.push(`${where}: pattern does not compile — ${error.message}`)
        }
      if (grader.match && !/^(contains|not_contains|count:\d+)$/.test(String(grader.match)))
        problems.push(`${where}: unknown match \`${grader.match}\``)
    }
    if (grader.type === 'tool_used' && !grader.tool) problems.push(`${where}: needs a \`tool\``)
    if (grader.type === 'tool_order' && !(grader.before && grader.after))
      problems.push(`${where}: needs \`before\` and \`after\``)
    if (grader.type === 'file_exists' && !grader.path) problems.push(`${where}: needs a \`path\``)
    if (grader.type === 'llm' && !grader.criteria) problems.push(`${where}: needs \`criteria\``)
  }
  return problems
}

/** Files the run produced, as workspace-relative POSIX paths. */
function workspaceFiles(runDir) {
  const root = join(runDir, 'workspace')
  if (!existsSync(root)) return []
  const found = []
  const walk = (dir) => {
    for (const entry of readdirSync(dir)) {
      const path = join(dir, entry)
      if (statSync(path).isDirectory()) walk(path)
      else found.push(relative(root, path).split(sep).join('/'))
    }
  }
  walk(root)
  return found.sort()
}

/** A glob over produced files: `**` crosses directories, `*` and `?` do not. */
function globToRegExp(pattern) {
  let source = ''
  for (let index = 0; index < pattern.length; index += 1) {
    const char = pattern[index]
    if (char === '*' && pattern[index + 1] === '*') {
      source += '.*'
      index += pattern[index + 2] === '/' ? 2 : 1
      continue
    }
    if (char === '*') source += '[^/]*'
    else if (char === '?') source += '[^/]'
    else source += char.replace(/[.+^${}()|[\]\\]/g, '\\$&')
  }
  return new RegExp(`^${source}$`)
}

/** What a grader looks at. Unreadable targets fail the grader, never throw. */
function readTarget(runDir, target) {
  const resolved = target ?? 'last_message'
  if (typeof resolved === 'object' && resolved.source === 'file') {
    const path = join(runDir, 'workspace', String(resolved.path))
    return existsSync(path)
      ? { text: readFileSync(path, 'utf8'), label: `file ${resolved.path}` }
      : { text: null, label: `file ${resolved.path} (not produced)` }
  }
  if (resolved === 'trace') return { text: readTranscript(runDir).raw, label: 'trace' }
  if (resolved === 'files')
    return { text: workspaceFiles(runDir).join('\n'), label: 'produced file paths' }
  const path = join(runDir, 'last-message.md')
  return existsSync(path)
    ? { text: readFileSync(path, 'utf8'), label: 'last_message' }
    : { text: null, label: 'last_message (not captured)' }
}

function readTranscript(runDir) {
  const path = join(runDir, 'transcript.jsonl')
  if (!existsSync(path)) return { raw: '', entries: [] }
  const raw = readFileSync(path, 'utf8')
  const entries = raw
    .split(/\r?\n/)
    .filter((line) => line.trim())
    .flatMap((line) => {
      try {
        return [JSON.parse(line)]
      } catch {
        return []
      }
    })
  return { raw, entries }
}

/**
 * Tool names are compared case-insensitively. The plugin declares its MCP
 * server as `sanity` and this repo's `.mcp.json` declares `Sanity`, so the same
 * call arrives as `mcp__sanity__query_documents` under the CLI and
 * `mcp__Sanity__query_documents` under the local runner.
 */
const toolCalls = (entries) =>
  entries
    .filter((entry) => entry.type === 'tool_use')
    .map((entry) => ({
      name: String(entry.name ?? '').toLowerCase(),
      input: JSON.stringify(entry.input ?? {}),
    }))

function grade(grader, runDir) {
  if (DEFERRED.includes(grader.type))
    return {
      passed: null,
      score: null,
      deferred: true,
      detail: `${grader.type} grader is judged by the runner`,
    }

  if (grader.type === 'regex') {
    const { text, label } = readTarget(runDir, grader.target)
    if (text === null) return { passed: false, score: 0, detail: `no ${label} to match against` }
    const flags = grader.flags ? String(grader.flags) : ''
    const expression = new RegExp(grader.pattern, flags.includes('g') ? flags : `${flags}g`)
    const count = [...text.matchAll(expression)].length
    const match = String(grader.match ?? 'contains')
    if (match === 'not_contains')
      return {
        passed: count === 0,
        score: count === 0 ? 1 : 0,
        detail: `${count} match(es) in ${label}`,
      }
    if (match.startsWith('count:')) {
      const wanted = Number(match.slice('count:'.length))
      return {
        passed: count === wanted,
        score: count === wanted ? 1 : 0,
        detail: `${count} match(es) in ${label}, wanted ${wanted}`,
      }
    }
    return { passed: count > 0, score: count > 0 ? 1 : 0, detail: `${count} match(es) in ${label}` }
  }

  if (grader.type === 'file_exists') {
    const expression = globToRegExp(String(grader.path))
    const hits = workspaceFiles(runDir).filter((file) => expression.test(file))
    return {
      passed: hits.length > 0,
      score: hits.length > 0 ? 1 : 0,
      detail:
        hits.length > 0 ? `matched ${hits.join(', ')}` : `nothing produced matches ${grader.path}`,
    }
  }

  if (grader.type === 'tool_used') {
    const wanted = String(grader.tool).toLowerCase()
    const input = grader.input_match ? new RegExp(String(grader.input_match)) : null
    const calls = toolCalls(readTranscript(runDir).entries).filter(
      (call) => call.name === wanted && (!input || input.test(call.input)),
    )
    const min = grader.min === undefined ? 1 : Number(grader.min)
    const max = grader.max === undefined ? Infinity : Number(grader.max)
    const passed = calls.length >= min && calls.length <= max
    return { passed, score: passed ? 1 : 0, detail: `${calls.length} call(s) to ${grader.tool}` }
  }

  const calls = toolCalls(readTranscript(runDir).entries).map((call) => call.name)
  const before = calls.indexOf(String(grader.before).toLowerCase())
  const after = calls.lastIndexOf(String(grader.after).toLowerCase())
  const passed = before !== -1 && after !== -1 && before < after
  return {
    passed,
    score: passed ? 1 : 0,
    detail: `${grader.before} at ${before}, ${grader.after} at ${after}`,
  }
}

/** Grade one finished run against one case. */
export function gradeRun(caseDir, runDir) {
  return readGraders(caseDir).map((grader) => ({
    name: grader.name,
    type: grader.type,
    ...grade(grader, runDir),
  }))
}

if (argv[1] && import.meta.url === pathToFileURL(argv[1]).href) {
  const args = argv.slice(2)
  if (args[0] === '--validate') {
    const problems = validateCase(args[1] ?? '.')
    if (problems.length === 0) console.log('case is valid')
    else {
      for (const problem of problems) console.error(problem)
      exit(1)
    }
  } else if (args.length < 2) {
    console.error('usage: grade.mjs <case-dir> <run-dir> | grade.mjs --validate <case-dir>')
    exit(1)
  } else {
    console.log(JSON.stringify({ graders: gradeRun(args[0], args[1]) }, null, 2))
  }
}
