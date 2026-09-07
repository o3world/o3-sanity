/** Join the current scroll position on first paint; ease only subsequent movement. */
export function workStarCameraY(previous: number | undefined, destination: number, dt: number) {
  return previous === undefined
    ? destination
    : previous + (destination - previous) * (1 - Math.exp(-dt * 5))
}
