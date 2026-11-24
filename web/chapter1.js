(function () {
  'use strict';
  var D = window.RIEMANN_DATA || { pi: [], lean: {} };
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  var redrawers = [];

  /* ---------- resolved colors ---------- */
  var probe = document.createElement('span');
  probe.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none;';
  document.body.appendChild(probe);
  function C(name) { probe.style.color = 'var(' + name + ')'; return getComputedStyle(probe).color; }
  function P() { return { surface: C('--surface'), text: C('--text'), muted: C('--muted'),
    border: C('--border'), accent: C('--accent'), warm: C('--warm'), green: C('--green'), amber: C('--amber') }; }

  /* ---------- KaTeX ---------- */
  var MACROS = {
    '\\Ree': '\\operatorname{Re}', '\\Imm': '\\operatorname{Im}',
    '\\Li': '\\operatorname{Li}', '\\pit': '\\pi(x)',
    '\\bigO': '\\mathcal{O}', '\\ee': '\\mathrm{e}',
    '\\dd': '\\,\\!\\mathrm{d}', '\\iu': '\\mathrm{i}',
    '\\Lmb': '\\Lambda', '\\Gam': '\\Gamma',
    '\\N': '\\mathbb{N}', '\\Z': '\\mathbb{Z}', '\\Q': '\\mathbb{Q}',
    '\\R': '\\mathbb{R}', '\\C': '\\mathbb{C}',
    '\\eps': '\\varepsilon', '\\abs': '\\lvert #1 \\rvert',
    '\\floor': '\\lfloor #1 \\rfloor', '\\lcm': '\\operatorname{lcm}',
    '\\texttt': '\\text{#1}'
  };
  var DELIMS = [{ left: '$$', right: '$$', display: true }, { left: '$', right: '$', display: false }];
  function renderAllMath() {
    $$('.math').forEach(function (el) {
      var tex = el.getAttribute('data-tex') || el.textContent;
      if (!tex) return;
      if (window.katex) {
        try { katex.render(tex, el, { displayMode: el.classList.contains('display'), throwOnError: false, strict: false, macros: MACROS }); }
        catch (e) { el.textContent = tex; }
      } else el.textContent = tex;
    });
  }
  function autoRender(root) {
    if (!window.renderMathInElement) return;
    try { renderMathInElement(root || document.body, { delimiters: DELIMS, throwOnError: false, strict: false, macros: MACROS }); } catch (e) {}
  }

  /* ---------- canvas helpers ---------- */
  function ctxOf(c) {
    var r = c.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
    if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) {
      c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
    }
    var x = c.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, w, h);
    return { ctx: x, w: w, h: h };
  }
  function drawChart(canvas, cfg) {
    var c = ctxOf(canvas), ctx = c.ctx, w = c.w, h = c.h, p = P();
    var pad = { l: 56, r: 14, t: 14, b: 30 };
    var x0 = pad.l, y0 = pad.t, x1 = w - pad.r, y1 = h - pad.b;
    var X = function (v) { return x0 + (x1 - x0) * (v - cfg.xmin) / (cfg.xmax - cfg.xmin); };
    var Y = function (v) { return y1 - (y1 - y0) * (v - cfg.ymin) / (cfg.ymax - cfg.ymin); };
    ctx.font = '12px ' + getComputedStyle(document.body).fontFamily;
    (cfg.xticks || []).forEach(function (t) {
      var px = X(t[0]); ctx.strokeStyle = p.border; ctx.globalAlpha = .5;
      ctx.beginPath(); ctx.moveTo(px, y0); ctx.lineTo(px, y1); ctx.stroke();
      ctx.globalAlpha = 1; ctx.fillStyle = p.muted; ctx.textAlign = 'center'; ctx.fillText(t[1], px, y1 + 18);
    });
    (cfg.yticks || []).forEach(function (t) {
      var py = Y(t[0]); ctx.strokeStyle = p.border; ctx.globalAlpha = .5;
      ctx.beginPath(); ctx.moveTo(x0, py); ctx.lineTo(x1, py); ctx.stroke();
      ctx.globalAlpha = 1; ctx.fillStyle = p.muted; ctx.textAlign = 'right'; ctx.fillText(t[1], x0 - 7, py + 4);
    });
    ctx.strokeStyle = p.muted; ctx.globalAlpha = .8;
    ctx.beginPath(); ctx.moveTo(x0, y1); ctx.lineTo(x1, y1); ctx.moveTo(x0, y0); ctx.lineTo(x0, y1); ctx.stroke();
    ctx.globalAlpha = 1;
    (cfg.series || []).forEach(function (s) {
      if (!s.pts.length) return;
      ctx.strokeStyle = s.color; ctx.lineWidth = s.width || 2;
      ctx.setLineDash(s.dash || []); ctx.lineJoin = 'round';
      ctx.beginPath();
      s.pts.forEach(function (q, i) {
        var px = X(q[0]), py = Y(Math.max(cfg.ymin, Math.min(cfg.ymax, q[1])));
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      });
      ctx.stroke(); ctx.setLineDash([]); ctx.lineWidth = 1;
    });
    (cfg.markers || []).forEach(function (m) {
      ctx.fillStyle = m.color || p.warm;
      ctx.beginPath(); ctx.arc(X(m[0]), Y(m[1]), m.r || 4, 0, Math.PI * 2); ctx.fill();
    });
    canvas._chart = { X: X, pad: pad, w: w };
  }
  function ticks(lo, hi, step, fmt) {
    var a = []; for (var v = lo; v <= hi + 1e-9; v += step) a.push([v, fmt ? fmt(v) : String(v)]); return a;
  }

  /* ---------- arithmetic ---------- */
  function sieve(n) { var a = new Uint8Array(n + 1), o = []; for (var i = 2; i <= n; i++) if (!a[i]) { o.push(i); for (var j = i * i; j <= n; j += i) a[j] = 1; } return o; }
  var PRIMES = sieve(200000);
  function zeta(s) { var N = 20000, x = 0; for (var n = 1; n <= N; n++) x += Math.pow(n, -s); return x + Math.pow(N, 1 - s) / (s - 1); }
  var recip = [], acc = 0;
  PRIMES.forEach(function (p) { acc += 1 / p; recip.push([p, acc]); });
  function sumRecip(N) { var lo = 0, hi = recip.length - 1, b = 0; while (lo <= hi) { var m = (lo + hi) >> 1; if (recip[m][0] <= N) { b = recip[m][1]; lo = m + 1; } else hi = m - 1; } return b; }
  function piAt(N) { var lo = 0, hi = PRIMES.length - 1, b = 0; while (lo <= hi) { var m = (lo + hi) >> 1; if (PRIMES[m] <= N) { b = m + 1; lo = m + 1; } else hi = m - 1; } return b; }

  /* ---------- sliders ---------- */
  function sync(el) {
    el.style.setProperty('--attr-min', el.min || 0);
    el.style.setProperty('--attr-max', el.max || 100);
    el.style.setProperty('--control-value', el.value);
    var t = (parseFloat(el.step) < 1) ? parseFloat(el.value).toFixed(2) : String(Math.round(parseFloat(el.value)));
    var out = document.querySelector('output[for="' + el.id + '"]');
    if (out) out.textContent = t;
    el.setAttribute('aria-valuetext', t);
  }
  $$('input[type="range"]').forEach(function (el) { sync(el); el.addEventListener('input', function () { sync(el); }); });

  /* ---------- theme / scale ---------- */
  var meta = document.querySelector('meta[name="color-scheme"]');
  var dlg = $('#ch1-settings'), form = dlg ? dlg.querySelector('form') : null;
  function applyScheme(v, persist) {
    meta.content = (v === 'system' || !v) ? 'light dark' : v;
    if (persist !== false) {
      try { if (v === 'system' || !v) localStorage.removeItem('ch1-color-scheme'); else localStorage.setItem('ch1-color-scheme', v); } catch (e) {}
    }
    $$('input[name="scheme"]').forEach(function (r) { r.checked = (r.value === (v || 'system')); });
    redrawers.forEach(function (f) { try { f(); } catch (e) {} });
  }
  if ($('#ch1-settings-open')) $('#ch1-settings-open').addEventListener('click', function () { dlg.showModal(); });
  if (form) form.addEventListener('submit', function (e) {
    if (!e.submitter || e.submitter.value !== 'apply') return;
    applyScheme((form.querySelector('input[name="scheme"]:checked') || {}).value || 'system');
    var sc = (form.querySelector('input[name="scale"]:checked') || {}).value || 'normal';
    document.documentElement.dataset.scale = sc;
    try { localStorage.setItem('ch1-scale', sc); } catch (err) {}
  });
  try {
    var st = localStorage.getItem('ch1-color-scheme'); if (st) applyScheme(st, false);
    var sc = localStorage.getItem('ch1-scale'); if (sc) document.documentElement.dataset.scale = sc;
  } catch (e) {}
  var q = new URLSearchParams(location.search).get('theme');
  if (q === 'light' || q === 'dark' || q === 'system') applyScheme(q, false);
  window.addEventListener('storage', function (e) { if (e.key === 'ch1-color-scheme') applyScheme(e.newValue || 'system', false); });

  /* ---------- scrollspy + progress fallback ---------- */
  var links = $$('.ch1-toc a');
  function syncAria() {
    var cur = document.querySelector('.ch1-toc a:target-current') || document.querySelector('.ch1-toc a.target-current');
    links.forEach(function (a) { a.setAttribute('aria-current', a === cur ? 'true' : 'false'); });
  }
  if (CSS.supports && CSS.supports('scroll-target-group: auto')) { syncAria(); document.addEventListener('scrollend', syncAria); }
  else {
    var io = new IntersectionObserver(function (es) { es.forEach(function (en) {
      if (en.isIntersecting) links.forEach(function (a) { var on = a.getAttribute('href') === '#' + en.target.id; a.classList.toggle('target-current', on); a.setAttribute('aria-current', String(on)); });
    }); }, { rootMargin: '-45% 0px -45% 0px' });
    $$('main section[id]').forEach(function (s) { io.observe(s); });
  }
  if (!(CSS.supports && CSS.supports('animation-timeline', 'scroll()'))) {
    var bar = $('#ch1-progress');
    var onScroll = function () { var m = document.documentElement.scrollHeight - window.innerHeight; bar.style.transform = 'scaleX(' + (m > 0 ? window.scrollY / m : 0) + ')'; };
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  }
  if (!reduceMQ.matches) {
    var rv = $$('.ch1-proof, .ch1-lab, .ch1-table-wrapper, .ch1-note, .ch1-tabs');
    rv.forEach(function (el) { el.classList.add('ch1-reveal'); });
    if ('IntersectionObserver' in window) {
      var rio = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); rio.unobserve(en.target); } }); }, { rootMargin: '0px 0px -6% 0px', threshold: .05 });
      rv.forEach(function (el) { rio.observe(el); });
    }
    setTimeout(function () { rv.forEach(function (el) { el.classList.add('in'); }); }, 1500);
  }

  /* ---------- Lab A ---------- */
  function labA() {
    var se = $('#A-s'), ne = $('#A-n'); if (!se || !ne) return;
    var s = parseFloat(se.value), N = parseInt(ne.value, 10), z = zeta(s);
    var pts = [], p = 1;
    for (var i = 0; i < N; i++) { p /= (1 - Math.pow(PRIMES[i], -s)); pts.push([i + 1, p]); }
    var xmax = Math.max(N, 2);
    drawChart($('#A-canvas'), {
      xmin: 0, xmax: xmax, ymin: 1, ymax: z * 1.12,
      xticks: ticks(0, xmax, Math.max(1, Math.round(xmax / 5)), function (v) { return String(Math.round(v)); }),
      yticks: ticks(1, z * 1.12, Math.max(.5, z / 4), function (v) { return v.toFixed(2); }),
      series: [{ pts: pts, color: P().accent, width: 2.6 },
               { pts: [[0, z], [xmax, z]], color: P().warm, width: 1.6, dash: [6, 5] }],
      markers: [[N, pts.length ? pts[pts.length - 1][1] : 1]]
    });
    $('#A-zeta').textContent = z.toFixed(6);
    var last = pts.length ? pts[pts.length - 1][1] : 1;
    $('#A-partial').textContent = last.toFixed(6);
    $('#A-err').textContent = ((z - last) / z * 100).toFixed(3) + ' %';
  }
  ['#A-s', '#A-n'].forEach(function (id) { if ($(id)) $(id).addEventListener('input', labA); });
  redrawers.push(labA); labA();

  /* ---------- Lab B ---------- */
  function labB() {
    var pe = $('#B-p'), ke = $('#B-k'); if (!pe || !ke) return;
    var p = PRIMES[parseInt(pe.value, 10) - 1], K = parseInt(ke.value, 10);
    $('#B-p-out').textContent = String(p);
    var lhs = 0, divs = [], rhs = 0;
    for (var k = 0; k <= K; k++) { var d = Math.pow(p, k); lhs += 1 / d; divs.push(String(d)); rhs += 1 / d; }
    $('#B-lhs').textContent = lhs.toFixed(6);
    $('#B-div').textContent = divs.join(', ');
    $('#B-rhs').textContent = rhs.toFixed(6);
    $('#B-ok').textContent = Math.abs(lhs - rhs) < 1e-9 ? '相等 ✓' : '不相等 ✗';
  }
  ['#B-p', '#B-k'].forEach(function (id) { if ($(id)) $(id).addEventListener('input', labB); });
  labB();

  /* ---------- Lab C ---------- */
  function labC() {
    var e = $('#C-n'); if (!e) return;
    var N = parseInt(e.value, 10), l10 = Math.LN10;
    var s1 = [], s2 = [], xmin = 1, xmax = Math.log(N) / l10;
    for (var i = 0; i <= 260; i++) {
      var t = xmin + (xmax - xmin) * i / 260, x = Math.pow(10, t);
      s1.push([t, sumRecip(x)]);
      s2.push([t, Math.log(Math.log(Math.max(x, Math.E + .01)))]);
    }
    var sN = sumRecip(N), ll = Math.log(Math.log(N)), ymax = Math.max(sN, ll) + .3;
    drawChart($('#C-canvas'), {
      xmin: xmin, xmax: xmax, ymin: 0, ymax: ymax,
      xticks: [[1, '10'], [2, '100'], [3, '1k'], [4, '10k'], [5, '100k']].filter(function (q) { return q[0] <= xmax + 1e-9; }),
      yticks: ticks(0, ymax, Math.max(.5, ymax / 4), function (v) { return v.toFixed(1); }),
      series: [{ pts: s1, color: P().accent, width: 2.6 }, { pts: s2, color: P().amber, width: 2, dash: [6, 4] }]
    });
    $('#C-pi').textContent = piAt(N).toLocaleString();
    $('#C-sum').textContent = sN.toFixed(4);
    $('#C-ll').textContent = ll.toFixed(4);
    $('#C-diff').textContent = (sN - ll).toFixed(4);
  }
  if ($('#C-n')) $('#C-n').addEventListener('input', labC);
  redrawers.push(labC); labC();

  /* ---------- Lab D ---------- */
  function labD() {
    var rows = D.pi || []; if (!rows.length) return;
    var a = [], b = [], c = [];
    rows.forEach(function (r) { a.push([r[0], r[1]]); b.push([r[0], r[2]]); c.push([r[0], r[3]]); });
    drawChart($('#D-canvas'), {
      xmin: 0, xmax: 100000, ymin: 0, ymax: 10200,
      xticks: [[0, '0'], [20000, '20k'], [40000, '40k'], [60000, '60k'], [80000, '80k'], [100000, '100k']],
      yticks: [[0, '0'], [2000, '2k'], [4000, '4k'], [6000, '6k'], [8000, '8k'], [10000, '10k']],
      series: [{ pts: a, color: P().accent, width: 2.6 }, { pts: b, color: P().warm, width: 2, dash: [7, 5] },
               { pts: c, color: P().green, width: 2, dash: [2, 4] }]
    });
  }
  var dc = $('#D-canvas'), tip = $('#D-tip');
  if (dc && tip) {
    dc.parentElement.style.position = 'relative';
    dc.addEventListener('mousemove', function (e) {
      var ch = dc._chart; if (!ch) return;
      var r = dc.getBoundingClientRect(), px = e.clientX - r.left;
      var frac = (px - ch.pad.l) / (ch.w - ch.pad.l - 14);
      var x = Math.max(0, Math.min(100000, Math.round(frac * 100000)));
      var best = D.pi[0], bd = Infinity;
      D.pi.forEach(function (row) { var d = Math.abs(row[0] - x); if (d < bd) { bd = d; best = row; } });
      tip.hidden = false; tip.style.left = px + 'px'; tip.style.top = (e.clientY - r.top) + 'px';
      tip.textContent = 'x=' + best[0] + '  π=' + best[1] + '  Li=' + best[2].toFixed(0) + '  x/logx=' + best[3].toFixed(0);
    });
    dc.addEventListener('mouseleave', function () { tip.hidden = true; });
  }
  redrawers.push(labD); labD();

  /* ---------- Lean tabs ---------- */
  var keys = ['ch1', 'euclid', 'eulerproduct'];
  var tabsWrap = $('#ch1-tabs');
  if (tabsWrap) {
    var tabs = $$('.ch1-tablist button', tabsWrap), panels = $$('.ch1-tabpanels > [role="tabpanel"]', tabsWrap);
    var KW = /\b(import|module|public|open|scoped|namespace|end|section|def|theorem|lemma|example|axiom|instance|class|structure|inductive|where|by|have|let|in|if|then|else|match|with|intro|exact|refine|apply|rw|simp|simpa|omega|ring|nlinarith|linarith|norm_num|decide|native_decide|by_contra|rintro|rcases|cases|induction|calc|unfold|show|from|sorry|noncomputable|partial|opaque|unsafe|variable|universe|private|protected|macro|syntax|eval|check|print|positivity|field_simp|aesop|grind|rfl|ext|funext)\b/g;
    function hl(src) {
      return src.split('\n').map(function (line) {
        var i = line.indexOf('--'), code = i >= 0 ? line.slice(0, i) : line, cm = i >= 0 ? line.slice(i) : '';
        return esc(code).replace(KW, '<span class="kw">$1</span>') +
          (cm ? '<span class="cm">' + esc(cm) + '</span>' : '');
      }).join('\n');
    }
    panels.forEach(function (pn, i) { var c = pn.querySelector('code'); if (c) c.innerHTML = hl(D.lean[keys[i]] || ''); });
    function select(i, focus) {
      tabs.forEach(function (t, j) { t.setAttribute('aria-selected', String(i === j)); t.toggleAttribute('focusgroupstart', i === j); });
      panels.forEach(function (pn, j) {
        if (i === j) { pn.removeAttribute('hidden'); pn.setAttribute('tabindex', '0'); }
        else { pn.setAttribute('hidden', 'until-found'); pn.removeAttribute('tabindex'); }
      });
      tabs[i].scrollIntoView({ block: 'nearest', inline: 'nearest', container: 'nearest' });
      if (focus) tabs[i].focus();
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(i, false); });
      panels[i].addEventListener('beforematch', function () { select(i, false); });
    });
    if (!('focusGroup' in HTMLElement.prototype)) {
      tabsWrap.querySelector('.ch1-tablist').addEventListener('keydown', function (e) {
        var i = tabs.findIndex(function (t) { return t.getAttribute('aria-selected') === 'true'; }), j = null;
        if (e.key === 'ArrowRight') j = (i + 1) % tabs.length;
        else if (e.key === 'ArrowLeft') j = (i - 1 + tabs.length) % tabs.length;
        else if (e.key === 'Home') j = 0; else if (e.key === 'End') j = tabs.length - 1;
        if (j !== null) { e.preventDefault(); select(j, true); }
      });
    }
  }

  /* ---------- proof stepper ---------- */
  var STEPS = [
    { lines: ['theorem euclid (n : ℕ) : ∃ p : ℕ, n ≤ p ∧ p.Prime := by'], active: 0, goal: '⊢ ∃ p, n ≤ p ∧ p.Prime', ctx: 'n : ℕ' },
    { lines: ['theorem euclid (n : ℕ) : ∃ p : ℕ, n ≤ p ∧ p.Prime := by', '  let p := Nat.minFac (n.factorial + 1)'], active: 1, goal: '⊢ ∃ p, n ≤ p ∧ p.Prime', ctx: 'n : ℕ\np := Nat.minFac (n.factorial + 1)' },
    { lines: ['  let p := Nat.minFac (n.factorial + 1)', '  have hpos : 0 < p := Nat.minFac_pos _', '  have hne : n.factorial + 1 ≠ 1 := by omega', '  have hp : p.Prime := Nat.minFac_prime hne'], active: 3, goal: '⊢ ∃ p, n ≤ p ∧ p.Prime', ctx: 'n : ℕ\np := ...\nhpos : 0 < p\nhne : n.factorial + 1 ≠ 1\nhp : p.Prime' },
    { lines: ['  have hp : p.Prime := Nat.minFac_prime hne', '  refine ⟨p, ?_, hp⟩'], active: 1, goal: '⊢ n ≤ p', ctx: 'n : ℕ, p := ..., hpos, hne, hp : p.Prime' },
    { lines: ['  refine ⟨p, ?_, hp⟩', '  by_contra hnot'], active: 1, goal: '⊢ False', ctx: 'n : ℕ, p := ..., hp : p.Prime\nhnot : ¬ n ≤ p' },
    { lines: ['  by_contra hnot', '  have hpn : p ≤ n := by omega', '  have hpdvd_fact : p ∣ n.factorial := Nat.dvd_factorial hpos hpn'], active: 2, goal: '⊢ False', ctx: 'hnot : ¬ n ≤ p\nhpn : p ≤ n\nhpdvd_fact : p ∣ n.factorial' },
    { lines: ['  have hpdvd_fact : p ∣ n.factorial := Nat.dvd_factorial hpos hpn', '  have hpdvd_succ : p ∣ n.factorial + 1 := Nat.minFac_dvd _', '  have hpdvd_one : p ∣ 1 := (Nat.dvd_add_iff_right hpdvd_fact).2 hpdvd_succ'], active: 2, goal: '⊢ False', ctx: 'hpdvd_fact : p ∣ n.factorial\nhpdvd_succ : p ∣ n.factorial + 1\nhpdvd_one : p ∣ 1' },
    { lines: ['  have hpdvd_one : p ∣ 1 := (Nat.dvd_add_iff_right hpdvd_fact).2 hpdvd_succ', '  exact hp.not_dvd_one hpdvd_one'], active: 1, goal: '✓ 没有剩余目标（证明完成）', ctx: 'hp : p.Prime\nhp.not_dvd_one : ¬ p ∣ 1\nhpdvd_one : p ∣ 1  ⇒  False' }
  ];
  var si = 0, src = $('#ch1-step-src'), goal = $('#ch1-step-goal'), ctx = $('#ch1-step-ctx');
  function stepRender() {
    if (!src) return;
    var s = STEPS[si];
    src.innerHTML = s.lines.map(function (l, i) { return (i === s.active ? '<span class="line-active">' : '<span>') + esc(l) + '</span>'; }).join('\n');
    goal.textContent = s.goal; ctx.textContent = s.ctx;
    $('#ch1-step-count').textContent = (si + 1) + ' / ' + STEPS.length;
    $('#ch1-step-prev').disabled = si === 0; $('#ch1-step-next').disabled = si === STEPS.length - 1;
  }
  if ($('#ch1-step-next')) $('#ch1-step-next').addEventListener('click', function () { if (si < STEPS.length - 1) { si++; stepRender(); } });
  if ($('#ch1-step-prev')) $('#ch1-step-prev').addEventListener('click', function () { if (si > 0) { si--; stepRender(); } });
  stepRender();

  /* exclusive details fallback (name unsupported) */
  if (!Object.hasOwn(HTMLDetailsElement.prototype, 'name')) {
    document.addEventListener('toggle', function (e) {
      var d = e.target;
      if (!(d instanceof HTMLDetailsElement) || !d.open || !d.hasAttribute('name')) return;
      var n = CSS.escape(d.getAttribute('name'));
      $$('details[name="' + n + '"]').forEach(function (o) { if (o !== d) o.open = false; });
    }, true);
  }

  var rt = null;
  window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { redrawers.forEach(function (f) { try { f(); } catch (e) {} }); }, 120); });

  renderAllMath();
  autoRender(document.body);
})();
