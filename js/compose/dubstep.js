// Dubstep, built on the default composition (same text-driven highlight and seed) and arranged the way a dubstep track is: in cycles of
// intro, build-up and drop.
//  - Intro: a soft pad on the chord, a sparse lead phrase, a kick now and then and light hats.
//  - Build-up: the pad keeps going, a lead arpeggio climbs the scale in 16ths getting louder, a riser sweeps up, and a snare roll speeds
//    up (quarters, 8ths, 16ths, then 32nds) while its volume climbs. Then everything stops for a beat of silence.
//  - Drop: an impact, then the heavy half-time part: a held sub bass, a wobble bass (a saw through a filter swept by a tempo-synced LFO,
//    in rhythm patterns that change from half to half and fill at the end of every four bars), a kick and a heavy snare on beat 3, hats,
//    and chord stabs. No lead: the bass is the tune.
// The chords follow a four-bar loop picked by the seed; the text decides the seed and the highlight. The lengths of the three parts are
// a quarter, a quarter and a half of a cycle (4, 4 and 8 bars for a cycle of 16), and a long text repeats the cycle (after the first drop the intro becomes a breakdown: the tune comes forward over a half-time beat, with no wobble).
// The kick ducks the pad, stabs and sub (see audio/play.js). Everything is synthesized.
import { variant } from './seed.js';

const GAP = 4;                                   // sixteenths of silence just before each drop
const LOOPS = [[0, 5, 6, 4], [0, 0, 5, 6], [0, 3, 5, 4], [0, 6, 5, 6], [0, 0, 3, 6]];   // chord roots as scale degrees, one per four bars
const RATE = { q: 1, e: 2, t: 3, s: 4 };                  // wobble cycles per beat: quarter, 8th, triplet, 16th
// Wobble patterns: two bars each (they alternate), as [position in bar, length, scale-degree move, rate].
const WOBS = {
  growl:   [[[0, 8, 0, 'e'], [8, 4, 0, 't'], [12, 4, 0, 's']], [[0, 6, 0, 't'], [6, 2, 2, 's'], [8, 8, 0, 'e']]],
  slow:    [[[0, 16, 0, 'q']], [[0, 8, 0, 'q'], [8, 8, 3, 'e']]],
  stutter: [[[0, 2, 0, 's'], [3, 2, 0, 's'], [6, 2, 0, 's'], [8, 8, 0, 'e']], [[0, 4, 0, 'e'], [4, 4, 0, 'e'], [8, 2, -1, 's'], [10, 6, 0, 't']]],
  triplet: [[[0, 5, 0, 't'], [5.33, 5, 0, 't'], [10.67, 5, 2, 't']], [[0, 8, 0, 't'], [8, 8, 0, 'e']]],
  riff:    [[[0, 4, 0, 'e'], [4, 4, 3, 'e'], [8, 4, 0, 'e'], [12, 4, 4, 't']], [[0, 4, 0, 'e'], [4, 4, 3, 'e'], [8, 8, -1, 'q']]],
};
const FILL = [[0, 2, 0, 's'], [2, 2, 0, 's'], [4, 2, 0, 's'], [6, 2, 0, 's'], [8, 4, 0, 'e'], [12, 2, 0, 's'], [14, 2, 0, 's']];   // the last bar of every four
const STABS = [[3, 6, 11], [6, 14], [0, 10], [3, 7, 10, 14]];
// Kick patterns for the drop, two bars each (the snare is always on beat 3).
const KICKS = [[[0], [0, 10]], [[0, 6], [0, 10, 14]], [[0], [0, 6, 10]], [[0, 3], [0, 10]], [[0, 11], [0, 6]]];
const HATS = [[0, 2, 4, 6, 8, 10, 12, 14], [2, 6, 10, 14], [0, 4, 8, 12, 14], [0, 2, 3, 4, 6, 8, 10, 11, 12, 14]];
const MOTIFS = [[[0, 6, 4], [6, 2, 5], [8, 8, 4]], [[0, 4, 2], [4, 4, 4], [8, 6, 5], [14, 2, 4]], [[0, 8, 4], [8, 4, 3], [12, 4, 2]]];   // the intro lead: [position, length, step above the chord root], one per two bars

// The cycles of a track `T` sixteenths long (at least 8 bars): for each, where it starts and where its build and drop begin and end.
export function layout(T) {
  const bars = Math.max(8, Math.ceil(T / 16)), n = Math.max(1, Math.ceil(bars / 16));
  const base = Math.floor(bars / n), extra = bars % n, out = [];
  let t0 = 0;
  for (let i = 0; i < n; i++) {
    const len = (base + (i < extra ? 1 : 0)) * 16, q = Math.max(2, Math.round(len / 16 / 4)) * 16;
    out.push({ t0, build: t0 + q, drop: t0 + 2 * q, end: t0 + len });
    t0 += len;
  }
  return { cycles: out, T: t0 };
}

export function dubstepify(r, v = variant(), len = r.t) {
  const T = layout(len).T, { cycles } = layout(T), tr = (r.events.find(e => e.tr !== undefined) || {}).tr || 0;
  const loop = v.of('loop', LOOPS), fam1 = v.of('wob1', Object.keys(WOBS)), fam2 = v.of('wob2', Object.keys(WOBS));
  const bright = v.of('bright', [900, 1200, 1500]), stab = v.of('stab', STABS), motif = v.of('motif', MOTIFS), motif2 = MOTIFS[(MOTIFS.indexOf(motif) + 1) % MOTIFS.length];
  const out = [];
  for (const e of r.events) {                       // the text's own events become rests, which keeps the highlight moving
    if (e.i !== undefined) out.push({ t: e.t, i: e.i, tr: e.tr, k: 'rest' });
  }
  const chordAt = (c, t) => loop[Math.floor((t - c.t0) / 64) % loop.length];
  const fold = m => m - 12 * Math.round((m - 34) / 12);                    // the bass octave: about E1 to E2
  const LO = 60, HI = 84, MID = 70;
  const place = (d, prev) => {
    let m = r.lead(d);
    while (m < LO) m += 12;
    while (m > HI) m -= 12;
    const cost = c => prev > 0 ? Math.abs(c - prev) + 0.15 * Math.abs(c - MID) : Math.abs(c - MID);
    let best = m;
    for (let c = m - 24; c <= m + 24; c += 12) if (c >= LO && c <= HI && cost(c) < cost(best)) best = c;
    return best;
  };
  let prev = -1;
  cycles.forEach(c => {
    const last = c.drop - GAP;                      // everything but the drop stops here
    // Intro and build: a pad on each chord, and the intro's lead phrase.
    for (let b = c.t0; b < c.drop; b += 64) {
      const a = chordAt(c, b), stop = Math.min(b + 64, last);
      if (stop <= b) continue;
      out.push({ t: b, tr, k: 'pad', m: [r.pad(a), r.pad(a + 2), r.pad(a + 4)], d: stop - b, v: c.t0 > 0 && b < c.build ? 0.6 : 0.4 });   // after the first drop the intro keeps more of its weight
      out.push({ t: b, tr, k: 'sub', m: fold(r.lead(a)), d: stop - b, v: b < c.build ? (c.t0 > 0 ? 0.5 : 0.3) : 0.45 });
    }
    const bd = c.t0 > 0;                            // after the first drop the intro is a breakdown: the tune comes forward and the beat carries on
    for (let b = c.t0, n = 0; b + 16 <= c.build; b += 32, n++) {
      const a = chordAt(c, b);
      for (const [off, len, step] of (bd && n % 2 ? motif2 : motif)) {
        const t = b + off;
        if (t + 2 > c.build) continue;
        let m = place(a + step, prev);
        if (m === prev) m = place(a + step + 1, prev);
        prev = m;
        out.push({ t, tr, k: 'lead', m, d: Math.min(len, c.build - t), v: bd ? (off === 0 ? 0.95 : 0.8) : off === 0 ? 0.7 : 0.55 });
      }
    }
    // Build: the lead arpeggio climbs the scale in 16ths and gets louder.
    const climb = [0, 2, 4, 7, 9, 11, 14];
    for (let t = c.build, k = 0; t < last; t++, k++) {
      const a = chordAt(c, t), p = (t - c.build) / (last - c.build);
      out.push({ t, tr, k: 'lead', m: place(a + climb[Math.min(climb.length - 1, Math.floor(p * climb.length))] + (k % 2 ? 2 : 0), -1), d: 1, v: 0.25 + 0.65 * p });
    }
    // Drop: sub, wobble and stabs.
    const end = c.end;
    for (let b = c.drop, bar = 0; b < end; b += 16, bar++) {
      const a = chordAt(c, b), bi = Math.floor(bar / 4), half = (b - c.drop) < (end - c.drop) / 2 ? 0 : 1;
      const fam = WOBS[half ? fam2 : fam1], fill = bar % 4 === 3 && end - b > 16;
      if (bar % 4 === 0 || b === c.drop) {            // the sub holds each chord's root for four bars
        const stop = Math.min(c.drop + (bi + 1) * 64, end);
        out.push({ t: b, tr, k: 'sub', m: fold(r.lead(a)), d: stop - b, v: 0.8 });
      }
      const outro = end - b <= 16;                     // the last bar of the cycle winds down so the intro doesn't arrive as a cliff
      for (const [off, len, move, rate] of (outro ? [[0, 16, 0, 'q']] : fill ? FILL : fam[bar % fam.length])) {
        out.push({ t: b + off, tr, k: 'wob', m: fold(r.lead(a + move)), d: Math.min(len, end - b - off), r: RATE[rate], b: bright, v: outro ? 0.6 : 0.9 });
      }
      if (!outro && (half || bar >= 2)) for (const off of stab) {
        if (b + off < end) out.push({ t: b + off, tr, k: 'stab', m: [r.pad(a) + 12, r.pad(a + 2) + 12, r.pad(a + 4) + 12], d: 1, v: half ? 0.5 : 0.35 });
      }
    }
  });
  return { events: out, t: T };
}

// The drums, risers and impacts: `T` is the length the track's own layout was made from (so they line up with the arrangement).
export function dubstepDrums(total, v = variant(), T = total) {
  const { cycles } = layout(T), ev = [];
  const kicks = v.of('kicks', KICKS), hats = v.of('hats', HATS), introKick = v.chance('intro-kick', 0.5);
  const hit = (t, k, vel) => { if (t < total) ev.push({ t, k, v: vel, tr: 0 }); };
  cycles.forEach(c => {
    // Intro: a kick on the bar line every other bar and quiet offbeat hats.
    for (let b = c.t0; b < c.build; b += 16) {
      if (c.t0 > 0) {                               // the breakdown keeps a half-time beat going under the tune
        hit(b, 'kick', 0.8); hit(b + 10, 'kick', 0.6); hit(b + 8, 'snare', 0.6);
        for (const o of [2, 6, 10, 14]) hit(b + o, 'hat', 0.35);
        continue;
      }
      if (introKick && ((b - c.t0) / 16) % 2 === 0) hit(b, 'kick', 0.55);
      for (const o of [2, 6, 10, 14]) hit(b + o, 'hat', 0.2);
    }
    // Build: a snare roll that speeds up and gets louder, a riser, then silence.
    const last = c.drop - GAP, len = last - c.build;
    hit(c.build, 'riser', 1); ev[ev.length - 1].d = len;
    hit(c.build, 'kick', 0.6);
    for (let t = c.build + 8, k = 0; t < last;) {
      const p = (t - c.build) / len;
      hit(t, 'snare', 0.25 + 0.7 * p);
      t += p < 0.4 ? 4 : p < 0.7 ? 2 : p < 0.9 ? 1 : 0.5;
      k++;
    }
    // Drop: impact, then half-time drums with a fill at the end of every four bars.
    hit(c.drop, 'impact', 1);
    for (let b = c.drop, bar = 0; b < c.end; b += 16, bar++) {
      const outro = c.end - b <= 16, fill = bar % 4 === 3 && !outro;
      for (const o of outro ? [0] : kicks[bar % kicks.length]) if (!(fill && o > 8)) hit(b + o, 'kick', o === 0 ? 1 : 0.8);
      hit(b + 8, 'snare', outro ? 0.7 : 1);
      for (const o of hats) if (!fill || o < 8) hit(b + o, o % 4 === 2 ? 'ohat' : 'hat', o % 4 === 0 ? 0.45 : 0.3);
      if (fill) for (const o of [8.5, 12, 13, 14, 14.5, 15]) hit(b + o, 'snare', o >= 14 ? 0.9 : 0.6);
    }
  });
  return ev;
}
