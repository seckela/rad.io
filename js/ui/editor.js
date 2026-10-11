import { $, src } from './dom.js';

let jar = null, editorEl = null;   // syntax-highlighting editor (CodeJar); null means the plain textarea is in use

// Where the user deliberately put the caret (a click or arrow keys), or null. Typing or pasting
// clears it, so a caret left at the end of freshly pasted code doesn't make Play start at the end.
let caret = null;
const remember = () => { try { caret = jar ? jar.save().start : src.selectionStart; } catch (e) { caret = null; } };
const CARET_KEYS = /^(Arrow|Home$|End$|Page)/;
function trackCaret(el) {
  el.addEventListener('pointerup', remember);
  el.addEventListener('keyup', e => { if (CARET_KEYS.test(e.key)) remember(); });
  el.addEventListener('input', () => { caret = null; });
}
trackCaret(src);

// The character index Play should start from, or null to start at the beginning (no deliberate
// caret, or the caret is at the very start or end).
export function getStartIndex() {
  const len = getText().length;
  return caret != null && caret > 0 && caret < len ? caret : null;
}

export const getText = () => (jar ? jar.toString() : src.value).replace(/\r\n?/g, '\n');

// One listener for "the text changed" (typing, pasting, loading an example or a file), used to show the text's seed.
let changed = () => {};
export const onTextChange = cb => { changed = cb; };
src.addEventListener('input', () => changed());

export function setCode(text) { src.value = text; if (jar) jar.updateCode(text); changed(); }

export const setEditorHidden = h => { (editorEl || src).hidden = h; };

// Syntax highlighting is a visual extra: if CodeJar or Prism can't be loaded, the plain
// textarea keeps working. `onFile` receives a file dropped onto the editor.
export async function initEditor(onFile) {
  if (!window.Prism) return;
  try {
    const { CodeJar } = await import('https://cdn.jsdelivr.net/npm/codejar@4.2.0/dist/codejar.js');
    editorEl = $('editor');
    jar = CodeJar(editorEl, el => {
      el.innerHTML = Prism.highlight(el.textContent, Prism.languages.javascript, 'javascript');
    }, { tab: '  ', addClosing: false });
    jar.onUpdate(code => { src.value = code; changed(); });
    jar.updateCode(src.value);
    trackCaret(editorEl);
    src.hidden = true; editorEl.hidden = false;
    for (const ev of ['dragover', 'drop']) {
      editorEl.addEventListener(ev, e => { e.preventDefault(); if (ev === 'drop') onFile(e.dataTransfer.files[0]); });
    }
  } catch (err) {
    jar = null; editorEl = null; src.hidden = false;
  }
}
