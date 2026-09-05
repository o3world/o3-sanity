import path from 'node:path'

import { ESLint } from 'eslint'
import { expect, it } from 'vitest'

const eslint = new ESLint()
const filePath = path.resolve('packages/content-ui/src/blocks/section/example/Example.stories.tsx')

it('rejects a section story module without an exported Figma design parameter', async () => {
  const results = await eslint.lintText(
    "// figmaDesign('1:1')\nconst ignored = figmaDesign('1:1');\nexport default {title:'Content/Blocks/Section/Example'};\nexport const Default = {}",
    { filePath },
  )
  expect(
    results
      .flatMap((result) => result.messages)
      .some((message) => message.ruleId === 'o3/figma-design'),
  ).toBe(true)
})

it.each([
  "import {figmaDesign} from '@o3/story-kit'; const meta = {parameters:{design:figmaDesign('1:1')}} satisfies Meta; export default meta; export const Stress = {}",
  "import {figmaDesign as design} from '@o3/story-kit'; export default {title:'Example'}; export const Canonical = {parameters:{design:design('1:1')}}",
])('accepts a real exported design parameter: %s', async (code) => {
  const results = await eslint.lintText(code, { filePath })
  expect(
    results
      .flatMap((result) => result.messages)
      .filter((message) => message.ruleId === 'o3/figma-design'),
  ).toEqual([])
})
