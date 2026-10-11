// Melody helpers shared by the Chillstep and Rock / Metal styles.

// Pulls the melody letters out of an event list, grouped by section (code line). The originals stay
// in the list as rests so the cursor still walks through the text.
export function groupLeads(ev) {
  const groups = new Map();
  for (const e of ev) {
    if (e.k !== 'lead') continue;
    if (!groups.has(e.s)) groups.set(e.s, []);
    groups.get(e.s).push({ ...e });
    e.k = 'rest'; delete e.m;
  }
  return groups;
}

// Folds x back into [lo, hi] like a bouncing ball, so values outside the window keep moving instead of
// all landing on the same edge.
export function fold(x, lo, hi) {
  const span = hi - lo, period = 2 * span;
  const y = (((x - lo) % period) + period) % period;
  return lo + (y > span ? period - y : y);
}

// Builds a sparse, grid-aligned melody from the section groups (see chillify for the rules).
// Options (o): picks (which of the slow/medium/lively paces each hash picks), shift(h) (moves a
// section's anchor away from its root), and fold/lo/hi (keep notes in a window by folding rather
// than clamping), sticky (the pace changes by at most one step from section to section) and legato
// (a section opens on the anchor nearest the previous note, not the middle of the range).
export function gridMelody(r, groups, base, withFillers, o = {}) {
  const picks = o.picks || [0, 0, 0, 1, 1, 2];
  const paces = [base * 2, base, base / 2];            // slow, medium, lively (units; 16 = 1 bar)
  const kept = [];
  let lastT = -99, prevPick = null, held = 0;
  for (const grp of groups.values()) {
    let pick = picks[(grp[0].h + (o.turn || 0)) % 6];      // o.turn: the seed rotates which sections are slow, medium or lively
    if (o.sticky && prevPick !== null) {
      // The pace moves one step at a time, and only after the same pace has held for two sections.
      pick = held >= 2 ? prevPick + Math.sign(pick - prevPick) : prevPick;
      held = pick === prevPick ? held + 1 : 0;
    }
    prevPick = pick;
    const pace = paces[pick];
    const end = grp[grp.length - 1].t;
    for (let s = Math.round(grp[0].t / pace) * pace; s <= end + pace / 2; s += pace) {
      if (s <= lastT + 1) continue;
      let best = null, bestScore = Infinity;
      for (const c of grp) {
        const dist = Math.abs(c.t - s);
        if (dist >= pace / 2) continue;
        const score = dist + (c.w === 1 ? 0 : pace);
        if (score < bestScore) { bestScore = score; best = c; }
      }
      if (best) { kept.push({ ...best, t: s }); lastT = s; }
    }
  }
  kept.forEach((e, j) => { delete e.i; e.d = Math.max(2, Math.min(kept[j + 1] ? kept[j + 1].t - e.t : 8, 16)); });

  const { lead, n } = r;
  const anchors = new Map();
  const near = (a, c) => a + Math.round((c - a) / n) * n;       // degree matching a (mod n) nearest c
  let lastG;
  for (const e of kept) {
    if (!anchors.has(e.s)) {
      let A = near(e.a, n + 1);
      if (o.legato && lastG !== undefined) {
        // Voice-leading: open on the note of the new chord (root, 3rd or 5th) closest to the last note, in
        // range, so the melody glides across a line break instead of leaping to the root.
        let best = Infinity;
        for (const tone of [0, 2, 4]) {
          for (let k = -2; k <= 3; k++) {
            const cand = e.a + tone + k * n;
            if (cand >= n - 3 && cand <= n + 7 && Math.abs(cand - lastG) < best) { best = Math.abs(cand - lastG); A = cand; }
          }
        }
      }
      anchors.set(e.s, A + (o.shift ? o.shift(e.h) : 0));
      e.g = anchors.get(e.s);
    }
    else {
      const A = anchors.get(e.s), u = e.g - A;
      e.g = A + (o.fold ? fold(u, o.lo, o.hi) : Math.max(-3, Math.min(4, u)));
    }
    e.m = lead(e.g);
    lastG = e.g;
  }
  const fillers = [];
  if (withFillers) kept.forEach((a, j) => {
    const b = kept[j + 1];
    if (!b || b.t - a.t < 4) return;
    const leap = b.g - a.g, size = Math.abs(leap), dir = Math.sign(leap);
    if (size < 3) return;
    const steps = size >= 6 ? 2 : 1, len = steps === 2 ? 1.5 : 2;
    for (let k = steps; k >= 1; k--) {
      fillers.push({ t: b.t - k * len, k: 'lead', m: lead(b.g - dir * k), d: len, v: a.v * 0.65, tr: a.tr });
    }
    a.d = Math.max(2, Math.min(a.d, b.t - a.t - steps * len));
  });
  return kept.concat(fillers);
}
