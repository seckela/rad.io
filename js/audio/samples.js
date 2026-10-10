// Sample sources and loaders. Nothing is bundled: samples are fetched when a style needs them.

// Salamander grand piano samples (Tone.js demo assets). The lead covers roughly C3-C7.
export const PIANO_BASE = 'https://tonejs.github.io/audio/salamander/';

export const PIANO_URLS = {};

for (let o = 3; o <= 6; o++) {
  for (const [n, f] of [['C', 'C'], ['D#', 'Ds'], ['F#', 'Fs'], ['A', 'A']]) PIANO_URLS[n + o] = f + o + '.mp3';
}

// Rock/metal guitar and bass samples from the tonejs-instruments library (CC BY 3.0).
const INSTR_BASE = 'https://nbrosowsky.github.io/tonejs-instruments/samples/';

const GUITAR_FILES = { 'C#2': 'Cs2', E2: 'E2', 'F#2': 'Fs2', A2: 'A2', C3: 'C3', 'D#3': 'Ds3', 'F#3': 'Fs3', A3: 'A3',
  C4: 'C4', 'D#4': 'Ds4', 'F#4': 'Fs4', A4: 'A4', C5: 'C5', 'D#5': 'Ds5', 'F#5': 'Fs5', A5: 'A5', C6: 'C6' };

const BASS_FILES = { 'A#1': 'As1', 'C#1': 'Cs1', E1: 'E1', G1: 'G1', 'A#2': 'As2', 'C#2': 'Cs2', E2: 'E2', G2: 'G2',
  'A#3': 'As3', 'C#3': 'Cs3', E3: 'E3', G3: 'G3' };

// Downloads and decodes the rock/metal guitar and bass samples once. Samplers are given the raw
// AudioBuffers (they can't take already-wrapped Tone buffers), so every track shares one copy.
export async function loadMetalBuffers() {
  const load = (dir, files) => Object.fromEntries(Object.entries(files)
    .map(([note, f]) => [note, new Tone.ToneAudioBuffer(INSTR_BASE + dir + '/' + f + '.mp3')]));
  const wrapped = { guitar: load('guitar-electric', GUITAR_FILES), bass: load('bass-electric', BASS_FILES) };
  await Tone.loaded();
  const raw = set => Object.fromEntries(Object.entries(set).map(([note, b]) => [note, b.get()]));
  return { guitar: raw(wrapped.guitar), bass: raw(wrapped.bass) };
}

// Chillstep uses the recorded electric bass too (a held synth sine at that pitch is a steady hum, which
// reads as a foghorn), so it needs just the bass samples.
export async function loadBassBuffers() {
  const wrapped = Object.fromEntries(Object.entries(BASS_FILES)
    .map(([note, f]) => [note, new Tone.ToneAudioBuffer(INSTR_BASE + 'bass-electric/' + f + '.mp3')]));
  await Tone.loaded();
  return Object.fromEntries(Object.entries(wrapped).map(([note, b]) => [note, b.get()]));
}
