import { buildTrack } from './track.js';
import { buildMetalTrack } from './metal-track.js';
import { buildLofiTrack } from './lofi-track.js';
import { buildChipTrack } from './chip-track.js';
import { buildSynthwaveTrack } from './synthwave-track.js';
import { buildHouseTrack } from './house-track.js';
import { buildAmbientTrack } from './ambient-track.js';

// The current set of voices (null until the first Play). Importers see the live value.
export let audio = null;
export function setAudio(a) { audio = a; }

// style: 'default' | 'chill' | 'lofi' | 'metal' | 'chiptune' | 'ambient' | 'synthwave' | 'house'. bufs: the decoded samples for that style (guitar and bass for
// metal, bass for chill and lofi), or undefined to use the synth fallbacks.
export function buildAudio(style, piano, bufs) {
  const limiter = new Tone.Limiter(-3).toDestination();   // safety net against pile-ups
  if (style === 'metal') {
    const reverb = new Tone.Reverb({ decay: 1.6, wet: 0.12 }).connect(limiter);
    return { reverb, limiter, piano: false, chill: false, metal: true,
      fg: buildMetalTrack(reverb, false, bufs), bg: buildMetalTrack(reverb, true, bufs) };
  }
  if (style === 'house') {               // a small, tight room: the beat stays dry and punchy
    const reverb = new Tone.Reverb({ decay: 1.4, wet: 0.15 }).connect(limiter);
    return { reverb, limiter, piano: false, chill: false, house: true,
      fg: buildHouseTrack(reverb, false, limiter), bg: buildHouseTrack(reverb, true) };
  }
  if (style === 'synthwave') {           // a medium, bright hall
    const reverb = new Tone.Reverb({ decay: 2.5, wet: 0.22 }).connect(limiter);
    return { reverb, limiter, piano: false, chill: false, synthwave: true,
      fg: buildSynthwaveTrack(reverb, false), bg: buildSynthwaveTrack(reverb, true) };
  }
  if (style === 'ambient') {             // a huge, soft space
    const reverb = new Tone.Reverb({ decay: 9, wet: 0.55 }).connect(limiter);
    return { reverb, limiter, piano: false, chill: false, ambient: true,
      fg: buildAmbientTrack(reverb, false), bg: buildAmbientTrack(reverb, true) };
  }
  if (style === 'chiptune') {            // dry and tight: just a hint of room
    const reverb = new Tone.Reverb({ decay: 0.8, wet: 0.05 }).connect(limiter);
    return { reverb, limiter, piano: false, chill: false, chip: true,
      fg: buildChipTrack(reverb, false), bg: buildChipTrack(reverb, true) };
  }
  if (style === 'lofi') {                // a small room: much drier than Chillstep
    const reverb = new Tone.Reverb({ decay: 2.2, wet: 0.2 }).connect(limiter);
    return { reverb, limiter, piano, chill: true, lofi: true,
      fg: buildLofiTrack(reverb, false, piano, bufs && bufs.bass), bg: buildLofiTrack(reverb, true, piano, bufs && bufs.bass) };
  }
  const chill = style === 'chill';
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
