/** Equal first-paint beats, with the final item starting within 480ms. */
export function heroStagger(itemCount: number): number {
  return Math.min(160, 480 / Math.max(1, itemCount - 1))
}

export const HERO_ENTRANCE = 'animate-hero-wave motion-reduce:animate-none'
