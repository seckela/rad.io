import { chillify } from './chill.js';

// Ambient feel, built on the Chillstep layout (same sparse, slow melody on a grid and the same i - VI - III - VII chord
// loop, one change per new line) but with nothing struck: the harmony is held.
//  - Each chord change becomes one long, soft drone: the chord and a low root with its fifth sustain until the next
//    change instead of being restated every bar.
//  - Melody notes are thinned to one every few beats and lengthened so they blend into the held chords.
//  - There are no drums at all.
// The slow fades, the filtering and the big reverb come from the voices (see audio/ambient-track.js).
export function ambientify(r, base) {
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
    extra.push({ t: c.t, tr: c.tr, k: 'bass', m: c.m + 7, d: span, v: 0.22 });    // the open fifth
    const chord = chordOf.get(c.s);
    if (chord) { chord.d = span; chord.v = 0.3; }
  });
  // Thin the melody to a note every few beats (the dropped ones become silent rests, so the text highlight still
  // moves), and let the rest ring long.
  let lastLead = -99;
  for (const e of ev.filter(x => x.k === 'lead').sort((x, y) => x.t - y.t)) {
    if (e.t - lastLead < 10) { e.k = 'rest'; delete e.m; delete e.v; continue; }
    lastLead = e.t; e.d = Math.max(e.d || 0, 8); e.v *= 0.8;
  }
  return { events: ev.concat(extra), t: res.t + 32 };    // a bar-and-a-half tail so the last chord rings out
}
