// A row of rounded bars (echoing the app icon) that rests quietly and moves with the music.
// Kept deliberately cheap: one small canvas, flat fills (no blur or shadows), a small FFT, no
// allocation per frame, a 30 fps cap on touch devices, and the loop only runs while playing (plus
// the brief fade-out). Honors prefers-reduced-motion (static resting bars only).
import { $ } from './dom.js';

const BAR = 6, GAP = 6, MAX_H = 48, REST_MIN = 4, REST_PEAK = 14;
const FFT = 256;                       // 128 bins
const canvas = $('viz');
const toggle = $('viz-on');
const ctx2d = canvas.getContext('2d');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const frameMs = matchMedia('(pointer: coarse)').matches ? 1000 / 30 : 1000 / 60;

let analyser = null, raf = 0, running = false, fading = false, last = 0;
let n = 0, levels = new Float32Array(0), color = '#f2b24c', dpr = 1, wCss = 0, hCss = 0;

function size() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  wCss = canvas.clientWidth; hCss = canvas.clientHeight;
  canvas.width = Math.round(wCss * dpr); canvas.height = Math.round(hCss * dpr);
  n = Math.max(7, Math.floor((wCss + GAP) / (BAR + GAP)));
  if (n % 2 === 0) n--;                // odd, so there is a centre bar
  levels = new Float32Array(n);
  color = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || color;
}

// Low frequencies sit in the centre and the highs spread outward, so it reads like the icon.
function binFor(d, half, bins) { return 1 + Math.floor(Math.pow(d / half, 1.7) * (bins * 0.8)); }

function draw(live) {
  const c = ctx2d, W = canvas.width, H = canvas.height, mid = H / 2;
  c.clearRect(0, 0, W, H);
  c.fillStyle = color;
  const bw = BAR * dpr, step = (BAR + GAP) * dpr, centre = (n - 1) / 2;
  const x0 = (W - (n * step - GAP * dpr)) / 2;
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
  return energy;
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
