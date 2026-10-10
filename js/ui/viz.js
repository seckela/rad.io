// A row of rounded bars (echoing the app icon) that rests quietly and moves with the music.
// Kept deliberately cheap: one small canvas, flat fills (no blur or shadows), a small FFT, no
// allocation per frame, a 30 fps cap on touch devices, and the loop only runs while playing (plus
// the brief fade-out). Honors prefers-reduced-motion (static resting bars only).
import { $ } from './dom.js';

const BAR = 6, GAP = 6, MAX_H = 48, REST_MIN = 4, REST_PEAK = 14;
const WIDTH_FRAC = 0.7, MIN_W = 220;     // the whole thing (braces and bars) takes about 70% of the width
const BRACE_PAD = 4;                     // space between a brace and the outermost bar (css px)
// The icon's curly brace (viewBox 512; spans x 66..134, y 118..394), reused so the two match.
const BRACE = new Path2D('M 134 118 C 104 118 100 138 100 168 L 100 218 C 100 240 90 256 66 256 C 90 256 100 272 100 294 L 100 344 C 100 374 104 394 134 394');
const BRACE_W = 68, BRACE_H = 276, BRACE_STROKE = 26;
const FFT = 256;                       // 128 bins
const canvas = $('viz');
const toggle = $('viz-on');
const ctx2d = canvas.getContext('2d');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const frameMs = matchMedia('(pointer: coarse)').matches ? 1000 / 30 : 1000 / 60;

let analyser = null, raf = 0, running = false, fading = false, last = 0;
let n = 0, levels = new Float32Array(0), color = '#f2b24c', braceColor = '#d9dce6', dpr = 1, wCss = 0, hCss = 0;
let barsX = 0, braceScale = 1, braceLeftX = 0, braceRightX = 0;

function size() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  wCss = canvas.clientWidth; hCss = canvas.clientHeight;
  canvas.width = Math.round(wCss * dpr); canvas.height = Math.round(hCss * dpr);
  braceScale = (hCss - 4) / BRACE_H;                       // braces span the strip's height
  const braceW = BRACE_W * braceScale + BRACE_STROKE * braceScale;   // outline included
  const total = Math.min(wCss, Math.max(MIN_W, wCss * WIDTH_FRAC));
  const barsW = Math.max(BAR, total - 2 * (braceW + BRACE_PAD));
  n = Math.max(5, Math.floor((barsW + GAP) / (BAR + GAP)));
  if (n % 2 === 0) n--;                // odd, so there is a centre bar
  levels = new Float32Array(n);
  const used = n * (BAR + GAP) - GAP;
  barsX = (wCss - used) / 2;
  braceLeftX = barsX - BRACE_PAD - braceW;                  // braces hug the bars, so the gap is
  braceRightX = barsX + used + BRACE_PAD + braceW;          // BRACE_PAD, not leftover width
  const cs = getComputedStyle(document.documentElement);
  color = cs.getPropertyValue('--accent').trim() || color;
  braceColor = cs.getPropertyValue('--text').trim() || braceColor;
}

// Low frequencies sit in the centre and the highs spread outward, so it reads like the icon.
function binFor(d, half, bins) { return 1 + Math.floor(Math.pow(d / half, 1.7) * (bins * 0.8)); }

function draw(live) {
  const c = ctx2d, W = canvas.width, H = canvas.height, mid = H / 2;
  c.clearRect(0, 0, W, H);
  c.fillStyle = color;
  const bw = BAR * dpr, step = (BAR + GAP) * dpr, centre = (n - 1) / 2;
  const x0 = barsX * dpr;
  let vals = null, bins = 0;
  if (live && analyser) { vals = analyser.getValue(); bins = vals.length; }
  let energy = 0;
  for (let i = 0; i < n; i++) {
    const d = Math.abs(i - centre);
    const rest = REST_MIN + (REST_PEAK - REST_MIN) * (1 - d / centre);
    let target = 0;
    if (vals) {
      const lo = binFor(d, centre, bins), hi = Math.max(lo + 1, binFor(d + 1, centre, bins));
      let m = -140;
      for (let b = lo; b < hi && b < bins; b++) if (vals[b] > m) m = vals[b];
      target = Math.min(1, Math.max(0, (m + 90) / 55));     // -90 dB..-35 dB  ->  0..1
    }
    levels[i] = target > levels[i] ? target : levels[i] * 0.85;   // fast attack, slow decay
    energy += levels[i];
    const h = Math.max(rest, levels[i] * MAX_H) * dpr;
    const x = x0 + i * step, y = mid - h / 2, r = bw / 2;
    c.beginPath();
    c.roundRect ? c.roundRect(x, y, bw, h, r) : c.rect(x, y, bw, h);
    c.fill();
  }
  drawBraces(c);
  return energy;
}

function drawBraces(c) {
  const k = braceScale * dpr, h = canvas.height;
  c.strokeStyle = braceColor; c.lineWidth = BRACE_STROKE * k; c.lineCap = 'round'; c.lineJoin = 'round';
  const top = (h - BRACE_H * k) / 2 - 118 * k;              // centre the path vertically
  // Left brace: its leftmost point (path x = 66) sits at braceLeftX.
  c.setTransform(k, 0, 0, k, braceLeftX * dpr - 66 * k + BRACE_STROKE * k / 2, top);
  c.stroke(BRACE);
  // Right brace: mirrored, its rightmost point at braceRightX.
  c.setTransform(-k, 0, 0, k, braceRightX * dpr + 66 * k - BRACE_STROKE * k / 2, top);
  c.stroke(BRACE);
  c.setTransform(1, 0, 0, 1, 0, 0);
}

function frame(t) {
  raf = 0;
  if (!running && !fading) return;
  if (t - last >= frameMs - 1) {
    last = t;
    const energy = draw(running);
    if (!running && energy < 0.05) { fading = false; draw(false); return; }
  }
  raf = requestAnimationFrame(frame);
}
function loop() { if (!raf && !reduced && toggle.checked) raf = requestAnimationFrame(frame); }

// Call after the audio output is wired (on every start): re-attaches the analyser, since the iOS
// routing in audio/unlock.js disconnects the output each time Play is pressed.
export function vizAttach() {
  try {
    if (!analyser) analyser = new Tone.Analyser('fft', FFT);
    Tone.getDestination().connect(analyser);
  } catch (e) { analyser = null; }
}
export function vizStart() { running = true; fading = false; loop(); }
export function vizStop() { running = false; fading = true; loop(); if (reduced || !toggle.checked) { fading = false; draw(false); } }

export function initViz() {
  const apply = () => {
    canvas.hidden = !toggle.checked;
    if (toggle.checked) { size(); draw(false); if (running) loop(); }
  };
  toggle.onchange = apply;
  window.addEventListener('resize', () => { if (toggle.checked) { size(); draw(running); } });
  apply();
}
