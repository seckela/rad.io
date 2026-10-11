import { chillify } from './chill.js';
import { variant } from './seed.js';
import { chordLayout } from './pieces.js';

// Cinematic feel, built on the Chillstep layout (the same slow, sparse melody and one chord per code line, with long lines moving on
// through other chords, see pieces.js) and arranged like a film trailer, as one long build to a single climax:
//  - A low drone under everything: a cello on each chord's root, with a sine sub beneath it.
//  - A driving cello ostinato (a pulse, a rising figure, a gallop or a dotted rhythm, seeded) that comes in after the opening and grows.
//  - A French horn carries the melody, and a charging horn line (short, punchy hits on the chord, never held) and synthesized string swells
//    join as the piece builds.
//  - A taiko-like pulse starts partway to the climax. Two bars before it a riser sweeps up and a snare roll speeds up, then a beat of
//    silence, then the climax: a huge impact, and from there a boom on every bar (and every fourth bar a bigger one).
//  - After the climax it holds at full power, then falls away to a last chord with a final impact.
// The seed changes the ostinato, the taiko pattern, where the climax falls and how the strings double the chords. The voices (sampled
// horn and cello, synthesized strings and drums) are in audio/cinematic-track.js.

const OSTINATI = [
  { name: 'pulse', hits: [[0, 0], [2, 0], [4, 0], [6, 0], [8, 0], [10, 0], [12, 0], [14, 0]] },                      // steady eighths on the root
  { name: 'rise', hits: [[0, 0], [2, 1], [4, 2], [6, 1], [8, 0], [10, 1], [12, 2], [14, 1]] },                      // root, fifth, octave, and back
  { name: 'gallop', hits: [[0, 0], [2, 0], [3, 0], [4, 0], [6, 0], [7, 0], [8, 0], [10, 0], [11, 0], [12, 0], [14, 0], [15, 0]] },
  { name: 'dotted', hits: [[0, 0], [3, 1], [6, 0], [8, 0], [11, 1], [14, 0]] },                                      // 3 + 3 + 2, rooted on the fifth
];
// The horns' charging line, as [offset in a bar (sixteenths), chord tone (0 low to 2 high), length] hits: short and punchy, never held.
const CHARGE = [
  [[0, 0, 1.5], [2, 0, 1], [3, 0, 1], [4, 1, 1.5], [6, 1, 1], [7, 1, 1], [8, 2, 1.5], [10, 2, 1], [11, 2, 1], [12, 1, 2]],     // long-short-short, climbing
  [[0, 0, 2], [3, 1, 1], [4, 2, 2], [8, 0, 2], [11, 1, 1], [12, 2, 2], [14, 1, 1]],                                          // a fanfare
  [[0, 0, 1.5], [2, 1, 1.5], [4, 2, 1.5], [6, 1, 1.5], [8, 0, 1.5], [10, 1, 1.5], [12, 2, 1.5], [14, 1, 1.5]],               // driving eighths
];
const TAIKO = [[0], [0, 8], [0, 6, 8], [0, 10]];                                                                    // hits per bar, in sixteenths
const arpPitch = [0, 7, 12];                                                                                       // root, fifth, octave

export function cinematicify(r, key, scale, base, v = variant()) {
  const ost = v.of('ostinato', OSTINATI), taiko = v.of('taiko', TAIKO), climaxAt = v.of('climax', [0.58, 0.64, 0.7]);
  const stringsAbove = v.of('strings', [12, 12, 7]), charge = v.of('charge', CHARGE);
  const res = chillify(r, base, v);
  const total = res.t + 16;
  const { ev, pieces } = chordLayout(r, res, total, v);
  // A long text is a run of acts, one build and climax each (about 64 bars apiece); a short one is a single act. In each, the climax falls
  // on a bar line part of the way through (never so early that there is nothing to build, or in the last bars).
  const bars = total / 16, nAct = Math.max(1, Math.round(bars / 64)), L = Math.round(bars / nAct) * 16;
  const acts = Array.from({ length: nAct }, (_, i) => {
    const s0 = i * L, e0 = i === nAct - 1 ? total : (i + 1) * L;
    return { s: s0, e: e0, c: Math.max(s0 + Math.min(16, e0 - s0 - 32), Math.min(e0 - 32, s0 + Math.round(climaxAt * (e0 - s0) / 16) * 16)) };
  });
  const actOf = t => acts.find(x => t < x.e) || acts[acts.length - 1];
  // The level of the track: it grows from the opening of an act to its climax, holds, and falls away at the end of the act.
  const lvl = t => { const x = actOf(t); return t < x.c ? 0.25 + 0.6 * Math.pow((t - x.s) / (x.c - x.s), 1.3) : t < x.e - 24 ? 1 : 0.45 + 0.55 * Math.max(0, (x.e - t) / 24); };

  const extra = [];
  pieces.forEach(c => {
    const { start, stop, tones } = c, a = lvl(start);
    // The drone: the chord's root on the cello (an octave above Chillstep's sub-bass), a sine sub underneath.
    const root = 43 + ((((r.pad(c.deg) % 12) + 12) % 12 - 43 % 12) + 12) % 12;
    extra.push({ t: start, tr: c.tr, k: 'bass', m: root, d: stop - start + 4, v: 0.3 + 0.4 * a });
    extra.push({ t: start, tr: c.tr, k: 'sub', m: root - 12, d: stop - start + 4, v: 0.25 + 0.3 * a });
    // The ostinato, after the opening, until the last bar.
    for (let b = start; b < stop - 1; b += 16) {
      const x = actOf(b);
      if (b < x.s + 0.12 * (x.e - x.s) || b >= x.e - 16) continue;
      for (const [off, p] of ost.hits) {
        const t = b + off;
        if (t >= stop - 0.5) break;
        if (t >= x.c - 4 && t < x.c) continue;                     // the ostinato stops for the last beat before the climax
        const al = lvl(t);
        extra.push({ t, tr: c.tr, k: 'arp', m: root + arpPitch[p], d: 1.2, v: Math.min(1, (0.2 + 0.5 * al) * (off === 0 ? 1 : off === 8 ? 0.85 : 0.65)) });
      }
    }
    // Strings swell in under the chords once the build is under way, and horns join them further on.
    const x0 = actOf(start), into = (start - x0.s) / (x0.c - x0.s);
    if (into >= 0.3 && start < x0.e - 16 && stop - start >= 8) extra.push({ t: start, tr: c.tr, k: 'strings', m: tones.map((m, q) => m + 12 + (q === 2 ? stringsAbove - 12 : 0)), d: stop - start + 6, v: 0.25 + 0.4 * a });
    // The horns' charging line, once the build is well under way: short hits on the chord's tones, bar after bar, in the horn's range.
    if (into >= 0.55 && start < x0.e - 16) {
      const fit = m => { while (m < 52) m += 12; while (m > 66) m -= 12; return m; };
      const pool = tones.map(fit).sort((p, q) => p - q);
      for (let b = start; b < stop - 1; b += 16) {
        if (b >= x0.e - 16) break;
        for (const [off, ti, d] of charge) {
          const t = b + off;
          if (t >= stop - 0.5) break;
          if (t >= x0.c - 4 && t < x0.c) continue;                     // (and silent for the last beat before the climax)
          extra.push({ t, tr: c.tr, k: 'brass', m: [pool[ti]], d, v: Math.min(1, 0.3 + 0.45 * lvl(t)) * (off === 0 ? 1 : 0.8) });
        }
      }
    }
  });

  // The melody: the Chillstep notes, in the horn's range, each held longer and swelling with the track.
  for (const e of ev) {
    if (e.k !== 'lead') continue;
    let m = e.m;
    while (m > 66) m -= 12;           // the horn samples jump from C4 to D5, and the top ones turn thin and whistly, so the melody stays below them
    while (m < 48) m += 12;
    e.m = m;
    e.d = Math.min(8, Math.max(e.d || 2, 3));   // notes held for a few beats at most: longer ones drone like an organ
    e.v = Math.min(1, (e.v || 0.5) * (0.5 + 0.7 * lvl(e.t)));
  }

  // The percussion (on the foreground track only), per act: the taiko pulse from partway to the climax, the riser and snare roll into it, the
  // climax itself, a boom on every bar after it, and a last impact on the act's final chord.
  const hits = [], isBg = pieces.length > 0 && pieces[0].tr === 1;   // (the second half of a split text has no percussion of its own)
  const hit = (t, k, o = {}) => hits.push({ t, tr: 0, k, ...o });
  for (const x of acts) {
    const riseStart = Math.max(x.s, x.c - 32);
    for (let b = x.s; b < x.e; b += 16) {
      if (b >= x.s + 0.4 * (x.c - x.s) && b < x.c - 32) for (const off of taiko) hit(b + off, 'kick', { v: (off === 0 ? 0.45 : 0.3) + 0.25 * lvl(b) });
      if (b >= x.c && b < x.e - 16) {
        hit(b, 'kick', { v: 0.9 });
        for (const off of taiko) if (off) hit(b + off, 'kick', { v: 0.55 });
        if (((b - x.c) / 16) % 4 === 3) hit(b, 'impact', { v: 0.5 });
      }
    }
    if (x.c - riseStart >= 8) hit(riseStart, 'riser', { d: x.c - riseStart, v: 1 });
    // The snare roll: slow in the first bar of the riser, then twice as fast, then every sixteenth, and dead silent for the last beat.
    for (let t = Math.max(x.s, x.c - 16); t < x.c - 4; t += t < x.c - 8 ? 2 : 1) hit(t, 'snare', { v: 0.2 + 0.4 * (t - (x.c - 16)) / 12 });
    hit(x.c, 'impact', { v: 1 });
    hit(x.e - 16, 'impact', { v: 0.55 });
  }
  return { events: ev.concat(extra, isBg ? [] : hits.filter(h => h.t >= 0 && h.t < total)), t: total };
}
