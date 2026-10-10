import { unlockAudio, releaseAudio } from '../audio/unlock.js';
import { $, view, playBtn } from './dom.js';
import { getText, setEditorHidden } from './editor.js';
import { renderView, highlight } from './view.js';
import { getKey, getScale, getStyle, isChill, isLofi, isMetal, getOpts } from './settings.js';
import { compose } from '../compose/index.js';
import { audio, setAudio, buildAudio, disposeAudio } from '../audio/engine.js';
import { sound } from '../audio/play.js';
import { loadMetalBuffers, loadBassBuffers } from '../audio/samples.js';

export let playing = false, lastTotal = 0;
let endToken = 0;
let metalBufs = null, chillBass = null;   // downloaded sample sets, kept for the rest of the session

// Pushes the layer checkboxes and background controls onto the audio graph.
export function applyMix() {
  if (!audio) return;
  for (const tr of [audio.fg, audio.bg]) {
    document.querySelectorAll('[data-layer]').forEach(c => { tr.group[c.dataset.layer].mute = !c.checked; });
  }
  audio.bg.out.volume.value = +$('bgvol').value;
}

function schedule(events, total) {
  const T = Tone.Transport, U = T.PPQ / 4;
  T.cancel(0);
  T.loop = $('loop').checked;
  T.loopStart = 0;
  T.loopEnd = Math.round(total * U) + 'i';
  for (const e of events) {
    T.schedule(time => {
      sound(e, time);
      if (e.i !== undefined) Tone.Draw.schedule(() => highlight(e.i, e.tr), time);
    }, Math.round(e.t * U) + 'i');
  }
  if (!T.loop) {
    // End of the piece: let the last notes ring out, then reset the UI. A plain timer is used
    // (not Tone.Draw) so it still fires when animation frames are paused. The token makes a
    // stale timer harmless if the user already stopped or restarted.
    const token = ++endToken;
    T.schedule(time => {
      const wait = Math.max(0, (time - Tone.now()) * 1000) + 1200;
      setTimeout(() => { if (playing && token === endToken) stop(); }, wait);
    }, Math.round(total * U) + 'i');
  }
}

export function updateStats(chars, total) {
  const secs = total * 60 / Tone.Transport.bpm.value / 4;
  $('stats').textContent = `${chars} characters · ${total / 16} bars · ${secs.toFixed(1)}s`;
}

export function rebuild() {
  const text = getText();
  const { events, total } = compose(text, getKey(), getScale(), getOpts());
  lastTotal = total;
  schedule(events, total);
  updateStats(text.length, total);
}

// Sets the tempo and scale that go with the selected style (both can be changed afterwards).
export function applyStyleDefaults() {
  const st = $('style').value;
  $('tempo').value = { chill: 70, lofi: 80, metal: 150 }[st] || 130;
  $('tempoVal').textContent = $('tempo').value;
  Tone.Transport.bpm.value = +$('tempo').value;
  $('scale').value = { chill: 'Natural minor', lofi: 'Natural minor', metal: 'Phrygian' }[st] || 'Dorian';
  $('leadsound').disabled = st === 'metal';       // the metal lead is always a guitar
}

// (Re)builds the voices and waits for the samples (piano, or guitar and bass for rock/metal). If
// they can't be fetched (offline, blocked), falls back to something that needs no downloads.
export async function loadAudio() {
  if (audio) disposeAudio();
  const metal = isMetal(), piano = !metal && $('leadsound').value === 'piano';
  const label = playBtn.textContent;
  if (metal) {
    playBtn.textContent = 'Loading guitars…';
    try {
      metalBufs = metalBufs || await loadMetalBuffers();
    } catch (err) {
      metalBufs = null;
      $('style').value = 'default';
      applyStyleDefaults();
      playBtn.textContent = label;
      await loadAudio();
      $('stats').textContent = 'Guitar samples could not be loaded, so the Default style is being used.';
      return;
    }
    setAudio(buildAudio('metal', false, metalBufs));
    applyMix();
    playBtn.textContent = label;
    return;
  }
  const warm = isChill() || isLofi();       // Chillstep and Lo-fi both use the recorded bass
  if (warm && !chillBass) {
    playBtn.textContent = 'Loading bass…';
    try { chillBass = await loadBassBuffers(); } catch (err) { chillBass = null; }   // falls back to the synth bass
  }
  const bufs = warm && chillBass ? { bass: chillBass } : undefined;
  setAudio(buildAudio(getStyle(), piano, bufs));
  applyMix();
  if (!piano) { playBtn.textContent = label; return; }
  playBtn.textContent = 'Loading piano…';
  try {
    await Tone.loaded();
  } catch (err) {
    disposeAudio();
    $('leadsound').value = 'synth';
    setAudio(buildAudio(getStyle(), false, bufs));
    applyMix();
    $('stats').textContent = 'Piano samples could not be loaded, so the synth lead is being used.';
  }
  playBtn.textContent = label;
}

export async function start() {
  unlockAudio();             // must run inside the tap, before any await (iOS silent-switch workaround)
  await Tone.start();
  if (!audio) await loadAudio();
  applyMix();
  const text = getText();
  renderView(text);
  Tone.Transport.bpm.value = +$('tempo').value;
  rebuild();
  setEditorHidden(true); view.hidden = false;
  playBtn.textContent = '■ Stop';
  playing = true;
  Tone.Transport.start('+0.1');
}

export function stop() {
  endToken++;
  releaseAudio();
  Tone.Transport.stop();
  Tone.Transport.cancel(0);
  if (audio) for (const tr of [audio.fg, audio.bg]) Object.values(tr.s).forEach(x => x.releaseAll && x.releaseAll());
  view.hidden = true; setEditorHidden(false);
  playBtn.textContent = '▶ Play';
  playing = false;
}
