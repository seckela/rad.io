// Connects the page to the VS Code extension (see vscode/). It does nothing outside a VS Code webview. The extension sends the text to
// play (a file, a selection) and where to start; the page tells the extension where playback is, so the real editor can follow along,
// and whether it is playing, for the status bar.
import { $, playBtn } from './ui/dom.js';
import { setCode, getText } from './ui/editor.js';
import { onHighlight } from './ui/view.js';
import { vizRetint } from './ui/viz.js';
import { applyFeel, start, stop, updateStats, playing } from './ui/playback.js';
import { compose } from './compose/index.js';
import { getKey, getScale, getOpts } from './ui/settings.js';

if (typeof acquireVsCodeApi === 'function') {
  const vs = acquireVsCodeApi();
  const post = m => vs.postMessage(m);
  let loaded = null;                       // the text last handed over, so a repeat play doesn't reset the seed's tempo, scale and key

  // The Settings button folds the style card, the controls and the seed away or brings them back (the choice is remembered).
  const more = document.createElement('button');
  more.id = 'vs-more'; more.type = 'button'; more.title = 'Settings: style details, tempo, key, scale, layers and seed';
  more.setAttribute('aria-label', 'Settings');
  more.innerHTML = '<svg class="ico" viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><path d="M2 4.5h7M12 4.5h2M2 11.5h2M7 11.5h7"/><circle cx="10.5" cy="4.5" r="1.6"/><circle cx="5.5" cy="11.5" r="1.6"/></svg>';
  $('stop').after(more);
  const showMore = on => { document.body.classList.toggle('vs-more', on); more.setAttribute('aria-expanded', String(on)); };
  showMore(!!(vs.getState() || {}).more);
  more.onclick = () => { const on = !document.body.classList.contains('vs-more'); showMore(on); vs.setState({ ...(vs.getState() || {}), more: on }); };

  // VS Code switches a class on <body> (vscode-dark, vscode-light, ...) when the theme changes; the equalizer reads its colour once, so refresh it.
  new MutationObserver(() => requestAnimationFrame(vizRetint)).observe(document.body, { attributes: true, attributeFilter: ['class', 'data-vscode-theme-id'] });

  onHighlight((i, tr) => post({ type: 'at', i, tr }));
  new MutationObserver(() => post({ type: 'state', playing })).observe($('stop'), { attributes: true, attributeFilter: ['hidden'] });

  window.addEventListener('message', async ({ data: m }) => {
    if (!m) return;
    if (m.type === 'theme') { document.body.classList.toggle('vs-native', !!m.native); requestAnimationFrame(vizRetint); return; }
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
