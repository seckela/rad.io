// Trance feel, built on the default composition (same melody and chord roots) and reworked like an uplifting trance track:
//  - Each line's chord is held as a big pad, with a fast 16th-note pluck arpeggio running over it (up the triad and into the
//    octave, then back down).
//  - The bass rolls: three 16ths between every kick, on the line's root.
//  - The melody becomes a tune written in two-bar phrases (see shapeLead): syncopated long and short notes on each line's chord,
//    ending early so there is a real pause with the last note ringing into it. The chords follow a fixed loop (i v VI VII III, as in
//    much uplifting trance) and the phrases alternate (with a higher "lift" phrase every fourth), so the sections tie together while
//    the line keeps moving. Each note is placed in the octave nearest the previous one, so it glides across chord changes.
//  - When a chord lasts two bars or more, the last half bar before the next chord is a snare roll that builds in volume.
//  - The character-driven drum hits go quiet and a four-on-the-floor beat takes over (see tranceDrums).
// The kick dips the pad, the arpeggio and the bass on every beat (see audio/play.js), which gives the pumping feel.
const PATS = [[0, 1, 2, 3, 2, 1, 0, 1], [0, 2, 1, 3, 2, 1, 3, 2], [2, 3, 2, 1, 2, 3, 2, 1]];   // arpeggio shapes per half bar; index 3 is the root an octave up
const LO = 55, HI = 79, MID = 67;                // the lead's range (MIDI) and the middle it leans toward
const LOOP = [0, 4, 5, 6, 2];                    // the chord loop as scale degrees: i  v  VI  VII  III (Cm Gm Ab Bb Eb in C minor), one chord per line
const RISE = [[8, 0.3], [6, 0.4], [4, 0.5], [3, 0.6], [2, 0.75], [1, 0.95]];   // [sixteenths before the next chord, snare velocity]

export function tranceify(r) {
  const out = [];
  for (const e of r.events) {
    if (['kick', 'hat', 'snare'].includes(e.k)) { out.push({ ...e, k: 'rest' }); continue; }
    if (e.k === 'bass' && e.s !== undefined) continue;                              // replaced below
    if (e.k === 'pad') { out.push({ t: e.t, i: e.i, tr: e.tr, k: 'rest' }); continue; }   // replaced; keeps the text highlight
    out.push(e);
  }
  let last = -99;
  for (const e of out.filter(x => x.k === 'lead').sort((x, y) => x.t - y.t)) {
    if (e.t - last < 3) { e.k = 'rest'; delete e.m; delete e.v; delete e.d; continue; }
    last = e.t; e.d = Math.max(e.d || 0, 3); e.v = (e.v || 0.5) * 0.9;
  }
  // The chords follow a fixed minor loop whatever the text, so every line leads naturally into the next. The bass note is the
  // chord root folded into the bass octave (a copy, so the source events are untouched).
  const roots = r.events.filter(e => e.k === 'bass' && e.s !== undefined).sort((a, b) => a.t - b.t).map((c, j) => {
    const a = LOOP[j % LOOP.length], m = r.lead(a);
    return { ...c, a, m: m - 24 - (m >= 72 ? 12 : 0) + (m < 60 ? 12 : 0) };
  });
  shapeLead(out, r, roots);
  roots.forEach((c, j) => {
    const stop = roots[j + 1] ? roots[j + 1].t : r.t, span = stop - c.t;
    const tri = [r.pad(c.a), r.pad(c.a + 2), r.pad(c.a + 4)].sort((x, y) => x - y);
    out.push({ t: c.t, i: c.i, tr: c.tr, k: 'pad', m: tri, d: span + 2, v: 0.4 });
    for (let t = c.t, n = 0; t < stop; t++, n++) {
      const pat = PATS[(Math.floor(t / 16) + Math.floor((t % 16) / 8)) % PATS.length], x = pat[t % 8];
      out.push({ t, tr: c.tr, k: 'pluck', m: (x === 3 ? tri[0] + 12 : tri[x]) + 12, d: 1, v: n % 4 === 0 ? 0.5 : 0.32 });
    }
    for (let b = Math.floor(c.t / 4) * 4; b < stop; b += 4) {
      for (const off of [1, 2, 3]) {
        const t = b + off;
        if (t >= c.t && t < stop) out.push({ t, tr: c.tr, k: 'bass', m: c.m, d: 0.9, v: off === 2 ? 0.65 : 0.45 });
      }
    }
    if (span >= 32 && roots[j + 1]) for (const [back, v] of RISE) out.push({ t: stop - back, tr: c.tr, k: 'snare', v });
  });
  return { events: out, t: r.t };
}

export function tranceDrums(total) {
  const ev = [];
  for (let b = 0; b < total; b += 16) {
    for (const off of [0, 4, 8, 12]) ev.push({ t: b + off, k: 'kick', v: 0.9, tr: 0 });
    ev.push({ t: b + 4, k: 'snare', v: 0.7, tr: 0 }, { t: b + 12, k: 'snare', v: 0.75, tr: 0 });
    for (const off of [2, 6, 10, 14]) ev.push({ t: b + off, k: 'ohat', v: 0.55, tr: 0 });
  }
  return ev;
}

// The lead is written as phrases, not taken from the text's timing: each phrase is two bars with a syncopated rhythm of long and
// short notes that sit on the chord, and it ends a little early so there is a real pause (about 6 sixteenths) with the last note
// ringing out into it. The code's own lead events are turned into rests, which keeps the text highlight moving.
const PHRASES = [
  [[0, 6, 4], [6, 2, 5], [8, 4, 4], [12, 2, 3], [14, 2, 4], [16, 10, 2]],
  [[0, 4, 2], [4, 4, 3], [8, 6, 4], [14, 2, 5], [16, 4, 4], [20, 6, 3]],
  [[0, 2, 4], [2, 2, 5], [4, 6, 6], [10, 2, 5], [12, 4, 4], [16, 2, 5], [18, 2, 6], [20, 6, 7]],   // the lift
];
const ORDER = [0, 1, 0, 2];
function shapeLead(out, r, roots) {
  for (const e of out) if (e.k === 'lead') { e.k = 'rest'; delete e.m; delete e.v; delete e.d; }
  const place = (d, prev) => {
    let m = r.lead(d);
    while (m < LO) m += 12;
    while (m > HI) m -= 12;
    // The octave nearest the last note, with a gentle lean toward the middle of the range so it can't ratchet up or down.
    const cost = c => prev > 0 ? Math.abs(c - prev) + 0.15 * Math.abs(c - MID) : Math.abs(c - MID);
    let best = m;
    for (let c = m - 24; c <= m + 24; c += 12) if (c >= LO && c <= HI && cost(c) < cost(best)) best = c;
    return best;
  };
  let prev = -1;
  roots.forEach((c, j) => {
    const stop = roots[j + 1] ? roots[j + 1].t : r.t;
    let first = true;
    for (let b = c.t, p = 0; b < stop; b += 32, p++) {
      const pi = ORDER[p % ORDER.length];
      PHRASES[pi].forEach(([off, len, step], n) => {
        const t = b + off;
        if (t + 2 > stop) return;
        let m = place(c.a + step, prev);
        if (first) {                                                   // a new chord starts on whichever of its notes is nearest the last pitch
          for (const d of [c.a, c.a + 2, c.a + 4]) { const q = place(d, prev); if (prev > 0 && Math.abs(q - prev) < Math.abs(m - prev)) m = q; }
          first = false;
        }
        if (m === prev) m = place(c.a + step + 1, prev);
        prev = m;
        out.push({ t, tr: c.tr, k: 'lead', m, d: Math.min(len, stop - t), v: (n === 0 ? 0.9 : [0, 2, 4].includes(off % 8) ? 0.8 : 0.68) + (pi === 2 ? 0.05 : 0) });
      });
    }
  });
}
