// Minimal view: only the {rad.io} strip / equalizer is shown, filling the page. Moving the mouse (or tapping) fades in a small
// bar with Play / Pause, Stop and a way back to the full view; it fades out again after a moment. The bar's buttons mirror the
// real ones (a MutationObserver copies the Play button's label and the Stop button's visibility), so the playback code
// doesn't need to know this view exists. Escape also goes back, and Space plays / pauses.
import { $, playBtn } from './dom.js';
import { vizMinimal } from './viz.js';

const IDLE_MS = 2500;
const stopBtn = $('stop'), miniPlay = $('mini-play'), miniStop = $('mini-stop'), bar = $('mini-bar');
let on = false, timer = 0;

function mirror() {
  miniPlay.innerHTML = playBtn.innerHTML;
  miniPlay.disabled = playBtn.disabled;
  miniStop.innerHTML = stopBtn.innerHTML;
  miniStop.hidden = stopBtn.hidden;
}

function wake() {
  if (!on) return;
  bar.classList.add('show');
  document.body.classList.remove('idle');
  clearTimeout(timer);
  timer = setTimeout(() => {
    if (bar.matches(':hover') || bar.contains(document.activeElement) && document.activeElement.matches(':focus-visible')) { wake(); return; }
    bar.classList.remove('show');
    document.body.classList.add('idle');          // hides the mouse pointer too
  }, IDLE_MS);
}

function set(v) {
  on = v;
  document.body.classList.toggle('mini', on);
  $('mini-on').setAttribute('aria-pressed', String(on));
  bar.setAttribute('aria-hidden', String(!on));
  if (on) { mirror(); window.scrollTo(0, 0); wake(); }
  else { clearTimeout(timer); bar.classList.remove('show'); document.body.classList.remove('idle'); }
  vizMinimal(on);                                  // reads the new layout, so it has to come after the class change
}

export function initMinimal() {
  $('mini-on').onclick = () => set(true);
  $('mini-exit').onclick = () => set(false);
  miniPlay.onclick = () => { playBtn.click(); wake(); };
  miniStop.onclick = () => { stopBtn.click(); wake(); };
  new MutationObserver(mirror).observe(playBtn, { childList: true, characterData: true, subtree: true, attributes: true });
  new MutationObserver(mirror).observe(stopBtn, { attributes: true, attributeFilter: ['hidden'] });
  for (const ev of ['pointermove', 'pointerdown']) window.addEventListener(ev, wake, { passive: true });
  document.addEventListener('keydown', e => {
    if (!on) return;
    if (e.key === 'Escape') { set(false); return; }
    if (e.key === ' ' && !(e.target instanceof HTMLButtonElement)) { e.preventDefault(); playBtn.click(); }
    wake();
  });
}
