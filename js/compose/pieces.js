// The chord layout the Neo-classical and Cinematic styles share, built on the Chillstep layout (res, from chillify): the events without
// Chillstep's soft restatements, bells, digits and percussion, plus the chords as `pieces`. A long line would hold one chord for many bars,
// so it is split into pieces of about four bars, and the later pieces move on to other chords of the key (a seeded shape: I - VI - IV - V
// and its relatives, as degrees above the line's own chord). Each piece is { start, stop, deg, tr, first, tones }, where tones is the
// chord voiced low and close, moving as little as possible from the last one.
import { variant } from './seed.js';

export function chordLayout(r, res, total, v = variant()) {
  const ev = [];
  for (const e of res.events) {
    if ((e.k === 'bass' || e.k === 'pad') && e.s === undefined) continue;
    if (['bell', 'digit', 'kick', 'hat', 'snare'].includes(e.k)) { ev.push({ t: e.t, i: e.i, tr: e.tr, k: 'rest' }); continue; }
    ev.push(e);
  }
  const changes = ev.filter(e => e.k === 'bass' && e.s !== undefined && e.m !== undefined).sort((a, b) => a.t - b.t).map(e => ({ ...e }));   // copies: the originals become rests below
  // The chord changes themselves are replaced by each style's arrangement (they keep their text index on a rest, so the highlight still moves).
  for (const e of ev) if (e.s !== undefined && (e.k === 'bass' || e.k === 'pad')) { e.k = 'rest'; delete e.m; delete e.v; delete e.d; }
  const INNER = v.of('inner', [[0, 5, 3, 4], [0, 3, 5, 4], [0, 5, 2, 4], [0, 2, 5, 3]]);
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
  for (const c of pieces) c.tones = voice(c.deg);
  return { ev, pieces };
}
