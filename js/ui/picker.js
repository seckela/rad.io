// The style picker: a dropdown plus an info card for the selected style. <select id="style"> is the
// source of truth (the rest of the app reads and listens to it); this fills it from STYLES and
// keeps the info card and visualizer colour in step with it. The list can grow without taking space.
import { $ } from './dom.js';
import { STYLES } from '../styles.js';
import { vizRetint } from './viz.js';

const sel = $('style'), detail = $('style-detail');
const byId = Object.fromEntries(STYLES.map(s => [s.id, s]));

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}

const KEY = 'radio.styleCard';
let open = true;
try { open = localStorage.getItem(KEY) !== 'closed'; } catch (e) { /* private mode: just stay open */ }

let head = null, body = null;

function setOpen(v) {
  open = v;
  detail.classList.toggle('closed', !open);
  head.setAttribute('aria-expanded', String(open));
  try { localStorage.setItem(KEY, open ? 'open' : 'closed'); } catch (e) { /* not essential */ }
}

export function initPicker() {
  for (const s of STYLES) sel.add(new Option(s.name, s.id));
  sel.value = STYLES[0].id;
  // The card has a header that doubles as the expand / collapse button, and a body that is rebuilt per style.
  head = el('button', 'detail-head');
  head.type = 'button';
  head.setAttribute('aria-controls', 'style-body');
  head.onclick = () => setOpen(!open);
  body = el('div', 'detail-body');
  body.id = 'style-body';
  detail.replaceChildren(head, body);
  setOpen(open);
  syncPicker();
}

// Reflects the select's current value in the info card and the visualizer colour.
// Also called when code changes the style without the user (e.g. a failed sample download).
export function syncPicker() {
  const cur = byId[sel.value] || STYLES[0];
  detail.style.setProperty('--tint', cur.tint);
  head.replaceChildren(el('span', 'title', cur.name), el('span', 'tag', cur.tagline), el('span', 'chev'));
  const chips = el('ul', 'chips');
  cur.chips.forEach(c => chips.appendChild(el('li', null, c)));
  const parts = [el('p', 'blurb', cur.blurb), chips];
  if (cur.download) parts.push(el('p', 'dl', 'Downloads: ' + cur.download));
  if (cur.note) parts.push(el('p', 'dl', cur.note));
  parts.push(el('p', 'dl', 'Each style sets a fitting tempo and scale, which you can still change below.'));
  body.replaceChildren(...parts);
  document.documentElement.style.setProperty('--bars', cur.tint);
  vizRetint();
}
