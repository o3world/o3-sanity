# O3 Globe exports

Two self-contained globes. Each folder is fully independent — no shared files,
no build step, no framework.

    globe-red/    index.html + globe.css + globe.js   (hero globe, red glow 1.4)
    globe-grey/   index.html + globe.css + globe.js   (neutral / background globe)

## Use in a new project
1. Copy the folder in.
2. Drop `<div id="globe"></div>` where you want it, link `globe.css`,
   and load `globe.js` after it.
3. All tweaks live in the `CONFIG` object at the top of `globe.js`
   (size lives in `--globe-size` in `globe.css`).

Both are rendered uncropped: the SVG uses `overflow: visible` so the outer
bloom rings extend past the box, and the page pads 18vmin around it.

## Baked-in settings (current live values)
tilt 11deg · angle -17deg · 7 orbits · line width 1.3 · line opacity 1.15 ·
3 electrons per orbit · electron r 7 · electron glow 3 · speed 0.3 ·
randomness 0.2 · seed 1837 (fixed layout) · mouse follow 0.8 ·
glow 1.4 (red) / 0.6 (grey) · scale 1

The site scales the hero copy up (2.5x) and dims the background globe to
0.15 opacity; the exports ship at scale 1 / full opacity so they read as
complete assets. Adjust `scale` in CONFIG or wrap in an element with
`opacity` to reproduce the in-page treatments.
