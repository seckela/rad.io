import { drumGroove, bassGroove, BASSES } from './groove.js';
import { variant } from './seed.js';

// The Default style's rhythm section. Before the seed, the bass was one note per line and the only drums were the ones the characters
// make (= kick, + - * / hat, < > ! & snare), so a text with few symbols had almost no foundation and every text had the same one.
// Now the seed picks a bass line (from the line's root, until the next line's root) and a drum groove that run underneath the
// character-driven hits, which stay as accents on top.
const BASS_CHOICES = ['long', 'fifth', 'pulse', 'sync', 'walk', 'offbeat', 'octave'];
const DRUM_CHOICES = ['boombap', 'halftime', 'breaks', 'driving', 'shuffle', 'four', 'sparse'];

export function defaultify(r, v = variant()) {
  const bassFamily = v.of('bass', BASS_CHOICES);
  const roots = r.events.filter(e => e.k === 'bass' && e.s !== undefined).sort((a, b) => a.t - b.t);
  const out = r.events.filter(e => !(e.k === 'bass' && e.s !== undefined));
  roots.forEach((c, j) => {
    const stop = roots[j + 1] ? roots[j + 1].t : r.t;
    const notes = bassGroove(c.t, Math.max(stop, c.t + 4), c.m, bassFamily, c.tr, c.i, 0.6);
    for (const n of notes) { n.s = c.s; n.a = c.a; if (n.t === c.t) { n.s = c.s; } }
    out.push(...notes);
  });
  return { ...r, events: out };
}

export const defaultDrums = (total, v = variant()) => drumGroove(total, v.of('drums', DRUM_CHOICES), 0.7);
