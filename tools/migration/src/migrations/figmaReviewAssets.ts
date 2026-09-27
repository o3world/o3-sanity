import { createReadStream, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { getCliClient } from 'sanity/cli'

const client = getCliClient({ apiVersion: '2026-07-01' })
const args = process.argv.slice(2)
const directory = args[args.indexOf('--directory') + 1]
if (
  !args.includes('--directory') ||
  !directory ||
  !args.includes('--dataset') ||
  args[args.indexOf('--dataset') + 1] !== 'production' ||
  client.config().dataset !== 'production' ||
  client.config().projectId !== 'naorcr6k'
)
  throw new Error('Requires the reviewed asset directory and naorcr6k --dataset production')
const assetDirectory = directory
const sources = JSON.parse(
  readFileSync(resolve(assetDirectory, 'exported-assets.json'), 'utf8'),
) as Record<string, string>
console.log(JSON.stringify(sources, null, 2))
async function main() {
  if (!args.includes('--apply')) return
  const assets: Record<string, string> = {}
  for (const [name, node] of Object.entries(sources)) {
    const asset = await client.assets.upload(
      'image',
      createReadStream(resolve(assetDirectory, `${name}.png`)),
      {
        filename: `figma-review-${name}.png`,
        source: {
          id: node,
          name: 'Figma 2402903657143566810',
          url: `https://www.figma.com/design/RvraLJaZ0zWm8UaD5AJf43?node-id=${node.replace(':', '-')}`,
        },
      },
    )
    assets[name] = asset._id
  }
  writeFileSync(resolve(assetDirectory, 'uploaded-assets.json'), JSON.stringify(assets, null, 2))
  console.log(assets)
}
main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
