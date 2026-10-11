// The trance voices, all synthesized (nothing downloads): a punchy kick, a clap, open hats, a rolling filtered-saw bass, a big
// supersaw pad, a short pluck for the arpeggio, and a supersaw lead with a long dotted echo. The kick dips the pad, the pluck and
// the bass on every beat (see audio/play.js) for the pump. The background track (the canon echo) only has the lead.
export function buildTranceTrack(reverb, bg, dryOut) {
  const out = new Tone.PanVol(bg ? 0.3 : 0, bg ? -6 : 0).connect(reverb);
  const group = {};
  for (const name of ['lead', 'bass', 'pad', 'accent', 'perc']) group[name] = new Tone.Volume(0).connect(out);
  const fx = {};
  if (!bg && dryOut) {          // drums skip most of the reverb so they keep their punch
    group.perc.disconnect();
    group.perc.connect(dryOut);
    group.perc.connect(new Tone.Gain(0.25).connect(reverb));
  }

  const duckPad = new Tone.Gain(1).connect(group.pad), duckBass = new Tone.Gain(1).connect(group.bass);
  fx.padChorus = new Tone.Chorus({ frequency: 0.4, delayTime: 4, depth: 0.6, wet: 0.5 }).connect(duckPad);
  fx.padChorus.start();
  fx.padLp = new Tone.Filter(3200, 'lowpass').connect(fx.padChorus);
  fx.pluckEcho = new Tone.FeedbackDelay({ delayTime: '8n.', feedback: 0.35, wet: 0.3 }).connect(duckPad);
  fx.pluckLp = new Tone.Filter(3000, 'lowpass').connect(fx.pluckEcho);
  fx.leadEcho = new Tone.FeedbackDelay({ delayTime: '8n.', feedback: 0.45, wet: bg ? 0.15 : 0.35 }).connect(group.lead);
  fx.leadLp = new Tone.Filter(bg ? 2500 : 3600, 'lowpass').connect(fx.leadEcho);

  const s = {
    pad: new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'fatsawtooth', count: 5, spread: 40 },
      envelope: { attack: 0.15, decay: 0.4, sustain: 0.75, release: 1.2 },
    }),
    pluck: new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.002, decay: 0.12, sustain: 0.05, release: 0.08 },
    }),
    bass: new Tone.MonoSynth({
      oscillator: { type: 'sawtooth' },
      filter: { Q: 2, type: 'lowpass', rolloff: -24 },
      envelope: { attack: 0.003, decay: 0.1, sustain: 0.5, release: 0.05 },
      filterEnvelope: { attack: 0.003, decay: 0.1, sustain: 0.3, release: 0.08, baseFrequency: 90, octaves: 2.8 },
    }),
    lead: new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'fatsawtooth', count: 4, spread: 30 },
      envelope: { attack: 0.014, decay: 0.28, sustain: 0.75, release: 0.8 },
    }),
    digit: new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'square' }, envelope: { attack: 0.001, decay: 0.07, sustain: 0, release: 0.07 },
    }),
    bell: new Tone.PolySynth(Tone.FMSynth, {
      harmonicity: 3.01, modulationIndex: 10,
      envelope: { attack: 0.001, decay: 0.9, sustain: 0, release: 0.6 },
      modulationEnvelope: { attack: 0.001, decay: 0.5, sustain: 0, release: 0.3 },
    }),
  };
  s.pad.volume.value = -19;     s.pad.connect(fx.padLp);
  s.pluck.volume.value = -22;   s.pluck.connect(fx.pluckLp);
  s.bass.volume.value = -9;     s.bass.connect(duckBass);
  s.lead.volume.value = bg ? -17 : -8;   s.lead.connect(fx.leadLp);
  s.digit.volume.value = -19;   s.digit.connect(group.accent);
  s.bell.volume.value = -22;    s.bell.connect(group.accent);
  s.duckPad = duckPad; s.duckBass = duckBass;

  if (!bg) {
    fx.ohatHp = new Tone.Filter(7000, 'highpass').connect(group.perc);
    fx.clapBp = new Tone.Filter(1500, 'bandpass').connect(group.perc);
    s.kick = new Tone.MembraneSynth({ pitchDecay: 0.05, octaves: 6, envelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.1 } });
    s.ohat = new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.002, decay: 0.14, sustain: 0 } });
    s.snare = new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.002, decay: 0.16, sustain: 0 } });   // the clap and the roll
    s.kick.volume.value = -3;     s.kick.connect(group.perc);
    s.ohat.volume.value = -23;    s.ohat.connect(fx.ohatHp);
    s.snare.volume.value = -9;    s.snare.connect(fx.clapBp);
  }
  Object.assign(s, fx);   // so disposeAudio cleans the effect nodes up with the voices
  return { s, group, out };
}
