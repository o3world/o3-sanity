import { COLUMNS, DARK_SURFACES, LIGHT_SURFACES, NAV_INK_TARGET } from './navInkSample'

/**
 * The bar's skin on arrival, decided before the page first paints.
 *
 * The server renders the dark skin, because with no page in hand it is the
 * skin that is right wherever the frames put the bar. `NavInk` then corrects
 * it — but `NavInk` is an effect, and an effect runs after hydration, which is
 * after first paint by a margin a reader can see: a light page opened cold
 * wore the scrim over its white hero until the bundle landed, then flipped.
 *
 * An inline script rather than an effect, for the reason `AnchorGlide` is one.
 * It sits after `<main>` in the site layout, so the arriving page's bands are
 * parsed and laid out when it runs, and it runs before the parser hands the
 * document to paint. It reads the declarations by geometry — which declared
 * band each column's centre falls inside, the same read `NavInk` takes mid
 * view transition — and writes the one attribute the skin hangs off.
 *
 * It writes it with the bar's transitions off. A streamed document gives the
 * header a style pass before `<main>` arrives, so the write would otherwise
 * be a change for the bar's `--duration-ink` transition to run, and the bar
 * arrived fading from the scrim to white. One stylesheet for one forced
 * style read, then gone, so hydration finds nothing but the attribute.
 *
 * `SiteNav` carries `suppressHydrationWarning` on the header for this script:
 * hydration finds an attribute the server did not send and leaves it alone.
 *
 * The vocabulary is inlined from `navInkSample` so the two readers cannot
 * disagree about what a surface is called.
 */
const READ_ON_ARRIVAL = `(function(){var h=document.getElementById(${JSON.stringify(NAV_INK_TARGET)});var p=h&&h.querySelector('nav');if(!p)return;var b=p.getBoundingClientRect(),y=b.top+b.height/2,s=b.width/${COLUMNS},d=${JSON.stringify(DARK_SURFACES)},l=${JSON.stringify(LIGHT_SURFACES)},e=document.querySelectorAll('main [data-surface]'),light=0,read=0;for(var c=0;c<${COLUMNS};c++){var x=b.left+s*(c+.5),g=null;for(var i=0;i<e.length;i++){var r=e[i].getBoundingClientRect();if(x<r.left||x>=r.right||y<r.top||y>=r.bottom)continue;var v=e[i].getAttribute('data-surface');if(d.indexOf(v)>=0)g=false;else if(l.indexOf(v)>=0)g=true}if(g===null)continue;read++;if(g)light++}if(light*2>read){var t=document.createElement('style');t.textContent='#'+h.id+' *{transition:none!important}';document.head.appendChild(t);h.setAttribute('data-ink','dark');void getComputedStyle(p).backgroundColor;t.remove()}})()`

export function NavInkFirstPaint() {
  return <script dangerouslySetInnerHTML={{ __html: READ_ON_ARRIVAL }} />
}

/** The script's body, exported so its behaviour can be run in a test. */
export const NAV_INK_FIRST_PAINT_SCRIPT = READ_ON_ARRIVAL
