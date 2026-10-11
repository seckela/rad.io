import { degToMidi } from './track.js';
import { groupLeads, fold, gridMelody } from './melody.js';
import { variant } from './seed.js';

// Riff note (scale steps above the section's root) by letter rank in FREQ: common letters chug on the root.
const METAL_RIFF = [0,0,0,0,2,0,1,3,0,4, 2,3,4,1, 5,2,3,4, 5,1, 6, 2,3,4,5,6];
// Rhythm patterns per bar (16 units): straight 8ths, gallop, and a syncopated half-time chug.
const RIFFS = [
  [0, 2, 4, 6, 8, 10, 12, 14],
  [0, 2, 3, 4, 6, 7, 8, 10, 11, 12, 14, 15],
  [0, 3, 4, 6, 8, 11, 12, 14],
];
// Bar-to-bar variation, so a riff doesn't loop unchanged: four rhythm variants for straight sections, a
// move of the riff's root on every second bar (scale steps, picked per section), and four bass bar shapes
// as [position in bar, semitones above the bar's bass root, length in units].
const STRAIGHT_VARIANTS = [
  [0, 2, 4, 6, 8, 10, 12, 14],
  [0, 2, 4, 7, 8, 10, 12, 15],
  [0, 2, 4, 6, 8, 10, 12, 14, 15],
  [0, 3, 4, 6, 8, 11, 12, 14],
];
const BAR_ROOT_MOVE = [0, 3, 4, 2, 1];
const BASS_BARS = [
  [[0, 0, 3.4], [4, 0, 3.4], [8, 0, 3.4], [12, 0, 3.4]],          // a root on every beat
  [[0, 0, 7.4], [8, 0, 3.4], [12, 7, 3.4]],                        // long root, root, fifth
  [[0, 0, 3.4], [4, 12, 3.4], [8, 0, 3.4], [12, 7, 3.4]],          // root, octave, root, fifth
  [[0, 0, 14]],                                                    // one long root
];
// Bass note (scale steps above the section's root) by length of the word it sits on.
const BASS_WORD = [0, 0, 0, 2, 3, 4, 1, 5];
const LEAD_PICKS = [0, 1, 1, 1, 2, 2];           // metal lead pace per section: mostly beats and 8ths, some slower
const LEAD_SHIFT = h => [0, 2, 4, -2, 3][(h >> 5) % 5];   // each section's lead centers on a different scale step
// Riff type per section, from the line's text hash. 3 is a burst section: the rhythm guitar plays steady 8ths
// (pattern 0) while the lead runs the scale in 8ths and the drums drive on 8ths.
const RIFF_PICK = [0, 0, 1, 1, 2, 3];

// Rock/metal feel, no time stretch. Each code line is a section with a riff rhythm picked from its
// text (straight 8ths, gallop, or syncopated half-time):
//  - Rhythm guitar palm-mute chugs on the riff's slots. Common letters stay on the section's root and
//    rarer ones move up the scale, so the riff is mostly root-heavy with occasional movement.
//    A section opens on a ringing power chord, and opening brackets add power-chord stabs.
//  - The bass doubles every chug, and the drums follow the riff (see metalDrums).
//  - A sparse lead guitar line is built with the same grid melody as chillstep.
// Character-driven drums, pads, bells and digits go quiet.
export function metalify(r, key, scale, base, v = variant()) {
  // Seeded choices (see seed.js): which riff type each section gets (the text's lines still decide where they fall, the seed rotates the
  // mapping), where the lead centers, and the order the bar roots move in.
  const riffTurn = v.pick('riffs', RIFF_PICK.length), leadTurn = v.pick('lead', 5), BAR_MOVES = v.of('moves', [BAR_ROOT_MOVE, [0, 4, 3, 1, 2], [0, 2, 4, 3, 1]]);
  const n = r.n;
  const root = d => degToMidi(36 + key, scale, d);
  const ev = r.events.map(e => {
    const o = { ...e };
    if (e.k === 'bass') { o.k = 'rest'; delete o.m; }
    else if (e.k === 'pad' && e.d === 4) { o.k = 'power'; o.m = e.m[0] - 12; o.v = 0.85; }   // opening bracket: power chord stab
    else if (['pad', 'bell', 'digit'].includes(e.k)) { o.k = 'rest'; delete o.m; }
    else if (e.k === 'kick') o.v = 0.55;        // code-driven drum accents: = kick, math hat, comparison snare ghost
    else if (e.k === 'hat') o.v = 0.5;
    else if (e.k === 'snare') o.v = 0.4;
    return o;
  });
  const groups = groupLeads(ev);
  const list = [...groups.values()];
  const end = Math.ceil(r.t / 16) * 16;
  const out = [], sections = [], runs = [], calm = new Map();
  const bassDrop = key >= 4 ? 12 : 0;     // bass an octave under the guitar when that stays above its lowest samples
  const bassNote = m => m - bassDrop;
  const near = (a, c) => a + Math.round((c - a) / n) * n;       // degree matching a (mod n) nearest c
  // The lead sits an octave lower than the shared melody range (roughly E4-E5, where guitar leads live and
  // the samples are closest to their recorded pitch). Up near G6 the shifted samples turn thin and flute-like.
  const lowLead = d => r.lead(d - n);
  list.forEach((grp, gi) => {
    const h = grp[0].h, pick = RIFF_PICK[(h + riffTurn) % 6], a = grp[0].a;
    // A section's riff runs from its first letter until the next section starts, so the guitar never
    // drops out across line breaks. The first section starts at the very beginning.
    const spanStart = gi === 0 ? 0 : grp[0].t;
    const spanEnd = gi + 1 < list.length ? list[gi + 1][0].t : end;
    // Some sections end in a burst of 16ths leading into the next one.
    const fillFrom = pick !== 3 && spanEnd - spanStart >= 24 && (h >> 2) % 3 === 0 ? spanEnd - 8 : null;
    const slots = [];
    const bar0 = Math.floor(spanStart / 16);
    const move = bi => (bi % 2 === 1 ? BAR_MOVES[(h >> 4) % 5] : 0);      // the riff's root shifts on every second bar
    // Only one part speeds up at a time: in a burst section the lead takes the fast run while the rhythm
    // guitar holds steady 8ths, and in a section-ending fill the guitar speeds up while the lead rests.
    for (let bar = bar0 * 16; bar < spanEnd; bar += 16) {
      const bi = bar / 16 - bar0;
      const pat = pick === 0 || pick === 3 ? STRAIGHT_VARIANTS[(bi + (h >> 2)) % 4]
        : pick === 1 && bi % 4 === 3 ? RIFFS[0] : RIFFS[pick];
      for (const p of pat) {
        const t = bar + p;
        if (t >= spanStart && t < spanEnd && (fillFrom === null || t < fillFrom)) slots.push(t);
      }
    }
    if (fillFrom !== null) for (let t = Math.ceil(fillFrom); t < spanEnd; t++) slots.push(t);

    let first = true;
    for (const t of slots) {
      let nearest = null, nd = 2;
      for (const c of grp) { const d = Math.abs(c.t - t); if (d < nd) { nd = d; nearest = c; } }
      const bi = Math.floor(t / 16) - bar0;
      // The last hit of most bars is a turnaround: a step off the root that leads into the next bar.
      const turn = !first && t % 16 >= 14 && (bi + (h >> 3)) % 3 !== 0 && !(fillFrom !== null && t >= fillFrom);
      const m = root(a + move(bi) + (turn ? [1, 3, 1, 4, 2][(bi + (h >> 5)) % 5] : nearest ? METAL_RIFF[nearest.rk] : 0));
      if (first) sections.push({ t0: grp[0].t, pick, tFirst: t, spanEnd, fillFrom });
      const fast = fillFrom !== null && t >= fillFrom;      // fill 16ths are single, lighter notes: less mush
      const stab = !first && !fast && bi % 2 === 1 && t % 16 === 8;      // a ringing chord stab mid-bar on every second bar
      out.push({ t, tr: 0, k: first || stab ? 'power' : 'chug', m, d: first ? 8 : stab ? 4 : 1,
        v: first ? 0.95 : stab ? 0.9 : fast ? 0.7 : t % 4 === 0 ? 0.95 : 0.78, n: fast ? 1 : undefined });
      first = false;
    }

    // The bass is its own part. Each bar picks one of several shapes (roots, octave, fifth, a long note),
    // follows the riff's root move, and the last beat of a section walks up to the next section's root.
    // On top of that, every word the line spells out adds a walking note (pitch by word length).
    const bassOut = [];
    for (let b = bar0 * 16; b < spanEnd; b += 16) {
      const bi = b / 16 - bar0, br = bassNote(root(a + move(bi)));
      for (const [p, up, d] of BASS_BARS[(bi + (h >> 6)) % 4]) {
        const t = b + p;
        if (t >= spanStart && t < spanEnd) bassOut.push({ t, tr: 0, k: 'bass', m: br + up, d, v: p === 0 ? 0.92 : 0.8 });
      }
    }
    if (list[gi + 1] && spanEnd - spanStart >= 8) {
      const stepIn = bassNote(root(list[gi + 1][0].a - 1));
      const keep = bassOut.filter(e => e.t < spanEnd - 4);
      bassOut.length = 0;
      bassOut.push(...keep, { t: spanEnd - 4, tr: 0, k: 'bass', m: stepIn, d: 3, v: 0.78 });
    }
    out.push(...bassOut);
    grp.forEach((c, j) => {
      if (c.w !== 1 || c.t % 4 === 0 || (list[gi + 1] && c.t >= spanEnd - 4)) return;
      let len = 1;
      while (grp[j + len] && grp[j + len].w === len + 1) len++;
      const next = grp.find((x, k) => k > j && x.w === 1);
      out.push({ t: c.t, tr: 0, k: 'bass', m: bassNote(root(a + move(Math.floor(c.t / 16) - bar0) + BASS_WORD[Math.min(len, 7)])),
        d: Math.max(1.5, Math.min(next ? next.t - c.t : 3, 3)), v: 0.68 });
    });

    if (pick === 3) {
      // Burst sections: the lead guitar runs up and down the scale in 8th notes, steered by the letters.
      const A = near(a, n + 1) + LEAD_SHIFT(h + (leadTurn << 5));
      let rp = 0, dir = 1;
      for (let t = Math.ceil(grp[0].t / 2) * 2; t <= grp[grp.length - 1].t; t += 2) {
        let c = null, nd = 2;
        for (const x of grp) { const d = Math.abs(x.t - t); if (d < nd) { nd = d; c = x; } }
        if (!c) continue;
        if (c.rk % 4 === 0) dir = -dir;                      // the run turns around now and then
        rp = fold(rp + dir * (c.rk % 3 === 0 ? 2 : 1), -4, 6);
        runs.push({ t, tr: 0, k: 'run', m: lowLead(A + rp), d: 1.8, v: t % 8 === 0 ? 0.8 : 0.66 });
      }
    } else {
      calm.set(grp[0].s, grp);
    }
  });
  const fills = sections.filter(x => x.fillFrom !== null);
  const lead = gridMelody({ ...r, lead: lowLead }, calm, base, true, { picks: LEAD_PICKS, shift: h => LEAD_SHIFT(h + (leadTurn << 5)), fold: true, lo: -4, hi: 6 })
    .map(e => ({ ...e, v: Math.min(1, e.v * 0.9) }))
    .filter(e => !fills.some(x => e.t >= x.fillFrom - 0.01 && e.t < x.spanEnd))          // the lead rests while the guitar bursts
    .map(e => { const f = fills.find(x => e.t < x.fillFrom && e.t + e.d > x.fillFrom); return f ? { ...e, d: Math.max(1, f.fillFrom - e.t) } : e; });
  return { events: ev.concat(out, lead, runs), t: r.t, sections };
}

// Drums for rock/metal that follow each section's riff: a rock beat under straight chugs, kick-and-
// gallop under galloping chugs, and a sparse half-time pattern under syncopated chugs. A crash lands
// with each section's opening power chord, and a snare roll leads into it.
export function metalDrums(total, sections, v = variant()) {
  // Seeded: which kick pattern a straight (rock) section gets.
  const KICKS = [v.of('rock-kick', [[0, 2, 8, 10], [0, 2, 8, 11], [0, 3, 8, 10]]), [0, 2, 3, 6, 8, 10, 11, 14], [0, 3, 6, 11], [0, 2, 4, 6, 8, 10, 12, 14]];
  const SNARES = [[4, 12], [4, 12], [8], [4, 12]];
  const HATS = [[0, 2, 4, 6, 8, 10, 12, 14], [0, 4, 8, 12], [0, 4, 8, 12], [0, 4, 8, 12]];
  const secs = sections.slice().sort((a, b) => a.t0 - b.t0);
  const pickAt = t => { let p = secs.length ? secs[0].pick : 0; for (const x of secs) { if (x.t0 <= t) p = x.pick; else break; } return p; };
  const fills = secs.slice(1).map(x => x.tFirst).filter(t => t >= 4);
  const inFill = t => fills.some(f => t >= f - 4 && t < f);
  const bursts = secs.filter(x => x.fillFrom !== null);                 // sections ending in a 16th burst
  const inBurst = t => bursts.some(x => t >= x.fillFrom && t < x.spanEnd);
  const ev = [];
  const hit = (t, k, v) => { if (t < total) ev.push({ t, k, v, tr: 0 }); };
  for (let b = 0; b < total; b += 16) {
    const pick = pickAt(b + 8);
    for (const p of KICKS[pick]) if (!inFill(b + p) && !inBurst(b + p)) hit(b + p, 'kick', p === 0 ? 1 : pick === 3 && p % 4 ? 0.7 : 0.85);
    for (const p of SNARES[pick]) if (!inFill(b + p)) hit(b + p, 'snare', 0.9);
    for (const p of HATS[pick]) hit(b + p, 'hat', p % 4 === 0 ? 0.7 : 0.45);
  }
  for (const f of fills) for (let k = 0; k < 4; k++) hit(f - 4 + k, 'snare', 0.5 + k * 0.13);
  for (const x of bursts) for (let t = Math.ceil(x.fillFrom); t < x.spanEnd; t++) if (!inFill(t)) hit(t, 'kick', t % 4 === 0 ? 0.95 : 0.7);
  if (secs.length) hit(secs[0].tFirst, 'crash', 0.8);
  for (const f of fills) hit(f, 'crash', 0.8);
  return ev;
}
