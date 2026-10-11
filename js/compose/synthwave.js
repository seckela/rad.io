// Synthwave feel, built on the default composition (same melody and chord roots) and reworked like an 80s night-drive track:
//  - The bass becomes a relentless pulse: a 16th-note saw on the line's root until the next line's root, with the beats accented.
//  - Chords are held (at least a beat and a half) so the wide, detuned pad underneath never stops.
//  - The character-driven drum hits go quiet and a steady four-on-the-floor beat takes over (see synthwaveDrums): kick on every
//    beat, snare / clap on 2 and 4, offbeat hats with 16th ghosts.
// Digits and quotes keep their blips and plinks, and the melody is untouched (the voices give it a bright, echoing saw lead).
export function synthwaveify(r) {
  const out = [];
  for (const e of r.events) {
    if (['kick', 'hat', 'snare'].includes(e.k)) { out.push({ ...e, k: 'rest' }); continue; }
    if (e.k === 'bass' && e.s !== undefined) continue;      // replaced by the pulse below
    if (e.k === 'pad' && e.m) { out.push({ ...e, d: Math.max(e.d || 0, 6) }); continue; }
    out.push(e);
  }
  const roots = r.events.filter(e => e.k === 'bass' && e.s !== undefined).sort((a, b) => a.t - b.t);
  roots.forEach((c, j) => {
    const stop = roots[j + 1] ? roots[j + 1].t : r.t;
    for (let t = c.t, k = 0; t < stop; t++, k++) {
      const o = { t, tr: c.tr, k: 'bass', m: c.m, d: 1, v: k % 4 === 0 ? 0.75 : k % 2 === 0 ? 0.55 : 0.4 };
      if (k === 0) o.i = c.i;
      out.push(o);
    }
  });
  return { events: out, t: r.t };
}

export function synthwaveDrums(total) {
  const ev = [];
  for (let b = 0; b < total; b += 16) {
    for (const off of [0, 4, 8, 12]) ev.push({ t: b + off, k: 'kick', v: off ? 0.75 : 0.9, tr: 0 });
    ev.push({ t: b + 4, k: 'snare', v: 0.85, tr: 0 }, { t: b + 12, k: 'snare', v: 0.9, tr: 0 });
    for (let h = 0; h < 16; h++) {
      if (h % 4 === 2) ev.push({ t: b + h, k: 'hat', v: 0.55, tr: 0 });             // the offbeat 8ths
      else if (h % 2 === 1) ev.push({ t: b + h, k: 'hat', v: 0.18, tr: 0 });         // quiet 16th ghosts
    }
  }
  return ev;
}
