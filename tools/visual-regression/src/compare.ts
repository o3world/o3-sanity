/**
 * The pixel comparison itself, and the one interesting decision in it: what to
 * do when a story got taller.
 *
 * pixelmatch needs two images of the same size. Padding both to the union size
 * — rather than cropping to the overlap — means a section that grew by 200px
 * shows those 200px as the difference they are, instead of being cropped out of
 * the comparison and reported as "no change".
 */
import fs from 'node:fs'
import path from 'node:path'

import pixelmatch from 'pixelmatch'
import { PNG } from 'pngjs'

import type { Shot } from './capture'

export type Verdict = 'unchanged' | 'changed' | 'added' | 'removed' | 'error'

export interface Comparison {
  storyId: string
  title: string
  name: string
  viewport: string
  verdict: Verdict
  /** Fraction of compared pixels that differ, 0–1. */
  ratio: number
  changedPixels: number
  resized: boolean
  baselineSize?: { width: number; height: number }
  currentSize?: { width: number; height: number }
  error?: string
  files: { baseline?: string; current?: string; diff?: string }
}

/** The report sizes a card from this, so a one-sided verdict still needs it. */
function sizeOf(file: string): { width: number; height: number } | undefined {
  if (!fs.existsSync(file)) return undefined
  const image = PNG.sync.read(fs.readFileSync(file))
  return { width: image.width, height: image.height }
}

function pad(image: PNG, width: number, height: number): PNG {
  if (image.width === width && image.height === height) return image
  const padded = new PNG({ width, height })
  // Transparent, not white: a white pad against a white page reads as "no
  // change" in the area that is precisely the change.
  padded.data.fill(0)
  PNG.bitblt(image, padded, 0, 0, image.width, image.height, 0, 0)
  return padded
}

export function compare(options: {
  baseline: Shot | undefined
  current: Shot | undefined
  diffDir: string
  threshold: number
  maxDiffRatio: number
}): Comparison {
  const { baseline, current } = options
  const shot = current ?? baseline
  if (!shot) throw new Error('compare() needs at least one side')

  const result: Comparison = {
    storyId: shot.storyId,
    title: shot.title,
    name: shot.name,
    viewport: shot.viewport,
    verdict: 'unchanged',
    ratio: 0,
    changedPixels: 0,
    resized: false,
    files: { baseline: baseline?.file, current: current?.file },
  }

  const error = current?.error ?? baseline?.error
  if (error !== undefined) {
    result.verdict = 'error'
    result.error = error
    return result
  }
  if (!current || !fs.existsSync(current.file)) {
    result.verdict = 'removed'
    result.baselineSize = baseline ? sizeOf(baseline.file) : undefined
    return result
  }
  if (!baseline || !fs.existsSync(baseline.file)) {
    result.verdict = 'added'
    result.currentSize = sizeOf(current.file)
    return result
  }

  const before = PNG.sync.read(fs.readFileSync(baseline.file))
  const after = PNG.sync.read(fs.readFileSync(current.file))
  result.baselineSize = { width: before.width, height: before.height }
  result.currentSize = { width: after.width, height: after.height }
  result.resized = before.width !== after.width || before.height !== after.height

  const width = Math.max(before.width, after.width)
  const height = Math.max(before.height, after.height)
  const diff = new PNG({ width, height })
  const changed = pixelmatch(
    pad(before, width, height).data,
    pad(after, width, height).data,
    diff.data,
    width,
    height,
    { threshold: options.threshold, alpha: 0.15 },
  )

  result.changedPixels = changed
  result.ratio = changed / (width * height)
  if (result.ratio > options.maxDiffRatio) {
    result.verdict = 'changed'
    const file = path.join(options.diffDir, path.basename(current.file))
    fs.mkdirSync(options.diffDir, { recursive: true })
    fs.writeFileSync(file, PNG.sync.write(diff))
    result.files.diff = file
  }

  return result
}
