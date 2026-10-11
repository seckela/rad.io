// Techno / house feel, built on the default composition (same melody and chord roots) and reworked like a club track:
//  - The bass is an offbeat pump: short low notes on the "and" of every beat (with a 16th pickup now and then), on each line's root
//    until the next line's root.
//  - Chords become minor-7th stabs (3rd, 5th and 7th of the line's chord, so the bass keeps the root to itself) in a syncopated,
//    house-piano rhythm that alternates between two bars, until the next line's chord.
//  - The melody is thinned to at most an 8th note's density and played as short plucks.
//  - The character-driven drum hits go quiet and a four-on-the-floor beat takes over (see houseDrums): kick on every beat, clap on
//    2 and 4, open hats on the offbeats and 16th closed hats in between.
// The kick also ducks the bass and the stabs while they play (see audio/play.js), which gives the pumping feel.
const STAB_BARS = [[3, 6, 10, 14], [3, 6, 11]];     // 16th offsets of the chord stabs; the two bars alternate
const BASS_BAR = [2, 6, 10, 14];                    // the offbeat 8ths, plus an occasional pickup (see below)

export function houseify(r) {
  const out = [];
  for (const e of r.events) {
    if (['kick', 'hat', 'snare'].includes(e.k)) { out.push({ ...e, k: 'rest' }); continue; }
    if (e.k === 'bass' && e.s !== undefined) continue;                              // replaced below
    if (e.k === 'pad') { out.push({ t: e.t, i: e.i, tr: e.tr, k: 'rest' }); continue; }   // replaced by stabs; keeps the text highlight
    out.push(e);
  }
  // Thin the melody to a note at most every 2 sixteenths (the dropped ones become rests, so the highlight still moves).
  let last = -99;
  for (const e of out.filter(x => x.k === 'lead').sort((x, y) => x.t - y.t)) {
    if (e.t - last < 2) { e.k = 'rest'; delete e.m; delete e.v; delete e.d; continue; }
    last = e.t; e.d = Math.min(e.d || 1, 1.5); e.v = (e.v || 0.5) * 0.9;
  }
  const roots = r.events.filter(e => e.k === 'bass' && e.s !== undefined).sort((a, b) => a.t - b.t);
  roots.forEach((c, j) => {
    const stop = roots[j + 1] ? roots[j + 1].t : r.t;
    const chord = [r.pad(c.a + 2), r.pad(c.a + 4), r.pad(c.a + 6)];
    let first = true;
    for (let b = Math.floor(c.t / 16) * 16; b < stop; b += 16) {
      const bar = (b / 16) % 2;
      BASS_BAR.forEach((off, k) => {
        const t = b + off;
        if (t < c.t || t >= stop) return;
        const o = { t, tr: c.tr, k: 'bass', m: c.m + (k === 3 && bar ? 12 : 0), d: 1.5, v: k % 2 ? 0.55 : 0.7 };
        if (first) { o.i = c.i; first = false; }
        out.push(o);
      });
      if (bar && b + 11 >= c.t && b + 11 < stop) out.push({ t: b + 11, tr: c.tr, k: 'bass', m: c.m, d: 1, v: 0.4 });   // the pickup
      for (const off of STAB_BARS[bar]) {
        const t = b + off;
        if (t >= c.t && t < stop) out.push({ t, tr: c.tr, k: 'pad', m: chord, d: 1, v: off === 3 ? 0.55 : 0.4 });
      }
    }
  });
  return { events: out, t: r.t };
}

export function houseDrums(total) {
  const ev = [];
  for (let b = 0; b < total; b += 16) {
    for (const off of [0, 4, 8, 12]) ev.push({ t: b + off, k: 'kick', v: 0.9, tr: 0 });
    ev.push({ t: b + 4, k: 'snare', v: 0.8, tr: 0 }, { t: b + 12, k: 'snare', v: 0.85, tr: 0 });
    for (let h = 0; h < 16; h++) {
      if (h % 4 === 2) ev.push({ t: b + h, k: 'ohat', v: 0.6, tr: 0 });             // open hats on the offbeats
      else ev.push({ t: b + h, k: 'hat', v: h % 2 ? 0.2 : 0.38, tr: 0 });            // closed 16ths
    }
  }
  return ev;
}
