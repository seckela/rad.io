// The "feel" a seed gives a style: where its tempo, scale and key start. Unlike the notes (see seed.js), these are settings the user can
// see and change, so they are only set at the moments a new seed takes effect (picking a style, loading an example or a file, or
// changing the seed), never while typing, and the user can change them afterwards. Each style keeps a range that still sounds like it:
// tempos stay within a few BPM of the style's usual, and scales are ones that suit its mood.
import { variant } from './seed.js';

export const FEEL = {
  default:   { tempo: [118, 140], scales: ['Dorian', 'Dorian', 'Natural minor', 'Major', 'Lydian'], key: true },
  chill:     { tempo: [64, 76],   scales: ['Natural minor', 'Natural minor', 'Dorian', 'Lydian'], key: true },
  lofi:      { tempo: [72, 90],   scales: ['Natural minor', 'Dorian', 'Dorian', 'Major', 'Lydian'], key: true },
  metal:     { tempo: [140, 170], scales: ['Phrygian', 'Phrygian', 'Natural minor'], key: false },     // the guitar samples limit the keys
  chiptune:  { tempo: [128, 160], scales: ['Major', 'Major', 'Natural minor', 'Dorian', 'Major pentatonic'], key: true },
  ambient:   { tempo: [60, 70],   scales: ['Natural minor', 'Lydian', 'Dorian', 'Major pentatonic'], key: true },
  synthwave: { tempo: [92, 112],  scales: ['Natural minor', 'Natural minor', 'Dorian', 'Major'], key: true },
  house:     { tempo: [120, 128], scales: ['Dorian', 'Natural minor', 'Dorian'], key: true },
  trance:    { tempo: [136, 142], scales: ['Natural minor', 'Natural minor', 'Dorian'], key: false },    // the chord loops are written in C minor
};

// The tempo, scale and key (an index into KEYS, or null to leave it alone) this seed gives `style`.
export function feelOf(style, seed) {
  const f = FEEL[style] || FEEL.default, v = variant(seed, style + '-feel');
  return {
    tempo: f.tempo[0] + v.pick('tempo', f.tempo[1] - f.tempo[0] + 1),
    scale: v.of('scale', f.scales),
    key: f.key ? v.pick('key', 12) : null,
  };
}
