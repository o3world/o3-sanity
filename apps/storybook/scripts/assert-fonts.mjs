import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'

import postcss from 'postcss'

try {
  const output = path.resolve(process.argv[2] ?? 'storybook-static')
  const assets = path.join(output, 'assets')
  const fontFaces = new Map([
    ['Figtree Variable', 0],
    ['Newsreader Variable', 0],
  ])

  for (const name of readdirSync(assets, { recursive: true })) {
    if (!name.endsWith('.css')) continue
    const cssPath = path.join(assets, name)
    const css = postcss.parse(readFileSync(cssPath, 'utf8'), { from: cssPath })

    css.walkAtRules('font-face', (face) => {
      let family
      let source
      face.walkDecls('font-family', (decl) => {
        family = decl.value
      })
      face.walkDecls('src', (decl) => {
        source = decl.value
      })
      const font = family?.replace(/['"]/g, '')
      if (!fontFaces.has(font)) return

      fontFaces.set(font, fontFaces.get(font) + 1)
      const urls = [...(source ?? '').matchAll(/url\(\s*['"]?([^'")\s]+)['"]?\s*\)/g)]
      assert.ok(urls.length, font + ' declares no font asset')
      for (const [, url] of urls) {
        assert.ok(!/^(?:[a-z]+:|\/\/)/i.test(url), font + ' must use a bundled local font')
        const pathname = decodeURIComponent(url.split(/[?#]/)[0])
        const file = pathname.startsWith('/')
          ? path.join(output, pathname)
          : path.resolve(path.dirname(cssPath), pathname)
        const relative = path.relative(output, file)
        assert.ok(
          !relative.startsWith('..') && !path.isAbsolute(relative),
          'Font escapes build output',
        )
        const bytes = readFileSync(file)
        assert.equal(
          bytes.subarray(0, 4).toString('ascii'),
          'wOF2',
          'Expected a WOFF2 font: ' + url,
        )
      }
    })
  }

  for (const [family, count] of fontFaces) {
    assert.ok(count > 0, 'Built Storybook has no ' + family + ' font faces')
    console.log('Verified ' + count + ' bundled ' + family + ' font faces')
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
}
