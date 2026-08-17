#!/usr/bin/env node
// The Claude Desktop skill ZIP, which this plugin can no longer produce.
//
// A Desktop custom skill is one folder: the folder is the ZIP root, its name
// matches the frontmatter `name`, and nothing outside it is reachable
// (Anthropic custom-skills docs, verified 2026-08-02 in
// docs/research/claude-desktop-delivery.md). Since #193 the plugin is five
// skills that open by reading `${CLAUDE_PLUGIN_ROOT}/CORE.md` — a variable
// Desktop does not set and a file no single skill folder contains. Any ZIP
// built from one of them ships a skill whose first instruction fails.
//
// So this exits non-zero rather than emitting an artifact that installs and
// then misbehaves. #198 owns the decision: give Desktop its own distribution,
// or retire the surface.
//
// (Claude Code needs no build. This directory is a plugin, installed from git
// via the repo-root .claude-plugin/marketplace.json.)
import { exit, stderr } from 'node:process'

stderr.write(
  [
    'build:skill is disabled.',
    '',
    'The Desktop skill ZIP packages one skill folder. This plugin is five skills',
    'sharing CORE.md and references/ at the plugin root, reached through',
    '${CLAUDE_PLUGIN_ROOT} — a path that does not resolve inside a Desktop skill.',
    'A ZIP built from any one of them uploads cleanly and then fails on its first',
    'instruction, which is worse than no ZIP at all.',
    '',
    'Deciding what Desktop gets instead is #198. Claude Code is unaffected:',
    '  claude plugin marketplace update o3world',
    '  claude plugin install o3sanity@o3world',
    '',
  ].join('\n'),
)
exit(1)
