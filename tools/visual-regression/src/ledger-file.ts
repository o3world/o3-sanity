/**
 * The ledger on disk (#339): one committed JSON file, read and written and
 * nothing else. Every rule about what the bytes look like is `ledger.ts`'s.
 *
 * It lives under `data/` beside the tool that reads it, the way
 * `tools/figma-sync/data/` and `tools/migration/data/assets.json` do — a
 * decision in git, reviewed in a diff, not an artifact under `.vr/`.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { parseLedger, serializeLedger, type Ledger } from './ledger'

/** `tools/visual-regression/data/figma-ledger.json`. */
export const LEDGER_FILE = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'data',
  'figma-ledger.json',
)

export function readLedger(file: string = LEDGER_FILE): Ledger {
  if (!fs.existsSync(file)) return parseLedger('')
  return parseLedger(fs.readFileSync(file, 'utf8'))
}

/** Writes only when the bytes differ, so an accept that accepted nothing leaves
 *  the file's mtime alone as well as its content. */
export function writeLedger(ledger: Ledger, file: string = LEDGER_FILE): boolean {
  const text = serializeLedger(ledger)
  if (fs.existsSync(file) && fs.readFileSync(file, 'utf8') === text) return false
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, text)
  return true
}
