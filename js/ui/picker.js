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

export function initPicker() {
  for (const s of STYLES) sel.add(new Option(s.name, s.id));
  sel.value = STYLES[0].id;
  syncPicker();
}

// Reflects the select's current value in the info card and the visualizer colour.
// Also called when code changes the style without the user (e.g. a failed sample download).
export function syncPicker() {
  const cur = byId[sel.value] || STYLES[0];
  detail.style.setProperty('--tint', cur.tint);
  const chips = el('ul', 'chips');
  cur.chips.forEach(c => chips.appendChild(el('li', null, c)));
  const parts = [el('h3', null, cur.name + ' · ' + cur.tagline), el('p', 'blurb', cur.blurb), chips];
  if (cur.download) parts.push(el('p', 'dl', 'Downloads: ' + cur.download));
  if (cur.note) parts.push(el('p', 'dl', cur.note));
  detail.replaceChildren(...parts);
  document.documentElement.style.setProperty('--bars', cur.tint);
  vizRetint();
}
