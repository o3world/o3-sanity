/**
 * What the build says each route ships to the browser (#269, spec #260).
 *
 * The ground truth is `.next/diagnostics/route-bundle-stats.json`, which Next
 * writes for every build: per route, the chunks the browser loads before the
 * page is interactive and their uncompressed total. It is the same set the
 * prerendered HTML lists as `<script src>`, which is how it was checked.
 *
 * Uncompressed rather than transferred, because that is the number the file
 * carries and the one that tracks parse and execute time — the part of a
 * bundle a phone pays for after the download finishes.
 */

/** One route's entry in `route-bundle-stats.json`, narrowed to what is read. */
export interface RouteBundle {
  route: string
  firstLoadUncompressedJsBytes: number
  /** `.next/static/chunks/...`, relative to `apps/web`. Reported, not judged. */
  firstLoadChunkPaths: string[]
}

/**
 * A route allowed more than the default, and why. The Studio is the case this
 * exists for: an editing application nobody browses to by accident.
 */
interface BudgetEntry {
  route: string
  bytes: number
  reason: string
}

export interface JsBudget {
  /** What any route may ship without an entry of its own. */
  defaultBytes: number
  routes: BudgetEntry[]
}

export type BudgetProblem =
  /** Ships more JavaScript than it may. */
  | { kind: 'over-budget'; route: string; bytes: number; budgetBytes: number }
  /** Has an entry, and the build has no such route. */
  | { kind: 'unknown-budget'; route: string }

function budgetFor(route: string, budget: JsBudget): number {
  return budget.routes.find((entry) => entry.route === route)?.bytes ?? budget.defaultBytes
}

/** `667149` → `667,149`, because six digits are unreadable without them. */
function thousands(bytes: number): string {
  return bytes.toLocaleString('en-US')
}

/** What a passing route has left, for the run's own report. */
export function headroom(
  bundle: RouteBundle,
  budget: JsBudget,
): { budgetBytes: number; leftBytes: number } {
  const budgetBytes = budgetFor(bundle.route, budget)
  return { budgetBytes, leftBytes: budgetBytes - bundle.firstLoadUncompressedJsBytes }
}

/** One line a reader can act on, starting from the route. */
export function describeBudgetProblem(problem: BudgetProblem): string {
  switch (problem.kind) {
    case 'over-budget':
      return `${problem.route} ships ${thousands(problem.bytes)} bytes of first-load JavaScript and its budget is ${thousands(problem.budgetBytes)}. Every visitor downloads, parses and runs the difference.`
    case 'unknown-budget':
      return `${problem.route} has a JS budget entry and the build has no such route — delete the entry or fix its path.`
  }
}

/**
 * Every way the build can outgrow the budget. An empty array is a pass.
 *
 * A ceiling, unlike the rendering allowlist beside it: that one is the exact
 * set because a per-request route is a cost someone chose, while a route
 * coming in under budget is the outcome the budget exists to produce. What
 * would go stale is an ENTRY — a route excused from the default long after it
 * needed to be — so the run prints every route's headroom whether it passes or
 * not, and an entry with room to spare reads as spent.
 */
export function checkJsBudget(bundles: RouteBundle[], budget: JsBudget): BudgetProblem[] {
  const problems: BudgetProblem[] = []

  for (const bundle of bundles) {
    const budgetBytes = budgetFor(bundle.route, budget)
    if (bundle.firstLoadUncompressedJsBytes <= budgetBytes) continue
    problems.push({
      kind: 'over-budget',
      route: bundle.route,
      bytes: bundle.firstLoadUncompressedJsBytes,
      budgetBytes,
    })
  }

  const routes = new Set(bundles.map((bundle) => bundle.route))
  for (const entry of budget.routes) {
    if (!routes.has(entry.route)) problems.push({ kind: 'unknown-budget', route: entry.route })
  }

  return problems
}
