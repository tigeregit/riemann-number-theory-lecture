(function () {
  'use strict';

  var D = window.RIEMANN_DATA || { pi: [], zeta: [], zeros: [], lean: {} };
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  var motionEnabled = !reduceMQ.matches;
  var redrawers = [];

  /* ---------- resolved CSS colors (light-dark() resolves at use time) ---------- */
  var probe = document.createElement('span');
  probe.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none;';
  document.body.appendChild(probe);
  function C(name) {
    probe.style.color = 'var(' + name + ')';
    return getComputedStyle(probe).color;
  }
  function P() {
    return { surface: C('--surface'), text: C('--text'), muted: C('--muted'),
             border: C('--border'), accent: C('--accent'), warm: C('--warm'),
             green: C('--green'), amber: C('--amber') };
  }

  /* ---------- KaTeX ---------- */
  /* Custom macros mirrored from the LaTeX lecture preamble, so the same
     source notation renders in the browser. */
  var MACROS = {
    '\\Ree': '\\operatorname{Re}', '\\Imm': '\\operatorname{Im}',
    '\\Li': '\\operatorname{Li}', '\\pit': '\\pi(x)',
    '\\bigO': '\\mathcal{O}', '\\ee': '\\mathrm{e}',
    '\\dd': '\\,\\!\\mathrm{d}', '\\iu': '\\mathrm{i}',
    '\\Lmb': '\\Lambda', '\\Gam': '\\Gamma',
    '\\N': '\\mathbb{N}', '\\Z': '\\mathbb{Z}', '\\Q': '\\mathbb{Q}',
    '\\R': '\\mathbb{R}', '\\C': '\\mathbb{C}',
    '\\eps': '\\varepsilon', '\\ssi': '\\sigma', '\\vphi': '\\varphi',
    '\\abs': '\\lvert #1 \\rvert', '\\norm': '\\lVert #1 \\rVert',
    '\\floor': '\\lfloor #1 \\rfloor',
    '\\texttt': '\\text{#1}'
  };
  function renderAllMath() {
    $$('.math').forEach(function (el) {
      var tex = el.getAttribute('data-tex') || el.textContent;
      if (!tex) return;
      if (window.katex) {
        try { katex.render(tex, el, { displayMode: el.classList.contains('display'), throwOnError: false, strict: false, macros: MACROS }); }
        catch (e) { el.textContent = tex; }
      } else { el.textContent = tex; }
    });
  }
  function setMath(el, tex) {
    if (window.katex) { try { katex.render(tex, el, { throwOnError: false, macros: MACROS }); return; } catch (e) {} }
    el.textContent = tex;
  }
  var MATH_DELIMS = [
    { left: '$$', right: '$$', display: true },
    { left: '$', right: '$', display: false }
  ];
  function autoRender(root) {
    if (!window.renderMathInElement) return;
    try { renderMathInElement(root || document.body, { delimiters: MATH_DELIMS, throwOnError: false, strict: false, macros: MACROS }); } catch (e) {}
  }

  /* ---------- canvas helpers ---------- */
  function ctxOf(canvas) {
    var r = canvas.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    }
    var ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    return { ctx: ctx, w: w, h: h };
  }
  function drawChart(canvas, cfg) {
    var c = ctxOf(canvas), ctx = c.ctx, w = c.w, h = c.h, p = P();
    var pad = { l: 58, r: 16, t: 16, b: 32 };
    var x0 = pad.l, y0 = pad.t, x1 = w - pad.r, y1 = h - pad.b;
    var xmin = cfg.xmin, xmax = cfg.xmax, ymin = cfg.ymin, ymax = cfg.ymax;
    var X = function (v) { return x0 + (x1 - x0) * (v - xmin) / (xmax - xmin); };
    var Y = function (v) { return y1 - (y1 - y0) * (v - ymin) / (ymax - ymin); };
    ctx.font = '12px ' + getComputedStyle(document.body).fontFamily;
    ctx.lineWidth = 1;
    (cfg.xticks || []).forEach(function (t) {
      var px = X(t[0]);
      ctx.strokeStyle = p.border; ctx.globalAlpha = .5;
      ctx.beginPath(); ctx.moveTo(px, y0); ctx.lineTo(px, y1); ctx.stroke();
      ctx.globalAlpha = 1; ctx.fillStyle = p.muted;
      ctx.textAlign = 'center'; ctx.fillText(t[1], px, y1 + 19);
    });
    (cfg.yticks || []).forEach(function (t) {
      var py = Y(t[0]);
      ctx.strokeStyle = p.border; ctx.globalAlpha = .5;
      ctx.beginPath(); ctx.moveTo(x0, py); ctx.lineTo(x1, py); ctx.stroke();
      ctx.globalAlpha = 1; ctx.fillStyle = p.muted;
      ctx.textAlign = 'right'; ctx.fillText(t[1], x0 - 8, py + 4);
    });
    ctx.strokeStyle = p.muted; ctx.globalAlpha = .8;
    ctx.beginPath(); ctx.moveTo(x0, y1); ctx.lineTo(x1, y1); ctx.moveTo(x0, y0); ctx.lineTo(x0, y1); ctx.stroke();
    ctx.globalAlpha = 1;
    (cfg.vlines || []).forEach(function (v) {
      ctx.strokeStyle = p.amber; ctx.globalAlpha = .7; ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(X(v[0]), y0); ctx.lineTo(X(v[0]), y1); ctx.stroke();
      ctx.setLineDash([]); ctx.globalAlpha = 1;
      if (v[1]) { ctx.fillStyle = p.amber; ctx.textAlign = 'left'; ctx.fillText(v[1], X(v[0]) + 4, y0 + 13); }
    });
    (cfg.series || []).forEach(function (s) {
      if (!s.pts.length) return;
      ctx.strokeStyle = s.color; ctx.lineWidth = s.width || 2;
      ctx.setLineDash(s.dash || []); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.beginPath();
      s.pts.forEach(function (q, i) { var px = X(q[0]), py = Y(Math.max(ymin, Math.min(ymax, q[1]))); if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py); });
      ctx.stroke(); ctx.setLineDash([]); ctx.lineWidth = 1;
    });
    (cfg.markers || []).forEach(function (m) {
      ctx.fillStyle = m.color || p.warm;
      ctx.beginPath(); ctx.arc(X(m[0]), Y(m[1]), m.r || 4, 0, Math.PI * 2); ctx.fill();
    });
    canvas._chart = { X: X, Y: Y, xmin: xmin, xmax: xmax, ymin: ymin, ymax: ymax, pad: pad, w: w, h: h };
  }
  function ticks(lo, hi, step, fmt) {
    var a = [];
    for (var v = lo; v <= hi + 1e-9; v += step) a.push([v, fmt ? fmt(v) : String(v)]);
    return a;
  }

  /* ---------- primes & zeta ---------- */
  function sieve(n) {
    var a = new Uint8Array(n + 1), out = [];
    for (var i = 2; i <= n; i++) if (!a[i]) { out.push(i); for (var j = i * i; j <= n; j += i) a[j] = 1; }
    return out;
  }
  var PRIMES = sieve(1000);
  function zeta(s) {
    var N = 20000, sum = 0;
    for (var n = 1; n <= N; n++) sum += Math.pow(n, -s);
    return sum + Math.pow(N, 1 - s) / (s - 1);
  }
  function Li(x) {
    if (x <= 2) return 0;
    var n = 600, a = 2, b = x, h = (b - a) / n, s = 0;
    for (var i = 0; i <= n; i++) {
      var t = a + i * h, f = 1 / Math.log(t);
      s += (i === 0 || i === n ? 1 : (i % 2 ? 4 : 2)) * f;
    }
    return s * h / 3;
  }
  function theta(t) {
    var s = 1;
    for (var n = 1; n <= 80; n++) s += 2 * Math.exp(-Math.PI * n * n * t);
    return s;
  }

  /* ---------- range sliders: native + synced CSS vars + aria-valuetext ---------- */
  function syncSlider(el) {
    el.style.setProperty('--attr-min', el.min || 0);
    el.style.setProperty('--attr-max', el.max || 100);
    el.style.setProperty('--control-value', el.value);
    var out = document.querySelector('output[for="' + el.id + '"]');
    var val = parseFloat(el.value);
    var txt = (el.step && parseFloat(el.step) < 1) ? val.toFixed(2) : String(Math.round(val));
    if (out) out.textContent = txt;
    el.setAttribute('aria-valuetext', txt);
  }
  $$('input[type="range"]').forEach(function (el) {
    syncSlider(el);
    el.addEventListener('input', function () { syncSlider(el); });
  });

  /* ---------- theme + motion settings ---------- */
  var metaScheme = document.querySelector('meta[name="color-scheme"]');
  var settingsDlg = $('#settings');
  var settingsForm = settingsDlg ? settingsDlg.querySelector('form') : null;
  var motionBtn = $('#motion-toggle');
  var motionChk = $('#settings-reduce');

  function applyScheme(v, persist) {
    metaScheme.content = (v === 'system' || !v) ? 'light dark' : v;
    if (persist !== false) {
      try {
        if (v === 'system' || !v) localStorage.removeItem('riemann-color-scheme');
        else localStorage.setItem('riemann-color-scheme', v);
      } catch (e) {}
    }
    $$('input[name="scheme"]').forEach(function (r) { r.checked = (r.value === (v || 'system')); });
    redrawers.forEach(function (fn) { try { fn(); } catch (e) {} });
  }
  function setMotion(on) {
    motionEnabled = !!on;
    document.documentElement.dataset.motion = motionEnabled ? 'on' : 'off';
    if (motionBtn) {
      motionBtn.setAttribute('aria-pressed', String(!motionEnabled));
      motionBtn.setAttribute('aria-label', motionEnabled ? '暂停所有动画' : '恢复所有动画');
      motionBtn.title = motionEnabled ? '暂停动画' : '恢复动画';
    }
    if (motionChk) motionChk.checked = motionEnabled;
    if (!motionEnabled) { drawHeroStatic(); redrawers.forEach(function (fn) { try { fn(); } catch (e) {} }); }
  }
  if ($('#settings-open')) $('#settings-open').addEventListener('click', function () { settingsDlg.showModal(); });
  if (settingsForm) settingsForm.addEventListener('submit', function (e) {
    if (!e.submitter || e.submitter.value !== 'apply') return;
    var v = (settingsForm.querySelector('input[name="scheme"]:checked') || {}).value || 'system';
    applyScheme(v); setMotion(motionChk ? motionChk.checked : true);
  });
  if (motionBtn) motionBtn.addEventListener('click', function () { setMotion(!motionEnabled); });
  window.addEventListener('storage', function (e) {
    if (e.key === 'riemann-color-scheme') applyScheme(e.newValue || 'system');
  });
  try {
    var stored = localStorage.getItem('riemann-color-scheme');
    if (stored) applyScheme(stored);
  } catch (e) {}
  // Allow ?theme=light / dark / system for sharing and verification.
  var qTheme = new URLSearchParams(location.search).get('theme');
  if (qTheme === 'light' || qTheme === 'dark' || qTheme === 'system') applyScheme(qTheme, false);
  setMotion(motionEnabled);

  /* ---------- scrollspy (native + IntersectionObserver fallback) ---------- */
  var navLinks = $$('.toc a');
  function syncAria() {
    var cur = document.querySelector('.toc a:target-current') || document.querySelector('.toc a.target-current');
    navLinks.forEach(function (a) { a.setAttribute('aria-current', a === cur ? 'true' : 'false'); });
  }
  if (CSS.supports && CSS.supports('scroll-target-group: auto')) {
    syncAria();
    document.addEventListener('scrollend', syncAria);
  } else {
    var sections = $$('main section[id]');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          navLinks.forEach(function (a) {
            var on = a.getAttribute('href') === '#' + en.target.id;
            a.classList.toggle('target-current', on);
            a.setAttribute('aria-current', String(on));
          });
        }
      });
    }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
    sections.forEach(function (s) { io.observe(s); });
  }

  /* ---------- scroll progress fallback ---------- */
  if (!(CSS.supports && CSS.supports('animation-timeline', 'scroll()'))) {
    var bar = $('#scroll-progress');
    var onScroll = function () {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = 'scaleX(' + (max > 0 ? window.scrollY / max : 0) + ')';
    };
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  }

  /* ---------- reveal on scroll ---------- */
  if (!reduceMQ.matches) {
    var revealables = $$('.callout, .card, .lab, .figure-card, .flow-step, .diagram, .two-col, .grid-cards, .nice-table');
    revealables.forEach(function (el) { el.classList.add('reveal'); });
    if ('IntersectionObserver' in window) {
      var rio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); rio.unobserve(en.target); } });
      }, { rootMargin: '0px 0px -8% 0px', threshold: .05 });
      revealables.forEach(function (el) { rio.observe(el); });
    }
    setTimeout(function () { revealables.forEach(function (el) { el.classList.add('in'); }); }, 1600);
  }

  /* ---------- stat numbers: always show the true value immediately ----------
     A decorative CSS fade-in provides the motion; JS never risks leaving a
     half-counted number on screen (rAF can be throttled in background tabs). */
  $$('[data-count]').forEach(function (el) { el.textContent = el.getAttribute('data-count'); });

  /* ---------- timeline ---------- */
  $$('#timeline button').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var body = btn.parentElement.querySelector('.timeline-body');
      var open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      body.hidden = open;
    });
  });

  /* ---------- hero animation ---------- */
  var hero = $('#hero-canvas'), heroRunning = false, heroVisible = true, heroT0 = 0;
  function drawHero(ts) {
    if (!hero) return;
    var c = ctxOf(hero), ctx = c.ctx, w = c.w, h = c.h, p = P();
    var cx = w * .5, cy = h * .5, scale = Math.min(w, h) / 380;
    var stripL = cx - 70 * scale, stripR = cx + 70 * scale, crit = cx;
    var top = cy - 130 * scale, bot = cy + 130 * scale;
    ctx.fillStyle = p.accent; ctx.globalAlpha = .09;
    ctx.fillRect(stripL, top, stripR - stripL, bot - top);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = p.accent; ctx.lineWidth = 1.4;
    ctx.strokeRect(stripL, top, stripR - stripL, bot - top);
    ctx.strokeStyle = p.border; ctx.globalAlpha = .7; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(24, cy); ctx.lineTo(w - 24, cy); ctx.moveTo(stripL, 20); ctx.lineTo(stripL, h - 20); ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = p.warm; ctx.lineWidth = 2.4; ctx.setLineDash([7, 6]);
    ctx.beginPath(); ctx.moveTo(crit, top); ctx.lineTo(crit, bot); ctx.stroke(); ctx.setLineDash([]);
    var gammas = [14.1, 21.0, 25.0, 30.4, 32.9, 37.6, 40.9, 43.3, 48.0, 49.8];
    gammas.forEach(function (g, i) {
      var frac = (g - 12) / 40, yy = cy + (frac * 2 - 1) * 105 * scale;
      var pulse = motionEnabled ? 2.5 + 1.6 * Math.sin(ts / 380 + i * .9) : 3;
      ctx.fillStyle = p.warm; ctx.globalAlpha = .18;
      ctx.beginPath(); ctx.arc(crit, yy, pulse * 2.6 * scale, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1; ctx.beginPath(); ctx.arc(crit, yy, 3.4 * scale, 0, Math.PI * 2); ctx.fill();
      if (motionEnabled) {
        var drift = (ts / 2600 + i * .13) % 1;
        ctx.globalAlpha = .35 * (1 - drift);
        ctx.beginPath(); ctx.arc(crit + (drift * 55 - 25) * scale, yy, 1.6 * scale, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
      }
    });
    [-2, -3, -4].forEach(function (k) {
      ctx.fillStyle = p.muted; ctx.beginPath(); ctx.arc(stripL - (2 - k) * 26 * scale, cy, 2.6 * scale, 0, Math.PI * 2); ctx.fill();
    });
    ctx.fillStyle = p.amber; ctx.beginPath(); ctx.arc(stripR, cy, 4 * scale, 0, Math.PI * 2); ctx.fill();
    ctx.font = (11 * Math.max(.8, scale)) + 'px ' + getComputedStyle(document.body).fontFamily;
    ctx.fillStyle = p.muted; ctx.textAlign = 'center';
    ctx.fillText('0', stripL, cy + 20 * scale);
    ctx.fillText('1', stripR, cy + 20 * scale);
    ctx.fillText('1/2', crit, bot + 18 * scale);
    ctx.fillStyle = p.warm; ctx.fillText('Re s = 1/2', crit, top - 8 * scale);
    ctx.fillStyle = p.accent; ctx.fillText('临界带', (stripL + stripR) / 2, top + 18 * scale);
    ctx.fillStyle = p.amber; ctx.fillText('极点', stripR + 20 * scale, cy - 10 * scale);
  }
  function drawHeroStatic() { drawHero(0); }
  function heroLoop(ts) {
    if (!motionEnabled || !heroVisible || document.hidden) { heroRunning = false; drawHeroStatic(); return; }
    if (!heroT0) heroT0 = ts;
    drawHero(ts - heroT0);
    requestAnimationFrame(heroLoop);
  }
  function startHero() { if (!heroRunning && motionEnabled && heroVisible) { heroRunning = true; heroT0 = 0; requestAnimationFrame(heroLoop); } }
  if (hero) {
    var hio = new IntersectionObserver(function (en) { heroVisible = en[0].isIntersecting; if (heroVisible) startHero(); });
    hio.observe(hero);
    drawHeroStatic(); startHero();
  }
  redrawers.push(drawHeroStatic);

  /* ---------- Lab 1: Euler product ---------- */
  function eulerDraw() {
    var el = $('#euler-s'), en = $('#euler-n'); if (!el || !en) return;
    var s = parseFloat(el.value), N = parseInt(en.value, 10), z = zeta(s);
    var pts = [], p = 1;
    for (var i = 0; i < N; i++) { p /= (1 - Math.pow(PRIMES[i], -s)); pts.push([i + 1, p]); }
    drawChart($('#euler-canvas'), {
      xmin: 0, xmax: Math.max(N, 2), ymin: 1, ymax: z * 1.12,
      xticks: ticks(0, Math.max(N, 2), Math.max(1, Math.round(N / 5)), function (v) { return String(Math.round(v)); }),
      yticks: ticks(1, z * 1.12, Math.max(.5, z / 4), function (v) { return v.toFixed(2); }),
      series: [
        { pts: pts, color: P().accent, width: 2.6 },
        { pts: [[0, z], [Math.max(N, 2), z]], color: P().warm, width: 1.6, dash: [6, 5] }
      ],
      markers: [[N, pts.length ? pts[pts.length - 1][1] : 1]]
    });
    $('#euler-zeta').textContent = z.toFixed(6);
    var last = pts.length ? pts[pts.length - 1][1] : 1;
    $('#euler-partial').textContent = last.toFixed(6);
    $('#euler-err').textContent = ((z - last) / z * 100).toFixed(3) + ' %';
  }
  ['#euler-s', '#euler-n'].forEach(function (id) { if ($(id)) $(id).addEventListener('input', eulerDraw); });
  redrawers.push(eulerDraw); eulerDraw();

  /* ---------- Lab 2: theta ---------- */
  function thetaDraw() {
    var el = $('#theta-t'); if (!el) return;
    var t = parseFloat(el.value), f = [], g = [];
    for (var u = .15; u <= 3.0001; u += .02) {
      f.push([u, theta(u)]); g.push([u, Math.pow(u, -.5) * theta(1 / u)]);
    }
    drawChart($('#theta-canvas'), {
      xmin: .15, xmax: 3, ymin: .8, ymax: 2.9,
      xticks: [[.15, '0.15'], [1, '1'], [2, '2'], [3, '3']],
      yticks: [[1, '1'], [1.5, '1.5'], [2, '2'], [2.5, '2.5']],
      vlines: [[t, 't=' + t.toFixed(2)]],
      series: [{ pts: f, color: P().accent, width: 3 }, { pts: g, color: P().amber, width: 2, dash: [7, 5] }],
      markers: [[t, theta(t)]]
    });
    var a = theta(t), b = Math.pow(t, -.5) * theta(1 / t);
    $('#theta-v1').textContent = a.toFixed(6);
    $('#theta-v2').textContent = b.toFixed(6);
    $('#theta-diff').textContent = Math.abs(a - b).toExponential(2);
  }
  if ($('#theta-t')) $('#theta-t').addEventListener('input', thetaDraw);
  redrawers.push(thetaDraw); thetaDraw();

  /* ---------- Lab 3: beta / RH error ---------- */
  function betaDraw() {
    var el = $('#beta-slider'), chk = $('#rh-switch'); if (!el) return;
    var beta = parseFloat(el.value), showRH = chk ? chk.checked : true;
    var rh = [], off = [];
    for (var k = 1; k <= 6.0001; k += .05) {
      var x = Math.pow(10, k);
      rh.push([k, Math.log10(Math.sqrt(x) * Math.log(x))]);
      off.push([k, beta * k]);
    }
    var series = [{ pts: off, color: P().warm, width: 2.8 }];
    if (showRH) series.push({ pts: rh, color: P().green, width: 2, dash: [6, 5] });
    drawChart($('#beta-canvas'), {
      xmin: 1, xmax: 6, ymin: 0, ymax: 6,
      xticks: [[1, '10'], [2, '10²'], [3, '10³'], [4, '10⁴'], [5, '10⁵'], [6, '10⁶']],
      yticks: [[0, '1'], [1, '10'], [2, '10²'], [3, '10³'], [4, '10⁴'], [5, '10⁵'], [6, '10⁶']],
      series: series
    });
    var x6 = 1e6, v = Math.pow(x6, beta), rhv = Math.sqrt(x6) * Math.log(x6);
    setMath($('#beta-order'), 'x^{' + beta.toFixed(2) + '}');
    $('#beta-num').textContent = v.toExponential(2);
    $('#beta-ratio').textContent = (v / rhv).toFixed(1) + '×';
  }
  ['#beta-slider', '#rh-switch'].forEach(function (id) { if ($(id)) $(id).addEventListener('input', betaDraw); });
  redrawers.push(betaDraw); betaDraw();

  /* ---------- Lab 4: explicit formula waves ---------- */
  function Jtrue2(x) {
    var s = 0;
    for (var i = 0; i < PRIMES.length && PRIMES[i] <= x; i++) {
      var p = PRIMES[i], q = p, m = 1;
      while (q <= x) { s += 1 / m; q *= p; m++; }
    }
    return s;
  }
  function waveSum(k, x) {
    var L = Math.log(x);
    if (L < .05 || k <= 0) return 0;
    var s = 0;
    for (var i = 0; i < k && i < D.zeros.length; i++) {
      var g = D.zeros[i];
      s += 2 * Math.sqrt(x) / L * (.5 * Math.cos(g * L) + g * Math.sin(g * L)) / (.25 + g * g);
    }
    return s;
  }
  var waveTimer = null;
  function waveDraw() {
    var ke = $('#wave-k'), xe = $('#wave-x'); if (!ke || !xe) return;
    var k = parseInt(ke.value, 10), xmax = parseInt(xe.value, 10);
    var step = [], smooth = [], approx = [];
    var maxY = Li(xmax) * 1.25 + 1;
    for (var x = 2; x <= xmax; x += Math.max(.25, xmax / 500)) {
      step.push([x, Jtrue2(x)]);
      smooth.push([x, Li(x)]);
      approx.push([x, Li(x) - Math.log(2) - waveSum(k, x)]);
    }
    drawChart($('#wave-canvas'), {
      xmin: 2, xmax: xmax, ymin: -maxY * .12, ymax: maxY,
      xticks: ticks(2, xmax, Math.max(5, Math.round(xmax / 5)), function (v) { return String(Math.round(v)); }),
      yticks: ticks(0, maxY, Math.max(2, Math.round(maxY / 4)), function (v) { return String(Math.round(v)); }),
      series: [
        { pts: step, color: P().muted, width: 1.8 },
        { pts: smooth, color: P().accent, width: 1.6, dash: [5, 5] },
        { pts: approx, color: P().warm, width: 2.6 }
      ]
    });
  }
  ['#wave-k', '#wave-x'].forEach(function (id) { if ($(id)) $(id).addEventListener('input', function () { stopWave(); waveDraw(); }); });
  function stopWave() { if (waveTimer) { clearInterval(waveTimer); waveTimer = null; } var b = $('#wave-play'); if (b) b.textContent = '▶ 播放'; }
  if ($('#wave-play')) $('#wave-play').addEventListener('click', function () {
    if (waveTimer) { stopWave(); return; }
    var ke = $('#wave-k');
    if (!motionEnabled) { ke.value = 14; syncSlider(ke); waveDraw(); return; }
    $('#wave-play').textContent = '⏸ 暂停';
    if (parseInt(ke.value, 10) >= 14) { ke.value = 0; syncSlider(ke); }
    waveTimer = setInterval(function () {
      var v = parseInt(ke.value, 10) + 1;
      ke.value = Math.min(14, v); syncSlider(ke); waveDraw();
      if (v >= 14) stopWave();
    }, 620);
  });
  redrawers.push(waveDraw); waveDraw();

  /* ---------- pi(x) chart + hover ---------- */
  function piDraw() {
    var rows = D.pi || []; if (!rows.length) return;
    var a = [], b = [], c = [];
    rows.forEach(function (r) { a.push([r[0], r[1]]); b.push([r[0], r[2]]); c.push([r[0], r[3]]); });
    drawChart($('#pi-canvas'), {
      xmin: 0, xmax: 100000, ymin: 0, ymax: 10200,
      xticks: [[0, '0'], [20000, '20k'], [40000, '40k'], [60000, '60k'], [80000, '80k'], [100000, '100k']],
      yticks: [[0, '0'], [2000, '2k'], [4000, '4k'], [6000, '6k'], [8000, '8k'], [10000, '10k']],
      series: [{ pts: a, color: P().accent, width: 2.6 },
               { pts: b, color: P().warm, width: 2, dash: [7, 5] },
               { pts: c, color: P().green, width: 2, dash: [2, 4] }]
    });
  }
  var piCanvas = $('#pi-canvas'), tip = $('#pi-tooltip');
  if (piCanvas && tip) {
    piCanvas.addEventListener('mousemove', function (e) {
      var ch = piCanvas._chart; if (!ch) return;
      var r = piCanvas.getBoundingClientRect(), px = e.clientX - r.left;
      var frac = (px - ch.pad.l) / (ch.w - ch.pad.l - ch.pad.r);
      var x = Math.max(0, Math.min(100000, Math.round(frac * 100000)));
      var best = D.pi[0], bd = Infinity;
      D.pi.forEach(function (row) { var d = Math.abs(row[0] - x); if (d < bd) { bd = d; best = row; } });
      tip.hidden = false;
      tip.style.left = px + 'px';
      tip.style.top = (e.clientY - r.top) + 'px';
      tip.textContent = 'x=' + best[0] + '  π=' + best[1] + '  Li=' + best[2].toFixed(0) + '  x/logx=' + best[3].toFixed(0);
    });
    piCanvas.addEventListener('mouseleave', function () { tip.hidden = true; });
  }
  redrawers.push(piDraw); piDraw();

  /* ---------- Lab 5: trig inequality ---------- */
  function trigDraw() {
    var el = $('#trig-slider'); if (!el) return;
    var t = parseFloat(el.value), f = [], g = [];
    for (var u = 0; u <= 6.2832; u += .02) {
      f.push([u, 3 + 4 * Math.cos(u) + Math.cos(2 * u)]);
      g.push([u, 2 * Math.pow(1 + Math.cos(u), 2)]);
    }
    drawChart($('#trig-canvas'), {
      xmin: 0, xmax: 6.28, ymin: -.6, ymax: 8.6,
      xticks: [[0, '0'], [1.57, 'π/2'], [3.14, 'π'], [4.71, '3π/2'], [6.28, '2π']],
      yticks: [[0, '0'], [2, '2'], [4, '4'], [6, '6'], [8, '8']],
      vlines: [[t, 'θ=' + t.toFixed(2)]],
      series: [{ pts: f, color: P().accent, width: 3 }, { pts: g, color: P().amber, width: 2, dash: [7, 5] }],
      markers: [[t, 3 + 4 * Math.cos(t) + Math.cos(2 * t)]]
    });
    var v = 3 + 4 * Math.cos(t) + Math.cos(2 * t);
    $('#trig-val').textContent = v.toFixed(5);
    $('#trig-val2').textContent = (2 * Math.pow(1 + Math.cos(t), 2)).toFixed(5);
  }
  if ($('#trig-slider')) $('#trig-slider').addEventListener('input', trigDraw);
  redrawers.push(trigDraw); trigDraw();

  /* ---------- Lean tabs ---------- */
  var tabKeys = ['basic', 'euclid', 'eulerproduct', 'moebius', 'pc', 'zeta', 'ex'];
  var tabsWrap = $('#lean-tabs');
  if (tabsWrap) {
    var tabs = $$('.tablist button', tabsWrap);
    var panels = $$('.tabpanels > [role="tabpanel"]', tabsWrap);
    function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
    var KW = /\b(import|module|public|open|scoped|namespace|end|section|def|theorem|lemma|example|axiom|instance|class|structure|inductive|where|by|have|let|in|if|then|else|match|with|intro|exact|refine|apply|rw|simp|simpa|omega|ring|nlinarith|linarith|norm_num|decide|native_decide|by_contra|rintro|rcases|cases|induction|calc|unfold|show|from|sorry|noncomputable|partial|opaque|unsafe|variable|universe|private|protected|macro|syntax|eval|check|print|positivity|field_simp|aesop|grind|rfl|ext|funext|add|end)\b/g;
    function hl(src) {
      return src.split('\n').map(function (line) {
        var i = line.indexOf('--');
        var code = i >= 0 ? line.slice(0, i) : line;
        var cm = i >= 0 ? line.slice(i) : '';
        var out = esc(code).replace(KW, '<span class="kw">$1</span>');
        return out + (cm ? '<span class="cm">' + esc(cm) + '</span>' : '');
      }).join('\n');
    }
    panels.forEach(function (panel, i) {
      var code = panel.querySelector('code');
      if (code) code.innerHTML = hl(D.lean[tabKeys[i]] || '');
    });
    function select(i, focusTab) {
      tabs.forEach(function (t, j) {
        t.setAttribute('aria-selected', String(i === j));
        t.toggleAttribute('focusgroupstart', i === j);
      });
      panels.forEach(function (pn, j) {
        if (i === j) { pn.removeAttribute('hidden'); pn.setAttribute('tabindex', '0'); }
        else { pn.setAttribute('hidden', 'until-found'); pn.removeAttribute('tabindex'); }
      });
      tabs[i].scrollIntoView({ block: 'nearest', inline: 'nearest', container: 'nearest' });
      if (focusTab) tabs[i].focus();
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(i, false); });
      panels[i].addEventListener('beforematch', function () { select(i, false); });
    });
    if (!('focusGroup' in HTMLElement.prototype)) {
      tabsWrap.querySelector('.tablist').addEventListener('keydown', function (e) {
        var i = tabs.findIndex(function (t) { return t.getAttribute('aria-selected') === 'true'; });
        var j = null;
        if (e.key === 'ArrowRight') j = (i + 1) % tabs.length;
        else if (e.key === 'ArrowLeft') j = (i - 1 + tabs.length) % tabs.length;
        else if (e.key === 'Home') j = 0;
        else if (e.key === 'End') j = tabs.length - 1;
        if (j !== null) { e.preventDefault(); select(j, true); }
      });
    }
  }

  /* ---------- proof stepper ---------- */
  var STEPS = [
    { lines: ['theorem euclid (n : ℕ) : ∃ p : ℕ, n ≤ p ∧ p.Prime := by'], active: 0,
      goal: '⊢ ∃ p, n ≤ p ∧ p.Prime', ctx: 'n : ℕ' },
    { lines: ['theorem euclid (n : ℕ) : ∃ p : ℕ, n ≤ p ∧ p.Prime := by',
              '  let p := Nat.minFac (n.factorial + 1)'], active: 1,
      goal: '⊢ ∃ p, n ≤ p ∧ p.Prime', ctx: 'n : ℕ\np := Nat.minFac (n.factorial + 1)' },
    { lines: ['  let p := Nat.minFac (n.factorial + 1)',
              '  have hpos : 0 < p := Nat.minFac_pos _',
              '  have hne : n.factorial + 1 ≠ 1 := by omega',
              '  have hp : p.Prime := Nat.minFac_prime hne'], active: 3,
      goal: '⊢ ∃ p, n ≤ p ∧ p.Prime', ctx: 'n : ℕ\np := ...\nhpos : 0 < p\nhne : n.factorial + 1 ≠ 1\nhp : p.Prime' },
    { lines: ['  have hp : p.Prime := Nat.minFac_prime hne',
              '  refine ⟨p, ?_, hp⟩'], active: 1,
      goal: '⊢ n ≤ p', ctx: 'n : ℕ, p := ..., hpos, hne, hp : p.Prime' },
    { lines: ['  refine ⟨p, ?_, hp⟩',
              '  by_contra hnot'], active: 1,
      goal: '⊢ False', ctx: 'n : ℕ, p := ..., hp : p.Prime\nhnot : ¬ n ≤ p' },
    { lines: ['  by_contra hnot',
              '  have hpn : p ≤ n := by omega',
              '  have hpdvd_fact : p ∣ n.factorial := Nat.dvd_factorial hpos hpn'], active: 2,
      goal: '⊢ False', ctx: 'hnot : ¬ n ≤ p\nhpn : p ≤ n\nhpdvd_fact : p ∣ n.factorial' },
    { lines: ['  have hpdvd_fact : p ∣ n.factorial := Nat.dvd_factorial hpos hpn',
              '  have hpdvd_succ : p ∣ n.factorial + 1 := Nat.minFac_dvd _',
              '  have hpdvd_one : p ∣ 1 := (Nat.dvd_add_iff_right hpdvd_fact).2 hpdvd_succ'], active: 2,
      goal: '⊢ False', ctx: 'hpdvd_fact : p ∣ n.factorial\nhpdvd_succ : p ∣ n.factorial + 1\nhpdvd_one : p ∣ 1' },
    { lines: ['  have hpdvd_one : p ∣ 1 := (Nat.dvd_add_iff_right hpdvd_fact).2 hpdvd_succ',
              '  exact hp.not_dvd_one hpdvd_one'], active: 1,
      goal: '✓ 没有剩余目标（证明完成）', ctx: 'hp : p.Prime\nhp.not_dvd_one : ¬ p ∣ 1\nhpdvd_one : p ∣ 1  ⇒  False' }
  ];
  var stepIdx = 0, stepCode = $('#stepper-code'), stepGoal = $('#stepper-goal'), stepCtx = $('#stepper-ctx');
  function stepRender() {
    if (!stepCode) return;
    var s = STEPS[stepIdx];
    var html = s.lines.map(function (l, i) {
      return (i === s.active ? '<span class="line-active">' : '<span>') + esc2(l) + '</span>';
    }).join('\n');
    stepCode.innerHTML = html;
    stepGoal.textContent = s.goal; stepCtx.textContent = s.ctx;
    $('#step-count').textContent = (stepIdx + 1) + ' / ' + STEPS.length;
    $('#step-prev').disabled = stepIdx === 0;
    $('#step-next').disabled = stepIdx === STEPS.length - 1;
  }
  function esc2(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  if ($('#step-next')) $('#step-next').addEventListener('click', function () { if (stepIdx < STEPS.length - 1) { stepIdx++; stepRender(); } });
  if ($('#step-prev')) $('#step-prev').addEventListener('click', function () { if (stepIdx > 0) { stepIdx--; stepRender(); } });
  stepRender();

  /* ---------- quiz ---------- */
  var QUIZ = [
    { q: '欧拉乘积公式 $\\zeta(s)=\\prod_p(1-p^{-s})^{-1}$ 在什么范围成立？',
      opts: ['$\\Ree s>1$', '$\\Ree s>0$', '$s\\ne1$', '整个复平面'], ok: 0,
      why: '级数 $\\sum n^{-s}$ 只在 $\\Ree s>1$ 绝对收敛；其它地方靠解析延拓得到，而乘积公式本身不收敛。' },
    { q: '下列哪一项不是黎曼 1859 年论文的核心步骤？',
      opts: ['用 $\\Gamma$ 与 theta 函数做解析延拓', '构造整函数 $\\xi(s)$', '给出 $\\pit$ 的显式公式', '严格证明黎曼猜想'], ok: 3,
      why: '黎曼明确说自己把 RH 的证明「暂时搁置」了；论文里它被写成「很可能成立」的观察。' },
    { q: '显式公式中，零点 $\\rho$ 贡献的波动振幅主要由什么决定？',
      opts: ['$\\Im\\rho$（频率）', '$\\Ree\\rho$（实部）', '$\\abs{\\rho}$ 的奇偶', '零点的重数'], ok: 1,
      why: '$\\abs{x^\\rho}=x^{\\Ree\\rho}$：零点越靠右，波动越大。RH 把 $\\Ree\\rho$ 压到 $1/2$，误差项才是 $\\sqrt x$ 量级。' },
    { q: '1896 年素数定理证明的关键引理是：',
      opts: ['$\\zeta(0)=-1/2$', '$\\zeta(s)$ 在 $\\Ree s=1$ 上不为零', '所有零点都是单零点', '$\\xi(s)$ 的阶为 $1$'], ok: 1,
      why: '用 $3+4\\cos\\theta+\\cos2\\theta=2(1+\\cos\\theta)^2\\ge0$ 可证 $\\zeta(1+\\iu t)\\ne0$，再由 Tauberian 论证得到 $\\psi(x)\\sim x$。' },
    { q: 'von Koch 1901 年证明 RH 等价于：',
      opts: ['$\\pit=\\Li(x)+\\bigO(\\sqrt x\\log x)$', '$\\pit=\\Li(x)+\\bigO(x/\\log x)$', '$\\sum 1/p$ 发散', '$\\Xi(t)$ 是偶函数'], ok: 0,
      why: '这是 RH 最直观的算术等价形式：误差项恰好被压到 $\\sqrt x$ 量级。' },
    { q: 'mathlib 里的 $\\texttt{RiemannHypothesis}$ 是什么？',
      opts: ['一个已经证明的定理', '一个 $\\texttt{Prop}$，被精确陈述但没有证明项', '一个可计算的实数函数', '一个 $\\texttt{axiom}$'], ok: 1,
      why: '$\\#\\text{check}$ 打印 $\\texttt{RiemannHypothesis : Prop}$。库作者的幽默注记：构造一个该类型的项值一百万美元。' }
  ];
  var qi = 0, score = 0, quizBody = $('#quiz-body'), quizBar = $('#quiz-bar');
  function quizRender() {
    if (!quizBody) return;
    quizBar.style.inlineSize = (qi / QUIZ.length * 100) + '%';
    $('#quiz-progress-text').textContent = qi + ' / ' + QUIZ.length;
    if (qi >= QUIZ.length) {
      quizBody.innerHTML = '<div class="quiz-final"><strong>' + score + ' / ' + QUIZ.length + '</strong>' +
        '<p>' + (score === QUIZ.length ? '全对！你已经把这条主线连起来了。' : '不错，回到对应章节再看看解析延拓与显式公式两部分。') + '</p>' +
        '<button type="button" class="btn primary" id="quiz-restart">再做一次</button></div>';
      $('#quiz-restart').addEventListener('click', function () { qi = 0; score = 0; quizRender(); });
      return;
    }
    var item = QUIZ[qi];
    var h = '<p class="quiz-q"></p><div class="quiz-options">';
    item.opts.forEach(function (o, i) { h += '<button type="button" data-i="' + i + '"></button>'; });
    h += '</div><div class="quiz-feedback" hidden></div>';
    quizBody.innerHTML = h;
    $('.quiz-q', quizBody).textContent = item.q;
    $$('.quiz-options button', quizBody).forEach(function (b, i) { b.textContent = item.opts[i]; });
    autoRender(quizBody);
    $$('.quiz-options button', quizBody).forEach(function (btn) {
      btn.addEventListener('click', function () {
        var i = parseInt(btn.getAttribute('data-i'), 10);
        $$('.quiz-options button', quizBody).forEach(function (b) { b.disabled = true; });
        btn.classList.add(i === item.ok ? 'correct' : 'wrong');
        if (i === item.ok) score++;
        else $$('.quiz-options button', quizBody)[item.ok].classList.add('correct');
        var fb = $('.quiz-feedback', quizBody);
        fb.hidden = false; fb.textContent = item.why;
        autoRender(fb);
        setTimeout(function () { qi++; quizRender(); }, 2400);
      });
    });
  }
  quizRender();

  /* ---------- redraw on resize / theme change ---------- */
  var resizeTimer = null;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () { redrawers.forEach(function (fn) { try { fn(); } catch (e) {} }); }, 120);
  });
  reduceMQ.addEventListener('change', function (e) { setMotion(!e.matches); });
  document.addEventListener('visibilitychange', function () { if (!document.hidden) startHero(); });

  renderAllMath();
  autoRender(document.body);
})();
