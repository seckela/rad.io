// rad.io for VS Code (a proof of concept). The player is the rad.io web app running in a webview panel; this file hands it the text of the
// editor and draws where it is on the real text. See README.md.
const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

let view = null, ready = false, queued = null, playing = false, status = null, follow = null, decos = null;

// Where the app's files are: media/ inside a packaged extension (see build.py), or the repository above this folder when running from
// source in an Extension Development Host.
function appRoot(ctx) {
  const packed = path.join(ctx.extensionPath, 'media');
  return fs.existsSync(path.join(packed, 'index.html')) ? packed : path.resolve(ctx.extensionPath, '..');
}

// The setting radio.theme: "editor" (the default) takes the editor's colours and font; "radio" keeps rad.io's own look.
const nativeTheme = () => vscode.workspace.getConfiguration('radio').get('theme') !== 'radio';

function pageHtml(ctx, webview) {
  const root = appRoot(ctx);
  const base = webview.asWebviewUri(vscode.Uri.file(root)).toString().replace(/\/?$/, '/');
  const src = webview.cspSource;
  const csp = [
    "default-src 'none'",
    `img-src ${src} https: data: blob:`,
    `style-src ${src} 'unsafe-inline'`,
    `font-src ${src} https: data:`,
    `script-src ${src} 'unsafe-inline' blob: https://cdnjs.cloudflare.com https://cdn.jsdelivr.net`,
    `connect-src ${src} https: blob: data:`,
    `media-src ${src} https: blob: data:`,
    'worker-src blob:',
  ].join('; ');
  let h = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  h = h.replace('<head>', `<head>\n<base href="${base}">\n<meta http-equiv="Content-Security-Policy" content="${csp}">`);
  h = h.replace(/<link rel="manifest"[^>]*>/, '');
  h = h.replace('<body>', `<body class="vscode${nativeTheme() ? ' vs-native' : ''}">`);
  h = h.replace('</body>', '<script type="module" src="js/vscode-bridge.js"></script>\n</body>');
  return h;
}

// The player lives in a view of its own (a tab in the bottom panel next to the terminal, which can be dragged to the side bars), not in an editor tab. The page loads when the view is first opened and is kept alive while it is hidden.
let ctxRef = null;
const provider = {
  resolveWebviewView(v) {
    view = v;
    ready = false;
    v.webview.options = { enableScripts: true, localResourceRoots: [vscode.Uri.file(appRoot(ctxRef))] };
    v.webview.html = pageHtml(ctxRef, v.webview);
    v.webview.onDidReceiveMessage(m => onMessage(ctxRef, m));
    v.onDidDispose(() => { view = null; ready = false; setPlaying(false); });
  },
};

function ensurePanel(ctx, reveal = true) {
  if (view) { if (reveal) view.show(true); }
  else if (reveal) vscode.commands.executeCommand('workbench.view.extension.radio');   // (opens the drawer, which loads the page)
}

function send(ctx, msg) {
  ensurePanel(ctx);
  if (view && ready) view.webview.postMessage(msg); else queued = msg;       // (the page tells us when it has loaded)
}

function onMessage(ctx, m) {
  if (m.type === 'ready') { ready = true; if (queued) { view.webview.postMessage(queued); queued = null; } }
  else if (m.type === 'state') setPlaying(m.playing);
  else if (m.type === 'at') showAt(m.i, m.tr);
  else if (m.type === 'blocked') vscode.window.setStatusBarMessage('rad.io: ' + m.message, 6000);
}

function setPlaying(on) {
  playing = on;
  if (status) { status.text = on ? '$(debug-stop) rad.io' : '$(play) rad.io'; status.tooltip = on ? 'Stop the music' : 'Play this file as music'; status.command = on ? 'radio.stop' : 'radio.playFile'; }
  if (!on) clearAt();
}

// What is being played: the editor's document and where its text starts (a selection starts partway in), with the line starts of the text as
// the page sees it (line breaks are always one character there, whatever the file uses), to turn the page's character index into a position.
function target(editor, range) {
  const doc = editor.document, text = doc.getText(range).replace(/\r\n?/g, '\n');
  const starts = [0];
  for (let k = 0; k < text.length; k++) if (text[k] === '\n') starts.push(k + 1);
  follow = { uri: doc.uri.toString(), line: range.start.line, char: range.start.character, starts, at: [null, null] };
  return text;
}

function positionOf(i) {
  let lo = 0, hi = follow.starts.length - 1;
  while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (follow.starts[mid] <= i) lo = mid; else hi = mid - 1; }
  return new vscode.Position(follow.line + lo, (lo === 0 ? follow.char : 0) + i - follow.starts[lo]);
}

function showAt(i, tr) {
  if (!follow || !vscode.workspace.getConfiguration('radio').get('followPlayback')) return;
  const editor = vscode.window.visibleTextEditors.find(e => e.document.uri.toString() === follow.uri);
  if (!editor) return;
  const pos = positionOf(i);
  follow.at[tr ? 1 : 0] = pos;                                    // (the foreground and the background voice each have a cursor)
  editor.setDecorations(decos.charType, follow.at.filter(Boolean).map(p => new vscode.Range(p, p.translate(0, 1))));
  if (!tr) {
    editor.setDecorations(decos.lineType, [new vscode.Range(pos.line, 0, pos.line, 0)]);
    editor.revealRange(new vscode.Range(pos, pos), vscode.TextEditorRevealType.InCenterIfOutsideViewport);
  }
}

function clearAt() {
  if (follow) follow.at = [null, null];
  for (const e of vscode.window.visibleTextEditors) { e.setDecorations(decos.charType, []); e.setDecorations(decos.lineType, []); }
}

function play(ctx, mode) {
  const editor = vscode.window.activeTextEditor;
  if (!editor) { vscode.window.showInformationMessage('rad.io: open a file to play.'); return; }
  const doc = editor.document;
  const whole = new vscode.Range(0, 0, doc.lineCount, 0);
  let range = whole, offset = 0;
  if (mode === 'selection' && !editor.selection.isEmpty) range = editor.selection;
  const text = target(editor, doc.validateRange(range));
  if (mode === 'cursor') offset = doc.getText(new vscode.Range(range.start, editor.selection.active)).replace(/\r\n?/g, '\n').length;
  const code = !['markdown', 'plaintext'].includes(doc.languageId);
  send(ctx, { type: 'play', text, offset, code });
}

function activate(ctx) {
  ctxRef = ctx;
  decos = {
    charType: vscode.window.createTextEditorDecorationType({ backgroundColor: new vscode.ThemeColor('editor.findMatchBackground'), border: '1px solid', borderColor: new vscode.ThemeColor('editor.findMatchBorder'), borderRadius: '2px' }),
    lineType: vscode.window.createTextEditorDecorationType({ isWholeLine: true, backgroundColor: new vscode.ThemeColor('editor.lineHighlightBackground') }),
  };
  status = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  status.show();
  setPlaying(false);
  ctx.subscriptions.push(
    vscode.window.registerWebviewViewProvider('radio.player', provider, { webviewOptions: { retainContextWhenHidden: true } }),
    status, decos.charType, decos.lineType,
    vscode.commands.registerCommand('radio.playFile', () => play(ctx, 'file')),
    vscode.commands.registerCommand('radio.playSelection', () => play(ctx, 'selection')),
    vscode.commands.registerCommand('radio.playFromCursor', () => play(ctx, 'cursor')),
    vscode.commands.registerCommand('radio.stop', () => { if (view) view.webview.postMessage({ type: 'stop' }); setPlaying(false); }),
    vscode.workspace.onDidChangeConfiguration(ev => { if (ev.affectsConfiguration('radio.theme') && view && ready) view.webview.postMessage({ type: 'theme', native: nativeTheme() }); }),
    vscode.commands.registerCommand('radio.showPanel', () => ensurePanel(ctx)),
  );
}

function deactivate() {}

module.exports = { activate, deactivate };
