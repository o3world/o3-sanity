/**
 * Reading a corpus off disk. Two registrations, one source shape: a declared
 * list (each row names its file) and a globbed directory (each file names
 * itself in frontmatter).
 */
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

import type { CorpusSource } from './plan'

/** Leading `---` block, if there is one: `key: value` lines, everything else ignored. */
const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n*/

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
    if (field) data[field] = value.trim().replace(/^['"]|['"]$/g, '')
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
 * A globbed corpus directory: every markdown file in it is a document, and its
 * frontmatter `key` and `title` are the whole registration. Sorted by path, so
 * a plan reads the same on every machine.
 */
export function readGlobbedSources(root: string, directory: string): CorpusSource[] {
  const files = readdirSync(join(root, directory))
    .filter((file) => file.endsWith('.md'))
    .sort()

  return files.map((file) => {
    const sourcePath = `${directory}/${file}`
    const { data, body } = sourceFrom(root, sourcePath)
    const { key, title } = data
    if (!key) throw new Error(`${sourcePath} has no \`key\` in its frontmatter`)
    if (!title) throw new Error(`${sourcePath} has no \`title\` in its frontmatter`)
    return { key, title, body, sourcePath }
  })
}
