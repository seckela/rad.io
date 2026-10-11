// The dubstep voices, all synthesized (nothing downloads): a sub sine, the wobble bass (a saw through a low-pass filter whose cutoff is
// (see audio/play.js) with each note, then distorted), short saw chord stabs, a soft pad and a lead
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
    fx.stabLp = new Tone.Filter(2200, 'lowpass').connect(duckPad);
    // The growl: an FM saw (rich in harmonics), high-passed so the sub layer carries the low end, heavily distorted, then pushed through
    // two resonant band-pass filters that audio/play.js sweeps against each other with LFOs, which makes the vowel-like "yoi" of a
    // dubstep bass, mixed with some of the unfiltered distortion for bite, and squashed by a compressor.
    fx.wobHp = new Tone.Filter(90, 'highpass');
    fx.wobDist = new Tone.Distortion({ distortion: 0.45, wet: 1 });
    fx.wobBpA = new Tone.Filter({ frequency: 400, type: 'lowpass', rolloff: -24, Q: 4 });   // a classic resonant wub sweep
    fx.wobBpB = new Tone.Filter({ frequency: 1500, type: 'bandpass', Q: 3 });
    fx.wobBody = new Tone.Gain(0.08);
    fx.wobPost = new Tone.Distortion({ distortion: 0.15, wet: 0.4 });   // a second stage of grit after the filters
    fx.wobMix = new Tone.Gain(0.6);
    fx.wobComp = new Tone.Compressor({ threshold: -24, ratio: 6, attack: 0.003, release: 0.1 }).connect(duckBass);
    fx.wobHp.connect(fx.wobDist);
    fx.wobDist.connect(fx.wobBpA); fx.wobDist.connect(fx.wobBpB); fx.wobDist.connect(fx.wobBody);
    fx.wobBpA.connect(fx.wobMix); fx.wobBpB.connect(fx.wobMix); fx.wobBody.connect(fx.wobMix);
    fx.wobLp = new Tone.Filter(1800, 'lowpass');   // a ceiling so it stays dark and heavy
    fx.wobMix.connect(fx.wobPost); fx.wobPost.connect(fx.wobLp); fx.wobLp.connect(fx.wobComp);
    // The sharp high tones: a bright FM square with a quick pitch dive, high-passed and lightly distorted, with a short echo.
    fx.zapEcho = new Tone.FeedbackDelay({ delayTime: '8n.', feedback: 0.3, wet: 0.25 }).connect(group.accent);
    fx.zapDist = new Tone.Distortion({ distortion: 0.3, wet: 0.5 }).connect(fx.zapEcho);
    fx.zapHp = new Tone.Filter(1200, 'highpass').connect(fx.zapDist);
    fx.riserBp = new Tone.Filter(400, 'bandpass', -12);
    fx.riserBp.Q.value = 2;
    fx.riserBp.connect(group.accent);
    fx.impactLp = new Tone.Filter(900, 'lowpass').connect(group.accent);
    fx.hatHp = new Tone.Filter(7500, 'highpass').connect(group.perc);
    fx.snareBp = new Tone.Filter(1800, 'bandpass').connect(group.perc);
    fx.clickHp = new Tone.Filter(3000, 'highpass').connect(group.perc);
    fx.clapBp = new Tone.Filter(1100, 'bandpass').connect(group.perc);
    Object.assign(s, {
      pad: new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'fatsawtooth', count: 3, spread: 35 },
        envelope: { attack: 0.4, decay: 0.4, sustain: 0.8, release: 1 },
      }),
      stab: new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sawtooth' },
        envelope: { attack: 0.003, decay: 0.2, sustain: 0.1, release: 0.15 },
      }),
      zap: new Tone.FMSynth({
        harmonicity: 2.5, modulationIndex: 12, oscillator: { type: 'square' }, modulation: { type: 'sawtooth' },
        envelope: { attack: 0.002, decay: 0.12, sustain: 0.25, release: 0.12 }, modulationEnvelope: { attack: 0.002, decay: 0.2, sustain: 0.3, release: 0.1 },
      }),
      sub: new Tone.Synth({ oscillator: { type: 'sine' }, envelope: { attack: 0.01, decay: 0.1, sustain: 1, release: 0.15 } }),
      wob: new Tone.FMSynth({
        harmonicity: 1, modulationIndex: 9, oscillator: { type: 'sawtooth' }, modulation: { type: 'square' },
        envelope: { attack: 0.004, decay: 0.1, sustain: 1, release: 0.05 }, modulationEnvelope: { attack: 0.004, decay: 0.1, sustain: 1, release: 0.05 },
      }),
      riserNoise: new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.05, decay: 0.1, sustain: 1, release: 0.1 } }),
      riserTone: new Tone.Synth({ oscillator: { type: 'sawtooth' }, envelope: { attack: 0.1, decay: 0.1, sustain: 1, release: 0.1 } }),
      impact: new Tone.MembraneSynth({ pitchDecay: 0.25, octaves: 5, envelope: { attack: 0.001, decay: 1.2, sustain: 0, release: 0.4 } }),
      impactNoise: new Tone.NoiseSynth({ noise: { type: 'pink' }, envelope: { attack: 0.001, decay: 0.9, sustain: 0, release: 0.2 } }),
      kick: new Tone.MembraneSynth({ pitchDecay: 0.03, octaves: 8, envelope: { attack: 0.001, decay: 0.4, sustain: 0, release: 0.1 } }),
      kickClick: new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.0005, decay: 0.012, sustain: 0 } }),
      clap: new Tone.NoiseSynth({ noise: { type: 'pink' }, envelope: { attack: 0.001, decay: 0.14, sustain: 0 } }),
      snare: new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.2, sustain: 0 } }),
      snareBody: new Tone.Synth({ oscillator: { type: 'triangle' }, envelope: { attack: 0.001, decay: 0.12, sustain: 0, release: 0.05 } }),
      hat: new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.04, sustain: 0 } }),
      ohat: new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.002, decay: 0.16, sustain: 0 } }),
    });
    s.pad.maxPolyphony = 6; s.stab.maxPolyphony = 6;
    s.pad.volume.value = -22;        s.pad.connect(fx.padLp);
    s.stab.volume.value = -22;       s.stab.connect(fx.stabLp);
    s.zap.volume.value = -21;        s.zap.connect(fx.zapHp);
    s.sub.volume.value = -7;         s.sub.connect(duckBass);
    s.wob.volume.value = -15;        s.wob.connect(fx.wobHp);
    s.riserNoise.volume.value = -20; s.riserNoise.connect(fx.riserBp);
    s.riserTone.volume.value = -26;  s.riserTone.connect(group.accent);
    s.impact.volume.value = -3;      s.impact.connect(group.accent);
    s.impactNoise.volume.value = -14; s.impactNoise.connect(fx.impactLp);
    s.kick.volume.value = -1;        s.kick.connect(group.perc);
    s.kickClick.volume.value = -12;  s.kickClick.connect(fx.clickHp);
    s.clap.volume.value = -8;        s.clap.connect(fx.clapBp);
    s.snare.volume.value = -5;       s.snare.connect(fx.snareBp);
    s.snareBody.volume.value = -5;   s.snareBody.connect(group.perc);
    s.hat.volume.value = -26;        s.hat.connect(fx.hatHp);
    s.ohat.volume.value = -26;       s.ohat.connect(fx.hatHp);
    s.duckPad = duckPad; s.duckBass = duckBass;
  }
  Object.assign(s, fx);   // so disposeAudio cleans the effect nodes up with the voices
  return { s, group, out };
}
