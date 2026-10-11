// The synthwave voices, all synthesized (nothing downloads): a bright detuned saw lead with a dotted echo and chorus, a wide
// detuned saw pad through a dark lowpass, a plucky filtered saw bass, a punchy kick, and a snare with a clap-like noise layer
// into the track's reverb. The background track (the canon echo) only has the melodic voices.
export function buildSynthwaveTrack(reverb, bg) {
  const out = new Tone.PanVol(bg ? 0.3 : 0, bg ? -6 : 0).connect(reverb);
  const group = {};
  for (const name of ['lead', 'bass', 'pad', 'accent', 'perc']) group[name] = new Tone.Volume(0).connect(out);
  const fx = {};

  fx.chorus = new Tone.Chorus({ frequency: 0.6, delayTime: 3.5, depth: 0.5, wet: 0.5 }).connect(group.lead);
  fx.chorus.start();
  fx.echo = new Tone.FeedbackDelay({ delayTime: '8n.', feedback: 0.35, wet: bg ? 0.1 : 0.25 }).connect(fx.chorus);
  fx.leadLp = new Tone.Filter(bg ? 2200 : 4000, 'lowpass').connect(fx.echo);
  fx.padLp = new Tone.Filter(1500, 'lowpass').connect(group.pad);
  fx.padChorus = new Tone.Chorus({ frequency: 0.3, delayTime: 5, depth: 0.6, wet: 0.5 }).connect(fx.padLp);
  fx.padChorus.start();

  const s = {
    lead: new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'fatsawtooth', count: 3, spread: 22 },
      envelope: { attack: 0.01, decay: 0.25, sustain: 0.55, release: 0.5 },
    }),
    pad: new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'fatsawtooth', count: 3, spread: 30 },
      envelope: { attack: 0.5, decay: 0.6, sustain: 0.7, release: 1.8 },
    }),
    bass: new Tone.MonoSynth({
      oscillator: { type: 'sawtooth' },
      filter: { Q: 2, type: 'lowpass', rolloff: -24 },
      envelope: { attack: 0.004, decay: 0.12, sustain: 0.55, release: 0.05 },
      filterEnvelope: { attack: 0.004, decay: 0.14, sustain: 0.3, release: 0.1, baseFrequency: 160, octaves: 2.6 },
    }),
    digit: new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'square' }, envelope: { attack: 0.001, decay: 0.08, sustain: 0, release: 0.08 },
    }),
    bell: new Tone.PolySynth(Tone.FMSynth, {
      harmonicity: 3.01, modulationIndex: 10,
      envelope: { attack: 0.001, decay: 0.9, sustain: 0, release: 0.6 },
      modulationEnvelope: { attack: 0.001, decay: 0.5, sustain: 0, release: 0.3 },
    }),
  };
  s.lead.volume.value = bg ? -17 : -11;   s.lead.connect(fx.leadLp);
  s.pad.volume.value = -19;               s.pad.connect(fx.padChorus);
  s.bass.volume.value = -9;               s.bass.connect(group.bass);
  s.digit.volume.value = -19;             s.digit.connect(group.accent);
  s.bell.volume.value = -22;              s.bell.connect(group.accent);

  if (!bg) {
    fx.hatHp = new Tone.Filter(7500, 'highpass').connect(group.perc);
    fx.snrBp = new Tone.Filter(2000, 'bandpass').connect(group.perc);
    s.kick = new Tone.MembraneSynth({ pitchDecay: 0.04, octaves: 5, envelope: { attack: 0.001, decay: 0.28, sustain: 0, release: 0.1 } });
    s.hat = new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.035, sustain: 0 } });
    s.snare = new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.2, sustain: 0 } });
    s.snareBody = new Tone.Synth({ oscillator: { type: 'triangle' }, envelope: { attack: 0.001, decay: 0.12, sustain: 0, release: 0.05 } });
    s.kick.volume.value = -6;       s.kick.connect(group.perc);
    s.hat.volume.value = -22;       s.hat.connect(fx.hatHp);
    s.snare.volume.value = -8;      s.snare.connect(fx.snrBp);
    s.snareBody.volume.value = -16; s.snareBody.connect(group.perc);
  }
  Object.assign(s, fx);   // so disposeAudio cleans the effect nodes up with the voices
  return { s, group, out };
}
