import { $, src, view, playBtn } from './ui/dom.js';
import { KEYS, SCALES } from './scales.js';
import { SAMPLE } from './sample.js';
import { compose } from './compose/index.js';
import { audio } from './audio/engine.js';
import { setCode, getText, initEditor, getStartIndex } from './ui/editor.js';
import { indexFromPoint } from './ui/view.js';
import { getKey, getScale, isChill, isLofi, getOpts } from './ui/settings.js';
import { initPicker } from './ui/picker.js';
import { initTips } from './ui/tips.js';
import { initDebug } from './audio/unlock.js';
import { initViz } from './ui/viz.js';
import { initMinimal } from './ui/minimal.js';
import { playing, paused, lastTotal, applyMix, updateStats, rebuild, applyStyleDefaults, loadAudio, start, stop, pause, resume, seekTo } from './ui/playback.js';

KEYS.forEach((k, i) => $('key').add(new Option(k, i)));
Object.keys(SCALES).forEach(k => $('scale').add(new Option(k, k)));
$('scale').value = 'Dorian';

src.value = SAMPLE;

const LAYERS = [['lead','Melody'],['bass','Bass'],['pad','Chords'],['accent','Bells & digits'],['perc','Percussion']];
LAYERS.forEach(([id, label]) => {
  const l = document.createElement('label');
  l.innerHTML = `<input type="checkbox" data-layer="${id}" checked> ${label}`;
  $('layers').appendChild(l);
});

initPicker();
initTips();
initDebug();
initViz();
initMinimal();

playBtn.onclick = () => !playing ? start(getStartIndex()) : paused ? resume() : pause();
$('stop').onclick = stop;
// Click a character in the playback view to jump there (playing or paused).
view.addEventListener('click', e => {
  if (String(getSelection()).length) return;               // the user was selecting text, not seeking
  const idx = indexFromPoint(e.clientX, e.clientY);
  if (idx != null) seekTo(idx);
});
$('tempo').oninput = e => {
  $('tempoVal').textContent = e.target.value;
  Tone.Transport.bpm.value = +e.target.value;
  if (lastTotal) updateStats(getText().length, lastTotal);
};
$('key').onchange = $('scale').onchange = () => { if (playing) rebuild(); };
$('loop').onchange = () => { if (playing) rebuild(); };
$('layers').onchange = applyMix;
$('bgvol').oninput = applyMix;
$('bgmode').onchange = $('delay').onchange = $('vary').onchange = () => { if (playing) rebuild(); };
$('style').onchange = () => {
  applyStyleDefaults();
  if (audio) loadAudio();
  if (playing) rebuild(); else updateStats(getText().length, compose(getText(), getKey(), getScale(), getOpts()).total);
};
$('gap').onchange = () => { if (playing) rebuild(); else if (isChill() || isLofi()) updateStats(getText().length, compose(getText(), getKey(), getScale(), getOpts()).total); };
$('leadsound').onchange = () => { if (audio) loadAudio(); };
$('sample').onclick = () => { if (playing) stop(); setCode(SAMPLE); };

async function loadFile(f) {
  if (!f) return;
  if (playing) stop();
  setCode(await f.text());
}
$('file').onchange = e => loadFile(e.target.files[0]);
initEditor(loadFile);
for (const el of [src, view]) {
  el.addEventListener('dragover', e => e.preventDefault());
  el.addEventListener('drop', e => { e.preventDefault(); loadFile(e.dataTransfer.files[0]); });
}
updateStats(SAMPLE.length, compose(SAMPLE, 0, SCALES['Dorian'], { mode: 'canon', delay: 16, vary: true, chill: false, gap: 8 }).total);
