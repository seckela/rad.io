import { $, src } from './dom.js';

let jar = null, editorEl = null;   // syntax-highlighting editor (CodeJar); null means the plain textarea is in use

export const getText = () => (jar ? jar.toString() : src.value).replace(/\r\n?/g, '\n');

export function setCode(text) { src.value = text; if (jar) jar.updateCode(text); }

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
    jar.onUpdate(code => { src.value = code; });
    jar.updateCode(src.value);
    src.hidden = true; editorEl.hidden = false;
    for (const ev of ['dragover', 'drop']) {
      editorEl.addEventListener(ev, e => { e.preventDefault(); if (ev === 'drop') onFile(e.dataTransfer.files[0]); });
    }
  } catch (err) {
    jar = null; editorEl = null; src.hidden = false;
  }
}
