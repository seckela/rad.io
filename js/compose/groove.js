// Rhythm-section families shared by the styles: whole drum grooves and bass lines, so the seed can change the foundation of a track
// (what the kick, snare, hats and bass do), not only the parts played on top of it. Each style picks from the families that suit it
// (see seed.js for how: `v.of('drums', ['halftime', 'boombap'])`) and keeps its own sound, tempo and extras.
//
// Positions are 16ths within a bar. A drum family gives one array per bar and the bars alternate (so a groove has a two-bar phrase).

export const DRUMS = {
  four:     { kick: [[0, 4, 8, 12]], snare: [[4, 12]], hat: [[2, 6, 10, 14]] },                       // four on the floor, offbeat hats
  boombap:  { kick: [[0, 7, 10], [0, 10, 14]], snare: [[4, 12]], hat: [[0, 2, 4, 6, 8, 10, 12, 14]] }, // dusty hip-hop
  halftime: { kick: [[0], [0, 10]], snare: [[8]], hat: [[0, 2, 4, 6, 8, 10, 12, 14]] },               // slow, heavy snare on 3
  breaks:   { kick: [[0, 6, 10], [0, 3, 10, 13]], snare: [[4, 12, 15]], hat: [[0, 2, 3, 4, 6, 8, 10, 11, 12, 14]] },   // a broken beat
  driving:  { kick: [[0, 2, 4, 6, 8, 10, 12, 14]], snare: [[4, 12]], hat: [[0, 4, 8, 12]] },          // straight 8th kicks
  shuffle:  { kick: [[0, 8], [0, 6, 8]], snare: [[4, 12]], hat: [[0, 3, 6, 8, 11, 14]] },             // a skipping, swung hat
  sparse:   { kick: [[0, 10]], snare: [[12]], hat: [[0, 8]] },                                         // a few hits and lots of air
  pulse:    { kick: [[0, 4, 8, 12]], snare: [[]], hat: [[0, 2, 4, 6, 8, 10, 12, 14]] },                // a kick pulse with straight hats, no snare
};

// Lays a family down for `total` 16ths. `soft` scales the velocity (for grooves that sit under other drum hits); `swing` pushes the
// off-8th hats later by that many 16ths.
export function drumGroove(total, family, soft = 1, swing = 0) {
  const f = DRUMS[family], ev = [];
  for (let b = 0, bar = 0; b < total; b += 16, bar++) {
    const at = list => list[bar % list.length];
    for (const p of at(f.kick)) ev.push({ t: b + p, k: 'kick', v: (p === 0 ? 0.9 : 0.72) * soft, tr: 0 });
    for (const p of at(f.snare)) ev.push({ t: b + p, k: 'snare', v: (p % 8 === 4 || p === 8 ? 0.75 : 0.25) * soft, tr: 0 });
    for (const p of at(f.hat)) ev.push({ t: b + p + (p % 4 === 2 ? swing : 0), k: 'hat', v: (p % 4 === 0 ? 0.42 : p % 2 === 0 ? 0.3 : 0.18) * soft, tr: 0 });
  }
  return ev;
}

// Bass families: [position in the bar, semitones above the line's root, length in 16ths], one array per bar (the bars alternate).
export const BASSES = {
  long:    [[[0, 0, 14]]],
  pulse:   [[[0, 0, 1.6], [2, 0, 1.6], [4, 0, 1.6], [6, 0, 1.6], [8, 0, 1.6], [10, 0, 1.6], [12, 0, 1.6], [14, 0, 1.6]]],
  offbeat: [[[2, 0, 1.4], [6, 0, 1.4], [10, 0, 1.4], [14, 0, 1.4]]],
  sync:    [[[0, 0, 2.5], [3, 0, 2.5], [6, 7, 2.5], [10, 0, 2.5], [12, 0, 2.5]], [[0, 0, 2.5], [3, 0, 2.5], [6, 0, 2.5], [10, 12, 2.5], [14, 7, 1.5]]],
  octave:  [[[0, 0, 1.6], [2, 12, 1.6], [4, 0, 1.6], [6, 12, 1.6], [8, 0, 1.6], [10, 12, 1.6], [12, 0, 1.6], [14, 12, 1.6]]],
  walk:    [[[0, 0, 3.5], [4, 7, 3.5], [8, 12, 3.5], [12, 7, 3.5]]],
  fifth:   [[[0, 0, 6], [8, 0, 3], [12, 7, 3]]],
  rolling: [[[1, 0, 0.9], [2, 0, 0.9], [3, 0, 0.9], [5, 0, 0.9], [6, 0, 0.9], [7, 0, 0.9], [9, 0, 0.9], [10, 0, 0.9], [11, 0, 0.9], [13, 0, 0.9], [14, 0, 0.9], [15, 0, 0.9]]],
};

// The notes of a bass family from `from` to `to` (16ths, on the absolute bar grid), on `midi`. The first note carries the text index
// `i` so the highlight still moves with each line.
export function bassGroove(from, to, midi, family, tr = 0, i, v = 0.6) {
  const f = BASSES[family], out = [];
  for (let b = Math.floor(from / 16) * 16, bar = b / 16; b < to; b += 16, bar++) {
    for (const [p, semi, d] of f[bar % f.length]) {
      const t = b + p;
      if (t < from || t >= to) continue;
      out.push({ t, tr, k: 'bass', m: midi + semi, d, v: p === 0 ? v : v * 0.78 });
    }
  }
  if (out.length && i !== undefined) out[0].i = i;
  return out;
}
