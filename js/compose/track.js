// Turns lines of text into timed events (no audio code). The lookup tables here set the melody and harmony.

import { variant } from './seed.js';

const FREQ = 'etaoinshrdlcumwfgypbvkjxqz';        // letters, most to least common

// Note lengths in 16ths, picked by letter pair. The seed picks one table: the original, a longer and flowing one, a short and
// choppy one, or an uneven one with long notes.
const DURS = [[1, 1, 1, 2, 1, 1, 2, 3], [2, 2, 3, 1, 2, 1, 2, 4], [1, 1, 1, 1, 1, 2, 1, 1], [1, 2, 1, 3, 1, 2, 1, 4]];

const STEPS = [1, -1, 2, -2, 1, 3, -3, 0, -1, 2, -2, 4, -4];   // melodic steps picked by letter pair

// Chillstep's chord roots, one per code line, cycling. The first loop is i - VI - III - VII; the seed picks one of these. All are
// familiar, diatonic and close together, so a new line changes the harmony gently instead of jumping to a root picked from the
// line's text.
const CHILL_LOOPS = [[0, 5, 2, 6], [0, 3, 6, 2], [0, 6, 5, 2], [0, 5, 3, 6]];

const PROG = [0, 3, 4, 2];                        // pad chord roots by nesting depth

const BASS = [0, 4, 2, 5, 3];                     // bass degrees by indent level

export function degToMidi(root, scale, d) {
  const n = scale.length;
  return root + Math.floor(d / n) * 12 + scale[((d % n) + n) % n];
}

// Plays one track's lines in order; times are in 16th-note units. The background track
// sits an octave lower and drops the percussion (those characters become rests).
export function composeTrack(items, key, scale, bg, vary, chill, v = variant()) {
  const n = scale.length, ev = [];
  // What the seed (see seed.js) changes: where in the table of melodic steps and note lengths each letter pair lands, the bass
  // degrees, how often the harmony returns to the tonic, and where the melody starts.
  const chillLoop = v.of('chill-loop', CHILL_LOOPS);
  const stepSh = v.pick('steps', STEPS.length), DUR = v.of('durs', DURS), durSh = v.pick('dur', DUR.length), mirror = v.chance('mirror', 0.5), leap = v.of('leap', [1, 1, 1.5, 2]), bassSh = v.pick('bass', BASS.length);
  const tonicEvery = 3 + v.pick('tonic', 3), regSh = v.pick('reg', 5), start = n + v.pick('start', 5) - 2;
  const sh = bg ? -12 : 0;
  const push = o => ev.push({ tr: bg ? 1 : 0, ...o });
  const lead = d => degToMidi((chill ? 48 : 60) + key + sh, scale, d);   // same tonic as pad/bass (C + key)
  const pad  = d => degToMidi(48 + key, scale, d);
  // Chillstep keeps the bass in one low octave (G1 to F#2) whatever the chord: roots on higher scale degrees
  // used to sit up near 105-117 Hz, which sounded brighter and louder than the others, so a line change onto
  // one of them came in sharp and high.
  const bass = d => { const m = degToMidi(36 + key, scale, d); return chill ? 31 + (((m - 31) % 12) + 12) % 12 : m; };
  const top  = d => degToMidi(72 + key + sh, scale, d);

  let t = 0, pos = start, depth = 0, prev = '';
  const lo = 0, hi = 2 * n;
  const isWord = ch => /[a-z_$]/i.test(ch);
  let lineNo = -1, seg = -1;

  items.forEach(({ line, idx, more }) => {
    const ws = line.match(/^[ \t]*/)[0];
    const indent = Math.round([...ws].reduce((a, c) => a + (c === '\t' ? 2 : 1), 0) / 2);
    const blank = ws.length === line.length;
    if (!blank) seg++;
    const len = Math.max(1, line.length - ws.length);
    const swell = j => Math.sin(Math.PI * (j - ws.length) / len);   // 0 -> 1 -> 0 across the line

    // With vary on, each line gets its own chord root and register, derived from its text.
    // Every fourth code line returns to the tonic so the harmony still resolves.
    let root = 0, reg = 0, wl = 0, h = 0;
    if (!blank) for (const ch of line.trim()) h = (h * 31 + ch.charCodeAt(0)) % 9973;
    if (vary && !blank) {
      lineNo++;
      root = chill ? chillLoop[lineNo % 4] % n : lineNo % tonicEvery === 0 ? 0 : (h + v.pick('root', n)) % n;
      reg = [0, 1, -1, 2, 1][((h >> 3) + regSh) % 5];
    }
    const tones = [root, root + 2, root + 4].map(d => d % n);

    if (!blank) {
      push({ t, i: idx + ws.length, k: 'bass', m: bass(chill ? root : (root + BASS[(indent + bassSh) % BASS.length]) % n), d: chill ? 16 : 4, v: chill ? 0.34 : 0.6, s: seg, a: root });
      if (vary) push({ t, i: idx + ws.length, k: 'pad', m: [pad(root), pad(root + 2), pad(root + 4)], rd: root, d: 8, v: chill ? 0.22 : 0.3, s: seg });
    }

    for (let j = ws.length; j < line.length; j++) {
      const c = line[j], i = idx + j;
      const lc = c.toLowerCase();
      wl = /[a-z_$0-9]/i.test(c) ? wl + 1 : 0;

      if (/[a-z_$]/i.test(c)) {
        const rank = /[_$]/.test(c) ? 12 : FREQ.indexOf(lc);
        let step = (rank % 2 ? -1 : 1) * (1 + Math.floor(rank / 6));
        if (vary) {
          const pr = isWord(prev) ? (/[_$]/.test(prev) ? 12 : FREQ.indexOf(prev.toLowerCase())) : 13;
          step = STEPS[(pr * 5 + rank * 3 + stepSh) % STEPS.length];
        }
        if (mirror) step = -step;                       // the contour flips (seeded)
        step = Math.round(step * leap);                 // and may be more or less jumpy (seeded)
        if (prev === c) step = 0;
        let next = pos + step;
        if (next < lo || next > hi) next = pos - step;
        pos = Math.max(lo, Math.min(hi, next));
        let d = DUR[(prev.charCodeAt(0) * 3 + c.charCodeAt(0) + durSh) % DUR.length || 0] || 1;
        const upper = c !== lc;
        let off = Math.min(depth, 3) * 2, v = upper ? 0.95 : 0.55;
        if (vary) {
          off += reg + Math.round(1.5 * swell(j));
          // On the beat, land on the nearest tone of this line's chord.
          if (t % 4 === 0) {
            let best = pos, bd = 99;
            for (const tn of tones) {
              const cand = tn + Math.round((pos + off - tn) / n) * n;
              if (Math.abs(cand - pos - off) < bd) { bd = Math.abs(cand - pos - off); best = cand - off; }
            }
            pos = Math.max(lo, Math.min(hi, best));
          }
          // Longer note to close a word of 3+ letters; accent word starts; shape dynamics over the line.
          if (wl >= 3 && !/[a-z_$0-9]/i.test(line[j + 1] || ' ')) d = Math.max(d, 2);
          v = Math.min(1, (0.5 + (wl === 1 ? 0.2 : 0) + (upper ? 0.25 : 0)) * (0.85 + 0.15 * swell(j)));
        }
        const g = Math.min(pos + off, hi + 4);
        push({ t, i, k: 'lead', m: lead(g), d, v, w: wl, g, a: root, s: seg, h, rk: rank });
        t += d;
      } else if (/[0-9]/.test(c)) {
        push({ t, i, k: 'digit', m: degToMidi(60 + key + sh, scale, +c), d: 1, v: 0.7 });
        t += 1;
      } else if (c === '=') {
        push({ t, i, k: bg ? 'rest' : 'kick' }); t += 1;
      } else if ('+-*/%'.includes(c)) {
        push({ t, i, k: bg ? 'rest' : 'hat' }); t += 1;
      } else if ('<>!&|^~'.includes(c)) {
        push({ t, i, k: bg ? 'rest' : 'snare' }); t += 1;
      } else if ('([{'.includes(c)) {
        depth++;
        const r = root + PROG[depth % PROG.length];
        push({ t, i, k: 'pad', m: [pad(r), pad(r + 2), pad(r + 4)], rd: r, d: 4, v: 0.5 });
        t += 1;
      } else if (')]}'.includes(c)) {
        depth = Math.max(0, depth - 1);
        push({ t, i, k: 'pad', m: [pad(root), pad(root + 2), pad(root + 4)], rd: root, d: 2, v: 0.4 });
        t += 1;
      } else if ('"\'`'.includes(c)) {
        push({ t, i, k: 'bell', m: top(4), d: 2, v: 0.5 }); t += 1;
      } else if (c === ';') {
        push({ t, i, k: 'bell', m: top(n), d: 2, v: 0.6 }); t += 1;
      } else if (c === '?') {
        push({ t, i, k: 'bell', m: top(2), d: 2, v: 0.5 }); t += 1;
      } else if (c === '\t') {
        push({ t, i, k: 'rest' }); t += 2;
      } else {
        push({ t, i, k: 'rest' }); t += 1;     // space , . : and anything unmapped
      }
      prev = c;
    }

    if (more) {
      push({ t, i: idx + line.length, k: 'rest' });
      // Blank lines add no time, so runs of them cost nothing beyond the preceding line's break.
      if (!blank) t = Math.ceil((t + 1) / 2) * 2;
      prev = '\n';
    }
  });

  return { events: ev, t, lead, pad, n };
}
