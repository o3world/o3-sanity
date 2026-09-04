# Performance probe

`pnpm perf` measures the four routes that represent the initial-load shapes of the O3 site:

- `/`
- `/insights`
- `/work`
- `/work/best-egg`

Build the web app, then run the probe:

```bash
pnpm --filter @o3/web build
pnpm perf
```

To measure the same commit on a production alias instead:

```bash
pnpm perf -- --url https://your-production-alias.example
```

The probe creates a fresh browser context for each sample, blocks service workers, and applies one fixed mobile viewport, CPU slowdown, latency, and bandwidth profile before navigation. Each route gets two consecutive cold loads. LCP comes from the browser's paint entry. CLS uses the largest layout-shift session window. TBT sums the blocking portion of long tasks between FCP and the first standard five-second TTI quiet window (no long tasks and no more than two concurrent resource requests). INP is the longest Event Timing duration produced by opening the site's mobile menu after the load metrics are captured.

The report prints the applied profile, both samples, and the tolerance used to check their agreement. An unstable route exits nonzero so a local run cannot be mistaken for a baseline, but the browser probe itself is deliberately absent from Turbo and CI.
