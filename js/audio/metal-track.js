// The rock/metal voices. Guitars are sampled electric guitar notes run through an amp chain
// (boost -> distortion -> mid scoop -> speaker-style rolloff). The rhythm guitar has a palm-muted
// sampler (short release, darker) and a ringing one; the lead has vibrato, lighter distortion and
// a dotted echo. The bass is sampled and the drums are synthesized. Samples are shared between tracks.
export function buildMetalTrack(reverb, bg, bufs) {
  const out = new Tone.PanVol(bg ? 0.3 : 0, bg ? -6 : -3).connect(reverb);
  const group = {};
  for (const name of ['lead', 'bass', 'pad', 'accent', 'perc']) group[name] = new Tone.Volume(0).connect(out);
  group.pad.volume.value = -3;       // rhythm guitar: distortion flattens the level, so set it after the amp
  group.lead.volume.value = -6;      // lead: same reason, and its heavier amp runs hotter

  const amp = new Tone.Gain(2);
  amp.chain(
    new Tone.Filter(90, 'highpass'),
    new Tone.Distortion({ distortion: 0.7, oversample: '4x' }),
    new Tone.EQ3({ low: 2, mid: -5, high: -3, lowFrequency: 250, highFrequency: 3500 }),
    new Tone.Filter(4400, 'lowpass', -24),               // speaker-style rolloff
    group.pad,
  );
  const s = {
    chug: new Tone.Sampler({ urls: bufs.guitar, release: 0.06 }),
    power: new Tone.Sampler({ urls: bufs.guitar, release: 0.7 }),
    lead: new Tone.Sampler({ urls: bufs.guitar, release: 0.6 }),
    run: new Tone.Sampler({ urls: bufs.guitar, release: 0.1 }),      // short-release lead for fast runs
    bass: new Tone.Sampler({ urls: bufs.bass, release: 0.12 }),
  };
  s.chug.chain(new Tone.Filter(1800, 'lowpass'), amp);
  s.power.connect(amp);
  // Vibrato starts at zero; held lead notes fade it in after the attack, like a player would (see sound()).
  const vibrato = new Tone.Vibrato({ frequency: 5.5, depth: 0 });
  s.vibrato = vibrato;
  s.run.connect(vibrato);
  s.lead.chain(
    vibrato,
    new Tone.Gain(2),
    new Tone.Filter(140, 'highpass'),
    new Tone.Distortion({ distortion: 0.8, oversample: '4x' }),
    new Tone.EQ3({ low: -2, mid: 3, high: -4, lowFrequency: 300, highFrequency: 3000 }),
    new Tone.Filter(4400, 'lowpass', -24),                // speaker-style rolloff
    new Tone.FeedbackDelay({ delayTime: '8n.', feedback: 0.22, wet: 0.1 }),
    group.lead,
  );
  s.bass.chain(new Tone.Filter(1200, 'lowpass'), group.bass);
  s.chug.volume.value = -11; s.power.volume.value = -11; s.lead.volume.value = -5; s.run.volume.value = -5; s.bass.volume.value = -7;
  if (!bg) {
    // Drums are layered so they read as a kit rather than a drum machine: a body tone plus a noise or
    // click layer for kick and snare, noise-based hats and crash, a bus compressor, and a short room.
    const bus = new Tone.Compressor({ threshold: -20, ratio: 4, attack: 0.006, release: 0.12 }).connect(group.perc);
    s.room = new Tone.Reverb({ decay: 0.7, wet: 1 }).connect(group.perc);
    const toBus = new Tone.Gain(1).connect(bus);
    toBus.connect(new Tone.Gain(0.22).connect(s.room));
    const hp = (f, to) => new Tone.Filter(f, 'highpass').connect(to);
    const bp = (f, q, to) => new Tone.Filter({ frequency: f, type: 'bandpass', Q: q }).connect(to);

    s.kick = new Tone.MembraneSynth({ pitchDecay: 0.025, octaves: 3.5, envelope: { attack: 0.001, decay: 0.34, sustain: 0, release: 0.08 } });
    s.kickClick = new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.0005, decay: 0.012, sustain: 0 } });
    s.snareBody = new Tone.MembraneSynth({ pitchDecay: 0.012, octaves: 1.5, oscillator: { type: 'triangle' }, envelope: { attack: 0.001, decay: 0.12, sustain: 0, release: 0.05 } });
    s.snare = new Tone.NoiseSynth({ noise: { type: 'pink' }, envelope: { attack: 0.001, decay: 0.2, sustain: 0 } });
    s.hat = new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.035, sustain: 0 } });
    s.crash = new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.004, decay: 1.7, sustain: 0, release: 0.5 } });
    s.crashM = new Tone.MetalSynth({ frequency: 320, envelope: { attack: 0.001, decay: 1.2, release: 0.3 },
      harmonicity: 5.1, modulationIndex: 32, resonance: 4000, octaves: 1.5 });

    s.kick.connect(new Tone.Distortion(0.12).connect(toBus));
    s.kickClick.connect(bp(3000, 0.8, toBus));
    s.snareBody.connect(toBus);
    s.snare.connect(bp(3800, 0.5, hp(1100, toBus)));
    s.hat.connect(hp(8000, toBus));
    s.crash.connect(hp(3500, toBus));
    s.crashM.connect(hp(5000, toBus));
    s.kick.volume.value = -4; s.kickClick.volume.value = -20;
    s.snareBody.volume.value = -14; s.snare.volume.value = -11;
    s.hat.volume.value = -21; s.crash.volume.value = -22; s.crashM.volume.value = -32;
  }
  return { s, group, out };
}
