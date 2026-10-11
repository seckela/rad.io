// The techno / house voices, all synthesized (nothing downloads): a punchy kick, a clap, closed and open hats, a short filtered
// saw bass, chord stabs, and a plucky lead with a dotted echo. The bass and the stabs go through gains that the kick dips on every
// beat (see audio/play.js), which gives the pumping, sidechained feel. The background track (the canon echo) only has the lead.
export function buildHouseTrack(reverb, bg, dryOut) {
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
  fx.stabEcho = new Tone.FeedbackDelay({ delayTime: '8n.', feedback: 0.3, wet: 0.2 }).connect(duckPad);
  fx.stabLp = new Tone.Filter(2400, 'lowpass').connect(fx.stabEcho);
  fx.leadEcho = new Tone.FeedbackDelay({ delayTime: '8n.', feedback: 0.3, wet: bg ? 0.1 : 0.25 }).connect(group.lead);
  fx.leadLp = new Tone.Filter(bg ? 2200 : 3500, 'lowpass').connect(fx.leadEcho);

  const s = {
    pad: new Tone.PolySynth(Tone.Synth, {                     // the chord stabs
      oscillator: { type: 'fatsawtooth', count: 2, spread: 14 },
      envelope: { attack: 0.003, decay: 0.2, sustain: 0.05, release: 0.12 },
    }),
    bass: new Tone.MonoSynth({
      oscillator: { type: 'sawtooth' },
      filter: { Q: 2, type: 'lowpass', rolloff: -24 },
      envelope: { attack: 0.003, decay: 0.18, sustain: 0.4, release: 0.06 },
      filterEnvelope: { attack: 0.003, decay: 0.16, sustain: 0.2, release: 0.1, baseFrequency: 110, octaves: 2.4 },
    }),
    lead: new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'pulse', width: 0.3 },
      envelope: { attack: 0.002, decay: 0.14, sustain: 0.08, release: 0.1 },
    }),
    digit: new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'square' }, envelope: { attack: 0.001, decay: 0.07, sustain: 0, release: 0.07 },
    }),
    bell: new Tone.PolySynth(Tone.FMSynth, {
      harmonicity: 3.01, modulationIndex: 10,
      envelope: { attack: 0.001, decay: 0.8, sustain: 0, release: 0.5 },
      modulationEnvelope: { attack: 0.001, decay: 0.4, sustain: 0, release: 0.3 },
    }),
  };
  s.pad.volume.value = -14;     s.pad.connect(fx.stabLp);
  s.bass.volume.value = -8;     s.bass.connect(duckBass);
  s.lead.volume.value = bg ? -17 : -12;   s.lead.connect(fx.leadLp);
  s.digit.volume.value = -19;   s.digit.connect(group.accent);
  s.bell.volume.value = -22;    s.bell.connect(group.accent);
  s.duckPad = duckPad; s.duckBass = duckBass;

  if (!bg) {
    fx.hatHp = new Tone.Filter(8500, 'highpass').connect(group.perc);
    fx.ohatHp = new Tone.Filter(7000, 'highpass').connect(group.perc);
    fx.clapBp = new Tone.Filter(1500, 'bandpass').connect(group.perc);
    s.kick = new Tone.MembraneSynth({ pitchDecay: 0.05, octaves: 6, envelope: { attack: 0.001, decay: 0.32, sustain: 0, release: 0.1 } });
    s.hat = new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.03, sustain: 0 } });
    s.ohat = new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.002, decay: 0.14, sustain: 0 } });
    s.snare = new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.002, decay: 0.16, sustain: 0 } });   // the clap
    s.kick.volume.value = -3;     s.kick.connect(group.perc);
    s.hat.volume.value = -23;     s.hat.connect(fx.hatHp);
    s.ohat.volume.value = -24;    s.ohat.connect(fx.ohatHp);
    s.snare.volume.value = -9;    s.snare.connect(fx.clapBp);
  }
  Object.assign(s, fx);   // so disposeAudio cleans the effect nodes up with the voices
  return { s, group, out };
}
