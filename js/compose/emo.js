import { degToMidi } from './track.js';
import { groupLeads, gridMelody } from './melody.js';
import { variant } from './seed.js';

// Emo / Pop Punk feel, built on the Rock / Metal voices (sampled guitar and bass, synth drums) but arranged as a song with a form,
// not a string of riffs:
//  - The text is cut into sections at its line breaks (a long line is cut into blocks of eight bars, a run of very short lines is
//    joined), and each section is a verse, a pre-chorus, a chorus or a bridge, in a seeded order that always ends on a chorus.
//  - Every section plays a loop of four chords, one to a bar, picked from the seed (I V vi IV and its relatives, as steps of the scale,
//    so in a minor scale the same shape turns moody). The verse starts the loop from a different chord, so the chorus sounds like an
//    arrival when it comes back to the first.
//  - Verses are palm-muted power chords in eighths or, in some songs (or just the first verse), a clean, chorused, arpeggiated guitar
//    with a quiet beat; a pre-chorus builds with a crescendo on a snare; the chorus opens up into ringing power chords with a crash;
//    a bridge drops to half time.
//  - The bass drives in eighths on each bar's root (long notes under the clean verses and the bridge).
//  - A lead guitar sings the melody (the Chillstep grid melody, with its on-beat notes moved onto the chord) in the choruses and bridges.
//  - The drums are a pop-punk kit: a rock beat or the "skate" beat (snare on the off-beats) in the verses, a snare roll into each
//    chorus, and a crash on its first bar.
// The code's own kicks, hats and snares go quiet here; the groove comes from the form. The voices are in audio/metal-track.js.

const LOOPS = [[0, 4, 5, 3], [0, 5, 3, 4], [0, 3, 4, 3], [0, 4, 3, 4], [5, 3, 0, 4], [0, 2, 5, 4]];
const FORMS = [
  ['V', 'V', 'C', 'C'],
  ['V', 'P', 'C', 'V', 'P', 'C', 'B', 'C'],
  ['V', 'V', 'P', 'C', 'C', 'B', 'C', 'C'],
];
const MUTE_PATS = [[0, 2, 4, 6, 8, 10, 12, 14], [0, 2, 3, 4, 6, 8, 10, 11, 12, 14], [0, 2, 4, 6, 8, 10, 12, 14]];
const CHORUS_PATS = [[0, 2, 4, 6, 8, 10, 12, 14], [0, 3, 4, 7, 8, 11, 12, 14], [0, 4, 6, 8, 12, 14]];
const FILL_PAT = [0, 4, 8, 10, 12, 13, 14, 15];
const ARPS = [[0, 4, 7, 4, 2, 4, 7, 4], [0, 2, 4, 7, 4, 2, 4, 2], [0, 7, 4, 2, 0, 7, 4, 2]];   // scale steps above the bar's chord root, one per eighth
const PICKS = [0, 0, 1, 1, 1, 2];                 // the lead's pace per line: mostly slow and medium, like a sung line
const BLOCK = 128;                                // the longest a section runs before it is cut (eight bars)

const rotate = (a, k) => a.slice(k).concat(a.slice(0, k));

export function emoify(r, key, scale, base, v = variant()) {
  const n = r.n;
  const loop = v.of('loop', LOOPS), form = v.of('form', FORMS), vRot = v.of('verse-rot', [0, 2, 2]);
  const verseKind = v.of('verse-kind', ['mute', 'clean', 'build']), mutePat = v.of('mute', MUTE_PATS), chorusPat = v.of('chorus', CHORUS_PATS), arp = v.of('arp', ARPS);
  const skate = v.of('verse-beat', ['rock', 'skate', 'rock']) === 'skate';
  const root = d => degToMidi(36 + key, scale, d);
  const bassNote = m => m - (key >= 4 ? 12 : 0);       // an octave under the guitar where the bass samples allow
  const lowLead = d => r.lead(d - n);                  // an octave under the shared melody range, where guitar leads live

  // The code's own drum hits go quiet, so does everything else that isn't the melody.
  const ev = r.events.map(e => {
    const o = { ...e };
    if (['bass', 'pad', 'bell', 'digit', 'kick', 'hat', 'snare'].includes(e.k)) { o.k = 'rest'; delete o.m; delete o.v; }
    return o;
  });
  const groups = groupLeads(ev);
  const list = [...groups.values()];
  const end = Math.max(32, Math.ceil(r.t / 16) * 16);

  // The sections, on the bar grid: one per line (a short line joins the one before it), a long one cut into blocks of eight bars.
  const raw = [];
  list.forEach((grp, gi) => {
    const s = gi === 0 ? 0 : Math.round(grp[0].t / 16) * 16, last = raw[raw.length - 1];
    if (last && s < last.s + 32) return;
    raw.push({ s });
  });
  if (!raw.length) raw.push({ s: 0 });
  const fixed = [];
  raw.forEach((x, i) => {
    const e = i + 1 < raw.length ? raw[i + 1].s : Math.max(end, x.s + 32);
    let s = x.s;
    for (; e - s > BLOCK + 31; s += BLOCK) fixed.push({ s, e: s + BLOCK });      // (a block that would leave under two bars over takes them)
    fixed.push({ s, e });
  });
  fixed.forEach((x, i) => {
    x.role = i === fixed.length - 1 ? 'C' : form[i % form.length];
    x.loop = x.role === 'C' ? loop : x.role === 'V' ? rotate(loop, vRot) : x.role === 'P' ? [3, 3, 4, 4] : [5, 3, 5, 4];
  });
  let verses = 0;
  for (const x of fixed) if (x.role === 'V') x.clean = verseKind === 'clean' || (verseKind === 'build' && verses++ === 0);
  const total = fixed[fixed.length - 1].e;
  const secAt = t => { for (let i = fixed.length - 1; i >= 0; i--) if (t >= fixed[i].s) return fixed[i]; return fixed[0]; };
  const chordAt = t => { const x = secAt(t); return x.loop[Math.floor((t - x.s) / 16) % 4]; };

  const out = [];
  fixed.forEach((x, si) => {
    const nextRole = fixed[si + 1] && fixed[si + 1].role, nBars = (x.e - x.s) / 16;
    for (let bi = 0; bi < nBars; bi++) {
      const b = x.s + bi * 16, cd = x.loop[bi % 4], m = root(cd), br = bassNote(m);
      const lastBar = bi === nBars - 1, fill = lastBar && (nextRole === 'C' || nextRole === 'B');
      const first = bi === 0, grow = nBars > 1 ? bi / (nBars - 1) : 1;
      const finale = si === fixed.length - 1 && lastBar;
      // Guitar.
      if (finale) {
        out.push({ t: b, tr: 0, k: 'power', m, d: 14, v: 1 });
      } else if (fill) {
        for (const p of FILL_PAT) out.push({ t: b + p, tr: 0, k: 'chug', m, d: 1, v: 0.7 + 0.25 * p / 15 });
      } else if (x.role === 'C') {
        chorusPat.forEach((p, j) => out.push({ t: b + p, tr: 0, k: 'power', m, d: Math.max(1.5, (chorusPat[j + 1] === undefined ? 16 : chorusPat[j + 1]) - p) * 0.95, v: first && p === 0 ? 1 : p % 8 === 0 ? 0.92 : 0.8 }));
      } else if (x.role === 'B') {
        out.push({ t: b, tr: 0, k: 'power', m, d: 8, v: 0.85 }, { t: b + 8, tr: 0, k: 'power', m, d: 7, v: 0.7 });
      } else if (x.role === 'P') {
        for (const p of [0, 2, 4, 6, 8, 10, 12, 14]) out.push({ t: b + p, tr: 0, k: 'chug', m, d: 1, v: (0.55 + 0.4 * grow) * (p % 4 === 0 ? 1 : 0.85) });
      } else if (x.clean) {
        arp.forEach((off, j) => out.push({ t: b + j * 2, tr: 0, k: 'clean', m: r.pad(cd + off), d: 3, v: j === 0 ? 0.7 : j % 2 ? 0.5 : 0.58 }));
      } else {
        for (const p of mutePat) out.push({ t: b + p, tr: 0, k: 'chug', m, d: 1, v: p % 4 === 0 ? 0.95 : 0.78 });
      }
      // Bass.
      if (finale) out.push({ t: b, tr: 0, k: 'bass', m: br, d: 14, v: 0.95 });
      else if (x.role === 'B' || x.clean) {
        for (const p of x.clean ? [0, 4, 8, 12] : [0, 8]) out.push({ t: b + p, tr: 0, k: 'bass', m: br, d: x.clean ? 3.4 : 7.4, v: p === 0 ? 0.8 : 0.65 });
      } else {
        for (let p = 0; p < 16; p += 2) out.push({ t: b + p, tr: 0, k: 'bass', m: br + (fill && p >= 12 ? 7 : 0), d: 1.8, v: p % 4 === 0 ? 0.9 : 0.72 });
      }
    }
  });

  // The lead: the grid melody over every line (anchored on the tonic), kept only in the choruses and bridges, with its on-beat notes
  // moved onto the nearest tone of that bar's chord.
  list.forEach(grp => grp.forEach(e => { e.a = 0; }));
  const lead = gridMelody({ ...r, lead: lowLead }, new Map(list.map(g => [g[0].s, g])), base, false,
    { picks: PICKS, shift: h => [0, 2, -2, 3, 0][(h >> 5) % 5], fold: true, lo: -4, hi: 6, legato: true })
    .filter(e => e.t < total && ['C', 'B'].includes(secAt(e.t).role))
    .map(e => {
      const o = { ...e, v: Math.min(1, e.v * 0.9) };
      if (o.g !== undefined && o.t % 4 === 0) {
        const cd = chordAt(o.t);
        let best = o.g, bd = 99;
        for (const tone of [0, 2, 4]) for (let k = -2; k <= 2; k++) {
          const cand = cd + tone + k * n;
          if (Math.abs(cand - o.g) < bd) { bd = Math.abs(cand - o.g); best = cand; }
        }
        o.g = best;
        o.m = lowLead(best);
      }
      return o;
    });
  return { events: ev.concat(out, lead), t: total, sections: fixed.map(x => ({ s: x.s, e: x.e, role: x.role, clean: !!x.clean })) };
}

// Pop-punk drums that follow the form: see the notes at the top of the file.
export function emoDrums(total, sections, v = variant()) {
  const CHORUS_KICK = v.of('chorus-kick', [[0, 8, 10], [0, 3, 8, 10], [0, 2, 8, 10]]);
  const skate = v.of('verse-beat', ['rock', 'skate', 'rock']) === 'skate';
  const ev = [];
  const hit = (t, k, vel) => { if (t < total) ev.push({ t, k, v: Math.min(1, vel), tr: 0 }); };
  sections.forEach((x, si) => {
    const next = sections[si + 1], nBars = (x.e - x.s) / 16;
    for (let bi = 0; bi < nBars; bi++) {
      const b = x.s + bi * 16, lastBar = bi === nBars - 1, grow = nBars > 1 ? bi / (nBars - 1) : 1;
      const fill = lastBar && next && (next.role === 'C' || next.role === 'B'), finale = !next && lastBar;
      let kick, snare, hat, sv = 1;
      if (x.role === 'C') { kick = CHORUS_KICK; snare = [4, 12]; hat = [0, 2, 4, 6, 8, 10, 12, 14]; }
      else if (x.role === 'P') { kick = [0, 8]; snare = [0, 4, 8, 12]; hat = []; sv = 0.45 + 0.5 * grow; }
      else if (x.role === 'B') { kick = [0, 10]; snare = [8]; hat = [0, 4, 8, 12]; }
      else if (x.clean) { kick = [0, 8]; snare = [4, 12]; hat = [0, 4, 8, 12]; sv = 0.45; }
      else if (skate) { kick = [0, 4, 8, 12]; snare = [2, 6, 10, 14]; hat = []; sv = 0.85; }
      else { kick = [0, 8]; snare = [4, 12]; hat = [0, 2, 4, 6, 8, 10, 12, 14]; }
      if (finale) { hit(b, 'kick', 1); hit(b, 'crash', 1); continue; }
      for (const p of kick) if (!(fill && p >= 8)) hit(b + p, 'kick', p === 0 ? 1 : 0.85);
      for (const p of snare) if (!(fill && p >= 8)) hit(b + p, 'snare', 0.9 * sv);
      for (const p of hat) if (!(fill && p >= 8)) hit(b + p, 'hat', p % 4 === 0 ? 0.7 : 0.45);
      if (fill) { hit(b + 8, 'kick', 0.9); for (const [i, p] of [8, 10, 12, 13, 14, 15].entries()) hit(b + p, 'snare', 0.5 + i * 0.1); }
      if (x.role === 'C' && bi % 2 === 0) hit(b, 'crash', bi === 0 ? 0.9 : 0.6);
    }
  });
  return ev;
}
