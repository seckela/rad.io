import { view } from './dom.js';

let charCls = null, lineEls = [], lineText = [], lineOf = null, cur = [null, null];

// Per-character Prism token classes for the whole text (null if Prism isn't available), so the
// playback view can colour each line even when a token, like a comment, spans several lines.
function classifyChars(text) {
  if (!window.Prism) return null;
  const out = new Array(text.length);
  let pos = 0;
  const walk = (tokens, cls) => {
    for (const t of tokens) {
      if (typeof t === 'string') {
        for (let k = 0; k < t.length; k++) out[pos++] = cls;
      } else {
        const own = 'token ' + t.type + (t.alias ? ' ' + [].concat(t.alias).join(' ') : '');
        walk(Array.isArray(t.content) ? t.content : [t.content], own);
      }
    }
  };
  walk(Prism.tokenize(text, Prism.languages.javascript), '');
  return pos === text.length ? out : null;
}

export function renderView(text) {
  view.textContent = '';
  charCls = classifyChars(text);
  lineEls = []; lineText = text.split('\n');
  lineOf = new Uint32Array(text.length + 1);
  let start = 0;
  lineText.forEach((ln, li) => {
    const div = document.createElement('div');
    view.appendChild(div);
    lineEls.push(div);
    for (let j = 0; j <= ln.length; j++) lineOf[start + j] = li;
    start += ln.length + 1;
  });
  view.dataset.starts = '';
  view._starts = [];
  let s = 0; lineText.forEach(ln => { view._starts.push(s); s += ln.length + 1; });
  cur = [null, null];
  lineText.forEach((_, li) => paintLine(li));
}

// Rebuilds one line from runs of same-coloured characters, with a cursor mark on the character
// each track is playing (foreground wins if both are on the same one).
function paintLine(li) {
  const el = lineEls[li], ln = lineText[li], start = view._starts[li];
  const at = [0, 1].map(tr => cur[tr] && cur[tr].li === li ? cur[tr].col : -1);
  el.textContent = '';
  let run = null;
  const flush = () => {
    if (!run) return;
    if (run.mtr >= 0) {
      const mark = document.createElement('mark');
      if (run.mtr) mark.className = 'bg';
      mark.textContent = run.text;
      el.append(mark);
    } else if (run.cls) {
      const span = document.createElement('span');
      span.className = run.cls;
      span.textContent = run.text;
      el.append(span);
    } else {
      el.append(run.text);
    }
    run = null;
  };
  for (let col = 0; col <= ln.length; col++) {
    const mtr = at[0] === col ? 0 : at[1] === col ? 1 : -1;
    if (col === ln.length && mtr < 0) break;                     // the newline only shows when it's the cursor
    const ch = col < ln.length ? ln[col] : '\u00a0';
    const cls = mtr >= 0 ? '' : (charCls && charCls[start + col]) || '';
    if (run && mtr < 0 && run.mtr < 0 && run.cls === cls) run.text += ch;
    else { flush(); run = { cls, text: ch, mtr }; }
  }
  flush();
}

export function highlight(i, tr) {
  const li = lineOf[i], old = cur[tr];
  cur[tr] = { li, col: i - view._starts[li] };
  paintLine(li);
  if (old && old.li !== li) paintLine(old.li);
  if (!tr && (!old || old.li !== li)) view.scrollTop = lineEls[li].offsetTop - view.clientHeight / 2;
}

// The index of the character under a screen point (for click-to-seek), or null. Uses a DOM range
// from the start of the line, so it doesn't matter how the line is split into spans and marks.
export function indexFromPoint(x, y) {
  let node, off;
  if (document.caretPositionFromPoint) {
    const pos = document.caretPositionFromPoint(x, y);
    if (!pos) return null;
    node = pos.offsetNode; off = pos.offset;
  } else if (document.caretRangeFromPoint) {
    const r = document.caretRangeFromPoint(x, y);
    if (!r) return null;
    node = r.startContainer; off = r.startOffset;
  } else return null;
  const el = node.nodeType === 1 ? node : node.parentElement;
  const div = el && el.closest('#view > div');
  if (!div) return null;
  const li = lineEls.indexOf(div);
  if (li < 0) return null;
  const range = document.createRange();
  range.setStart(div, 0);
  range.setEnd(node, off);
  return view._starts[li] + Math.min(range.toString().length, lineText[li].length);
}
