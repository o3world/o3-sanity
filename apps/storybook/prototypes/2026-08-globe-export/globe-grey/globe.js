/* O3 Globe — Grey (neutral / background settings) — standalone. No dependencies.
   Renders the O3 wireframe atom/globe into #globe. Tweak CONFIG below.
   Values below are the live site's current tweak settings. */
(function () {
  var CONFIG = {
    // geometry / motion — identical to the red globe
    scale: 1,
    tilt: 11,
    angle: -17,
    lines: 7,
    lineWidth: 1.3,
    lineOpacity: 1.15,
    randomness: 0.2,
    speed: 0.3,
    seed: 1837,
    mouseFollow: 0.8,

    // electrons
    balls: 3,
    electronR: 7,
    electronGlow: 3,
    electronOpacity: 1,

    // color — neutral/grey variant (the background globe)
    glow: 0.6,             // soft neutral bloom instead of red
    accent: '#C8C8CC',
    accentDim: '#8A8A8E',
    wire: '#E9EDF5',
    dotCols: ['#E9EDF5', '#C8C8CC', '#8A8A8E', '#6E6E73'],
    glowCols: ['#C8C8CC', '#4A4A4E', '#F4F4F6'],
    shade: ['#C8C8CC', '#4A4A4E']
  };

  var host = document.getElementById('globe');
  if (!host) return;

  var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 1200 1200');
  svg.setAttribute('class', 'globe-svg');
  svg.style.transform = 'rotateX(' + CONFIG.tilt + 'deg) rotate(' + CONFIG.angle + 'deg) scale(' + CONFIG.scale + ')';
  host.appendChild(svg);

  var seed = CONFIG.seed;
  var rand = function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  var vary = function (v, amt) { return v * (1 + (rand() - 0.5) * 2 * CONFIG.randomness * amt); };

  var C = 600, CY = 600, R = 340, fl = 1650, M = 72;

  var mkFilter = function (id, sd) {
    return '<filter id="' + id + '" x="-200%" y="-200%" width="500%" height="500%">' +
      '<feGaussianBlur stdDeviation="' + sd.toFixed(1) + '" result="b"></feGaussianBlur>' +
      '<feMerge><feMergeNode in="b"></feMergeNode><feMergeNode in="SourceGraphic"></feMergeNode></feMerge></filter>';
  };
  var defs = '<defs>' +
    mkFilter('gA0', Math.max(0.1, CONFIG.electronGlow * (1 - 0.6 * CONFIG.randomness))) +
    mkFilter('gA1', Math.max(0.1, CONFIG.electronGlow)) +
    mkFilter('gA2', Math.max(0.1, CONFIG.electronGlow * (1 + 0.8 * CONFIG.randomness))) +
    '<radialGradient id="orbShade" cx="38%" cy="32%" r="75%">' +
      '<stop offset="0%" stop-color="' + CONFIG.shade[0] + '" stop-opacity="0.10"></stop>' +
      '<stop offset="55%" stop-color="' + CONFIG.shade[1] + '" stop-opacity="0.05"></stop>' +
      '<stop offset="100%" stop-color="#000" stop-opacity="0"></stop></radialGradient></defs>';

  var norm3 = function (p) { var l = Math.hypot(p[0], p[1], p[2]) || 1; return [p[0] / l, p[1] / l, p[2] / l]; };
  var cross = function (a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; };

  var N = Math.max(1, Math.round(CONFIG.lines));
  var circles = [], electrons = 0;
  for (var i = 0; i < N; i++) {
    var th = rand() * Math.PI * 2, ph = Math.acos(2 * rand() - 1);
    var nv = [Math.sin(ph) * Math.cos(th), Math.sin(ph) * Math.sin(th), Math.cos(ph)];
    var u = cross(nv, [0, 0, 1]);
    if (Math.hypot(u[0], u[1], u[2]) < 0.01) u = cross(nv, [0, 1, 0]);
    u = norm3(u);
    var v = cross(nv, u);
    var colored = (i % 4 === 2);
    var col = colored ? (i % 8 === 2 ? CONFIG.accent : CONFIG.accentDim) : CONFIG.wire;
    var op = Math.min(1, Math.max(0.05, vary((colored ? 0.55 : 0.3) * CONFIG.lineOpacity, 0.8)));
    var w = Math.max(0.2, vary(0.9 * CONFIG.lineWidth, 0.7));
    var dots = [];
    var nn = Math.max(0, Math.round(vary(CONFIG.balls, 0.7) + (rand() - 0.5) * CONFIG.randomness * 2));
    for (var k = 0; k < nn; k++) {
      dots.push({ t: rand() * Math.PI * 2, sp: (0.05 + rand() * 0.12) * (rand() < 0.5 ? -1 : 1),
        r: Math.max(1, vary(CONFIG.electronR * 0.38, 0.6)), col: CONFIG.dotCols[Math.floor(rand() * CONFIG.dotCols.length)], glow: false });
    }
    if (colored && electrons < 3) {
      dots.push({ t: rand() * Math.PI * 2, sp: 0.08 + rand() * 0.1, r: Math.max(1.5, vary(CONFIG.electronR, 0.6)),
        col: CONFIG.dotCols[electrons % CONFIG.dotCols.length], glow: true });
      electrons++;
    }
    circles.push({ u: u, v: v, col: col, op: op, w: w, dots: dots, colored: colored, i: i });
  }

  var h = defs;
  circles.forEach(function (c) {
    h += '<g' + (c.colored ? ' style="--po:1;animation:orbPulse ' + ((4.2 + c.i * 0.7) / CONFIG.speed).toFixed(1) + 's ease-in-out infinite ' + (c.i * 1.1) + 's;"' : '') + '>';
    h += '<path pathLength="1" data-cb="' + c.i + '" fill="none" stroke="' + c.col + '" stroke-width="' + c.w.toFixed(2) + '" stroke-opacity="' + (c.op * 0.28).toFixed(2) + '"></path>';
    h += '<path pathLength="1" data-cf="' + c.i + '" fill="none" stroke="' + c.col + '" stroke-width="' + c.w.toFixed(2) + '" stroke-opacity="' + c.op.toFixed(2) + '"></path>';
    c.dots.forEach(function (d, k) {
      h += '<circle data-cd="' + c.i + '-' + k + '" r="' + d.r.toFixed(1) + '" fill="' + d.col + '"' + (d.glow ? ' filter="url(#gA' + Math.floor(rand() * 3) + ')"' : '') + '></circle>';
    });
    h += '</g>';
  });
  if (CONFIG.glow > 0) {
    h += '<circle cx="' + C + '" cy="' + CY + '" r="' + (R + 6) + '" fill="none" stroke="' + CONFIG.glowCols[0] + '" stroke-width="14" style="filter:blur(26px);opacity:' + (0.5 * CONFIG.glow).toFixed(2) + ';"></circle>';
    h += '<circle cx="' + C + '" cy="' + CY + '" r="' + (R + 22) + '" fill="none" stroke="' + CONFIG.glowCols[1] + '" stroke-width="44" style="filter:blur(60px);opacity:' + (0.4 * CONFIG.glow).toFixed(2) + ';"></circle>';
    h += '<circle cx="' + C + '" cy="' + CY + '" r="' + (R + 2) + '" fill="none" stroke="' + CONFIG.glowCols[2] + '" stroke-width="3" style="filter:blur(8px);opacity:' + (0.45 * CONFIG.glow).toFixed(2) + ';"></circle>';
  }
  h += '<circle cx="' + C + '" cy="' + CY + '" r="' + R + '" fill="none" stroke="' + CONFIG.wire + '" stroke-width="' + (1.1 * CONFIG.lineWidth).toFixed(2) + '" stroke-opacity="' + Math.min(1, Math.max(0.15, 0.5 * CONFIG.lineOpacity)).toFixed(2) + '"></circle>';
  h += '<circle cx="' + C + '" cy="' + CY + '" r="' + R + '" fill="url(#orbShade)"></circle>';
  svg.innerHTML = h;

  var rb = [], rf = [];
  circles.forEach(function (c) {
    rb.push(svg.querySelector('[data-cb="' + c.i + '"]'));
    rf.push(svg.querySelector('[data-cf="' + c.i + '"]'));
    c.dotEls = c.dots.map(function (d, k) { return svg.querySelector('[data-cd="' + c.i + '-' + k + '"]'); });
  });

  var axis = norm3([0.32, 1, 0.18]);
  var rot = function (p, cs, sn) {
    var dd = axis[0] * p[0] + axis[1] * p[1] + axis[2] * p[2];
    var cr = [axis[1] * p[2] - axis[2] * p[1], axis[2] * p[0] - axis[0] * p[2], axis[0] * p[1] - axis[1] * p[0]];
    return [p[0] * cs + cr[0] * sn + axis[0] * dd * (1 - cs),
            p[1] * cs + cr[1] * sn + axis[1] * dd * (1 - cs),
            p[2] * cs + cr[2] * sn + axis[2] * dd * (1 - cs)];
  };

  var mx = 0, my = 0, mx3 = 0, my3 = 0;
  if (CONFIG.mouseFollow > 0) {
    window.addEventListener('mousemove', function (e) {
      mx = (e.clientX / window.innerWidth - 0.5) * 2;
      my = (e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });
  }

  var omega = (2 * Math.PI) / (70 / CONFIG.speed);
  var t0 = performance.now();
  function frame(now) {
    var t = (now - t0) / 1000;
    var cs = Math.cos(t * omega), sn = Math.sin(t * omega);
    mx3 += (mx - mx3) * 0.06;
    my3 += (my - my3) * 0.06;
    var al = mx3 * 0.55 * CONFIG.mouseFollow, be = my3 * 0.4 * CONFIG.mouseFollow;
    var ca = Math.cos(al), sa = Math.sin(al), cb = Math.cos(be), sb = Math.sin(be);
    var proj = function (p) {
      var x = p[0] * ca + p[2] * sa, z = -p[0] * sa + p[2] * ca;
      var y2 = p[1] * cb - z * sb; z = p[1] * sb + z * cb;
      var kk = fl / (fl - z);
      return [C + x * kk, CY + y2 * kk, z];
    };
    circles.forEach(function (c, ci) {
      var dB = '', dF = '', penB = false, penF = false;
      for (var m = 0; m <= M; m++) {
        var a = (m / M) * Math.PI * 2, ct = Math.cos(a), st = Math.sin(a);
        var q = proj(rot([(c.u[0] * ct + c.v[0] * st) * R, (c.u[1] * ct + c.v[1] * st) * R, (c.u[2] * ct + c.v[2] * st) * R], cs, sn));
        var pt = q[0].toFixed(1) + ' ' + q[1].toFixed(1);
        if (q[2] >= 0) { dF += (penF ? ' L ' : ' M ') + pt; penF = true; penB = false; }
        else { dB += (penB ? ' L ' : ' M ') + pt; penB = true; penF = false; }
      }
      if (rb[ci]) rb[ci].setAttribute('d', dB || 'M 0 0');
      if (rf[ci]) rf[ci].setAttribute('d', dF || 'M 0 0');
      c.dots.forEach(function (d, k) {
        var el = c.dotEls[k]; if (!el) return;
        d.t += d.sp * CONFIG.speed / 60;
        var ct = Math.cos(d.t), st = Math.sin(d.t);
        var q = proj(rot([(c.u[0] * ct + c.v[0] * st) * R, (c.u[1] * ct + c.v[1] * st) * R, (c.u[2] * ct + c.v[2] * st) * R], cs, sn));
        var kk = fl / (fl - q[2]);
        el.setAttribute('cx', q[0].toFixed(1));
        el.setAttribute('cy', q[1].toFixed(1));
        el.setAttribute('r', Math.max(0.4, d.r * kk).toFixed(1));
        el.setAttribute('opacity', (q[2] >= 0 ? Math.min(1, d.glow ? CONFIG.electronOpacity : c.op + 0.35) : 0.22).toFixed(2));
      });
    });
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
