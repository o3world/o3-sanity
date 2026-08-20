#!/usr/bin/env node
// Run-scoped fixture ids, and the ledger teardown reads.
//
// Every run shares one `development` dataset, so two runs that seed the same
// fixture id write over each other and either one's teardown deletes the
// other's documents. A run therefore mints a tag and puts it on every id it
// creates — `brief-eval-typeset-insight--k3f9q2` — which makes the ids unique
// and makes teardown a query over the run's own tag rather than over `eval-`.
//
// The tag is a dataset-only detail. `settle` strips it back out of everything
// the run captured, so a grader still matches the id the case wrote and no
// case file has to know a tag exists. What the tag cannot reach — a piece
// document, whose id the skill under test derives and whose shape is the thing
// the typeset cases check — is covered by the ledger instead: every id the run
// brought into being, written down as it happened, and deleted by name.
//
//   node fixtures.mjs new <run-dir>            mint the tag, print it
//   node fixtures.mjs scope <run-dir> <id>…    tag document ids, and record them
//   node fixtures.mjs tag <run-dir> <value>…   tag a key or a slug — no ledger entry
//   node fixtures.mjs record <run-dir> <id>…   record an id the harness did not choose
//   node fixtures.mjs settle <run-dir>         strip the tag from what was captured
//   node fixtures.mjs teardown <run-dir>       what to discard, as JSON
import { randomBytes } from 'node:crypto'
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { basename, dirname, join } from 'node:path'
import { argv, exit } from 'node:process'
import { pathToFileURL } from 'node:url'

/** Where the tag and the ledger live: beside the run, never inside `workspace/`. */
const RUN_ID_FILE = 'run-id.txt'
const LEDGER_FILE = 'created-ids.txt'

/**
 * `settle` rewrites what the run produced and leaves the harness's own files
 * alone. The ledger has to keep the tag — it is what teardown deletes by — and
 * `notes.md` is ungraded, so naming the tag there is how a half-finished run
 * stays traceable.
 */
const HARNESS_FILES = [RUN_ID_FILE, LEDGER_FILE, 'notes.md']

/** Six base36 characters, and a separator no slug produces on its own. */
export function mintRunId() {
  let id = ''
  while (id.length < 6) id += randomBytes(8).readUInt32BE(0).toString(36)
  return id.slice(0, 6)
}

export const isRunId = (value) => /^[a-z0-9]{6,}$/.test(String(value))

const tagOf = (runId) => `--${runId}`

/** Idempotent: scoping an already-scoped id is a no-op, not a double tag. */
export function scopeId(id, runId) {
  if (!isRunId(runId)) throw new Error(`not a run id: ${runId}`)
  const tag = tagOf(runId)
  return String(id).endsWith(tag) ? String(id) : `${id}${tag}`
}

/** The inverse, over arbitrary text: ids inside JSON, prose, or a file name. */
export function unscope(text, runId) {
  if (!isRunId(runId)) throw new Error(`not a run id: ${runId}`)
  return String(text).split(tagOf(runId)).join('')
}

export function readRunId(runDir) {
  const path = join(runDir, RUN_ID_FILE)
  if (!existsSync(path)) return null
  const id = readFileSync(path, 'utf8').trim()
  return isRunId(id) ? id : null
}

export function newRun(runDir) {
  const existing = readRunId(runDir)
  if (existing) return existing
  const runId = mintRunId()
  mkdirSync(runDir, { recursive: true })
  writeFileSync(join(runDir, RUN_ID_FILE), `${runId}\n`)
  return runId
}

/** The ledger holds published ids; a draft is addressed from one at teardown. */
const published = (id) => String(id).replace(/^drafts\./, '')

export function readLedger(runDir) {
  const path = join(runDir, LEDGER_FILE)
  if (!existsSync(path)) return []
  return readFileSync(path, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
}

export function recordIds(runDir, ids) {
  const ledger = readLedger(runDir)
  for (const id of ids.map(published)) if (id && !ledger.includes(id)) ledger.push(id)
  mkdirSync(runDir, { recursive: true })
  writeFileSync(join(runDir, LEDGER_FILE), ledger.map((id) => `${id}\n`).join(''))
  return ledger
}

function walk(dir) {
  const found = []
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) found.push(...walk(path))
    else found.push(path)
  }
  return found
}

/**
 * Take the tag back out of everything the run captured — file contents first,
 * then the names. A file with a NUL byte is left as bytes and only renamed; a
 * run that captures a binary artifact should not have it rewritten as text.
 */
export function settleRun(runDir, runId = readRunId(runDir)) {
  if (!isRunId(runId)) throw new Error(`no run id for ${runDir}`)
  const rewritten = []
  const renamed = []
  for (const path of walk(runDir)) {
    if (HARNESS_FILES.includes(basename(path)) && dirname(path) === runDir) continue
    const bytes = readFileSync(path)
    if (!bytes.includes(0)) {
      const before = bytes.toString('utf8')
      const after = unscope(before, runId)
      if (after !== before) {
        writeFileSync(path, after)
        rewritten.push(path)
      }
    }
    const name = basename(path)
    const stable = unscope(name, runId)
    if (stable !== name) {
      const target = join(dirname(path), stable)
      renameSync(path, target)
      renamed.push([path, target])
    }
  }
  return { runId, rewritten, renamed }
}

/**
 * What teardown deletes: every id the run wrote down, published and draft, plus
 * a sweep for anything the ledger missed. GROQ's `match` tokenises on the
 * non-alphanumerics in an id, so the tag is a token of its own and the sweep
 * needs no wildcards.
 */
export function teardownPlan(runDir) {
  const runId = readRunId(runDir)
  const ledger = readLedger(runDir)
  return {
    runId,
    ids: ledger.flatMap((id) => [id, `drafts.${id}`]),
    sweep: runId ? `*[_id match "${runId}"]._id` : null,
  }
}

if (argv[1] && import.meta.url === pathToFileURL(argv[1]).href) {
  const [command, runDir, ...rest] = argv.slice(2)
  const usage = () => {
    console.error(
      'usage: fixtures.mjs new|settle|teardown <run-dir> | fixtures.mjs scope|tag|record <run-dir> <value>…',
    )
    exit(1)
  }
  if (!command || !runDir) usage()
  else if (command === 'new') console.log(newRun(runDir))
  else if (command === 'scope' || command === 'tag') {
    const runId = readRunId(runDir)
    if (!runId) {
      console.error(`${runDir} has no ${RUN_ID_FILE} — run \`fixtures.mjs new\` first`)
      exit(1)
    }
    const scoped = rest.map((value) => scopeId(value, runId))
    if (command === 'scope') recordIds(runDir, scoped)
    for (const value of scoped) console.log(value)
  } else if (command === 'record') for (const id of recordIds(runDir, rest)) console.log(id)
  else if (command === 'settle') {
    const { rewritten, renamed } = settleRun(runDir)
    console.log(`rewrote ${rewritten.length} file(s), renamed ${renamed.length}`)
  } else if (command === 'teardown') console.log(JSON.stringify(teardownPlan(runDir), null, 2))
  else usage()
}
