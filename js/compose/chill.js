import { groupLeads, gridMelody } from './melody.js';
import { variant } from './seed.js';
import { drumGroove } from './groove.js';

const CHILL_SLOW = 1.5;                         // how much chillstep stretches the melody's timeline

// Chillstep feel. Everything is stretched in time, then the melody is rebuilt on a rhythmic grid:
//  - Each code line is a section with its own pace (picked from the line's text): mostly slow
//    (a note every 2 bars... of the grid below), sometimes medium, occasionally lively.
//  - Grid steps are multiples of `base` units (16 units = 1 bar), so the notes stay in time with
//    the drums. Near each grid step the nearest letter supplies the pitch, preferring word starts.
//  - A section opens on its "source note" (the line's chord root) and stays within a few steps of
//    it, so leaps happen between sections; stepwise filler notes smooth leaps that remain.
// Chords and bells are thinned, digits go quiet, and the character-driven percussion is reduced to
// silent. A steady half-time drum pattern is laid on top by chillDrums().
export function chillify(r, base, v = variant()) {
  const S = CHILL_SLOW;
  // Seeded (see seed.js): what the bass does each bar between chord changes, as [offset in 16ths, semitones above the root]; the first
  // is the long root, the others add a softer note in the bar. (Lo-fi and Ambient drop these restatements and play their own.)
  const RESTATE = v.of('restate', [[[0, 0]], [[0, 0]], [[0, 0], [8, 7]], [[0, 0], [10, 0]], [[0, 0], [6, 0], [12, 7]]]);
  const ev = r.events.map(e => {
    const o = { ...e, t: e.t * S };
    if (e.d) o.d = e.d * S;
    if (['digit', 'kick', 'hat', 'snare'].includes(e.k)) { o.k = 'rest'; delete o.m; delete o.v; }
    // The bass already plays each chord's root, so the pad takes the 3rd, 5th and 7th: doubling the root in bass,
    // pad and melody at once stacked the same note into a droning, horn-like tone.
    else if (e.k === 'pad' && e.rd !== undefined) {
      if (e.d !== 8) { o.k = 'rest'; delete o.m; }      // brackets don't add chords here: the harmony changes only at line starts
      else o.m = [r.pad(e.rd + 2), r.pad(e.rd + 4), r.pad(e.rd + 6)];      // pitches only; voiced below
    }
    return o;
  });
  // The harmony changes only on a new line, and the bass and chord change together. A line that starts too soon
  // after the last change keeps the harmony going (before, its chord was dropped but its bass note still moved,
  // leaving the old chord ringing against the new bass). The melody follows whichever root is actually sounding.
  const heldRoot = new Map(), dropped = new Set();
  let lastChange = -99, sounding = null;
  for (const e of ev) {
    if (e.k !== 'bass' || e.s === undefined) continue;
    if (e.t - lastChange >= 18) { lastChange = e.t; sounding = e.a; }
    else { e.k = 'rest'; delete e.m; dropped.add(e.s); }
    heldRoot.set(e.s, sounding);
  }
  for (const e of ev) {
    if (e.k === 'pad' && dropped.has(e.s)) { e.k = 'rest'; delete e.m; }
    if (e.k === 'lead' && heldRoot.has(e.s)) e.a = heldRoot.get(e.s);
  }
  // Put each chord change (bass and chord together) on the nearest beat. A new line's first character falls at
  // an arbitrary step, so the new bass and chord used to start a little off the beat, right after the snare and
  // the melody's own note, which made the change sound like a stumble instead of a continuation.
  for (const e of ev) {
    if ((e.k === 'bass' || e.k === 'pad') && e.s !== undefined && e.m !== undefined) e.t = Math.round(e.t / 4) * 4;
  }
  // Voice the chords: compact (within an octave), in a low range under the melody, and each one arranged to move
  // as little as possible from the last. (Placing every chord by scale degree sent a chord whose root was a high
  // degree up an octave, so it jumped above the melody the moment a new line began.)
  let prevVoicing = null;
  const voice = pcs => {
    const choices = pcs.map(pc => { const c = []; for (let m = 48; m <= 66; m++) if (m % 12 === pc) c.push(m); return c; });
    let best = null, bestCost = Infinity;
    for (const x of choices[0]) for (const y of choices[1]) for (const z of choices[2]) {
      const v = [x, y, z].sort((a, b) => a - b);
      if (v[2] - v[0] > 12) continue;
      const cost = prevVoicing ? v.reduce((sum, m, i) => sum + Math.abs(m - prevVoicing[i]), 0) : Math.abs((v[0] + v[1] + v[2]) / 3 - 58);
      if (cost < bestCost) { bestCost = cost; best = v; }
    }
    return best || pcs.map(pc => 52 + (((pc - 52) % 12) + 12) % 12).sort((a, b) => a - b);
  };
  for (const e of ev) {
    if (e.k !== 'pad' || !e.m) continue;
    prevVoicing = voice(e.m.map(m => ((m % 12) + 12) % 12));
    e.m = prevVoicing;
  }
  // Keep the harmony sounding. A chord struck at a line start has faded long before the next line, so the bass
  // and chord used to vanish for many seconds and then arrive all at once. Now the bass restates the chord root on
  // every bar (with the kick) and the chord is softly re-struck every second bar, until the next change.
  const changes = ev.filter(e => e.k === 'bass' && e.m !== undefined && e.s !== undefined);
  const chordOf = new Map(ev.filter(e => e.k === 'pad' && e.m).map(e => [e.s, e]));
  const endT = r.t * S;
  changes.forEach((c, j) => {
    const stop = changes[j + 1] ? changes[j + 1].t : endT;
    const chord = chordOf.get(c.s);
    // The line-start note runs on into the first restatement, and each restatement overlaps the next (the
    // sampler fades in and out slowly), so the bass is one continuous tone instead of separate plucks.
    const first = Math.ceil((c.t + 4) / 16) * 16;
    c.d = Math.max(4, Math.min(first, stop) - c.t + 4);
    for (let bt = first, k = 0; bt < stop - 4; bt += 16, k++) {
      RESTATE.forEach(([off, semi], n) => { if (bt + off < stop - 4) ev.push({ t: bt + off, tr: 0, k: 'bass', m: c.m + semi, d: n ? 6 : Math.min(20, stop - bt + 4), v: n ? 0.24 : 0.34 }); });
      if (chord && k % 2 === 1) ev.push({ t: bt, tr: 0, k: 'pad', m: chord.m, d: 10, v: 0.22 });
    }
  });
  const thin = (kind, minGap) => {
    let last = -99;
    for (const e of ev) {
      if (e.k !== kind) continue;
      if (e.t - last < minGap) { e.k = 'rest'; delete e.m; } else last = e.t;
    }
  };
  thin('bell', 12);

  const groups = groupLeads(ev);
  return { events: ev.concat(gridMelody(r, groups, base, true, { legato: true, sticky: true })), t: r.t * S };
}

// The groove. The seed picks a whole one (see groove.js) from the slow, spacious kinds: half-time, boom-bap, shuffle or sparse; the hats
// are swung a little.
export function chillDrums(total, v = variant()) {
  return drumGroove(total, v.of('drums', ['halftime', 'halftime', 'boombap', 'shuffle', 'sparse']), 0.9, 0.5);
}
