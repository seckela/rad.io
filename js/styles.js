// The styles shown in the picker: the one place that says what each style is. `id` is the value
// the rest of the app switches on; the text is only for the picker. To add a style, add an entry
// here (and its compose/audio code), and it appears in the picker automatically.
export const STYLES = [
  {
    id: 'default', name: 'Default', tint: '#f2b24c',
    tagline: 'Upbeat and lively',
    blurb: 'The original mapping. Letters drive a melody, operators become drums, brackets become chords, and each line picks its own chord root so the music keeps moving.',
    chips: ['130 BPM', 'Dorian', 'Piano or synth lead', 'Synth bass and pad', 'Synth drums'],
    download: 'Piano samples (about 1 MB) when the piano lead is on.',
  },
  {
    id: 'chill', name: 'Chillstep', tint: '#7fb7e6',
    tagline: 'Slow and calm, for background listening',
    blurb: 'A relaxed half-time groove: a sparse piano melody on a steady grid over soft piano chords and a recorded bass that restates each bar. The chords follow a steady i–VI–III–VII loop.',
    chips: ['70 BPM', 'Natural minor', 'Piano melody and chords', 'Recorded bass', 'Half-time drums'],
    download: 'Piano and bass samples.',
  },
  {
    id: 'lofi', name: 'Lo-fi', tint: '#e08f6b',
    tagline: 'Dusty, swung beats',
    blurb: "Chillstep's harmony played like a lo-fi beat: 9th-chord stabs, a boom-bap kick with ghost notes, swung hats, short round bass notes, a gentle tape wobble and quiet vinyl crackle.",
    chips: ['80 BPM', 'Natural minor', 'Piano stabs', 'Recorded bass', 'Swung drums'],
    download: 'Piano and bass samples.',
  },
  {
    id: 'metal', name: 'Rock / Metal', tint: '#e0584d',
    tagline: 'Heavy, driving riffs',
    blurb: 'Each line becomes a riff section: palm-muted guitar chugs in changing rhythms, power chords from brackets, a bass part of its own, and a lead guitar over some sections. The drums are layered and follow the code.',
    chips: ['150 BPM', 'Phrygian', 'Sampled guitars and bass', 'Synth drums'],
    download: 'About 3 MB of guitar and bass samples.',
    note: 'The lead is always a guitar, so the Lead control is disabled.',
  },
  {
    id: 'chiptune', name: 'Chiptune', tint: '#6fd08c',
    tagline: 'Bright 8-bit game music',
    blurb: 'The default melody played on pulse waves, like a classic console soundtrack. Chords become fast arpeggios, the triangle-wave bass bounces between octaves, and a tight beat of noise drums keeps time.',
    chips: ['140 BPM', 'Major', 'Pulse-wave lead', 'Arpeggios', 'Triangle bass', 'Noise drums'],
    download: 'Nothing: every sound is synthesized.',
    note: 'The lead is always a pulse wave, so the Lead control is disabled.',
  },
  {
    id: 'ambient', name: 'Ambient', tint: '#a592f0',
    tagline: 'Slow, drifting drones',
    blurb: "Chillstep's slow harmony with nothing struck: each chord change becomes one long, soft drone with a low root and fifth underneath, a few long melody notes that blend into it, bell chimes, and now and then a gentle gust of wind chimes, all in a huge reverb. There are no drums.",
    chips: ['60 BPM', 'Natural minor', 'Soft sine lead', 'Detuned pad drone', 'Wind chimes', 'No drums'],
    download: 'Nothing: every sound is synthesized.',
    note: 'The lead is always a soft sine, so the Lead control is disabled.',
  },
  {
    id: 'synthwave', name: 'Synthwave', tint: '#f06bd0',
    tagline: 'Neon night-drive',
    blurb: 'The default melody on a bright, echoing saw lead over a wide detuned pad, with a relentless 16th-note saw bass on each line\'s root and a four-on-the-floor beat with a big snare.',
    chips: ['100 BPM', 'Natural minor', 'Saw lead', 'Wide pad', 'Pulsing bass', 'Four-on-the-floor'],
    download: 'Nothing: every sound is synthesized.',
    note: 'The lead is always a saw synth, so the Lead control is disabled.',
  },
  {
    id: 'house', name: 'Techno / House', tint: '#37d6c4',
    tagline: 'Four-on-the-floor club groove',
    blurb: 'A club beat under the default melody: a kick on every beat, claps, offbeat open hats, an offbeat saw bass, minor-7th chord stabs in a syncopated house rhythm, and a plucky lead. The kick ducks the bass and stabs on every beat for the pump.',
    chips: ['124 BPM', 'Dorian', 'Offbeat bass', 'Chord stabs', 'Plucky lead', 'Four-on-the-floor'],
    download: 'Nothing: every sound is synthesized.',
    note: 'The lead is always a pluck synth, so the Lead control is disabled.',
  },
  {
    id: 'trance', name: 'Trance', tint: '#5b8cff',
    tagline: 'Soaring, driving euphoria',
    blurb: 'Each line becomes a big supersaw chord with a fast pluck arpeggio over it, a rolling bass between the kicks, and a long-note supersaw lead with a dotted echo. Long chords end in a building snare roll, and the kick pumps everything on every beat.',
    chips: ['138 BPM', 'Natural minor', 'Supersaw pad', 'Pluck arpeggio', 'Rolling bass', 'Snare builds'],
    download: 'Nothing: every sound is synthesized.',
    note: 'The lead is always a supersaw, so the Lead control is disabled.',
  },
];
