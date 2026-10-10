import { audio } from './engine.js';

// Deterministic pseudo-random value in [0, 1), so the "human" variation is the same every time the
// same code is played.
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
      case 'bell':  s.bell.triggerAttackRelease(hz(e.m), dur, time, v); break;
      case 'crackle': s.crackle.triggerAttackRelease('64n', time, v); break;
      case 'pad':
        if (audio.chill && audio.piano) e.m.forEach((m, i) => s.pad.triggerAttackRelease(hz(m), dur, time + i * 0.035, v));   // a gently rolled chord
        else s.pad.triggerAttackRelease(e.m.map(hz), dur, time, v);
        break;
      case 'kick':
        if (audio.chill && !audio.lofi && !e.tr) for (const [g, dip] of [[s.duckPad, 0.55], [s.duckBass, 0.85]]) {   // dip the sustained tones under the kick
          g.gain.cancelScheduledValues(time);
          g.gain.setValueAtTime(dip, time);
          g.gain.linearRampToValueAtTime(1, time + 0.35);
        }
        s.kick.triggerAttackRelease(audio.metal ? 'F1' : 'C1', '16n', time, v ?? 0.9);
        if (s.kickClick) s.kickClick.triggerAttackRelease('64n', time, v ?? 0.9);
        break;
      case 'hat':   s.hat.triggerAttackRelease('32n', time, v ?? 0.6); break;
      case 'snare':
        s.snare.triggerAttackRelease('16n', time, v ?? 0.7);
        if (s.snareBody) s.snareBody.triggerAttackRelease('G3', '32n', time, (v ?? 0.7) * 0.9);
        break;
    }
  } catch (err) { /* monophonic voices can reject a duplicate start time; skip it */ }
}
