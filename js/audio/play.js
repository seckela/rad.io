import { audio } from './engine.js';

// Deterministic pseudo-random value in [0, 1), so the "human" variation is the same every time the
// same code is played.
const WOB_DB = -15;   // the dubstep wobble's level (set in audio/dubstep-track.js)
const rnd = x => { const y = Math.sin(x * 12.9898) * 43758.5453; return y - Math.floor(y); };

export function sound(e, time) {
  const { s } = e.tr ? audio.bg : audio.fg;
  const unit = Tone.Time('16n').toSeconds();
  const dur = (e.d || 1) * unit * 0.9;
  const hz = m => Tone.Midi(m).toFrequency();
  let v = e.v;
  if (audio.metal) {
    // Human feel: a few milliseconds of timing drift and a little velocity variation (drums are tighter).
    const r1 = rnd(e.t + (e.m || 0) * 0.37 + (e.tr || 0) * 5.1), r2 = rnd(e.t * 1.7 + (e.m || 0) + 3.3);
    const tight = e.k === 'kick' || e.k === 'snare' || e.k === 'hat' || e.k === 'crash';
    time += (r1 - 0.5) * (tight ? 0.006 : 0.014);
    if (v !== undefined) v = Math.min(1, v * (0.9 + 0.2 * r2));
  }
  if (audio.lofi) {
    // Loose, lazy feel: a few tens of milliseconds of drift (the drums less), a snare that sits a touch behind the
    // beat, and some velocity variation.
    const r1 = rnd(e.t + (e.m || 0) * 0.37 + (e.tr || 0) * 5.1), r2 = rnd(e.t * 1.7 + (e.m || 0) + 3.3);
    const drum = e.k === 'kick' || e.k === 'snare' || e.k === 'hat';
    time += (r1 - 0.5) * (drum ? 0.012 : 0.03) + (e.k === 'snare' ? 0.012 : 0);
    if (v !== undefined) v = Math.min(1, v * (0.85 + 0.3 * r2));
  }
  try {
    switch (e.k) {
      case 'lead':
        if (audio.metal) {                       // held notes get vibrato after a moment; short ones stay straight
          const depth = s.vibrato.depth;
          depth.cancelScheduledValues(time);
          depth.setValueAtTime(0, time);
          if (dur > 0.4) depth.linearRampToValueAtTime(0.22, time + Math.min(dur * 0.8, 0.6));
        }
        // A held-pedal feel for piano: notes ring on past their slot so they blend into the next one.
        s.lead.triggerAttackRelease(hz(e.m), audio.piano ? dur * (audio.chill ? 1.3 : 2) : dur, time, audio.piano ? v * (audio.chill ? 0.7 : 0.85) : v);
        break;
      case 'chug':  s.chug.triggerAttackRelease((e.n === 1 ? [e.m] : [e.m, e.m + 7, e.m + 12]).map(hz), dur * 0.6, time, v); break;
      case 'power': s.power.triggerAttackRelease([e.m, e.m + 7, e.m + 12].map(hz), dur, time, v); break;
      case 'run':
        if (audio.metal) s.vibrato.depth.setValueAtTime(0, time);
        s.run.triggerAttackRelease(hz(e.m), dur * 0.7, time, v);
        break;
      case 'crash':
        s.crash.triggerAttackRelease(1.4, time, v);
        if (s.crashM) s.crashM.triggerAttackRelease('4n', time, v * 0.6);
        break;
      case 'arp':   s.pad.triggerAttackRelease(hz(e.m), dur * 0.8, time, v); break;
      case 'bass':  s.bass.triggerAttackRelease(hz(e.m), dur, time, v); break;
      case 'digit': s.digit.triggerAttackRelease(hz(e.m), dur, time, v); break;
      case 'chime': s.chime.triggerAttackRelease(hz(e.m), dur, time, v); break;
      case 'bell':  s.bell.triggerAttackRelease(hz(e.m), dur, time, v); break;
      case 'crackle': s.crackle.triggerAttackRelease('64n', time, v); break;
      case 'pad':
        if (audio.chill && audio.piano) e.m.forEach((m, i) => s.pad.triggerAttackRelease(hz(m), dur, time + i * 0.035, v));   // a gently rolled chord
        else s.pad.triggerAttackRelease(e.m.map(hz), dur, time, v);
        break;
      case 'kick':
        if ((audio.house || audio.trance || audio.dubstep) && !e.tr && s.duckPad) for (const [g, dip] of [[s.duckPad, 0.3], [s.duckBass, 0.35]]) {   // the pump: a deep, quick dip
          g.gain.cancelScheduledValues(time);
          g.gain.setValueAtTime(dip, time);
          g.gain.linearRampToValueAtTime(1, time + 0.2);
        } else if (audio.chill && !audio.lofi && !e.tr) for (const [g, dip] of [[s.duckPad, 0.55], [s.duckBass, 0.85]]) {   // dip the sustained tones under the kick
          g.gain.cancelScheduledValues(time);
          g.gain.setValueAtTime(dip, time);
          g.gain.linearRampToValueAtTime(1, time + 0.35);
        }
        s.kick.triggerAttackRelease(audio.metal ? 'F1' : 'C1', '16n', time, v ?? 0.9);
        if (s.kickClick) s.kickClick.triggerAttackRelease('64n', time, v ?? 0.9);
        break;
      case 'sub':   s.sub.triggerAttackRelease(hz(e.m), dur, time, v); break;
      case 'stab':  s.stab.triggerAttackRelease(e.m.map(hz), unit * 1.2, time, v); break;
      case 'zap': {         // a sharp high tone: a quick pitch dive into the note, or a rising scream if it is held
        const long = (e.d || 1) > 2;
        s.zap.detune.cancelScheduledValues(time);
        s.zap.detune.setValueAtTime(long ? -300 : 600, time);
        s.zap.detune.linearRampToValueAtTime(long ? 1200 : 0, time + (long ? (e.d || 1) * unit : 0.06));
        s.zap.triggerAttackRelease(hz(e.m), long ? (e.d || 1) * unit : unit * 0.8, time, v);
        break;
      }
      case 'climb': {       // the build-up's riser in miniature: swept noise and a rising tone that pull up and stop dead as the melody lands
        const L = 4 * unit - 0.02;
        s.riserBp.frequency.cancelScheduledValues(time);
        s.riserBp.frequency.setValueAtTime(900, time);
        s.riserBp.frequency.exponentialRampToValueAtTime(8000, time + L);
        s.riserNoise.triggerAttackRelease(L, time, 0.7);
        s.riserTone.frequency.cancelScheduledValues(time);
        s.riserTone.frequency.setValueAtTime(440, time);
        s.riserTone.frequency.exponentialRampToValueAtTime(2200, time + L);
        s.riserTone.triggerAttackRelease(L, time, 0.6);
        break;
      }
      case 'wob': {         // the growl: a quick pitch dive into the note, and two LFOs locked to the tempo sweeping the formant filters
        const hzNote = hz(e.m);
        s.wob.triggerAttackRelease(hzNote, e.dv ? (e.d || 1) * unit + 0.03 : dur, time, v);   // the dive's note runs right up to the next one
        s.wob.detune.cancelScheduledValues(time);
        s.wob.volume.cancelScheduledValues(time);
        if (e.dv) {         // the drop's opening: a separate bright, metallic FM voice falls three octaves onto the wobble's pitch, while the wobble itself swells in underneath, so the two meet on the same note
          const fall = 8 * unit, hzD = hzNote;
          s.dive.detune.cancelScheduledValues(time);
          s.dive.detune.setValueAtTime(3600, time);
          s.dive.detune.exponentialRampToValueAtTime(1, time + fall * 0.9);
          s.dive.detune.setValueAtTime(0, time + fall * 0.9 + 0.001);
          s.dive.modulationIndex.cancelScheduledValues(time);
          s.dive.modulationIndex.setValueAtTime(40, time);
          s.dive.modulationIndex.linearRampToValueAtTime(12, time + fall);
          s.dive.volume.cancelScheduledValues(time);
          s.dive.volume.setValueAtTime(-7, time);
          s.dive.volume.setValueAtTime(-7, time + fall * 0.45);
          s.dive.volume.linearRampToValueAtTime(-40, time + fall * 1.05);
          s.dive.triggerAttackRelease(hzD, fall * 1.05, time, 1);
          s.wob.volume.setValueAtTime(WOB_DB - 18, time);
          s.wob.volume.setValueAtTime(WOB_DB - 18, time + fall * 0.25);
          s.wob.volume.linearRampToValueAtTime(WOB_DB, time + fall * 0.8);
          s.wob.detune.setValueAtTime(0, time);
        } else if (e.fl) {  // the note right after the dive: no extra dive of its own, so the voice carries straight on
          s.wob.volume.setValueAtTime(WOB_DB, time);
          s.wob.detune.setValueAtTime(0, time);
        } else {
          s.wob.volume.setValueAtTime(WOB_DB, time);
          s.wob.detune.setValueAtTime(500, time);
          s.wob.detune.exponentialRampToValueAtTime(1, time + 0.07);
          s.wob.detune.setValueAtTime(0, time + 0.08);
        }
        const rate = Tone.Transport.bpm.value / 60 * e.r;
        for (const [filt, lo, hi, ph] of [[s.wobBpA, 200, e.b, 270], [s.wobBpB, 600, e.b * 2.4, 90]]) {
          // (the second sweeps the opposite way) The sweeps start at their lowest point, except for the dive and the note after it, where they start half-open so the tone doesn't close up at the join
          const lfo = new Tone.LFO({ frequency: rate, min: lo, max: hi, type: 'sine', phase: e.fl || e.dv ? (ph === 270 ? 0 : 180) : ph });
          lfo.connect(filt.frequency);
          lfo.start(time).stop(time + dur + 0.05);
          setTimeout(() => { try { lfo.dispose(); } catch (err) { /* already gone */ } }, (time - Tone.now() + dur + 0.5) * 1000);
        }
        break;
      }
      case 'riser': {       // swept noise and a rising tone over the build-up
        const len = (e.d || 16) * unit;
        s.riserBp.frequency.cancelScheduledValues(time);
        s.riserBp.frequency.setValueAtTime(300, time);
        s.riserBp.frequency.exponentialRampToValueAtTime(7000, time + len);
        s.riserNoise.triggerAttackRelease(len, time, 0.9);
        s.riserTone.frequency.cancelScheduledValues(time);
        s.riserTone.frequency.setValueAtTime(220, time);
        s.riserTone.frequency.exponentialRampToValueAtTime(1760, time + len);
        s.riserTone.triggerAttackRelease(len, time, 0.7);
        break;
      }
      case 'fall': {        // the opposite of a riser, over the last bar of a drop: a noise sweep and a tone falling away
        const len = (e.d || 16) * unit;
        s.riserBp.frequency.cancelScheduledValues(time);
        s.riserBp.frequency.setValueAtTime(6000, time);
        s.riserBp.frequency.exponentialRampToValueAtTime(200, time + len);
        s.riserNoise.triggerAttackRelease(len, time, 0.8);
        s.riserTone.frequency.cancelScheduledValues(time);
        s.riserTone.frequency.setValueAtTime(1200, time);
        s.riserTone.frequency.exponentialRampToValueAtTime(110, time + len);
        s.riserTone.triggerAttackRelease(len, time, 0.6);
        break;
      }
      case 'impact':
        s.impact.triggerAttackRelease('A0', 1.2, time, v ?? 1);
        s.impactNoise.triggerAttackRelease(0.9, time, (v ?? 1) * 0.9);
        break;
      case 'pluck': s.pluck.triggerAttackRelease(hz(e.m), dur * 0.8, time, v); break;
      case 'ohat':  s.ohat.triggerAttackRelease('16n', time, v ?? 0.6); break;
      case 'hat':   s.hat.triggerAttackRelease('32n', time, v ?? 0.6); break;
      case 'snare':
        s.snare.triggerAttackRelease('16n', time, v ?? 0.7);
        if (s.snareBody) s.snareBody.triggerAttackRelease('G3', '32n', time, (v ?? 0.7) * 0.9);
        if (s.clap) s.clap.triggerAttackRelease('16n', time, v ?? 0.7);
        break;
    }
  } catch (err) { /* monophonic voices can reject a duplicate start time; skip it */ }
}
