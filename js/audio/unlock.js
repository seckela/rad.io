// iOS (Safari and Chrome, which both use WebKit) plays Web Audio on the "ambient" audio channel, so
// it is silent whenever the ring/silent switch is on, even though the page is running normally.
// Anything played through a media element (<audio>) uses the "playback" channel instead, which the
// switch doesn't mute. So on iOS we send Tone's whole output into a MediaStream and play that
// stream from an <audio> element, started from the Play tap. If that can't start, we fall back to
// the normal output. On other platforms none of this runs.
//
// Call unlockAudio() synchronously inside the tap handler (before any await) and releaseAudio()
// when playback stops. Add ?debug to the page URL to show what happened on screen.
export const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) ||
  /[?&]forceios\b/.test(location.search);
const DEBUG = /[?&]debug\b/.test(location.search);

let el = null, stream = null, routed = false, note = '';

function log(msg) {
  note = msg;
  if (!DEBUG) return;
  let d = document.getElementById('audio-debug');
  if (!d) {
    d = document.createElement('div'); d.id = 'audio-debug';
    d.style.cssText = 'position:fixed;left:8px;bottom:8px;right:8px;z-index:20;padding:6px 8px;background:#000c;color:#9f9;font:11px/1.4 ui-monospace,monospace;white-space:pre-wrap;border-radius:6px';
    document.body.appendChild(d);
  }
  let state = 'n/a';
  try { state = Tone.getContext().rawContext.state; } catch (e) {}
  d.textContent = `[unlock v3] ua=${navigator.userAgent.slice(0, 60)}\nios=${isIOS} ctx=${state} routed=${routed} el.paused=${el ? el.paused : 'n/a'} session=${navigator.audioSession ? navigator.audioSession.type : 'n/a'}\n${note}`;
}

function toDirectOutput() {
  try {
    const out = Tone.getDestination().output;
    out.disconnect();
    out.connect(Tone.getContext().rawContext.destination);
    routed = false;
  } catch (e) {}
}

function routeThroughElement() {
  const ctx = Tone.getContext().rawContext;
  if (!ctx.createMediaStreamDestination) return false;
  if (!stream) stream = ctx.createMediaStreamDestination();
  const out = Tone.getDestination().output;
  out.disconnect();
  out.connect(stream);
  routed = true;
  if (!el) {
    el = new Audio();
    el.setAttribute('playsinline', '');
    el.setAttribute('x-webkit-airplay', 'deny');
    el.srcObject = stream.stream;
  }
  const p = el.play();
  if (p && p.catch) p.catch(err => { toDirectOutput(); log('element play failed, using direct output: ' + (err && err.name)); });
  return true;
}

// Shows the status line right away when the URL has ?debug (before Play is pressed), so you can
// tell the page loaded this code.
export function initDebug() { log('loaded; press Play'); }

export function unlockAudio() {
  try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {}
  if (!isIOS) { log('not iOS, nothing to do (add ?forceios to try the iOS path)'); return; }
  try {
    if (!routeThroughElement()) log('MediaStream destination not available');
    else log('routed through <audio>');
  } catch (e) {
    toDirectOutput();
    log('routing failed: ' + (e && e.message));
  }
  setTimeout(() => log(note), 1500);
}

export function releaseAudio() {
  try { if (el) el.pause(); } catch (e) {}
}
