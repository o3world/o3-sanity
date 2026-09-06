// Integer hashing gives the server and GPU identical seeds; sin-based hashes vary by device.
export function starHash(n: number) {
  let x = n >>> 0
  x = Math.imul(x ^ (x >>> 16), 0x7feb352d) >>> 0
  x = Math.imul(x ^ (x >>> 15), 0x846ca68b) >>> 0
  x = (x ^ (x >>> 16)) >>> 0
  return (x & 0xffffff) / 16777216
}

export const starHashWGSL = /* wgsl */ `
fn stableStarHash(n: f32) -> f32 {
  var x = u32(n);
  x = (x ^ (x >> 16u)) * 0x7feb352du;
  x = (x ^ (x >> 15u)) * 0x846ca68bu;
  x = x ^ (x >> 16u);
  return f32(x & 0xffffffu) / 16777216.0;
}
`
