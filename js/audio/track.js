import { PIANO_BASE, PIANO_URLS } from './samples.js';

// One full set of voices. The background track is quieter, panned a little right,
// has a softer lead, and has no percussion. `chill` swaps in the chillstep sounds:
// electric-piano lead with a dotted echo, recorded bass and piano chords (synth fallbacks), deep kick, soft snare.
export function buildTrack(reverb, bg, chill, piano, dryOut, bassSamples) {
  const out = new Tone.PanVol(bg ? 0.3 : 0, bg ? -6 : 0).connect(reverb);
  const group = {};
  for (const name of ['lead', 'bass', 'pad', 'accent', 'perc']) {
    group[name] = new Tone.Volume(0).connect(out);
  }
  let leadDst = bg ? new Tone.Filter(piano ? 3500 : 1800, 'lowpass').connect(group.lead) : group.lead;
  if (piano && !bg) leadDst = new Tone.Filter(chill ? 2800 : 5500, 'lowpass').connect(group.lead);   // take the edge off
  if (chill && !bg) {
    const echo = new Tone.FeedbackDelay({ delayTime: '8n.', feedback: 0.25, wet: 0.15 }).connect(group.lead);
    leadDst = new Tone.Filter(piano ? 2800 : 3500, 'lowpass').connect(echo);
  }
  // Pad and bass go through gains the kick briefly dips in chillstep (a simple sidechain duck), so the
  // drums stay present against the sustained tones.
  const duckPad = new Tone.Gain(1).connect(group.pad), duckBass = new Tone.Gain(1).connect(group.bass);
  const padFilter = new Tone.Filter(chill ? 1200 : 1400, 'lowpass').connect(duckPad);
  if (chill && !bg && dryOut) {
    // Drums skip most of the big chillstep reverb so they keep their punch.
    group.perc.disconnect();
    group.perc.connect(dryOut);
    group.perc.connect(new Tone.Gain(0.3).connect(reverb));
  }

  const s = {
    lead: piano
      ? new Tone.Sampler({ urls: PIANO_URLS, baseUrl: PIANO_BASE, release: 1.5 })
      : chill && !bg
      ? new Tone.PolySynth(Tone.FMSynth, {
          harmonicity: 2, modulationIndex: 1, oscillator: { type: 'sine' },
          envelope: { attack: 0.01, decay: 0.8, sustain: 0.2, release: 1.5 },
          modulationEnvelope: { attack: 0.005, decay: 0.4, sustain: 0.1, release: 0.5 },
        })
      : new Tone.PolySynth(Tone.Synth, {
          oscillator: { type: bg ? 'sine' : 'triangle' },
          envelope: { attack: 0.01, decay: 0.12, sustain: 0.35, release: 0.25 },
        }),
    bass: chill && bassSamples
      ? new Tone.Sampler({ urls: bassSamples, attack: 0.4, release: 1.6 })   // slow fade in and out: no pluck, no hard cut
      : new Tone.PolySynth(Tone.Synth, {
          oscillator: { type: 'sine' },
          envelope: chill ? { attack: 0.08, decay: 0.4, sustain: 0.5, release: 0.8 }
                          : { attack: 0.02, decay: 0.2, sustain: 0.6, release: 0.4 },
        }),
    pad: chill && piano
      ? new Tone.Sampler({ urls: PIANO_URLS, baseUrl: PIANO_BASE, attack: 0.12, release: 2 })
      : new Tone.PolySynth(Tone.Synth, chill
      ? { oscillator: { type: 'fattriangle', count: 3, spread: 18 },
          envelope: { attack: 0.9, decay: 0.6, sustain: 0.7, release: 3 } }
      : { oscillator: { type: 'sawtooth' },
          envelope: { attack: 0.15, decay: 0.3, sustain: 0.5, release: 1.2 } }),
    digit: new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: chill ? 'sine' : 'square' },
      envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.1 },
    }),
    bell: new Tone.PolySynth(Tone.FMSynth, {
      harmonicity: 3.01, modulationIndex: 12,
      envelope: { attack: 0.001, decay: 0.7, sustain: 0, release: 0.5 },
      modulationEnvelope: { attack: 0.001, decay: 0.4, sustain: 0, release: 0.3 },
    }),
  };
  s.lead.volume.value = piano ? (bg ? -8 : -4) : chill && !bg ? -10 : -8;   s.lead.connect(leadDst);
  s.bass.volume.value = chill ? (bassSamples ? -17 : -14) : -10;
  if (chill && bassSamples) s.bass.connect(new Tone.Filter(380, 'lowpass').connect(duckBass));   // warm and round, no horn-like upper harmonics
  else s.bass.connect(duckBass);
  s.duckPad = duckPad; s.duckBass = duckBass;
  s.pad.volume.value = chill ? (piano ? -9 : -19) : -20;  s.pad.connect(padFilter);
  s.digit.volume.value = -16;                      s.digit.connect(group.accent);
  s.bell.volume.value = chill ? -22 : -18;         s.bell.connect(group.accent);
  if (!bg) {
    const hatFilter = new Tone.Filter(chill ? 8000 : 7000, 'highpass').connect(group.perc);
    const snrFilter = chill ? new Tone.Filter(1800, 'bandpass').connect(group.perc)
                            : new Tone.Filter(1800, 'highpass').connect(group.perc);
    s.kick = chill
      ? new Tone.MembraneSynth({ pitchDecay: 0.08, octaves: 6, envelope: { attack: 0.001, decay: 0.45, sustain: 0, release: 0.3 } })
      : new Tone.MembraneSynth({ pitchDecay: 0.04, octaves: 5 });
    s.hat = new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.001, decay: chill ? 0.03 : 0.04, sustain: 0 } });
    s.snare = new Tone.NoiseSynth({ noise: { type: 'pink' }, envelope: { attack: 0.001, decay: chill ? 0.28 : 0.14, sustain: 0 } });
    s.kick.volume.value = chill ? -11 : -4;  s.kick.connect(group.perc);
    s.hat.volume.value = chill ? -20 : -22;  s.hat.connect(hatFilter);      // chillstep hats/snare were ~30 dB under the kick
    s.snare.volume.value = chill ? 0 : -18;  s.snare.connect(snrFilter);
  }
  return { s, group, out };
}
