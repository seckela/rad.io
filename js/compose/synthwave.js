// Synthwave feel, built on the default composition (same melody and chord roots) and reworked like an 80s night-drive track:
//  - The bass becomes a relentless pulse: a 16th-note saw on the line's root until the next line's root, with the beats accented.
//  - Chords are held (at least a beat and a half) so the wide, detuned pad underneath never stops.
//  - The character-driven drum hits go quiet and a steady four-on-the-floor beat takes over (see synthwaveDrums): kick on every
//    beat, snare / clap on 2 and 4, offbeat hats with 16th ghosts.
// Digits and quotes keep their blips and plinks, and the melody is untouched (the voices give it a bright, echoing saw lead).
import { variant } from './seed.js';
import { bassGroove } from './groove.js';

// Seeded choices (see seed.js): the bass line's rhythm (one entry per 16th, a semitone offset or null for a rest) and how long the pad
// is held, plus the drums (see synthwaveDrums).
const BASS_LINES = [
  [0],                                                            // a steady 16th pulse
  [0, null],                                                      // 8ths
  [0, 0, 12, 0, 0, 12, 0, 0],                                     // octave jumps
  [0, 0, 0, null, 0, 0, null, 0],                                 // a galloping, driving pulse
];

export function synthwaveify(r, v = variant()) {
  const line = v.of('bass', BASS_LINES), bassFam = v.of('bassfam', ['line', 'line', 'sync', 'fifth', 'walk']), padHold = v.of('pad', [6, 8, 12]);
  const out = [];
  for (const e of r.events) {
    if (['kick', 'hat', 'snare'].includes(e.k)) { out.push({ ...e, k: 'rest' }); continue; }
    if (e.k === 'bass' && e.s !== undefined) continue;      // replaced by the pulse below
    if (e.k === 'pad' && e.m) { out.push({ ...e, d: Math.max(e.d || 0, padHold) }); continue; }
    out.push(e);
  }
  const roots = r.events.filter(e => e.k === 'bass' && e.s !== undefined).sort((a, b) => a.t - b.t);
  roots.forEach((c, j) => {
    const stop = roots[j + 1] ? roots[j + 1].t : r.t;
    if (bassFam !== 'line') { out.push(...bassGroove(c.t, stop, c.m, bassFam, c.tr, c.i, 0.7)); return; }
    for (let t = c.t, k = 0; t < stop; t++, k++) {
      const step = line[k % line.length];
      if (step === null && k > 0) continue;
      const o = { t, tr: c.tr, k: 'bass', m: c.m + (step || 0), d: line.length === 2 ? 1.6 : 1, v: k % 4 === 0 ? 0.75 : k % 2 === 0 ? 0.55 : 0.4 };
      if (k === 0) o.i = c.i;
      out.push(o);
    }
  });
  return { events: out, t: r.t };
}

export function synthwaveDrums(total, v = variant()) {
  // Seeded: the hat pattern (offbeats with 16th ghosts, offbeats only, or 8ths with the offbeats accented), a pickup kick before every
  // fourth bar, and a clap on the 2 and 4 or just on the 4 of alternate bars.
  const hats = v.pick('hats', 3), pickup = v.chance('pickup', 0.5), thin = v.chance('thin-claps', 0.25);
  const ev = [];
  for (let b = 0; b < total; b += 16) {
    for (const off of [0, 4, 8, 12]) ev.push({ t: b + off, k: 'kick', v: off ? 0.75 : 0.9, tr: 0 });
    if (!(thin && (b / 16) % 2)) ev.push({ t: b + 4, k: 'snare', v: 0.85, tr: 0 });
    ev.push({ t: b + 12, k: 'snare', v: 0.9, tr: 0 });
    if (pickup && (b / 16) % 4 === 3) ev.push({ t: b + 14, k: 'kick', v: 0.6, tr: 0 });
    for (let h = 0; h < 16; h++) {
      if (h % 4 === 2) ev.push({ t: b + h, k: 'hat', v: 0.55, tr: 0 });             // the offbeat 8ths
      else if (hats === 0 && h % 2 === 1) ev.push({ t: b + h, k: 'hat', v: 0.18, tr: 0 });         // quiet 16th ghosts
      else if (hats === 2 && h % 4 === 0) ev.push({ t: b + h, k: 'hat', v: 0.3, tr: 0 });         // 8ths, the beats quieter
    }
  }
  return ev;
}
