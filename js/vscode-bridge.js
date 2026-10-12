// Connects the page to the VS Code extension (see vscode/). It does nothing outside a VS Code webview. The extension sends the text to
// play (a file, a selection) and where to start; the page tells the extension where playback is, so the real editor can follow along,
// and whether it is playing, for the status bar.
import { $, playBtn } from './ui/dom.js';
import { setCode, getText } from './ui/editor.js';
import { onHighlight } from './ui/view.js';
import { applyFeel, start, stop, updateStats, playing } from './ui/playback.js';
import { compose } from './compose/index.js';
import { getKey, getScale, getOpts } from './ui/settings.js';

if (typeof acquireVsCodeApi === 'function') {
  const vs = acquireVsCodeApi();
  const post = m => vs.postMessage(m);
  let loaded = null;                       // the text last handed over, so a repeat play doesn't reset the seed's tempo, scale and key

  onHighlight((i, tr) => post({ type: 'at', i, tr }));
  new MutationObserver(() => post({ type: 'state', playing })).observe($('stop'), { attributes: true, attributeFilter: ['hidden'] });

  window.addEventListener('message', async ({ data: m }) => {
    if (!m) return;
    if (m.type === 'stop') { if (playing) stop(); return; }
    if (m.type !== 'play' && m.type !== 'load') return;
    if (playing) stop();
    if (m.text !== loaded) {
      loaded = m.text;
      setCode(m.text, !m.code);            // (plain text, like a Markdown file, is shown without code colours)
      applyFeel();                         // the text's seed sets the tempo, scale and key, as when loading a file in the page
      updateStats(getText().length, compose(getText(), getKey(), getScale(), getOpts()).total);
    }
    if (m.type === 'play') {
      try { await start(m.offset > 0 ? m.offset : null); }
      catch (err) { post({ type: 'blocked', message: String(err && err.message || err) }); }
      // Browsers only let audio start after a click inside the page. If this play was started from a command, the context may still be asleep.
      try { if (Tone.getContext().rawContext.state !== 'running') post({ type: 'blocked', message: 'click Play in the rad.io panel once to allow sound' }); } catch (e) { /* no audio context */ }
    }
  });
  post({ type: 'ready' });
}
