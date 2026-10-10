import { buildTrack } from './track.js';
import { buildMetalTrack } from './metal-track.js';

// The current set of voices (null until the first Play). Importers see the live value.
export let audio = null;
export function setAudio(a) { audio = a; }

export function buildAudio(chill, piano, metal, bufs) {
  const limiter = new Tone.Limiter(-3).toDestination();   // safety net against pile-ups
  if (metal) {
    const reverb = new Tone.Reverb({ decay: 1.6, wet: 0.12 }).connect(limiter);
    return { reverb, limiter, piano: false, chill: false, metal: true,
      fg: buildMetalTrack(reverb, false, bufs), bg: buildMetalTrack(reverb, true, bufs) };
  }
  const reverb = new Tone.Reverb({ decay: chill ? 5.5 : 3, wet: chill ? 0.4 : 0.25 }).connect(limiter);
  return { reverb, limiter, piano, chill, fg: buildTrack(reverb, false, chill, piano, limiter, bufs && bufs.bass), bg: buildTrack(reverb, true, chill, piano, undefined, bufs && bufs.bass) };
}

export function disposeAudio() {
  for (const tr of [audio.fg, audio.bg]) {
    Object.values(tr.s).forEach(x => x.dispose());
    Object.values(tr.group).forEach(x => x.dispose());
    tr.out.dispose();
  }
  audio.reverb.dispose();
  audio.limiter.dispose();
}
