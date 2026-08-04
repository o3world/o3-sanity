import { describe, expect, it } from 'vitest'

import { stripRenderNonces } from './nonces'

/** The real markup, from the one post that carries a Gravity Form. */
const tag = (value: string) =>
  `<input type='hidden' class='gform_hidden' name='gform_currency' data-currency='USD' value='${value}' />`

describe('stripRenderNonces', () => {
  it('makes two renders of the same form equal', () => {
    const first = `<p>Body</p>${tag('2l10tmN01ZM0m8v5OVuiLryh5cRbEg+x5wdGF1Y8/OJu=')}`
    const second = `<p>Body</p>${tag('McrMspenXRjyTFWZsNPlfJiWOfW4l00U9R2J2Rof1TBa=')}`
    expect(stripRenderNonces(first)).toBe(stripRenderNonces(second))
  })

  it('leaves the neighbouring hidden inputs alone', () => {
    const html =
      `<input type='hidden' class='gform_hidden' name='gform_submit' value='9' />` + tag('abc=')
    const out = stripRenderNonces(html)
    expect(out).toContain(`name='gform_submit' value='9'`)
    expect(out).not.toContain(`value='abc='`)
  })

  it('normalizes whatever the attribute order is', () => {
    const valueFirst = `<input value='abc=' class='gform_hidden' name='gform_currency' />`
    const nameFirst = `<input class='gform_hidden' name='gform_currency' value='xyz=' />`
    expect(stripRenderNonces(valueFirst)).toBe(
      `<input value='__O3_MIGRATION_RENDER_NONCE__' class='gform_hidden' name='gform_currency' />`,
    )
    expect(stripRenderNonces(nameFirst)).toContain('__O3_MIGRATION_RENDER_NONCE__')
  })

  it('walks nested extract records, not just top-level strings', () => {
    const record = { fields: { flexible_post_content: [{ text_editor: tag('abc=') }] } }
    const out = stripRenderNonces(record)
    expect(out.fields.flexible_post_content[0]!.text_editor).toContain(
      '__O3_MIGRATION_RENDER_NONCE__',
    )
  })

  it('changes nothing in content that has no form in it', () => {
    const post = { title: 'A post', body: "<p>value='looks like an attribute'</p>", n: 3 }
    expect(stripRenderNonces(post)).toEqual(post)
  })

  it('is idempotent, so a re-extract of stripped content is still a no-op', () => {
    const once = stripRenderNonces(tag('abc='))
    expect(stripRenderNonces(once)).toBe(once)
  })
})
