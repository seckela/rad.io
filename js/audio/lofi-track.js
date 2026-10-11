import { PIANO_BASE, PIANO_URLS } from './samples.js';

// One full set of Lo-fi voices (see compose/lofi.js for the notes they play). The sound is warm and a little
// degraded: the piano and chords go through a gentle tape wobble, a touch of saturation and a dark lowpass,
// the bass is short, round and dark, the drums are soft and filtered, and quiet crackle pops sit over the top.
// The background track (the canon echo) only has the melodic voices.
export function buildLofiTrack(reverb, bg, piano, bassSamples) {
  const out = new Tone.PanVol(bg ? 0.3 : 0, bg ? -6 : 0).connect(reverb);
  const group = {};
  for (const name of ['lead', 'bass', 'pad', 'accent', 'perc']) group[name] = new Tone.Volume(0).connect(out);
  const fx = {};

  // Tape: piano, chords and bells share a slow pitch wobble, a little saturation and a dark top end.
  fx.warm = new Tone.Filter(4200, 'lowpass').connect(out);
  fx.sat = new Tone.Distortion({ distortion: 0.1, wet: 0.25 }).connect(fx.warm);
  fx.wobble = new Tone.Vibrato({ frequency: 0.45, depth: 0.07 }).connect(fx.sat);
  for (const name of ['lead', 'pad', 'accent']) { group[name].disconnect(); group[name].connect(fx.wobble); }
  fx.bassLp = new Tone.Filter(320, 'lowpass').connect(out);
  group.bass.disconnect(); group.bass.connect(fx.bassLp);
  fx.drumLp = new Tone.Filter(6500, 'lowpass').connect(out);
  group.perc.disconnect(); group.perc.connect(fx.drumLp);

  const epiano = () => new Tone.PolySynth(Tone.FMSynth, {
    harmonicity: 3, modulationIndex: 1.2, oscillator: { type: 'sine' },
    envelope: { attack: 0.005, decay: 1.2, sustain: 0.15, release: 1.2 },
    modulationEnvelope: { attack: 0.002, decay: 0.5, sustain: 0.1, release: 0.5 },
  });
  const s = {
    lead: piano ? new Tone.Sampler({ urls: PIANO_URLS, baseUrl: PIANO_BASE, release: 1.2 }) : epiano(),
    pad: piano ? new Tone.Sampler({ urls: PIANO_URLS, baseUrl: PIANO_BASE, attack: 0.03, release: 1.6 }) : epiano(),
    bass: bassSamples
      ? new Tone.Sampler({ urls: bassSamples, attack: 0.02, release: 0.6 })
      : new Tone.PolySynth(Tone.Synth, { oscillator: { type: 'sine' }, envelope: { attack: 0.03, decay: 0.3, sustain: 0.4, release: 0.5 } }),
    digit: new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' }, envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.1 },
    }),
    bell: new Tone.PolySynth(Tone.FMSynth, {
      harmonicity: 3.01, modulationIndex: 12,
      envelope: { attack: 0.001, decay: 0.7, sustain: 0, release: 0.5 },
      modulationEnvelope: { attack: 0.001, decay: 0.4, sustain: 0, release: 0.3 },
    }),
  };
  fx.leadLp = new Tone.Filter(2600, 'lowpass').connect(group.lead);
  fx.padLp = new Tone.Filter(1800, 'lowpass').connect(group.pad);
  s.lead.volume.value = piano ? (bg ? -8 : -5) : -10;   s.lead.connect(fx.leadLp);
  s.pad.volume.value = piano ? -10 : -19;               s.pad.connect(fx.padLp);
  s.bass.volume.value = bassSamples ? -13 : -12;        s.bass.connect(group.bass);
  s.digit.volume.value = -16;                           s.digit.connect(group.accent);
  s.bell.volume.value = -24;                            s.bell.connect(group.accent);

  if (!bg) {
    fx.hatHp = new Tone.Filter(5500, 'highpass').connect(group.perc);
    fx.snrBp = new Tone.Filter(1900, 'bandpass').connect(group.perc);
    fx.crackleHp = new Tone.Filter(2200, 'highpass').connect(group.perc);
    s.kick = new Tone.MembraneSynth({ pitchDecay: 0.05, octaves: 5, envelope: { attack: 0.002, decay: 0.38, sustain: 0, release: 0.2 } });
    s.hat = new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.03, sustain: 0 } });
    s.snare = new Tone.NoiseSynth({ noise: { type: 'pink' }, envelope: { attack: 0.001, decay: 0.2, sustain: 0 } });
    s.snareBody = new Tone.Synth({ oscillator: { type: 'triangle' }, envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.05 } });
    s.crackle = new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.006, sustain: 0 } });
    s.kick.volume.value = -9;       s.kick.connect(group.perc);
    s.hat.volume.value = -22;       s.hat.connect(fx.hatHp);
    s.snare.volume.value = -4;      s.snare.connect(fx.snrBp);
    s.snareBody.volume.value = -17; s.snareBody.connect(group.perc);
    s.crackle.volume.value = -26;   s.crackle.connect(fx.crackleHp);
  }
  Object.assign(s, fx);   // so disposeAudio cleans the effect nodes up with the voices
  // The seed's tone settings (see seed.js), applied each time a track is built: how dark the tape is, how much it wobbles and
  // saturates, how soft the piano and chords are, and how loud the crackle is. They stay within a warm, dusty range.
  const feel = v => {
    fx.warm.frequency.value = v.of('warm', [3200, 4200, 5000, 3800]);
    fx.wobble.depth.value = v.of('wobble', [0.04, 0.07, 0.1, 0.13]);
    fx.sat.wet.value = v.of('sat', [0.15, 0.25, 0.4]);
    fx.leadLp.frequency.value = v.of('lead-tone', [1900, 2600, 3400]);
    fx.padLp.frequency.value = v.of('pad-tone', [1400, 1800, 2400]);
    if (s.crackle) s.crackle.volume.value = v.of('crackle', [-31, -26, -22]);
  };
  return { s, group, out, feel };
}
