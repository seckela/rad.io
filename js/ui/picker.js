// The style picker: a card per style plus a detail panel for the selected one. The hidden
// <select id="style"> stays the source of truth (the rest of the app reads and listens to it), so
// choosing a card sets the select and fires its change event like a normal dropdown would.
import { $ } from './dom.js';
import { STYLES } from '../styles.js';
import { vizRetint } from './viz.js';

const sel = $('style'), cards = $('style-cards'), detail = $('style-detail');
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
  for (const s of STYLES) {
    const b = el('button', 'card');
    b.type = 'button';
    b.dataset.style = s.id;
    b.style.setProperty('--tint', s.tint);
    b.append(el('span', 'dot'), el('span', 'name', s.name), el('span', 'tag', s.tagline));
    b.onclick = () => {
      if (sel.value === s.id) return;
      sel.value = s.id;
      sel.dispatchEvent(new Event('change'));
    };
    cards.appendChild(b);
  }
  syncPicker();
}

// Reflects the select's current value in the cards, the detail panel and the visualizer colour.
// Also called when code changes the style without the user (e.g. a failed sample download).
export function syncPicker() {
  const cur = byId[sel.value] || STYLES[0];
  cards.querySelectorAll('.card').forEach(b => {
    const on = b.dataset.style === cur.id;
    b.classList.toggle('on', on);
    b.setAttribute('aria-pressed', String(on));
  });
  const chips = el('ul', 'chips');
  cur.chips.forEach(c => chips.appendChild(el('li', null, c)));
  const parts = [el('h3', null, cur.name), el('p', 'blurb', cur.blurb), chips];
  if (cur.download) parts.push(el('p', 'dl', 'Downloads: ' + cur.download));
  if (cur.note) parts.push(el('p', 'dl', cur.note));
  detail.replaceChildren(...parts);
  document.documentElement.style.setProperty('--bars', cur.tint);
  vizRetint();
}
