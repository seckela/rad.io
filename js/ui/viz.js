// The masthead: "{rad.io}" at rest. On Play the right brace slides out to the edge of the page, the
// title fades, and rounded bars (echoing the app icon) grow outward from the middle and move with
// the music; Stop reverses it. The left brace never moves.
//
// Kept deliberately cheap: one canvas, flat fills (no blur or shadows), a small FFT, no allocation
// per frame, a 30 fps cap on touch devices, and the loop only runs while something is moving.
// Honors prefers-reduced-motion (the two states just switch, no animation).
import { $ } from './dom.js';

const BAR = 6, GAP = 6, MAX_H = 44, REST_MIN = 4, REST_PEAK = 12;
const FFT = 1024;                        // 512 bins (about 43 Hz each), fine enough that the middle bars read different low frequencies
const PAD = 8;                           // space between a brace and the title / outermost bar (css px)
// The icon's curly brace (viewBox 512; spans x 66..134, y 118..394), reused so the two match.
const BRACE = new Path2D('M 134 118 C 104 118 100 138 100 168 L 100 218 C 100 240 90 256 66 256 C 90 256 100 272 100 294 L 100 344 C 100 374 104 394 134 394');
const BRACE_W = 68, BRACE_H = 276, BRACE_STROKE = 26;
const TAU = 0.11;                        // seconds; how quickly the expansion settles

const canvas = $('viz'), toggle = $('viz-on'), title = $('title');
const enabled = () => toggle.checked || forced;
const ctx2d = canvas.getContext('2d');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const frameMs = matchMedia('(pointer: coarse)').matches ? 1000 / 30 : 1000 / 60;

let analyser = null, raf = 0, playing = false, last = 0;
let p = 0, target = 0;                   // expansion 0 (title) .. 1 (full-width bars)
let levels = new Float32Array(0), nMax = 0;
let color = '#f2b24c', braceColor = '#d9dce6';
let Kw = 1, Kh = 1;                      // size factors: 1 for the 52px masthead, larger in the minimal view
let forced = false;                      // minimal view: show the bars even if the Visualizer box is off
let dpr = 1, wCss = 0, hCss = 0, braceScale = 1, braceW = 0, idleRight = 0;

// Dubstep pulse (see vizCue): the bars put low pitches in the middle and high ones at the edges, so the drop's pitch dive is a bright pulse
// that falls from the edges to the middle, and the rise after it a pulse that climbs back out and stops dead.
let pulse = null;                        // { kind: 'dive' | 'rise', t0, ms }
// The pulse leaves the bars it has passed coloured: the dive paints a cool gradient (magenta at the edges to cyan in the middle) as it falls
// and holds it; the rise then repaints them warm (orange to magenta) as it climbs out; when the rise is over everything fades back to the
// style's colour.
let flashT0 = 0;                         // the strobe (an option): when the last flash began
let hold = false, holdT = 0, fade = 0;   // hold: the dive's colours are still on the bars; fade: when the colours began fading out
const diveHue = u => Math.round(180 + 120 * u), riseHue = u => Math.round((390 - 90 * u) % 360);
let rgb = null;                          // the bar colour as [r, g, b] if it is a #rrggbb value
const parse = c => { const m = /^#([0-9a-f]{6})$/i.exec(c); return m ? [0, 2, 4].map(i => parseInt(m[1].substr(i, 2), 16)) : null; };
const toWhite = t => rgb ? `rgb(${rgb.map(v => Math.round(v + (255 - v) * t)).join(',')})` : color;
const clamp01 = x => Math.min(1, Math.max(0, x));
const ease = x => x * x * (3 - 2 * x);

function size() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  wCss = canvas.clientWidth; hCss = canvas.clientHeight;
  canvas.width = Math.round(wCss * dpr); canvas.height = Math.round(hCss * dpr);
  Kh = hCss / 52; Kw = 1 + (Kh - 1) * 0.5;
  braceScale = (hCss - 4) / (BRACE_H + BRACE_STROKE);                  // braces (round ends included) fit the strip's height
  braceW = (BRACE_W + BRACE_STROKE) * braceScale;                      // outline included
  if (title) {
    title.style.left = (braceW + (PAD * Kw)) + 'px';
    idleRight = braceW + (PAD * Kw) + title.getBoundingClientRect().width + (PAD * Kw) + braceW;
  } else idleRight = 2 * braceW + 2 * (PAD * Kw) + 60;
  nMax = Math.max(7, Math.floor((wCss - 2 * (braceW + (PAD * Kw)) + (GAP * Kw)) / ((BAR * Kw) + (GAP * Kw))));
  levels = new Float32Array(nMax);
  const cs = getComputedStyle(document.documentElement);
  color = cs.getPropertyValue('--bars').trim() || cs.getPropertyValue('--accent').trim() || color;
  braceColor = cs.getPropertyValue('--text').trim() || braceColor;
  rgb = parse(color);
}

// Low frequencies sit in the middle and the highs spread outward, so it reads like the icon.
// Each bar keeps its frequency as the strip widens, so expanding reveals the higher bands.
// The middle bars are kept on different bins (at least one apart), or the first few all read the same constant bass and sit still.
function binFor(d, half, bins) { return Math.max(1 + d, 1 + Math.floor(Math.pow(d / half, 1.7) * (bins * 0.8))); }

function drawBraces(c, leftX, rightX) {
  const k = braceScale * dpr, h = canvas.height;
  c.strokeStyle = braceColor; c.lineWidth = BRACE_STROKE * k; c.lineCap = 'round'; c.lineJoin = 'round';
  const top = (h - BRACE_H * k) / 2 - 118 * k;                         // centre the path vertically
  const half = BRACE_STROKE * k / 2;
  c.setTransform(k, 0, 0, k, leftX * dpr - 66 * k + half, top);        // left brace, outline starts at leftX
  c.stroke(BRACE);
  c.setTransform(-k, 0, 0, k, rightX * dpr + 66 * k - half, top);      // right brace, mirrored, ends at rightX
  c.stroke(BRACE);
  c.setTransform(1, 0, 0, 1, 0, 0);
}

function draw() {
  const c = ctx2d, W = canvas.width, H = canvas.height, mid = H / 2;
  c.clearRect(0, 0, W, H);
  const e = ease(p);
  // Where the pulse is now (0 = the middle bar, 1 = the outermost), or -1 when there isn't one.
  let at = -1, tkind = null, tfade = 1;    // tkind: which pulse is moving; tfade: how much of the leftover colour remains (1 = all)
  const nowMs = performance.now();
  if (reduced || !playing) { pulse = null; hold = false; fade = 0; }
  if (pulse) {
    const f = (nowMs - pulse.t0) / pulse.ms;
    if (f >= 1) {
      if (pulse.kind === 'dive') { hold = true; holdT = nowMs; } else { hold = false; fade = nowMs; }
      pulse = null;
    } else { tkind = pulse.kind; at = tkind === 'dive' ? Math.pow(1 - f, 1.8) : 0.15 + 0.85 * Math.pow(f, 1.4); }
  }
  if (hold && !pulse && nowMs - holdT > 3500) hold = false;      // never leave the colours stuck on if the rise doesn't come
  if (fade) { tfade = 1 - (nowMs - fade) / 400; if (tfade <= 0) { fade = 0; tfade = 1; } }
  // The strobe: a short white flash of the bars and the strip on the beat of a snare fill (two a bar, never more than about 2.5 a second).
  const flash = $('strobe').checked && flashT0 ? Math.exp(-(nowMs - flashT0) / 110) : 0;
  if (flash > 0.03) { c.globalAlpha = 0.28 * flash; c.fillStyle = toWhite(0.8); c.fillRect(0, 0, W, H); c.globalAlpha = 1; }
  const baseFill = flash > 0.05 ? toWhite(Math.min(0.9, flash)) : color;
  const rightX = idleRight + (wCss - idleRight) * e;                   // right edge of the right brace
  drawBraces(c, 0, rightX);
  if (title) title.style.opacity = String(1 - clamp01(p / 0.35));

  // Bars live between the braces, centred in that gap, and appear once the title has mostly faded.
  const alpha = clamp01((p - 0.3) / 0.5);
  let energy = 0;
  if (alpha > 0 || playing) {
    const innerL = braceW + (PAD * Kw), innerR = rightX - braceW - (PAD * Kw);
    const avail = innerR - innerL;
    let n = Math.floor((avail + (GAP * Kw)) / ((BAR * Kw) + (GAP * Kw)));
    if (n % 2 === 0) n--;
    n = Math.min(n, nMax);
    if (n >= 1) {
      const used = n * ((BAR * Kw) + (GAP * Kw)) - (GAP * Kw), x0 = (innerL + (avail - used) / 2) * dpr;
      const bw = (BAR * Kw) * dpr, step = ((BAR * Kw) + (GAP * Kw)) * dpr, centre = (n - 1) / 2, fullHalf = (nMax - 1) / 2;
      let vals = null, bins = 0;
      if (playing && analyser) { vals = analyser.getValue(); bins = vals.length; }
      c.globalAlpha = alpha; c.fillStyle = baseFill;
      for (let i = 0; i < n; i++) {
        const d = Math.abs(i - centre);
        const rest = (REST_MIN * Kh) + ((REST_PEAK * Kh) - (REST_MIN * Kh)) * (1 - d / Math.max(1, centre));
        let t = 0;
        if (vals) {
          const lo = binFor(d, fullHalf, bins), hi = Math.max(lo + 1, binFor(d + 1, fullHalf, bins));
          let m = -140;
          for (let b = lo; b < hi && b < bins; b++) if (vals[b] > m) m = vals[b];
          t = clamp01((m + 93) / 55);                                   // -90 dB .. -35 dB  ->  0 .. 1
        }
        const idx = Math.min(nMax - 1, Math.round(d));
        levels[idx] = t > levels[idx] ? t : levels[idx] * 0.85;         // fast attack, slow decay
        energy += levels[idx];
        let boost = 0;
        if (at >= 0) { const u = (d / Math.max(1, centre)) - at; boost = Math.exp(-(u * u) / 0.012); }   // a soft bump around the pulse
        const h = Math.min(H * 0.96, Math.max(rest, levels[idx] * (MAX_H * Kh) + boost * 0.7 * MAX_H * Kh) * dpr * (0.4 + 0.6 * alpha));
        // Colour left behind by the pulse: what it has already passed (or all of it once it is done, while it holds or fades).
        const u0 = d / Math.max(1, centre);
        let trail = null, amt = 1;
        if (tkind === 'dive') { if (u0 > at) trail = diveHue(u0); }
        else if (tkind === 'rise') trail = u0 < at ? riseHue(u0) : hold ? diveHue(u0) : null;
        else if (hold) trail = diveHue(u0);
        else if (fade) { trail = riseHue(u0); amt = tfade; }
        if (boost > 0.12) {                // the pulse is a spread of neon colours: magenta on the outer side, white-hot in the middle, cyan on the inner side
          const u = (d / Math.max(1, centre)) - at, dir = pulse && pulse.kind === 'rise' ? -1 : 1;
          const hue = 160 + 120 * clamp01(0.5 + dir * u / 0.3) + 20;            // 180 (cyan) .. 300 (magenta)
          c.fillStyle = `hsl(${Math.round(hue)} 100% ${Math.round(58 + 34 * boost * boost)}%)`;
        } else if (trail !== null) {
          c.fillStyle = baseFill;
          if (amt < 1) { c.beginPath(); c.roundRect ? c.roundRect(x0 + i * step, mid - h / 2, bw, h, bw / 2) : c.rect(x0 + i * step, mid - h / 2, bw, h); c.fill(); c.globalAlpha = alpha * amt; }
          c.fillStyle = `hsl(${trail} 100% 60%)`;
        } else c.fillStyle = baseFill;
        const x = x0 + i * step, y = mid - h / 2;
        c.beginPath();
        c.roundRect ? c.roundRect(x, y, bw, h, bw / 2) : c.rect(x, y, bw, h);
        c.fill();
        c.globalAlpha = alpha;
      }
      c.globalAlpha = 1;
    }
  }
  return energy;
}

function frame(t) {
  raf = 0;
  const dt = Math.min(0.1, Math.max(0, (t - last) / 1000));
  if (t - last >= frameMs - 1) {
    last = t;
    if (p !== target) {
      p += (target - p) * (1 - Math.exp(-dt / TAU));
      if (Math.abs(target - p) < 0.004) p = target;
    }
    const energy = draw();
    const settling = p !== target || (!playing && energy > 0.05);
    if (!playing && !settling) { for (let i = 0; i < nMax; i++) levels[i] = 0; draw(); return; }
  }
  raf = requestAnimationFrame(frame);
}

function loop() { if (!raf) { last = performance.now() - frameMs; raf = requestAnimationFrame(frame); } }
function jump() { p = target; draw(); }

// The bar colour follows the selected style (the --bars variable); redraw so it shows right away.
export function vizRetint() {
  if (!wCss) return;                    // not laid out yet; initViz will read it
  const cs = getComputedStyle(document.documentElement);
  color = cs.getPropertyValue('--bars').trim() || cs.getPropertyValue('--accent').trim() || color;
  rgb = parse(color);
  if (!raf) draw();
}

// Call after the audio output is wired (on every start): re-attaches the analyser, since the iOS
// routing in audio/unlock.js disconnects the output each time Play is pressed.
export function vizAttach() {
  try {
    if (!analyser) analyser = new Tone.Analyser('fft', FFT);
    Tone.getDestination().connect(analyser);
  } catch (e) { analyser = null; }
}
// Cues from the music (dubstep only): 'dive' is the drop's pitch dive (it lasts `secs`), 'rise' the rise after it.
export function vizCue(kind, secs = 0.5) {
  if (reduced) return;
  if (kind === 'flash') { if ($('strobe').checked) { flashT0 = performance.now(); if (playing && enabled()) loop(); } return; }
  pulse = { kind, t0: performance.now(), ms: Math.max(100, secs * 1000) };
  if (kind === 'dive') { hold = false; fade = 0; }
  if (playing && enabled()) loop();
}

export function vizStart() {
  pulse = null; hold = false; fade = 0; flashT0 = 0;
  playing = true;
  if (!enabled()) return;
  target = 1;
  if (reduced) { jump(); return; }
  loop();
}
// Paused: the audio is frozen, so the bars settle to rest but the strip stays expanded.
export function vizPause() {
  pulse = null; hold = false; fade = 0;
  playing = false;
  if (enabled() && !reduced) loop();
}
export function vizStop() {
  pulse = null; hold = false; fade = 0;
  playing = false;
  target = 0;
  if (reduced || !enabled()) { jump(); return; }
  loop();
}

// Minimal view: the strip grows to fill the page and the bars run even if the Visualizer box is off.
// Call after the layout has changed (the strip's size is read from the page).
export function vizMinimal(on) {
  forced = on;
  size();
  if (on && playing) { target = 1; reduced ? jump() : loop(); }
  else if (!enabled()) { target = 0; jump(); }
  else draw();
}

export function initViz() {
  const relayout = () => { size(); draw(); };
  toggle.onchange = () => {
    if (!enabled()) { target = 0; jump(); }
    else if (playing) { target = 1; reduced ? jump() : loop(); }
  };
  window.addEventListener('resize', relayout);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(relayout);
  relayout();
}
