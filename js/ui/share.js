// Export and import a whole session (the text, the seed and the settings) as one small JSON file, so it can be shared and opened
// on another computer to sound exactly the same. A file you import is treated as data: only the fields listed here are read, and
// every value is checked against what the controls accept.
import { $ } from './dom.js';
import { getText, setCode, isPlain } from './editor.js';
import { seedOf, parseSeed, formatSeed } from '../compose/seed.js';

const KIND = 'rad.io session', VERSION = 1, MAX_TEXT = 1_000_000;
const SELECTS = ['style', 'key', 'scale', 'gap', 'leadsound', 'bgmode', 'delay'];
const CHECKS = ['loop', 'vary'];
const SLIDERS = ['tempo', 'bgvol'];

// The current session as a plain object. The seed is always written out (the text's own if none was typed), so the file sounds the
// same even if the text is edited afterwards.
export function exportSession() {
  const text = getText();
  const s = { app: KIND, version: VERSION, text, plain: isPlain(), seed: formatSeed(parseSeed($('seed').value) ?? seedOf(text)), settings: {}, layers: {} };
  for (const id of SELECTS) s.settings[id] = $(id).value;
  for (const id of CHECKS) s.settings[id] = $(id).checked;
  for (const id of SLIDERS) s.settings[id] = +$(id).value;
  document.querySelectorAll('[data-layer]').forEach(c => { s.layers[c.dataset.layer] = c.checked; });
  return s;
}

export function downloadSession() {
  const blob = new Blob([JSON.stringify(exportSession(), null, 2) + '\n'], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'session.radio.json';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

// True if the parsed JSON is one of our session files.
export const isSession = o => !!o && typeof o === 'object' && o.app === KIND;

const fire = (el, type) => el.dispatchEvent(new Event(type, { bubbles: true }));

// Applies a parsed session file. Throws an Error with a message for the user if it can't be used. The caller stops playback first.
export function importSession(o) {
  if (!isSession(o)) throw new Error("That file isn't a rad.io session.");
  if (o.version > VERSION) throw new Error('That session was saved by a newer version of rad.io.');
  if (typeof o.text !== 'string' || o.text.length > MAX_TEXT) throw new Error('That session has no usable text.');
  const st = o.settings && typeof o.settings === 'object' ? o.settings : {};
  const has = (id, v) => [...$(id).options].some(x => x.value === String(v));

  setCode(o.text, o.plain === true);
  // The style first: choosing it sets a fitting tempo and scale, which the saved ones then replace.
  if (has('style', st.style)) { $('style').value = st.style; fire($('style'), 'change'); }
  for (const id of SELECTS) if (id !== 'style' && has(id, st[id])) { $(id).value = st[id]; if (!$(id).disabled) fire($(id), 'change'); }
  for (const id of CHECKS) if (typeof st[id] === 'boolean') { $(id).checked = st[id]; fire($(id), 'change'); }
  for (const id of SLIDERS) {
    const v = +st[id];
    if (Number.isFinite(v)) { $(id).value = Math.min(+$(id).max, Math.max(+$(id).min, v)); fire($(id), 'input'); }
  }
  if (o.layers && typeof o.layers === 'object') {
    document.querySelectorAll('[data-layer]').forEach(c => { if (typeof o.layers[c.dataset.layer] === 'boolean') c.checked = o.layers[c.dataset.layer]; });
    fire($('layers'), 'change');
  }
  const seed = typeof o.seed === 'string' ? parseSeed(o.seed) : null;
  $('seed').value = seed == null ? '' : formatSeed(seed);
  fire($('seed'), 'change');                       // refreshes the length shown under the code
}
