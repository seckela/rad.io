import { chillify } from './chill.js';
import { variant } from './seed.js';

// Ambient feel, built on the Chillstep layout (same sparse, slow melody on a grid and the same i - VI - III - VII chord
// loop, one change per new line) but with nothing struck: the harmony is held.
//  - Each chord change becomes one long, soft drone: the chord and a low root with its fifth sustain until the next
//    change instead of being restated every bar.
//  - Melody notes are thinned to one every few beats and lengthened so they blend into the held chords.
//  - Every few bars a soft gust of wind chimes drifts through: two to four high notes tumbling close together down a minor-pentatonic-like
//    subset of the scale, each ringing for seconds. They are placed by a fixed hash, so the same code gets the same chimes.
//  - There are no drums at all.
// The slow fades, the filtering and the big reverb come from the voices (see audio/ambient-track.js).
export function ambientify(r, key, scale, base, v = variant()) {
  // Seeded choices (see seed.js): the interval held above each drone's root, how sparse the melody is, and the chimes (see windChimes).
  const above = v.of('above', [7, 7, 12, 9]), thinGap = v.of('thin', [8, 10, 14, 18]);
  const res = chillify(r, base);
  // Drop Chillstep's soft restatements (bass and chord events without a line segment); the changes themselves stay.
  const ev = res.events.filter(e => !((e.k === 'bass' || e.k === 'pad') && e.s === undefined));
  const changes = ev.filter(e => e.k === 'bass' && e.s !== undefined && e.m !== undefined).sort((a, b) => a.t - b.t);
  const chordOf = new Map(ev.filter(e => e.k === 'pad' && e.s !== undefined && e.m).map(e => [e.s, e]));
  const extra = [];
  changes.forEach((c, j) => {
    const span = (changes[j + 1] ? changes[j + 1].t : res.t) - c.t + 8;   // overlaps the next change so the join is a crossfade
    c.m += 12;                       // up from the sub-bass range, where a sine is hard to hear on small speakers
    c.d = span; c.v = 0.4;
    extra.push({ t: c.t, tr: c.tr, k: 'bass', m: c.m + above, d: span, v: 0.22 });    // the open fifth (or octave, or sixth)
    const chord = chordOf.get(c.s);
    if (chord) { chord.d = span; chord.v = 0.3; }
  });
  // Thin the melody to a note every few beats (the dropped ones become silent rests, so the text highlight still
  // moves), and let the rest ring long.
  let lastLead = -99;
  for (const e of ev.filter(x => x.k === 'lead').sort((x, y) => x.t - y.t)) {
    if (e.t - lastLead < thinGap) { e.k = 'rest'; delete e.m; delete e.v; continue; }
    lastLead = e.t; e.d = Math.max(e.d || 0, 8); e.v *= 0.8;
  }
  return { events: ev.concat(extra, windChimes(res.t + 32, key, scale, v)), t: res.t + 32 };    // a bar-and-a-half tail so the last chord rings out
}

// Wind chimes: a gust every 1.5 to 4 bars, each two to four quick, high notes (mostly falling) from the scale. They carry no
// text index, so the highlight is unaffected, and they stay clear of the melody's range.
function windChimes(total, key, scale, v) {
  const hash = v.noise('chimes'), gap = v.of('chime-gap', [28, 40, 56]);   // the same gusts for the same text and seed; some texts get more
  const n = scale.length;
  const picks = n === 7 ? [0, 2, 3, 4, 6] : scale.map((_, i) => i);   // leave out the notes most likely to clash with the chords
  const out = [];
  let t = 12 + Math.floor(hash(1) * 16), g = 0;
  while (t < total - 8) {
    const count = 2 + Math.floor(hash(g * 7.1 + 2) * 3);               // 2 to 4 notes
    const notes = [];
    for (let j = 0; j < count; j++) {
      const deg = picks[Math.floor(hash(g * 13.7 + j * 3.3 + 5) * picks.length)];
      let m = 76 + key + scale[deg];
      if (m + 12 <= 96 && hash(g * 5.9 + j * 1.9 + 9) > 0.6) m += 12;
      notes.push(m);
    }
    if (hash(g * 3.3 + 4) < 0.7) notes.sort((a, b) => b - a);       // usually a falling cascade
    let at = t;
    notes.forEach((m, j) => {
      out.push({ t: at, tr: 0, k: 'chime', m, d: 8, v: Math.max(0.3, 0.55 - j * 0.04 - hash(g * 2.7 + j) * 0.06) });
      at += 1 + Math.floor(hash(g * 9.1 + j * 2.1 + 1) * 2);       // 1 or 2 sixteenths apart, so they ring together as one chime
    });
    t += 24 + Math.floor(hash(g * 4.4 + 6) * gap);
    g++;
  }
  return out;
}
