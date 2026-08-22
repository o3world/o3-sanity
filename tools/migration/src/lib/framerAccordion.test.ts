import { describe, expect, it } from 'vitest'

import { pageModuleUrls, parseAccordion } from './framerAccordion'

/**
 * The two shapes Framer compiles an accordion row into, written out the way its
 * minifier writes them.
 *
 * `Closed`/`Opened` is the pair every row that sets its answer as a prop uses —
 * the opened variant binds `text:S` and draws whatever the instance passed.
 * `Closed1`/`Opened1` is the pair a row gets when the designer typed into the
 * opened variant instead: that variant hard-codes its copy in `children:` runs
 * and binds nothing, and the instance's own prop is left at the component's
 * default. On the live page the default is another row's answer, which is why
 * the variant text has to win.
 */
const MODULE = [
  'De={Closed:`t7Z`,Closed1:`j3n`,Opened:`lKe`,Opened1:`uIJ`},',
  'ke=({title:i,text2:r,...o})=>({...o,KDq:i??o.KDq??`How do we start?`,',
  'Wyf:r??o.Wyf??`Building fits when the systems are yours; buying fits when the tool already is.`}),',
  'X=...U({lKe:{children:o(r,{children:o(d.p,{style:{"--framer-font-weight":`300`},',
  'children:`Building fits when the systems are yours; buying fits when the tool already is.`})}),',
  'fonts:[`GF;Figtree-300`],text:S},',
  'uIJ:{children:o(r,{children:l(d.p,{style:{"--framer-font-weight":`300`},',
  'children:[`The answer the designer typed into the opened variant, ending in `,',
  'o(E,{href:x,children:o(d.a,{children:`a link.`})})]})}),fonts:[`GF;Figtree-300`]}},w,O)',
  'p1=o(G,{id:`a`,KDq:`How do we start?`,variant:Y(`j3n`),Wyf:`Building fits when the systems are yours; buying fits when the tool already is.`}),',
  'p2=o(G,{id:`b`,KDq:`Should we build or buy?`,variant:Y(`t7Z`),',
  'Wyf:`Building fits when the systems are yours; buying fits when the tool already is.`})',
].join('')

describe('reading an accordion out of a page module', () => {
  const rows = parseAccordion(MODULE)

  it('reads one row per instance, in page order', () => {
    expect(rows.map((row) => row.question)).toEqual(['How do we start?', 'Should we build or buy?'])
  })

  it('prefers the opened variant’s own copy over a prop the instance never set', () => {
    // The whole point: row one's prop holds row two's answer, so a parse that
    // trusted the prop would publish the same paragraph twice.
    expect(rows[0]!.answer).toBe(
      'The answer the designer typed into the opened variant, ending in a link.',
    )
  })

  it('takes the prop where the opened variant binds it', () => {
    expect(rows[1]!.answer).toBe(
      'Building fits when the systems are yours; buying fits when the tool already is.',
    )
  })

  it('refuses two rows that read one answer, rather than publishing it twice', () => {
    const duplicated = MODULE.replace('uIJ:{children:', 'uIJx:{children:')
    expect(() => parseAccordion(duplicated)).toThrow(/two accordion rows read the same answer/)
  })

  it('finds no accordion in a module that builds none', () => {
    expect(parseAccordion('var a=`hello`,b=`world`')).toEqual([])
  })
})

describe('which modules a page’s own code is in', () => {
  const html = [
    '<link rel="modulepreload" href="https://f.example/sites/x/react.AAA.mjs">',
    '<link rel="modulepreload" href="https://f.example/sites/x/motion.BBB.mjs">',
    '<link rel="modulepreload" href="https://f.example/sites/x/PageAbc.CCC.mjs">',
    '<link rel="stylesheet" href="https://f.example/sites/x/styles.css">',
  ].join('')

  it('keeps the page modules and drops the shared runtime', () => {
    expect(pageModuleUrls(html)).toEqual(['https://f.example/sites/x/PageAbc.CCC.mjs'])
  })
})
