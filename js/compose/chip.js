// Chiptune feel, built on the default composition (same melody, same chord roots) and reworked the way an
// 8-bit soundtrack would be written for a handful of simple channels:
//  - Chords become fast arpeggios (one note per 16th, cycling up and back down the chord) instead of
//    sustained chords, because the old sound chips couldn't hold three notes at once.
//  - The bass bounces between its root and the octave above on every 8th note, until the next line's root.
//  - The character-driven drum hits (= + - < > and so on) go quiet and a steady, tight beat takes over (see chipDrums).
// Digits and quotes keep their blips and plinks, and the melody is untouched.
import { variant } from './seed.js';

// Seeded choices (see seed.js): the arpeggio shape (indexes into the chord), how the bass bounces (semitones above the root, one
// per 8th), and the drum groove (see chipDrums).
const ARPS = [[0, 1, 2, 1], [0, 2, 1, 2], [2, 1, 0, 1], [0, 1, 2, 2, 1, 0]];
const BOUNCES = [[0, 12], [0, 12, 7, 12], [0, 0, 12, 0], [0, 7, 12, 7]];

export function chipify(r, v = variant()) {
  const ARP = v.of('arp', ARPS), BOUNCE = v.of('bounce', BOUNCES);
  const out = [];
  for (const e of r.events) {
    if (['kick', 'hat', 'snare'].includes(e.k)) { out.push({ ...e, k: 'rest' }); continue; }
    if (e.k === 'pad' && e.m) {
      const n = Math.max(2, Math.min(e.d || 4, 8));
      for (let j = 0; j < n; j++) {
        const o = { t: e.t + j, tr: e.tr, k: 'arp', m: e.m[ARP[j % ARP.length]] + 12, d: 1, v: (e.v || 0.3) * 0.7 };
        if (j === 0) o.i = e.i;
        out.push(o);
      }
      continue;
    }
    if (e.k === 'bass' && e.s !== undefined) continue;      // replaced by the bounce below
    out.push(e);
  }
  const roots = r.events.filter(e => e.k === 'bass' && e.s !== undefined).sort((a, b) => a.t - b.t);
  roots.forEach((c, j) => {
    const stop = roots[j + 1] ? roots[j + 1].t : r.t;
    for (let t = c.t, k = 0; t < stop; t += 2, k++) {
      const o = { t, tr: c.tr, k: 'bass', m: c.m + 12 + BOUNCE[k % BOUNCE.length], d: 1.6, v: k % 4 === 0 ? 0.7 : 0.5 };
      if (k === 0) o.i = c.i;
      out.push(o);
    }
  });
  return { events: out, t: r.t };
}

// A tight four-on-the-floor-ish beat: kick on 1 and 3 (plus a pickup every other bar), snare on 2 and 4,
// and straight 8th hats with the beats accented.
export function chipDrums(total, v = variant()) {
  // Seeded: where the kicks fall (1 and 3 with a pickup, 1 and the "and" of 2 and 3, or 1, 3 and a late kick), and 8th or 16th hats.
  const kicks = v.of('kicks', [[0, 8], [0, 6, 8], [0, 8, 11]]), sixteenths = v.chance('hats16', 0.35);
  const ev = [];
  for (let b = 0; b < total; b += 16) {
    for (const off of kicks) ev.push({ t: b + off, k: 'kick', v: off ? 0.8 : 0.9, tr: 0 });
    if ((b / 16) % 2 === 1) ev.push({ t: b + 14, k: 'kick', v: 0.6, tr: 0 });
    ev.push({ t: b + 4, k: 'snare', v: 0.8, tr: 0 }, { t: b + 12, k: 'snare', v: 0.8, tr: 0 });
    if (sixteenths) for (let h = 0; h < 16; h++) ev.push({ t: b + h, k: 'hat', v: h % 4 === 0 ? 0.5 : h % 2 === 0 ? 0.3 : 0.16, tr: 0 });
    else for (let h = 0; h < 8; h++) ev.push({ t: b + h * 2, k: 'hat', v: h % 2 ? 0.3 : 0.5, tr: 0 });
  }
  return ev;
}
