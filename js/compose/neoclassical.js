import { chillify } from './chill.js';
import { variant } from './seed.js';

// Neo-classical feel, built on the Chillstep layout (the same slow, sparse melody on a grid, and one chord per code line from a
// seeded loop) and arranged like a modern piano piece with strings:
//  - Each chord becomes a piano figure that rolls through it without stopping (an arpeggio, in even eighths or in flowing triplets, in
//    one of several shapes) until the next line's chord.
//  - A low, bowed bass (a cello) holds each chord's root; its shape is seeded (held, a root and fifth, or a rocking pair).
//  - The melody sings above the figure, a few notes at a time, ringing on into the next.
//  - A string section swells in under the chords once the piece has settled, and leaves again before the end. The whole piece follows a
//    long dynamic arc: it begins quietly, grows towards the middle and falls away.
//  - There are no drums, and the character-driven bells, digits and percussion go quiet.
// The voices (a sampled piano, bowed synth strings) and the hall reverb are in audio/neoclassical-track.js.

// The figures, as indexes into the chord's pool [root, 3rd, 5th, root+8ve, 3rd+8ve], one per eighth of a bar (eight to a bar)...
const EIGHTHS = [
  [0, 1, 2, 3, 4, 3, 2, 1],       // up and back down
  [0, 2, 1, 3, 2, 4, 3, 2],       // a wave
  [0, 1, 2, 1, 3, 2, 4, 2],       // a rolling climb
  [0, 2, 3, 2, 1, 2, 3, 4],       // a broken, circling shape
];
// ...or one per triplet eighth (twelve to a bar, a 12/8 flow).
const TRIPLETS = [
  [0, 1, 2, 1, 3, 2, 4, 2, 3, 2, 1, 2],
  [0, 2, 1, 3, 2, 4, 3, 2, 1, 2, 3, 1],
];

// The dynamic arc: soft at the start, full in the middle, soft again at the end (p is the position in the piece, 0 to 1).
const arc = p => 0.4 + 0.5 * Math.sin(Math.PI * Math.min(1, Math.max(0, p)));

export function neoclassicalify(r, key, scale, base, v = variant()) {
  // Seeded choices (see seed.js): the figure and its pulse, the bass family, the doubling of the strings, and the melody's pace.
  const triplets = v.chance('triplets', 0.3);
  const fig = triplets ? v.of('figure-t', TRIPLETS) : v.of('figure', EIGHTHS);
  const bassFam = v.of('bass', ['held', 'held', 'fifth', 'rock']);
  const stringsAbove = v.of('strings', [12, 12, 7]);
  // Which stretches the cello takes the melody in (the piano keeps the figure). The track is cut into blocks of two or three chord pieces
  // (eight to twelve bars or so), and the cello has every other block, every third, or the second half. Between two piano blocks it comes
  // in for a few notes leading into the next one (see below).
  const celloIn = v.of('cello', ['odd', 'odd', 'third', 'late']), blockLen = v.of('cello-len', [2, 2, 3]);
  const res = chillify(r, base, v);
  const tail = 16;
  const total = res.t + tail;
  const ev = [];
  // The Chillstep layout without its soft restatements, bells, digits and percussion: only the chord changes stay.
  for (const e of res.events) {
    if ((e.k === 'bass' || e.k === 'pad') && e.s === undefined) continue;
    if (['bell', 'digit', 'kick', 'hat', 'snare'].includes(e.k)) { ev.push({ t: e.t, i: e.i, tr: e.tr, k: 'rest' }); continue; }
    ev.push(e);
  }
  const changes = ev.filter(e => e.k === 'bass' && e.s !== undefined && e.m !== undefined).sort((a, b) => a.t - b.t).map(e => ({ ...e }));   // copies: the originals become rests below
  const chordOf = new Map(ev.filter(e => e.k === 'pad' && e.s !== undefined && e.m).map(e => [e.s, { ...e }]));
  // The chord changes themselves are replaced below by the arrangement (they keep their text index on a rest, so the highlight still moves).
  for (const e of ev) if (e.s !== undefined && (e.k === 'bass' || e.k === 'pad')) { e.k = 'rest'; delete e.m; delete e.v; delete e.d; }

  // A long line would hold one chord for many bars, so it is split into pieces of about four bars, and the later pieces move on to
  // other chords of the key (a seeded shape: I - VI - IV - V and its relatives, as degrees above the line's own chord).
  const INNER = v.of('inner', [[0, 5, 3, 4], [0, 3, 5, 4], [0, 5, 2, 4], [0, 2, 5, 3]]);
  const n = scale.length;
  const pieces = [];
  changes.forEach((c, j) => {
    const stop = changes[j + 1] ? changes[j + 1].t : total, span = stop - c.t;
    const count = Math.max(1, Math.round(span / 64));
    for (let k = 0; k < count; k++) {
      const start = k === 0 ? c.t : Math.round((c.t + span * k / count) / 4) * 4;
      const end = k === count - 1 ? stop : Math.round((c.t + span * (k + 1) / count) / 4) * 4;
      pieces.push({ start, stop: end, deg: c.a + (k ? INNER[k % 4] : 0), tr: c.tr, first: k === 0 });
    }
  });
  // Voice each chord low and close (so the figure stays under the melody), moving as little as possible from the last one.
  let prev = null;
  const voice = deg => {
    const pcs = [r.pad(deg), r.pad(deg + 2), r.pad(deg + 4)].map(m => ((m % 12) + 12) % 12);
    let best = null, bestCost = Infinity;
    const opts = pc => { const o = []; for (let m = 45; m <= 60; m++) if (m % 12 === pc) o.push(m); return o; };
    for (const x of opts(pcs[0])) for (const y of opts(pcs[1])) for (const z of opts(pcs[2])) {
      const t = [x, y, z].sort((a, b) => a - b);
      if (t[2] - t[0] > 12) continue;
      const cost = prev ? t.reduce((sum, m, q) => sum + Math.abs(m - prev[q]), 0) : Math.abs((t[0] + t[1] + t[2]) / 3 - 53);
      if (cost < bestCost) { bestCost = cost; best = t; }
    }
    return prev = best || pcs.map(pc => 48 + ((pc - 48 + 120) % 12)).sort((a, b) => a - b);
  };
  const extra = [];
  const step = triplets ? 16 / 12 : 2, per = triplets ? 12 : 8;
  pieces.forEach(c => {
    const start = c.start, stop = c.stop, tones = c.tones = voice(c.deg);
    const a0 = arc(start / total);
    // The bowed bass: the chord's root in the octave above Chillstep's sub-bass (so it can be heard on small speakers) until the next chord.
    const root = 43 + ((((r.pad(c.deg) % 12) + 12) % 12 - 43 % 12) + 12) % 12;
    if (bassFam === 'held') extra.push({ t: start, tr: c.tr, k: 'bass', m: root, d: stop - start + 4, v: 0.5 * a0 + 0.15 });
    else for (let b = start; b < stop - 2; b += 16) {
      const room = Math.min(16, stop - b) + 3;
      if (bassFam === 'fifth') { extra.push({ t: b, tr: c.tr, k: 'bass', m: root, d: room, v: 0.45 * a0 + 0.12 }); if (stop - b > 10) extra.push({ t: b + 8, tr: c.tr, k: 'bass', m: root + 7, d: 11, v: 0.3 * a0 + 0.1 }); }
      else { extra.push({ t: b, tr: c.tr, k: 'bass', m: root, d: 10, v: 0.45 * a0 + 0.12 }); if (stop - b > 8) extra.push({ t: b + 8, tr: c.tr, k: 'bass', m: root + 12, d: 10, v: 0.32 * a0 + 0.1 }); }
    }
    // The piano figure, bar by bar: the first note of a bar is the strongest, the first bar of a chord a little stronger.
    const pool = [tones[0], tones[1], tones[2], tones[0] + 12, tones[1] + 12];
    for (let b = start, bar = 0; b < stop - 1; b += 16, bar++) {
      const lastBar = stop === total && b + 16 >= stop - 1;
      for (let k = 0; k < per; k++) {
        const t = b + k * step;
        if (t >= stop - 0.5) break;
        if (lastBar && k >= per / 2) break;                         // the last bar only plays half its figure, then the final chord rings
        const a = arc(t / total);
        const accent = k === 0 ? 1 : k % (per / 4) === 0 ? 0.85 : 0.7;
        extra.push({ t, tr: c.tr, k: 'arp', m: pool[fig[k]], d: step * 2.2, v: Math.min(1, (0.45 + 0.4 * (a - 0.4) / 0.5) * accent * (bar === 0 ? 1.05 : 1)) });
      }
    }
    // The string chord: it enters once the piece has grown past its first stretch and leaves as it falls away.
    if (a0 >= 0.62 && stop - start >= 8) extra.push({ t: start, tr: c.tr, k: 'strings', m: tones.map((m, q) => m + 12 + (q === 2 ? stringsAbove - 12 : 0)), d: stop - start + 6, v: 0.3 + 0.35 * (a0 - 0.62) / 0.28 });
    // The close: the last chord is left to ring, voiced high.
    if (stop === total) extra.push({ t: Math.max(start, total - 16), tr: c.tr, k: 'arp', m: tones[2] + 12, d: 24, v: 0.5 });
  });

  // The melody: the Chillstep notes, an octave or two higher so they sing above the figure, each ringing on into the next. In the pieces
  // where the cello takes over, the same notes are played an octave lower in its range (the voice is chosen in audio/play.js).
  const blocks = Math.ceil(pieces.length / blockLen);
  const cellos = i => { const b = Math.floor(i / blockLen); return celloIn === 'odd' ? b % 2 === 1 : celloIn === 'third' ? b % 3 === 2 : b >= Math.ceil(blocks / 2); };
  // The pickups: where a piano block runs into another piano block, the cello plays three notes of the incoming chord, falling, in the
  // last bar, the last one ringing on into the new chord.
  const pickups = [];
  pieces.forEach((c, i) => {
    const next = pieces[i + 1];
    if (!next || (i + 1) % blockLen !== 0 || cellos(i) || cellos(i + 1) || c.stop - c.start < 12) return;
    const fit = m => { while (m < 55) m += 12; while (m > 69) m -= 12; return m; };
    const notes = next.tones.map(fit).sort((a, b) => b - a);
    [[-7, 3], [-4.5, 3], [-2, 6]].forEach(([off, d], q) => pickups.push({ t: c.stop + off, tr: c.tr, k: 'lead', m: notes[q], d, v: 0.4 + 0.2 * arc(c.stop / total), cello: true }));
  });
  for (const e of ev) {
    if (e.k !== 'lead') continue;
    let m = e.m;
    while (m < 69) m += 12;
    while (m > 88) m -= 12;
    const pi = pieces.findIndex(c => e.t >= c.start && e.t < c.stop);
    if (pi >= 0 && cellos(pi)) { m -= 12; while (m > 69) m -= 12; e.cello = true; }
    e.m = m;
    e.d = Math.max(e.d || 2, 4);
    e.v = Math.min(1, (e.v || 0.5) * (0.7 + 0.5 * arc(e.t / total)));
  }
  return { events: ev.concat(extra, pickups), t: total };
}
