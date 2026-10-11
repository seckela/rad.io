import { PIANO_BASE, PIANO_URLS } from './samples.js';

// The neo-classical voices: a sampled grand piano for both the melody and the rolling figure under it (a soft synth if the samples can't be
// loaded), a bowed bass (a cello) and a string section made from detuned saw waves with slow bows, a lowpass and vibrato, so
// nothing else downloads. There are no drums. The hall reverb is in engine.js. The background track (the canon echo) has only the melody.
export function buildNeoTrack(reverb, bg, piano) {
  const out = new Tone.PanVol(bg ? 0.3 : 0, bg ? -6 : 0).connect(reverb);
  const group = {};
  for (const name of ['lead', 'bass', 'pad', 'accent', 'perc']) group[name] = new Tone.Volume(0).connect(out);
  const fx = {};

  fx.leadLp = new Tone.Filter(bg ? 3000 : 5500, 'lowpass').connect(group.lead);           // take the edge off the top
  fx.arpLp = new Tone.Filter(2800, 'lowpass').connect(group.pad);                          // the figure sits softer and rounder than the melody
  fx.stringLp = new Tone.Filter(1700, 'lowpass').connect(group.pad);
  fx.vibrato = new Tone.Vibrato({ frequency: 5, depth: 0.1 }).connect(fx.stringLp);
  fx.celloLp = new Tone.Filter(650, 'lowpass').connect(group.bass);

  const soft = (type, env, extra = {}) => new Tone.PolySynth(Tone.Synth, { oscillator: { type, ...extra }, envelope: env });
  const s = {
    lead: piano ? new Tone.Sampler({ urls: PIANO_URLS, baseUrl: PIANO_BASE, release: 1.8 }) : soft('triangle', { attack: 0.01, decay: 0.4, sustain: 0.25, release: 1.6 }),
    arp: piano ? new Tone.Sampler({ urls: PIANO_URLS, baseUrl: PIANO_BASE, release: 1.2 }) : soft('triangle', { attack: 0.01, decay: 0.35, sustain: 0.1, release: 1 }),
    strings: soft('fatsawtooth', { attack: 1.2, decay: 0.5, sustain: 0.85, release: 2.4 }, { count: 3, spread: 18 }),
    bass: soft('fatsawtooth', { attack: 0.4, decay: 0.4, sustain: 0.85, release: 1.8 }, { count: 2, spread: 10 }),
  };
  s.lead.volume.value = bg ? -9 : -5;     s.lead.connect(fx.leadLp);
  s.arp.volume.value = -11;               s.arp.connect(fx.arpLp);
  s.strings.volume.value = -22;           s.strings.connect(fx.vibrato);
  s.bass.volume.value = -17;              s.bass.connect(fx.celloLp);
  Object.assign(s, fx);   // so disposeAudio cleans the effect nodes up with the voices
  // The seed's tone settings (see seed.js), applied each time a track is built: how bright the piano and the strings are, and how much
  // the strings' vibrato moves. They stay within a warm, chamber-music range.
  const feel = v => {
    fx.leadLp.frequency.value = bg ? 3000 : v.of('lead-tone', [4200, 5500, 7000]);
    fx.arpLp.frequency.value = v.of('arp-tone', [2200, 2800, 3600]);
    fx.stringLp.frequency.value = v.of('string-tone', [1400, 1700, 2100]);
    fx.vibrato.depth.value = v.of('vibrato', [0.06, 0.1, 0.16]);
  };
  return { s, group, out, feel };
}
