import { $, src, view, playBtn } from './ui/dom.js';
import { KEYS, SCALES } from './scales.js';
import { SAMPLE, EXAMPLES } from './sample.js';
import { compose } from './compose/index.js';
import { audio } from './audio/engine.js';
import { setCode, getText, initEditor, getStartIndex, onTextChange } from './ui/editor.js';
import { seedOf, formatSeed } from './compose/seed.js';
import { downloadSession, importSession, isSession } from './ui/share.js';
import { indexFromPoint } from './ui/view.js';
import { getKey, getScale, isChill, isLofi, getOpts } from './ui/settings.js';
import { initPicker } from './ui/picker.js';
import { initTips } from './ui/tips.js';
import { initDebug } from './audio/unlock.js';
import { initViz } from './ui/viz.js';
import { initMinimal } from './ui/minimal.js';
import { playing, paused, lastTotal, applyMix, updateStats, rebuild, applyStyleDefaults, applyFeel, loadAudio, start, stop, pause, resume, seekTo } from './ui/playback.js';

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
// The seed box: empty means the text's own seed, which is shown as the placeholder.
const showSeed = () => { $('seed').placeholder = formatSeed(seedOf(getText())); };
const seedChanged = () => { if (playing) rebuild(); else updateStats(getText().length, compose(getText(), getKey(), getScale(), getOpts()).total); };
onTextChange(showSeed);
showSeed();
// A new seed (typed, random or back to Auto) also moves the tempo, scale and key to where it puts this style; Pin keeps the same seed.
const newSeed = () => { applyFeel(); seedChanged(); };
$('seed').onchange = newSeed;
$('seed-pin').onclick = () => { $('seed').value = formatSeed(seedOf(getText())); seedChanged(); };
$('seed-dice').onclick = () => { $('seed').value = formatSeed(Math.floor(Math.random() * 2 ** 32)); newSeed(); };
$('seed-auto').onclick = () => { $('seed').value = ''; newSeed(); };
$('leadsound').onchange = () => { if (audio) loadAudio(); };
for (const g of EXAMPLES) {
  const og = document.createElement('optgroup');
  og.label = g.group;
  for (const it of g.items) og.append(new Option(it.name, it.id));
  $('sample').append(og);
}
$('sample').onchange = () => {
  const it = EXAMPLES.flatMap(g => g.items).find(x => x.id === $('sample').value);
  $('sample').value = '';                      // back to the prompt, so the same example can be picked again
  if (!it) return;
  if (playing) stop();
  setCode(it.text, !it.code);
  applyFeel();                                  // the new text's seed sets the tempo, scale and key
  seedChanged();
};

// A rad.io session file (from Export) restores the text, seed and settings; any other file is loaded as text.
async function loadFile(f) {
  if (!f) return;
  if (playing) stop();
  const text = await f.text();
  if (/\.json$/i.test(f.name)) {
    let o = null;
    try { o = JSON.parse(text); } catch (e) { /* plain text that happens to end in .json */ }
    if (isSession(o)) return openSession(o);
  }
  setCode(text);
  applyFeel();
  seedChanged();
}
function openSession(o) {
  if (playing) stop();
  try { importSession(o); $('stats').textContent = 'Session loaded. ' + $('stats').textContent; }
  catch (e) { $('stats').textContent = e.message; }
}
$('export').onclick = downloadSession;
$('import').onclick = () => $('import-file').click();
$('import-file').onchange = async e => {
  const f = e.target.files[0];
  e.target.value = '';
  if (!f) return;
  let o = null;
  try { o = JSON.parse(await f.text()); } catch (err) { /* reported below */ }
  if (o) openSession(o); else $('stats').textContent = "That file isn't a rad.io session.";
};
$('file').onchange = e => loadFile(e.target.files[0]);
initEditor(loadFile);
for (const el of [src, view]) {
  el.addEventListener('dragover', e => e.preventDefault());
  el.addEventListener('drop', e => { e.preventDefault(); loadFile(e.dataTransfer.files[0]); });
}
updateStats(SAMPLE.length, compose(SAMPLE, 0, SCALES['Dorian'], { mode: 'canon', delay: 16, vary: true, chill: false, gap: 8 }).total);
