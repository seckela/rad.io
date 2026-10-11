// The cinematic voices: a lively violin (sampled; synth saws if the samples can't be loaded) for the melody, a cello (sampled, with the
// same fallback) for the drone, the driving ostinato and the low charging line, a sine sub under the drone, a synthesized string section for the
// swells, and synthesized percussion: a deep taiko-like boom, a snare for the roll, a riser (swept noise and a rising tone) and a huge
// impact for the climax. A big hall reverb (see engine.js) holds it together. The background track (the canon echo) has only the melody.
export function buildCineTrack(reverb, bg, samples) {
  const violin = samples && samples.violin, cello = samples && samples.cello;
  const out = new Tone.PanVol(bg ? 0.3 : 0, bg ? -6 : 0).connect(reverb);
  const group = {};
  for (const name of ['lead', 'bass', 'pad', 'accent', 'perc']) group[name] = new Tone.Volume(0).connect(out);
  const fx = {};

  fx.violinLp = new Tone.Filter(violin ? 2800 : 1800, 'lowpass').connect(group.lead);
  fx.chargeLp = new Tone.Filter(cello ? 3000 : 1800, 'lowpass').connect(group.pad);
  fx.arpLp = new Tone.Filter(cello ? 2600 : 1400, 'lowpass').connect(group.pad);
  fx.stringLp = new Tone.Filter(1300, 'lowpass').connect(group.pad);
  fx.vibrato = new Tone.Vibrato({ frequency: 5, depth: 0.1 }).connect(fx.stringLp);
  fx.celloLp = new Tone.Filter(cello ? 1400 : 650, 'lowpass').connect(group.bass);

  const soft = (type, env, extra = {}) => new Tone.PolySynth(Tone.Synth, { oscillator: { type, ...extra }, envelope: env });
  const s = {
    lead: violin ? new Tone.Sampler({ urls: violin, attack: 0.12, release: 0.5 }) : soft('sawtooth', { attack: 0.12, decay: 0.2, sustain: 0.7, release: 0.5 }),
    bass: cello ? new Tone.Sampler({ urls: cello, attack: 0.3, release: 1.0 }) : soft('fatsawtooth', { attack: 0.4, decay: 0.4, sustain: 0.85, release: 1.8 }, { count: 2, spread: 10 }),
    strings: soft('fatsawtooth', { attack: 1.2, decay: 0.5, sustain: 0.85, release: 2.4 }, { count: 3, spread: 18 }),
    sub: soft('sine', { attack: 0.4, decay: 0.3, sustain: 0.9, release: 1.5 }),
    charge: cello ? new Tone.Sampler({ urls: cello, attack: 0.01, release: 0.25 }) : soft('sawtooth', { attack: 0.01, decay: 0.15, sustain: 0.5, release: 0.2 }),
    arp: cello ? new Tone.Sampler({ urls: cello, attack: 0.01, release: 0.35 }) : soft('sawtooth', { attack: 0.01, decay: 0.2, sustain: 0.3, release: 0.3 }),
  };
  s.lead.volume.value = bg ? -15 : -12;   s.lead.connect(fx.violinLp);
  s.bass.volume.value = cello ? -11 : -17; s.bass.connect(fx.celloLp);
  s.strings.volume.value = -25;          s.strings.connect(fx.vibrato);
  s.sub.volume.value = -19;              s.sub.connect(group.bass);
  s.charge.volume.value = cello ? -7 : -17; s.charge.connect(fx.chargeLp);
  s.arp.volume.value = cello ? -9 : -18;   s.arp.connect(fx.arpLp);
  if (!bg) {
    fx.riserBp = new Tone.Filter(400, 'bandpass', -12);
    fx.riserBp.Q.value = 2;
    fx.riserBp.connect(group.accent);
    fx.impactLp = new Tone.Filter(900, 'lowpass').connect(group.accent);
    fx.snareBp = new Tone.Filter(1500, 'bandpass').connect(group.perc);
    Object.assign(s, {
      kick: new Tone.MembraneSynth({ pitchDecay: 0.08, octaves: 3, envelope: { attack: 0.002, decay: 0.9, sustain: 0, release: 0.4 } }),
      snare: new Tone.NoiseSynth({ noise: { type: 'pink' }, envelope: { attack: 0.001, decay: 0.12, sustain: 0 } }),
      impact: new Tone.MembraneSynth({ pitchDecay: 0.25, octaves: 5, envelope: { attack: 0.001, decay: 1.6, sustain: 0, release: 0.6 } }),
      impactNoise: new Tone.NoiseSynth({ noise: { type: 'pink' }, envelope: { attack: 0.001, decay: 1.4, sustain: 0, release: 0.3 } }),
      riserNoise: new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.05, decay: 0.1, sustain: 1, release: 0.1 } }),
      riserTone: new Tone.Synth({ oscillator: { type: 'sawtooth' }, envelope: { attack: 0.1, decay: 0.1, sustain: 1, release: 0.1 } }),
    });
    s.kick.volume.value = -2;                s.kick.connect(group.perc);
    s.snare.volume.value = -10;              s.snare.connect(fx.snareBp);
    s.impact.volume.value = -3;              s.impact.connect(group.accent);
    s.impactNoise.volume.value = -12;        s.impactNoise.connect(fx.impactLp);
    s.riserNoise.volume.value = -20;         s.riserNoise.connect(fx.riserBp);
    s.riserTone.volume.value = -26;          s.riserTone.connect(group.accent);
  }
  Object.assign(s, fx);   // so disposeAudio cleans the effect nodes up with the voices
  // The seed's tone settings (see seed.js), applied each time a track is built: how bright the violin, the cello's lines and the strings are.
  const feel = v => {
    fx.violinLp.frequency.value = violin ? v.of('violin-tone', [2400, 2800, 3400]) : 1800;
    fx.arpLp.frequency.value = cello ? v.of('arp-tone', [2000, 2600, 3300]) : 1400;
    fx.chargeLp.frequency.value = cello ? v.of('charge-tone', [2400, 3000, 3800]) : 1800;
    fx.stringLp.frequency.value = v.of('string-tone', [1100, 1300, 1600]);
  };
  return { s, group, out, feel };
}
