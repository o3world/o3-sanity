/**
 * Reading a corpus off disk. Two registrations, one source shape: a declared
 * list (each row names its file) and a globbed directory (each file names
 * itself in frontmatter).
 */
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

import type { CorpusSource } from './plan'

/**
 * Leading `---` block, if there is one: `key: value` lines, everything else
 * ignored. The closing fence must end its line — otherwise `\n---` inside a
 * longer dash run would close the block mid-line and swallow real body text.
 */
const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n+|$)/

type Frontmatter = { data: Record<string, string>; body: string }

/**
 * Frontmatter is registration for the globbed corpus and packaging metadata for
 * the skill loader in the declared one. Either way it is not the document, so
 * it never reaches the body.
 */
function parseFrontmatter(markdown: string): Frontmatter {
  const match = FRONTMATTER.exec(markdown)
  if (!match) return { data: {}, body: markdown.trim() }

  const [matched, block = ''] = match
  const data: Record<string, string> = {}
  for (const line of block.split(/\r?\n/)) {
    const [, field, value = ''] = /^([A-Za-z][\w-]*):\s*(.*)$/.exec(line) ?? []
    // Only a matched pair is quoting; a lone quote is part of the value.
    if (field) data[field] = value.trim().replace(/^(['"])(.*)\1$/, '$2')
  }

  return { data, body: markdown.slice(matched.length).trim() }
}

function sourceFrom(root: string, sourcePath: string): Frontmatter {
  const parsed = parseFrontmatter(readFileSync(join(root, sourcePath), 'utf8'))
  if (!parsed.body) throw new Error(`${sourcePath} is empty after stripping frontmatter`)
  return parsed
}

/** A declared corpus row: the file is named here rather than naming itself. */
export type SourceDeclaration = { key: string; title: string; sourcePath: string }

/** A declared corpus: one row per document, the file supplying only the body. */
export function readDeclaredSources(
  root: string,
  declarations: readonly SourceDeclaration[],
): CorpusSource[] {
  return declarations.map((declaration) => ({
    key: declaration.key,
    title: declaration.title,
    body: sourceFrom(root, declaration.sourcePath).body,
    sourcePath: declaration.sourcePath,
  }))
}

/**
 * The key grammar: lowercase kebab, so the deterministic `<type>-<key>` id
 * stays unambiguous everywhere it is matched.
 */
const KEY = /^[a-z0-9]+(-[a-z0-9]+)*$/

/**
 * Deleting the last file in a globbed corpus deletes the directory too — git
 * does not track an empty one — and sync has to run on that checkout to retire
 * the document the file left behind in the dataset. So a directory that is not
 * there is a corpus of nothing, and any other read error is still an error.
 */
function markdownIn(directory: string): string[] {
  try {
    return readdirSync(directory)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return []
    throw error
  }
}

/**
 * A globbed corpus directory: every markdown file in it is a document, and its
 * frontmatter `key` and `title` are the whole registration. Sorted by path, so
 * a plan reads the same on every machine.
 */
export function readGlobbedSources(root: string, directory: string): CorpusSource[] {
  const files = markdownIn(join(root, directory))
    .filter((file) => file.endsWith('.md'))
    .sort()

  const claimed = new Map<string, string>()
  return files.map((file) => {
    const sourcePath = `${directory}/${file}`
    const { data, body } = sourceFrom(root, sourcePath)
    const { key, title } = data
    if (!key) throw new Error(`${sourcePath} has no \`key\` in its frontmatter`)
    if (!title) throw new Error(`${sourcePath} has no \`title\` in its frontmatter`)
    if (!KEY.test(key)) {
      throw new Error(`${sourcePath} declares key "${key}", which is not lowercase kebab-case`)
    }
    /* Two sources sharing a key map to one _id: sync would last-write-win
     * silently and check would report a drift that names neither file. */
    const rival = claimed.get(key)
    if (rival) throw new Error(`${sourcePath} and ${rival} both declare key "${key}"`)
    claimed.set(key, sourcePath)
    return { key, title, body, sourcePath }
  })
}
