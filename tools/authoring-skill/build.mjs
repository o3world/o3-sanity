#!/usr/bin/env node
// Builds the uploadable Claude Desktop skill ZIP from the checked-in source.
// The ZIP is a build artifact — never hand-edit it, never commit it.
// (Claude Code needs no build: this directory is a plugin, installed straight
// from git via the repo-root .claude-plugin/marketplace.json.)
//
// Packaging contract (Anthropic custom-skills docs, verified 2026-08-02 in
// docs/research/claude-desktop-delivery.md): the skill folder is the ZIP
// root, the folder name matches the frontmatter `name` (≤64 chars), and
// `description` is ≤200 chars.
import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(fileURLToPath(import.meta.url))
const skillsRoot = join(root, 'skills')
const skillDir = 'o3-authoring'
const skillMd = readFileSync(join(skillsRoot, skillDir, 'SKILL.md'), 'utf8')

const frontmatter = skillMd.match(/^---\n([\s\S]*?)\n---/)?.[1]
if (!frontmatter) throw new Error('SKILL.md has no frontmatter')
const field = (key) => frontmatter.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'))?.[1].trim() ?? ''

const name = field('name')
const description = field('description')
if (name !== skillDir) throw new Error(`frontmatter name "${name}" must match folder "${skillDir}"`)
if (name.length > 64) throw new Error(`name is ${name.length} chars (max 64)`)
if (description.length > 200)
  throw new Error(`description is ${description.length} chars (max 200)`)

const outDir = join(root, 'dist')
rmSync(outDir, { recursive: true, force: true })
mkdirSync(outDir)
const zipPath = join(outDir, `${name}.zip`)
execFileSync('zip', ['-r', zipPath, skillDir], { cwd: skillsRoot, stdio: 'inherit' })
console.log(`\nBuilt ${zipPath}`)
console.log(
  'Upload at claude.ai → Settings → Customize → Skills (re-upload to update; shared/org-provisioned recipients update automatically).',
)
