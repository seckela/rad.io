import { chillify } from './chill.js';
import { variant } from './seed.js';
import { DRUMS, drumGroove } from './groove.js';

// Bar patterns, as [offset in 16ths, velocity, length]. Even and odd bars alternate so a loop doesn't feel mechanical.
// The bass and the chord stabs follow the kick, the way a lo-fi producer would play them.
// The seed picks one set of each (see seed.js).
const CHORD_SETS = [
  [[[0, 0.26, 7], [6, 0.17, 4], [10, 0.14, 4]], [[0, 0.26, 9], [7, 0.18, 5]]],
  [[[0, 0.26, 12]], [[0, 0.26, 6], [8, 0.17, 5]]],
  [[[0, 0.26, 5], [3, 0.15, 3], [8, 0.17, 4], [11, 0.14, 3]], [[0, 0.26, 7], [10, 0.16, 5]]],
  [[[0, 0.26, 6], [4, 0.16, 3], [10, 0.16, 5]], [[0, 0.26, 8], [6, 0.18, 4], [12, 0.14, 3]]],
  [[[0, 0.26, 9], [8, 0.16, 4]], [[0, 0.26, 5], [6, 0.18, 4], [10, 0.15, 4]]],
];

// Lo-fi feel, built on the Chillstep composition (same sparse melody on a grid, same i - VI - III - VII chord loop,
// bass restating the chord) and then reworked:
//  - Chords gain a 9th on top (when it isn't a flat 9th) and are played as rhythmic stabs that follow the kick,
//    instead of being re-struck softly every second bar.
//  - The bass plays short, round notes on the kick pattern instead of one long overlapping tone.
//  - Melody notes are capped at half a bar so the piano plays phrases with space between them.
//  - A scattering of vinyl crackle pops (quiet 'crackle' events) is laid over the whole piece.
// The swing, the lazy snare and the loose timing are applied when the notes are played (see audio/play.js).
export function lofiify(r, key, scale, base, v = variant()) {
  const CHORD_HITS = v.of('chords', CHORD_SETS);
  // The bass plays on the groove's kicks, so it always locks with the drums (the same pick lofiDrums makes).
  const BASS_HITS = DRUMS[v.of('drums', LOFI_DRUMS)].kick.map(bar => bar.map((p, k) => [p, p === 0 ? 0.42 : 0.3, k % 2 ? 3 : 5]));
  const res = chillify(r, base, v);
  // Seeded: what colours each chord on top: a 9th (the classic), a 7th, a 6th, or nothing extra.
  const colour = v.of('colour', [1, 1, 6, 5, null]);
  const n = scale.length, pcs = scale.map(x => (key + x) % 12);
  // Drop Chillstep's soft restatements (the bass and chord events without a line segment); the changes themselves stay.
  let ev = res.events.filter(e => !((e.k === 'bass' || e.k === 'pad') && e.s === undefined));
  const changes = ev.filter(e => e.k === 'bass' && e.s !== undefined && e.m !== undefined).sort((a, b) => a.t - b.t);
  const chordOf = new Map(ev.filter(e => e.k === 'pad' && e.s !== undefined && e.m).map(e => [e.s, e]));

  // 9th on top of each chord: the next scale degree above its root, placed just above the chord and kept in range.
  for (const c of changes) {
    const chord = chordOf.get(c.s);
    if (!chord) continue;
    const at = pcs.indexOf(c.m % 12);
    if (at < 0) continue;
    if (colour === null) continue;
    const ninth = pcs[(at + colour) % n];
    if ((ninth - c.m % 12 + 12) % 12 === 1) continue;           // a flat 9th grates; leave that chord as it is
    const top = chord.m[chord.m.length - 1];
    let m = top + 1;
    while (m % 12 !== ninth) m++;
    chord.m = [...chord.m, m > 74 ? m - 12 : m];
    chord.v = 0.26;
  }

  // Stabs and bass notes on the absolute bar grid (the drums use the same one), until the next chord change.
  changes.forEach((c, j) => {
    const stop = changes[j + 1] ? changes[j + 1].t : res.t, chord = chordOf.get(c.s);
    c.d = 6; c.v = 0.42;
    for (let b = Math.floor(c.t / 16) * 16; b < stop; b += 16) {
      const bar = b / 16 % 2;
      for (const [off, v, d] of BASS_HITS[bar % BASS_HITS.length]) {
        const t = b + off;
        if (t > c.t && t < stop - 1) ev.push({ t, tr: 0, k: 'bass', m: c.m, d, v });
      }
      if (!chord) continue;
      for (const [off, v, d] of CHORD_HITS[bar]) {
        const t = b + off;
        if (t > c.t && t < stop - 1) ev.push({ t, tr: 0, k: 'pad', m: chord.m, d, v });
      }
    }
  });

  for (const e of ev) if (e.k === 'lead' && e.d > 8) e.d = 8;
  const events = ev.concat(gridCrackle(res.t, v));
  return { events, t: res.t };
}

// Vinyl crackle: quiet, irregular pops, about four a bar.
function gridCrackle(total, v) {
  const hash = v.noise('crackle');       // the same pops for the same text and seed
  const out = [];
  for (let u = 0; u < total - 1; u++) {
    if (hash(u * 3.1 + 7) > 0.74) out.push({ t: u + hash(u * 5.3) * 0.9, k: 'crackle', v: 0.08 + 0.25 * hash(u * 1.7), tr: 0 });
  }
  return out;
}

// The groove. The seed picks a whole one (see groove.js) from the dusty kinds, plus an occasional ghost snare; the bass in lofiify
// follows its kicks. (The lazy snare and loose timing come from audio/play.js.)
const LOFI_DRUMS = ['boombap', 'boombap', 'halftime', 'shuffle', 'breaks', 'sparse'];
export function lofiDrums(total, v = variant()) {
  const hash = v.noise('ghost-snare');
  const ev = drumGroove(total, v.of('drums', LOFI_DRUMS), 0.95, 0.8);
  for (let b = 0; b < total; b += 16) if (hash(b * 0.37 + 2) > 0.5) ev.push({ t: b + 15, k: 'snare', v: 0.16, tr: 0 });
  return ev;
}
