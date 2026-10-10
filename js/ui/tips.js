// Small "?" help icons next to each control, with one shared tooltip. Works on hover, keyboard
// focus and tap (the icons are focusable). The text lives here so index.html stays readable.
import { $ } from './dom.js';

const TIPS = {
  style: 'The overall sound. Default is upbeat, Chillstep is slow and calm, Lo-fi is a dusty swung beat, Rock / Metal uses sampled guitars. Picking one also sets a fitting tempo and scale.',
  leadsound: 'What plays the melody: sampled piano, or a plain synth that needs no downloads. Rock / Metal always uses guitar.',
  gap: 'How busy the melody is. Busy plays a note every few beats, Relaxed leaves more space. Applies to Chillstep, Lo-fi and Rock / Metal.',
  key: 'The home note the music is built around. Changing it moves everything up or down together.',
  scale: 'The set of notes the melody and chords use, which sets the mood. Dorian and Natural minor sound moody, Major sounds bright, Phrygian sounds dark.',
  tempo: 'Speed in beats per minute. You can change it while it plays.',
  loop: 'Start over when the music reaches the end instead of stopping.',
  vary: 'Gives each line its own chord and register, so the music changes more across a file. Turn it off for a plainer, more repetitive sound.',
  bgmode: 'A second, quieter voice. Canon echoes the melody a little later. Alternating lines plays odd and even lines at the same time as two voices. Off plays a single voice.',
  delay: 'How far behind the echo comes. Only used by Canon.',
  bgvol: 'Volume of the background voice. Further left is quieter.',
  file: 'Load a file from your computer instead of pasting. You can also drop a file onto the code area.',
};
const LAYER_TIPS = {
  lead: 'Mute or unmute the melody (letters).',
  bass: 'Mute or unmute the bass line.',
  pad: 'Mute or unmute the chords (brackets).',
  accent: 'Mute or unmute the bells and plucked notes (quotes and digits).',
  perc: 'Mute or unmute the drums (operators and symbols).',
};

function addIcon(label, text) {
  if (!label || label.querySelector('.tip')) return;
  const tip = document.createElement('span');
  tip.className = 'tip';
  tip.tabIndex = 0;
  tip.setAttribute('role', 'note');
  tip.setAttribute('aria-label', text);
  tip.dataset.tip = text;
  tip.textContent = '?';
  label.appendChild(tip);
  label.removeAttribute('title');      // the icon replaces any native tooltip on the label
}

export function initTips() {
  for (const [id, text] of Object.entries(TIPS)) {
    const el = $(id);
    if (el) addIcon(el.closest('label'), text);
  }
  document.querySelectorAll('[data-layer]').forEach(c => addIcon(c.closest('label'), LAYER_TIPS[c.dataset.layer]));

  const box = document.createElement('div');
  box.className = 'tip-box';
  box.setAttribute('aria-hidden', 'true');
  document.body.appendChild(box);

  const show = tip => {
    box.textContent = tip.dataset.tip;
    box.style.visibility = 'hidden'; box.classList.add('on');
    const r = tip.getBoundingClientRect(), w = box.offsetWidth, h = box.offsetHeight, m = 8;
    let x = Math.min(Math.max(m, r.left + r.width / 2 - w / 2), window.innerWidth - w - m);
    let y = r.bottom + 8;
    if (y + h > window.innerHeight - m) y = Math.max(m, r.top - h - 8);   // flip above if no room below
    box.style.left = x + 'px'; box.style.top = y + 'px'; box.style.visibility = '';
  };
  const hide = () => box.classList.remove('on');
  const target = e => e.target.closest && e.target.closest('.tip');

  document.addEventListener('mouseover', e => { const t = target(e); if (t) show(t); });
  document.addEventListener('mouseout', e => { if (target(e)) hide(); });
  document.addEventListener('focusin', e => { const t = target(e); if (t) show(t); });
  document.addEventListener('focusout', e => { if (target(e)) hide(); });
  // The icon sits inside its <label>; stop a tap on it from toggling or focusing the control.
  document.addEventListener('click', e => { if (target(e)) e.preventDefault(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') hide(); });
  window.addEventListener('scroll', hide, true);
}
