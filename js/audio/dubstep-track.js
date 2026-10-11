// The dubstep voices, all synthesized (nothing downloads): a sub sine, the wobble bass (a saw through a low-pass filter whose cutoff is
// swept by a tempo-synced LFO that audio/play.js starts with each note, then distorted), short saw chord stabs, a soft pad and a lead
// for the intro and build-up, a riser (swept noise plus a rising tone), an impact for the drop, and the drums (a hard kick, a heavy
// snare, hats). The kick ducks the pad, stabs, sub and wobble. The background track (the canon echo) only has the lead.
export function buildDubstepTrack(reverb, bg, dryOut) {
  const out = new Tone.PanVol(bg ? 0.3 : 0, bg ? -6 : 0).connect(reverb);
  const group = {};
  for (const name of ['lead', 'bass', 'pad', 'accent', 'perc']) group[name] = new Tone.Volume(0).connect(out);
  const fx = {};
  if (!bg && dryOut) {          // the drums and the bass skip most of the reverb so they keep their weight
    for (const name of ['perc', 'bass']) {
      group[name].disconnect();
      group[name].connect(dryOut);
      group[name].connect(new Tone.Gain(0.2).connect(reverb));
    }
  }
  fx.leadEcho = new Tone.FeedbackDelay({ delayTime: '8n.', feedback: 0.4, wet: bg ? 0.15 : 0.3 }).connect(group.lead);
  fx.leadLp = new Tone.Filter(bg ? 2500 : 3400, 'lowpass').connect(fx.leadEcho);
  const s = {
    lead: new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'fatsawtooth', count: 3, spread: 30 },
      envelope: { attack: 0.01, decay: 0.25, sustain: 0.7, release: 0.5 },
    }),
  };
  s.lead.maxPolyphony = 5;
  s.lead.volume.value = bg ? -17 : -11;   s.lead.connect(fx.leadLp);

  if (!bg) {
    const duckPad = new Tone.Gain(1).connect(group.pad), duckBass = new Tone.Gain(1).connect(group.bass);
    fx.padLp = new Tone.Filter(2200, 'lowpass').connect(duckPad);
    fx.stabLp = new Tone.Filter(3500, 'lowpass').connect(duckPad);
    fx.wobFilter = new Tone.Filter({ frequency: 200, type: 'lowpass', rolloff: -24, Q: 7 });   // the LFO sweeps this cutoff
    fx.wobDist = new Tone.Distortion({ distortion: 0.55, wet: 0.7 });
    fx.wobFilter.connect(fx.wobDist);
    fx.wobDist.connect(duckBass);
    fx.riserBp = new Tone.Filter(400, 'bandpass', -12);
    fx.riserBp.Q.value = 2;
    fx.riserBp.connect(group.accent);
    fx.impactLp = new Tone.Filter(900, 'lowpass').connect(group.accent);
    fx.hatHp = new Tone.Filter(7500, 'highpass').connect(group.perc);
    fx.snareBp = new Tone.Filter(1800, 'bandpass').connect(group.perc);
    Object.assign(s, {
      pad: new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'fatsawtooth', count: 3, spread: 35 },
        envelope: { attack: 0.4, decay: 0.4, sustain: 0.8, release: 1 },
      }),
      stab: new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sawtooth' },
        envelope: { attack: 0.003, decay: 0.2, sustain: 0.1, release: 0.15 },
      }),
      sub: new Tone.Synth({ oscillator: { type: 'sine' }, envelope: { attack: 0.01, decay: 0.1, sustain: 1, release: 0.15 } }),
      wob: new Tone.Synth({ oscillator: { type: 'fatsawtooth', count: 2, spread: 18 }, envelope: { attack: 0.005, decay: 0.1, sustain: 1, release: 0.05 } }),
      riserNoise: new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.05, decay: 0.1, sustain: 1, release: 0.1 } }),
      riserTone: new Tone.Synth({ oscillator: { type: 'sawtooth' }, envelope: { attack: 0.1, decay: 0.1, sustain: 1, release: 0.1 } }),
      impact: new Tone.MembraneSynth({ pitchDecay: 0.25, octaves: 5, envelope: { attack: 0.001, decay: 1.2, sustain: 0, release: 0.4 } }),
      impactNoise: new Tone.NoiseSynth({ noise: { type: 'pink' }, envelope: { attack: 0.001, decay: 0.9, sustain: 0, release: 0.2 } }),
      kick: new Tone.MembraneSynth({ pitchDecay: 0.04, octaves: 6, envelope: { attack: 0.001, decay: 0.35, sustain: 0, release: 0.1 } }),
      snare: new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.2, sustain: 0 } }),
      snareBody: new Tone.Synth({ oscillator: { type: 'triangle' }, envelope: { attack: 0.001, decay: 0.12, sustain: 0, release: 0.05 } }),
      hat: new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.04, sustain: 0 } }),
      ohat: new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.002, decay: 0.16, sustain: 0 } }),
    });
    s.pad.maxPolyphony = 6; s.stab.maxPolyphony = 6;
    s.pad.volume.value = -22;        s.pad.connect(fx.padLp);
    s.stab.volume.value = -17;       s.stab.connect(fx.stabLp);
    s.sub.volume.value = -6;         s.sub.connect(duckBass);
    s.wob.volume.value = -10;        s.wob.connect(fx.wobFilter);
    s.riserNoise.volume.value = -20; s.riserNoise.connect(fx.riserBp);
    s.riserTone.volume.value = -26;  s.riserTone.connect(group.accent);
    s.impact.volume.value = -3;      s.impact.connect(group.accent);
    s.impactNoise.volume.value = -14; s.impactNoise.connect(fx.impactLp);
    s.kick.volume.value = -2;        s.kick.connect(group.perc);
    s.snare.volume.value = -8;       s.snare.connect(fx.snareBp);
    s.snareBody.volume.value = -9;   s.snareBody.connect(group.perc);
    s.hat.volume.value = -26;        s.hat.connect(fx.hatHp);
    s.ohat.volume.value = -26;       s.ohat.connect(fx.hatHp);
    s.duckPad = duckPad; s.duckBass = duckBass;
  }
  Object.assign(s, fx);   // so disposeAudio cleans the effect nodes up with the voices
  return { s, group, out };
}
