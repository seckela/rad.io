import { composeTrack } from './track.js';
import { chillify, chillDrums } from './chill.js';
import { lofiify, lofiDrums } from './lofi.js';
import { metalify, metalDrums } from './metal.js';
import { chipify, chipDrums } from './chip.js';

// o.mode: 'off' | 'canon' | 'split'
//  canon: the background repeats the melody `o.delay` units late, an octave up (lead voice only)
//  split: code lines alternate between foreground and background tracks, each on its own clock
// o.vary: evolving harmony; o.chill: chillstep feel; o.lofi: lo-fi feel; o.metal: rock/metal feel; o.chip: chiptune feel; o.gap: melody pace
export function compose(text, key, scale, o) {
  const { mode, delay, vary, chill, lofi, metal, chip } = o;
  const warm = chill || lofi;      // Lo-fi is composed on top of the Chillstep layout
  const fix = r => chip ? chipify(r) : metal ? metalify(r, key, scale, o.gap / 2) : lofi ? lofiify(r, key, scale, o.gap) : chill ? chillify(r, o.gap) : r;
  const lines = text.split('\n');
  const tracks = [[], []];
  let idx = 0, k = -1;
  lines.forEach((line, li) => {
    if (line.trim()) k++;
    const tr = mode === 'split' && k > 0 ? k % 2 : 0;
    tracks[tr].push({ line, idx, more: li < lines.length - 1 });
    idx += line.length + 1;
  });
  const fg = fix(composeTrack(tracks[0], key, scale, false, vary, warm));
  let events = fg.events, t = fg.t;
  if (mode === 'split') {
    const bg = fix(composeTrack(tracks[1], key, scale, true, vary, warm));
    events = events.concat(bg.events);
    t = Math.max(t, bg.t);
  } else if (mode === 'canon') {
    // Non-melodic events become rests so the echo only moves the highlight.
    const echo = fg.events.map(e => e.k === 'lead'
      ? { ...e, tr: 1, t: e.t + delay, m: e.m + 12, v: e.v * 0.8 }
      : { t: e.t + delay, i: e.i, tr: 1, k: 'rest' });
    events = events.concat(echo);
    t += delay;
  }
  const total = Math.max(16, Math.ceil(t / 16) * 16);
  if (lofi) events = events.concat(lofiDrums(total));
  else if (chill) events = events.concat(chillDrums(total));
  if (chip) events = events.concat(chipDrums(total));
  if (metal) {
    const grid = metalDrums(total, fg.sections);
    const taken = new Set(grid.map(e => e.k + '@' + Math.round(e.t)));
    events = events.filter(e => !['kick', 'hat', 'snare'].includes(e.k) || !taken.has(e.k + '@' + Math.round(e.t))).concat(grid);
  }
  return { events, total };
}
