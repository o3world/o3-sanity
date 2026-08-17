---
name: References read
tags: [smoke]
plugins: ['../..']
runs: 1
max_turns: 8
timeout_seconds: 300
allowed_tools: [Read, Glob, Write]
model: sonnet
---

The o3sanity plugin carries its writing references as files: a `references/`
directory at the plugin root, holding `argument.md`, `composition.md` and
`style.md`. Every skill in this plugin reads them before writing a word, so a
run that cannot reach them produces guesswork in the house voice.

Check that the references are reachable and complete:

1. Find the `references/` directory the installed plugin ships and read all
   three files from it. Read each one — a file you did not open is a file you
   cannot vouch for.
2. Write what you read to `references.json` in your working directory: a JSON
   array of one `{"file": …, "words": …}` object per file, in the order
   `argument.md`, `composition.md`, `style.md`. `file` is the bare filename and
   `words` is an integer word count. Only those two fields, and no wrapper.
3. Report each file and its word count, one per line.
4. End your reply with a machine-readable last line, and nothing after it:

   ```
   BLOCKING: false (<reason>)
   ```

   Report `false` if all three files were there and each carried a body.
   Report `true` if any is missing or empty, naming which in the reason.

This run reads and never writes outside its own working directory. Touch no
Sanity document, and never address the `production` dataset.
