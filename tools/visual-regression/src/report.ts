/**
 * The report: one self-contained HTML file, opened in your browser.
 *
 * Images are referenced, not inlined — a run over a wide change can be 200 MB
 * of PNGs, and a browser handles that far better as files than as one document.
 * It follows that the report only opens from its own directory; moving the HTML
 * out of `.vr/report/` leaves the images behind.
 */
import fs from 'node:fs'
import path from 'node:path'

import type { Comparison, Verdict } from './compare'

export interface ReportMeta {
  baseRef: string
  baseSha: string
  head: string
  storyCount: number
  viewports: string[]
  everything: boolean
  generatedAt: string
}

const ORDER: Verdict[] = ['changed', 'error', 'added', 'removed', 'unchanged']

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        character
      ] as string,
  )
}

/**
 * JSON for an inline `<script>`.
 *
 * `JSON.stringify` escapes nothing HTML cares about, so a story error carrying
 * the literal text `</script>` — and a React error message quoting markup is
 * exactly that — would close the block and blank the whole report. Escaping
 * every `<` leaves a JSON parser the same string and an HTML one no tag.
 */
function embedJson(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}

function relative(reportDir: string, file: string | undefined): string | null {
  return file ? path.relative(reportDir, file).split(path.sep).join('/') : null
}

export function writeReport(
  reportDir: string,
  comparisons: Comparison[],
  meta: ReportMeta,
): string {
  fs.mkdirSync(reportDir, { recursive: true })

  const sorted = [...comparisons].sort(
    (a, b) =>
      ORDER.indexOf(a.verdict) - ORDER.indexOf(b.verdict) ||
      b.ratio - a.ratio ||
      a.storyId.localeCompare(b.storyId) ||
      a.viewport.localeCompare(b.viewport),
  )

  const data = sorted.map((comparison) => ({
    id: `${comparison.storyId}--${comparison.viewport}`,
    storyId: comparison.storyId,
    label: `${comparison.title} / ${comparison.name}`,
    viewport: comparison.viewport,
    verdict: comparison.verdict,
    ratio: comparison.ratio,
    changedPixels: comparison.changedPixels,
    resized: comparison.resized,
    baselineSize: comparison.baselineSize,
    currentSize: comparison.currentSize,
    error: comparison.error,
    baseline: relative(reportDir, comparison.files.baseline),
    current: relative(reportDir, comparison.files.current),
    diff: relative(reportDir, comparison.files.diff),
  }))

  const counts = ORDER.reduce<Record<string, number>>(
    (totals, verdict) => ({
      ...totals,
      [verdict]: comparisons.filter((comparison) => comparison.verdict === verdict).length,
    }),
    {},
  )

  const file = path.join(reportDir, 'index.html')
  fs.writeFileSync(file, page(data, counts, meta))
  return file
}

function page(data: unknown[], counts: Record<string, number>, meta: ReportMeta): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Visual regression — ${escapeHtml(meta.head)} vs ${escapeHtml(meta.baseRef)}</title>
<style>
  :root {
    color-scheme: dark;
    --bg: #0d0f12; --panel: #15181d; --line: #262b33; --text: #e7ebf0; --dim: #8b93a1;
    --changed: #ff6b5e; --added: #59c2ff; --removed: #b18bff; --error: #ffb454; --unchanged: #3fb950;
  }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--text);
    font: 14px/1.5 ui-sans-serif, -apple-system, "Segoe UI", system-ui, sans-serif; }
  header { position: sticky; top: 0; z-index: 5; display: flex; flex-wrap: wrap; gap: 12px 24px;
    align-items: baseline; padding: 16px 24px; background: var(--panel);
    border-bottom: 1px solid var(--line); }
  h1 { font-size: 15px; margin: 0; font-weight: 600; letter-spacing: .01em; }
  .meta { color: var(--dim); font-size: 12px; }
  .pills { display: flex; gap: 8px; margin-left: auto; flex-wrap: wrap; }
  .pill { font-size: 12px; padding: 2px 10px; border-radius: 999px; border: 1px solid var(--line);
    background: #0d0f12; cursor: pointer; color: var(--dim); }
  .pill[aria-pressed="true"] { color: var(--text); border-color: currentColor; }
  .pill .dot { display: inline-block; width: 7px; height: 7px; border-radius: 50%; margin-right: 6px; }
  main { padding: 24px; display: flex; flex-direction: column; gap: 32px; max-width: 1600px; }
  .card { border: 1px solid var(--line); border-radius: 10px; background: var(--panel); overflow: hidden; }
  .card > .head { display: flex; gap: 12px; align-items: center; padding: 12px 16px;
    border-bottom: 1px solid var(--line); flex-wrap: wrap; }
  .card h2 { font-size: 14px; margin: 0; font-weight: 600; }
  .tag { font-size: 11px; text-transform: uppercase; letter-spacing: .06em; padding: 2px 8px;
    border-radius: 4px; border: 1px solid currentColor; }
  .changed { color: var(--changed); } .added { color: var(--added); }
  .removed { color: var(--removed); } .error { color: var(--error); } .unchanged { color: var(--unchanged); }
  .modes { margin-left: auto; display: flex; gap: 4px; }
  .modes button { font: inherit; font-size: 12px; padding: 3px 10px; border-radius: 6px;
    border: 1px solid var(--line); background: transparent; color: var(--dim); cursor: pointer; }
  .modes button[aria-pressed="true"] { color: var(--text); background: #202631; }
  /* A story is captured at its own width; showing it any wider is a lie about
     what it looks like, and a full-page shot of a long story is taller than any
     screen — hence the natural-width cap and the scroll container. */
  .stage { padding: 16px; background: #0a0c0f; max-height: 78vh; overflow: auto; }
  .frame { max-width: var(--nw, 100%); margin: 0 auto; }
  .pair { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; align-items: start;
    max-width: calc(var(--nw, 100%) * 2 + 16px); margin: 0 auto; }
  figure { margin: 0; }
  figcaption { color: var(--dim); font-size: 12px; margin-bottom: 6px; }
  img { display: block; width: 100%; height: auto; background: #fff; border: 1px solid var(--line); }
  .slider { position: relative; user-select: none; border: 1px solid var(--line); overflow: hidden; }
  .slider img { border: 0; }
  .slider .top { position: absolute; inset: 0; overflow: hidden; }
  .slider .top img { position: absolute; top: 0; left: 0; width: var(--w); }
  .slider .handle { position: absolute; top: 0; bottom: 0; width: 2px; background: var(--changed);
    cursor: ew-resize; }
  .onion { position: relative; }
  .onion .over { position: absolute; inset: 0; opacity: .5; }
  .empty { color: var(--dim); padding: 40px; text-align: center; }
  code { color: var(--dim); font-size: 12px; }
</style>
</head>
<body>
<header>
  <div>
    <h1>Visual regression</h1>
    <div class="meta">${escapeHtml(meta.head)} vs ${escapeHtml(meta.baseRef)} <code>${escapeHtml(meta.baseSha)}</code>
      · ${meta.storyCount} ${meta.everything ? 'stories (global change)' : 'changed stories'}
      · ${escapeHtml(meta.viewports.join(', '))} · ${escapeHtml(meta.generatedAt)}</div>
  </div>
  <div class="pills" id="filters"></div>
</header>
<main id="cards"></main>
<script>
const DATA = ${embedJson(data)};
const COUNTS = ${embedJson(counts)};
// Everything below builds markup by concatenation, so anything that came from a
// story — its label, its viewport, and above all a render error quoting the
// component that threw — goes through here first.
const esc = (value) => String(value ?? '').replace(/[&<>"']/g,
  (character) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[character]);
const COLOURS = { changed: 'var(--changed)', added: 'var(--added)', removed: 'var(--removed)',
  error: 'var(--error)', unchanged: 'var(--unchanged)' };
const active = new Set(Object.keys(COUNTS).filter(k => COUNTS[k] > 0 && k !== 'unchanged'));
if (active.size === 0) active.add('unchanged');

const filters = document.getElementById('filters');
for (const [verdict, count] of Object.entries(COUNTS)) {
  if (!count) continue;
  const button = document.createElement('button');
  button.className = 'pill';
  button.setAttribute('aria-pressed', String(active.has(verdict)));
  button.innerHTML = '<span class="dot" style="background:' + COLOURS[verdict] + '"></span>' + verdict + ' ' + count;
  button.onclick = () => {
    active.has(verdict) ? active.delete(verdict) : active.add(verdict);
    button.setAttribute('aria-pressed', String(active.has(verdict)));
    render();
  };
  filters.append(button);
}

const percent = (n) => (n * 100 < 0.01 && n > 0 ? '<0.01%' : (n * 100).toFixed(2) + '%');

function stage(item, mode) {
  const framed = (html) => '<div class="frame">' + html + '</div>';
  if (item.verdict === 'error') return '<div class="empty error">' + esc(item.error || 'render failed') + '</div>';
  if (mode === 'diff' && item.diff) return framed('<img src="' + item.diff + '" alt="diff">');
  if (mode === 'slider' && item.baseline && item.current)
    return framed('<div class="slider"><img class="under" src="' + item.current + '" alt="current">' +
      '<div class="top"><img src="' + item.baseline + '" alt="baseline"></div>' +
      '<div class="handle"></div></div>');
  if (mode === 'onion' && item.baseline && item.current)
    return framed('<div class="onion"><img src="' + item.current + '" alt="current">' +
      '<img class="over" src="' + item.baseline + '" alt="baseline"></div>');
  const before = item.baseline
    ? '<figure><figcaption>baseline</figcaption><img src="' + item.baseline + '" alt="baseline"></figure>'
    : '<figure><figcaption>baseline</figcaption><div class="empty">new story</div></figure>';
  const after = item.current
    ? '<figure><figcaption>current</figcaption><img src="' + item.current + '" alt="current"></figure>'
    : '<figure><figcaption>current</figcaption><div class="empty">gone</div></figure>';
  return '<div class="pair">' + before + after + '</div>';
}

function wireSlider(card) {
  const slider = card.querySelector('.slider');
  if (!slider) return;
  const top = slider.querySelector('.top');
  const handle = slider.querySelector('.handle');
  const image = slider.querySelector('.top img');
  const size = () => { image.style.setProperty('--w', slider.clientWidth + 'px'); };
  const set = (x) => {
    const ratio = Math.max(0, Math.min(1, x / slider.clientWidth));
    top.style.width = (ratio * 100) + '%';
    handle.style.left = (ratio * 100) + '%';
  };
  new ResizeObserver(size).observe(slider);
  size(); set(slider.clientWidth / 2);
  let dragging = false;
  slider.addEventListener('pointerdown', (event) => { dragging = true; slider.setPointerCapture(event.pointerId); set(event.offsetX); });
  slider.addEventListener('pointermove', (event) => { if (dragging) set(event.offsetX); });
  slider.addEventListener('pointerup', () => { dragging = false; });
}

function render() {
  const host = document.getElementById('cards');
  host.textContent = '';
  const items = DATA.filter((item) => active.has(item.verdict));
  if (items.length === 0) {
    host.innerHTML = '<div class="empty">Nothing selected.</div>';
    return;
  }
  for (const item of items) {
    const card = document.createElement('section');
    card.className = 'card';
    const natural = (item.currentSize || item.baselineSize || {}).width;
    if (natural) card.style.setProperty('--nw', natural + 'px');
    const size = item.resized && item.baselineSize && item.currentSize
      ? ' · ' + item.baselineSize.width + '×' + item.baselineSize.height + ' → ' +
        item.currentSize.width + '×' + item.currentSize.height
      : '';
    card.innerHTML =
      '<div class="head"><span class="tag ' + item.verdict + '">' + item.verdict + '</span>' +
      '<h2>' + esc(item.label) + '</h2>' +
      '<code>' + esc(item.viewport) +
        (item.verdict === 'changed' ? ' · ' + percent(item.ratio) + ' of pixels' : '') + size + '</code>' +
      '<div class="modes"></div></div><div class="stage"></div>';
    const modes = card.querySelector('.modes');
    const body = card.querySelector('.stage');
    const available = item.verdict === 'changed' ? ['side by side', 'slider', 'onion', 'diff'] : ['side by side'];
    let mode = item.verdict === 'changed' ? 'slider' : 'side by side';
    const draw = () => {
      body.innerHTML = stage(item, mode.replace(/ /g, ''));
      wireSlider(card);
      for (const button of modes.children) button.setAttribute('aria-pressed', String(button.textContent === mode));
    };
    for (const option of available) {
      const button = document.createElement('button');
      button.textContent = option;
      button.onclick = () => { mode = option; draw(); };
      modes.append(button);
    }
    host.append(card);
    draw();
  }
}

render();
</script>
</body>
</html>
`
}
