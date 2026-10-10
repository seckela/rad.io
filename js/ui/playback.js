import { unlockAudio, releaseAudio } from '../audio/unlock.js';
import { vizAttach, vizStart, vizStop, vizPause } from './viz.js';
import { syncPicker } from './picker.js';
import { $, view, playBtn } from './dom.js';
import { getText, setEditorHidden } from './editor.js';
import { renderView, highlight } from './view.js';
import { getKey, getScale, getStyle, isChill, isLofi, isMetal, isChip, getOpts } from './settings.js';
import { compose } from '../compose/index.js';
import { audio, setAudio, buildAudio, disposeAudio } from '../audio/engine.js';
import { sound } from '../audio/play.js';
import { loadMetalBuffers, loadBassBuffers } from '../audio/samples.js';

export let playing = false, paused = false, lastTotal = 0;   // playing is true while paused too (a session is open)
let endToken = 0, lastEvents = [], endReached = false;
const stopBtn = $('stop');

// The Play button doubles as Pause / Resume; Stop only shows while a session is open.
const ICON = {
  play: '<svg class="ico" viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 2.8v10.4L12.6 8z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>',
  pause: '<svg class="ico" viewBox="0 0 16 16" aria-hidden="true"><rect x="3" y="2.5" width="3.4" height="11" rx="1.2"/><rect x="9.6" y="2.5" width="3.4" height="11" rx="1.2"/></svg>',
};
function setUi() {
  playBtn.innerHTML = !playing ? ICON.play + 'Play' : paused ? ICON.play + 'Resume' : ICON.pause + 'Pause';
  stopBtn.hidden = !playing;
}

// After the last note: let it ring out, then reset the UI. A plain timer (not Tone.Draw) so it
// still fires when animation frames are paused. The token makes a stale timer harmless after a
// stop, restart or seek.
function armEnd(wait) {
  const my = ++endToken;
  setTimeout(() => { if (playing && !paused && my === endToken) stop(); }, wait);
}
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
  lastEvents = events;
  endReached = false;
  if (!T.loop) {
    T.schedule(time => {
      endReached = true;
      armEnd(Math.max(0, (time - Tone.now()) * 1000) + 1200);
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
  $('tempo').value = { chill: 70, lofi: 80, metal: 150, chiptune: 140 }[st] || 130;
  $('tempoVal').textContent = $('tempo').value;
  Tone.Transport.bpm.value = +$('tempo').value;
  $('scale').value = { chill: 'Natural minor', lofi: 'Natural minor', metal: 'Phrygian', chiptune: 'Major' }[st] || 'Dorian';
  $('leadsound').disabled = st === 'metal' || st === 'chiptune';   // the metal lead is always a guitar, the chiptune lead a pulse wave
  syncPicker();
}

// (Re)builds the voices and waits for the samples (piano, or guitar and bass for rock/metal). If
// they can't be fetched (offline, blocked), falls back to something that needs no downloads.
export async function loadAudio() {
  if (audio) disposeAudio();
  const metal = isMetal(), piano = !metal && !isChip() && $('leadsound').value === 'piano';
  const label = playBtn.innerHTML;
  if (metal) {
    playBtn.textContent = 'Loading guitars…';
    try {
      metalBufs = metalBufs || await loadMetalBuffers();
    } catch (err) {
      metalBufs = null;
      $('style').value = 'default';
      applyStyleDefaults();
      playBtn.innerHTML = label;
      await loadAudio();
      $('stats').textContent = 'Guitar samples could not be loaded, so the Default style is being used.';
      return;
    }
    setAudio(buildAudio('metal', false, metalBufs));
    applyMix();
    playBtn.innerHTML = label;
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
  if (!piano) { playBtn.innerHTML = label; return; }
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
  playBtn.innerHTML = label;
}

// The transport tick and event for a character index: the first note at or after it.
function tickFor(idx) {
  const U = Tone.Transport.PPQ / 4;
  let best = null;
  for (const e of lastEvents) {
    if (e.i === undefined || e.i < idx) continue;
    if (!best || e.i < best.i || (e.i === best.i && (e.tr || 0) < (best.tr || 0))) best = e;
  }
  return best ? { tick: Math.round(best.t * U), ev: best } : null;
}

function releaseVoices() {
  if (audio) for (const tr of [audio.fg, audio.bg]) Object.values(tr.s).forEach(x => x.releaseAll && x.releaseAll());
}

// Starts from the beginning, or from the note at character `fromIdx` if one is given.
export async function start(fromIdx = null) {
  unlockAudio();             // must run inside the tap, before any await (iOS silent-switch workaround)
  await Tone.start();
  vizAttach();
  if (!audio) await loadAudio();
  applyMix();
  const text = getText();
  renderView(text);
  Tone.Transport.bpm.value = +$('tempo').value;
  rebuild();
  const hit = fromIdx != null ? tickFor(fromIdx) : null;
  setEditorHidden(true); view.hidden = false;
  playing = true; paused = false;
  setUi();
  if (hit) {
    highlight(hit.ev.i, hit.ev.tr || 0);
    $('stats').textContent += ` · starting at character ${hit.ev.i}`;
  }
  Tone.Transport.start('+0.1', hit ? hit.tick + 'i' : undefined);
  vizStart();
}

// Pausing freezes the audio clock, so notes and reverb tails hold exactly where they are and
// resume without gaps or repeats. It costs nothing while paused.
export function pause() {
  if (!playing || paused) return;
  paused = true;
  setUi();
  vizPause();
  try { Tone.getContext().rawContext.suspend().catch(() => {}); } catch (e) {}
}

export function resume() {
  if (!playing || !paused) return;
  unlockAudio();             // inside the tap: iOS needs a gesture to resume audio
  paused = false;
  setUi();
  try { Tone.getContext().rawContext.resume().catch(() => {}); } catch (e) {}
  vizAttach();
  vizStart();
  if (endReached) armEnd(1200);   // paused during the tail after the last note
}

// Jumps to a character while playing or paused. Notes already sounding are released; chords that
// started before the target aren't re-struck, so the harmony catches up at the next chord.
export function seekTo(idx) {
  if (!playing) return;
  const hit = tickFor(idx);
  if (!hit) return;
  endToken++;                // cancel any pending end-of-piece timer
  endReached = false;
  Tone.Transport.ticks = hit.tick;
  releaseVoices();
  highlight(hit.ev.i, hit.ev.tr || 0);
}

export function stop() {
  endToken++;
  releaseAudio();
  vizStop();
  if (paused) { try { Tone.getContext().rawContext.resume().catch(() => {}); } catch (e) {} }
  Tone.Transport.stop();
  Tone.Transport.cancel(0);
  releaseVoices();
  view.hidden = true; setEditorHidden(false);
  playing = false; paused = false;
  setUi();
}
