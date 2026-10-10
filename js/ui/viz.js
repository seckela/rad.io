// The masthead: "{rad.io}" at rest. On Play the right brace slides out to the edge of the page, the
// title fades, and rounded bars (echoing the app icon) grow outward from the middle and move with
// the music; Stop reverses it. The left brace never moves.
//
// Kept deliberately cheap: one canvas, flat fills (no blur or shadows), a small FFT, no allocation
// per frame, a 30 fps cap on touch devices, and the loop only runs while something is moving.
// Honors prefers-reduced-motion (the two states just switch, no animation).
import { $ } from './dom.js';

const BAR = 6, GAP = 6, MAX_H = 44, REST_MIN = 4, REST_PEAK = 12;
const FFT = 256;                         // 128 bins
const PAD = 8;                           // space between a brace and the title / outermost bar (css px)
// The icon's curly brace (viewBox 512; spans x 66..134, y 118..394), reused so the two match.
const BRACE = new Path2D('M 134 118 C 104 118 100 138 100 168 L 100 218 C 100 240 90 256 66 256 C 90 256 100 272 100 294 L 100 344 C 100 374 104 394 134 394');
const BRACE_W = 68, BRACE_H = 276, BRACE_STROKE = 26;
const TAU = 0.11;                        // seconds; how quickly the expansion settles

const canvas = $('viz'), toggle = $('viz-on'), title = $('title');
const ctx2d = canvas.getContext('2d');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const frameMs = matchMedia('(pointer: coarse)').matches ? 1000 / 30 : 1000 / 60;

let analyser = null, raf = 0, playing = false, last = 0;
let p = 0, target = 0;                   // expansion 0 (title) .. 1 (full-width bars)
let levels = new Float32Array(0), nMax = 0;
let color = '#f2b24c', braceColor = '#d9dce6';
let dpr = 1, wCss = 0, hCss = 0, braceScale = 1, braceW = 0, idleRight = 0;

const clamp01 = x => Math.min(1, Math.max(0, x));
const ease = x => x * x * (3 - 2 * x);

function size() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  wCss = canvas.clientWidth; hCss = canvas.clientHeight;
  canvas.width = Math.round(wCss * dpr); canvas.height = Math.round(hCss * dpr);
  braceScale = (hCss - 4) / BRACE_H;                                   // braces span the strip's height
  braceW = (BRACE_W + BRACE_STROKE) * braceScale;                      // outline included
  if (title) {
    title.style.left = (braceW + PAD) + 'px';
    idleRight = braceW + PAD + title.getBoundingClientRect().width + PAD + braceW;
  } else idleRight = 2 * braceW + 2 * PAD + 60;
  nMax = Math.max(7, Math.floor((wCss - 2 * (braceW + PAD) + GAP) / (BAR + GAP)));
  levels = new Float32Array(nMax);
  const cs = getComputedStyle(document.documentElement);
  color = cs.getPropertyValue('--accent').trim() || color;
  braceColor = cs.getPropertyValue('--text').trim() || braceColor;
}

// Low frequencies sit in the middle and the highs spread outward, so it reads like the icon.
// Each bar keeps its frequency as the strip widens, so expanding reveals the higher bands.
function binFor(d, half, bins) { return 1 + Math.floor(Math.pow(d / half, 1.7) * (bins * 0.8)); }

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
  const rightX = idleRight + (wCss - idleRight) * e;                   // right edge of the right brace
  drawBraces(c, 0, rightX);
  if (title) title.style.opacity = String(1 - clamp01(p / 0.35));

  // Bars live between the braces, centred in that gap, and appear once the title has mostly faded.
  const alpha = clamp01((p - 0.3) / 0.5);
  let energy = 0;
  if (alpha > 0 || playing) {
    const innerL = braceW + PAD, innerR = rightX - braceW - PAD;
    const avail = innerR - innerL;
    let n = Math.floor((avail + GAP) / (BAR + GAP));
    if (n % 2 === 0) n--;
    n = Math.min(n, nMax);
    if (n >= 1) {
      const used = n * (BAR + GAP) - GAP, x0 = (innerL + (avail - used) / 2) * dpr;
      const bw = BAR * dpr, step = (BAR + GAP) * dpr, centre = (n - 1) / 2, fullHalf = (nMax - 1) / 2;
      let vals = null, bins = 0;
      if (playing && analyser) { vals = analyser.getValue(); bins = vals.length; }
      c.globalAlpha = alpha; c.fillStyle = color;
      for (let i = 0; i < n; i++) {
        const d = Math.abs(i - centre);
        const rest = REST_MIN + (REST_PEAK - REST_MIN) * (1 - d / Math.max(1, centre));
        let t = 0;
        if (vals) {
          const lo = binFor(d, fullHalf, bins), hi = Math.max(lo + 1, binFor(d + 1, fullHalf, bins));
          let m = -140;
          for (let b = lo; b < hi && b < bins; b++) if (vals[b] > m) m = vals[b];
          t = clamp01((m + 90) / 55);                                   // -90 dB .. -35 dB  ->  0 .. 1
        }
        const idx = Math.min(nMax - 1, Math.round(d));
        levels[idx] = t > levels[idx] ? t : levels[idx] * 0.85;         // fast attack, slow decay
        energy += levels[idx];
        const h = Math.max(rest, levels[idx] * MAX_H) * dpr * (0.4 + 0.6 * alpha);
        const x = x0 + i * step, y = mid - h / 2;
        c.beginPath();
        c.roundRect ? c.roundRect(x, y, bw, h, bw / 2) : c.rect(x, y, bw, h);
        c.fill();
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

// Call after the audio output is wired (on every start): re-attaches the analyser, since the iOS
// routing in audio/unlock.js disconnects the output each time Play is pressed.
export function vizAttach() {
  try {
    if (!analyser) analyser = new Tone.Analyser('fft', FFT);
    Tone.getDestination().connect(analyser);
  } catch (e) { analyser = null; }
}
export function vizStart() {
  playing = true;
  if (!toggle.checked) return;
  target = 1;
  if (reduced) { jump(); return; }
  loop();
}
// Paused: the audio is frozen, so the bars settle to rest but the strip stays expanded.
export function vizPause() {
  playing = false;
  if (toggle.checked && !reduced) loop();
}
export function vizStop() {
  playing = false;
  target = 0;
  if (reduced || !toggle.checked) { jump(); return; }
  loop();
}

export function initViz() {
  const relayout = () => { size(); draw(); };
  toggle.onchange = () => {
    if (!toggle.checked) { target = 0; jump(); }
    else if (playing) { target = 1; reduced ? jump() : loop(); }
  };
  window.addEventListener('resize', relayout);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(relayout);
  relayout();
}
