// The ambient voices: slow, soft and wide. Everything fades in and out over seconds (no attacks to speak of), the
// chords are detuned triangle waves through a dark lowpass and a slow chorus, the lead is a soft sine with a long
// echo, the bass is a sine drone, the bells are long FM chimes, and now and then a gust of soft wind chimes passes through. A big reverb (see engine.js) does the rest.
// There are no drums. The background track (the canon echo) has only the melodic voices.
export function buildAmbientTrack(reverb, bg) {
  const out = new Tone.PanVol(bg ? 0.3 : 0, bg ? -6 : 0).connect(reverb);
  const group = {};
  for (const name of ['lead', 'bass', 'pad', 'accent', 'perc']) group[name] = new Tone.Volume(0).connect(out);
  const fx = {};

  fx.padLp = new Tone.Filter(1100, 'lowpass').connect(group.pad);
  fx.chorus = new Tone.Chorus({ frequency: 0.2, delayTime: 6, depth: 0.6, wet: 0.5 }).connect(fx.padLp);
  fx.chorus.start();
  fx.echo = new Tone.FeedbackDelay({ delayTime: '4n.', feedback: 0.45, wet: 0.3 }).connect(group.lead);
  fx.leadLp = new Tone.Filter(2400, 'lowpass').connect(fx.echo);

  const s = {
    pad: new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'fattriangle', count: 3, spread: 25 },
      envelope: { attack: 3, decay: 1, sustain: 0.8, release: 6 },
    }),
    lead: new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: { attack: 0.5, decay: 1, sustain: 0.6, release: 3 },
    }),
    bass: new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: { attack: 3, decay: 1, sustain: 0.9, release: 5 },
    }),
    bell: new Tone.PolySynth(Tone.FMSynth, {
      harmonicity: 3.01, modulationIndex: 6,
      envelope: { attack: 0.01, decay: 3, sustain: 0, release: 3 },
      modulationEnvelope: { attack: 0.01, decay: 2, sustain: 0, release: 2 },
    }),
    chime: new Tone.PolySynth(Tone.FMSynth, {          // glassy, slightly inharmonic: like thin metal tubes
      harmonicity: 3.5, modulationIndex: 2.5,
      envelope: { attack: 0.002, decay: 4, sustain: 0, release: 3 },
      modulationEnvelope: { attack: 0.002, decay: 1.2, sustain: 0, release: 1 },
    }),
  };
  s.pad.volume.value = -16;                   s.pad.connect(fx.chorus);
  s.lead.volume.value = bg ? -17 : -12;       s.lead.connect(fx.leadLp);
  s.bass.volume.value = -14;                  s.bass.connect(group.bass);
  s.bell.volume.value = -22;                  s.bell.connect(group.accent);
  s.chime.volume.value = -18;                 s.chime.connect(group.accent);
  Object.assign(s, fx);   // so disposeAudio cleans the effect nodes up with the voices
  return { s, group, out };
}
