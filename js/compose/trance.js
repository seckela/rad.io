// Trance feel, built on the default composition (same melody and chord roots) and reworked like an uplifting trance track:
//  - Each line's chord is held as a big pad, with a fast 16th-note pluck arpeggio running over it (up the triad and into the
//    octave, then back down).
//  - The bass rolls: three 16ths between every kick, on the line's root.
//  - The melody is rebuilt as a lead line: thinned to a note every few beats, lifted above the arpeggio, and shaped per chord. Each
//    section opens on a held chord tone, then climbs and falls through a rising arc (so it never sits on one note), lands on
//    chord tones on the beats, and never repeats the same pitch twice in a row.
//  - When a chord lasts two bars or more, the last half bar before the next chord is a snare roll that builds in volume.
//  - The character-driven drum hits go quiet and a four-on-the-floor beat takes over (see tranceDrums).
// The kick dips the pad, the arpeggio and the bass on every beat (see audio/play.js), which gives the pumping feel.
const PATS = [[0, 1, 2, 3, 2, 1, 0, 1], [0, 2, 1, 3, 2, 1, 3, 2], [2, 3, 2, 1, 2, 3, 2, 1]];   // arpeggio shapes per half bar; index 3 is the root an octave up
const ARC = [0, 1, 2, 4, 2, 1];                  // how many scale steps above the written note each melody note in a section sits
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
  const roots = r.events.filter(e => e.k === 'bass' && e.s !== undefined).sort((a, b) => a.t - b.t);
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

// Reshapes the (already thinned) lead notes in place; see the header comment. Works in scale degrees (the lead events carry
// theirs in `g`) so the result stays in the scale, then places each note in the 72 to 93 range, above the arpeggio.
function shapeLead(out, r, roots) {
  const n = r.n;
  const leads = out.filter(x => x.k === 'lead' && x.m !== undefined).sort((x, y) => x.t - y.t);
  let sec = -2, k = 0, prev = -1;
  for (const e of leads) {
    let idx = -1;
    roots.forEach((c, j) => { if (c.t <= e.t) idx = j; });
    const c = roots[Math.max(0, idx)];
    if (!c) break;
    if (idx !== sec) { sec = idx; k = 0; }
    const chord = [c.a, c.a + 2, c.a + 4].map(d => ((d % n) + n) % n);
    let g = (e.g ?? 0) + ARC[k % ARC.length];
    if (k === 0 || e.t % 4 === 0) {                                  // land on a chord tone on the beats and at the section start
      let best = g, bd = 99;
      for (const cd of chord) {
        const cand = cd + Math.round((g - cd) / n) * n;
        if (Math.abs(cand - g) < bd) { bd = Math.abs(cand - g); best = cand; }
      }
      g = best;
    }
    const place = d => { let m = r.lead(d); while (m < 72) m += 12; while (m > 93) m -= 12; return m; };
    let m = place(g);
    if (m === prev) m = place(g + (k % 2 ? -1 : 1));                 // never the same pitch twice in a row
    e.m = prev = m;
    if (k === 0) { e.d = 8; e.v = Math.max(e.v || 0, 0.8); }          // each section opens on a held note
    k++;
  }
}
