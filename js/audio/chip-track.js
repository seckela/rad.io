// The chiptune voices: everything is a plain square, pulse or triangle wave or a burst of noise, like the
// channels of an old sound chip, and nothing needs a download. The lead is a quarter-width pulse with a
// touch of vibrato on held notes, the arpeggios are a thin pulse, the bass is a triangle, and the drums
// are a short pitch-dropping thump plus filtered noise. The background track (the canon echo) only has the
// melodic voices.
export function buildChipTrack(reverb, bg) {
  const out = new Tone.PanVol(bg ? 0.3 : 0, bg ? -6 : 0).connect(reverb);
  const group = {};
  for (const name of ['lead', 'bass', 'pad', 'accent', 'perc']) group[name] = new Tone.Volume(0).connect(out);
  const fx = {};
  const poly = (osc, env) => new Tone.PolySynth(Tone.Synth, { oscillator: osc, envelope: env });

  const s = {
    lead: poly({ type: 'pulse', width: bg ? 0.5 : 0.25 }, { attack: 0.002, decay: 0.08, sustain: 0.7, release: 0.04 }),
    pad: poly({ type: 'pulse', width: 0.125 }, { attack: 0.001, decay: 0.07, sustain: 0.1, release: 0.03 }),
    bass: poly({ type: 'triangle' }, { attack: 0.002, decay: 0.05, sustain: 0.9, release: 0.03 }),
    digit: poly({ type: 'square' }, { attack: 0.001, decay: 0.06, sustain: 0, release: 0.05 }),
    bell: poly({ type: 'pulse', width: 0.125 }, { attack: 0.001, decay: 0.12, sustain: 0, release: 0.08 }),
  };
  s.lead.volume.value = bg ? -14 : -9;   s.lead.connect(group.lead);
  s.pad.volume.value = -19;              s.pad.connect(group.pad);
  s.bass.volume.value = -8;              s.bass.connect(group.bass);
  s.digit.volume.value = -17;            s.digit.connect(group.accent);
  s.bell.volume.value = -20;             s.bell.connect(group.accent);

  if (!bg) {
    fx.hatHp = new Tone.Filter(7000, 'highpass').connect(group.perc);
    fx.snrBp = new Tone.Filter(2200, 'bandpass').connect(group.perc);
    s.kick = new Tone.MembraneSynth({ pitchDecay: 0.03, octaves: 4, envelope: { attack: 0.001, decay: 0.16, sustain: 0, release: 0.05 } });
    s.hat = new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.025, sustain: 0 } });
    s.snare = new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.11, sustain: 0 } });
    s.kick.volume.value = -6;    s.kick.connect(group.perc);
    s.hat.volume.value = -22;    s.hat.connect(fx.hatHp);
    s.snare.volume.value = -9;   s.snare.connect(fx.snrBp);
  }
  Object.assign(s, fx);   // so disposeAudio cleans the effect nodes up with the voices
  return { s, group, out };
}
