/**
 * Pure HTTP basic-auth check for gating non-production surfaces (Storybook,
 * preview deploys). Returns true when the request carries credentials matching
 * the expected pair; when no credentials are configured the gate is open.
 */
export function checkBasicAuth(
  authorizationHeader: string | null | undefined,
  expected: { user: string | undefined; pass: string | undefined },
): boolean {
  if (!expected.user || !expected.pass) return true
  if (!authorizationHeader?.startsWith('Basic ')) return false
  let decoded: string
  try {
    decoded = globalThis.atob(authorizationHeader.slice('Basic '.length))
  } catch {
    return false
  }
  const separator = decoded.indexOf(':')
  if (separator === -1) return false
  const user = decoded.slice(0, separator)
  const pass = decoded.slice(separator + 1)
  return user === expected.user && pass === expected.pass
}
