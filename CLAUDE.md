# rad.io: project brief

Turns any pasted or dropped JavaScript (really any text) into music. Every character maps to a musical role; the music never depends on syntax, and the same code always plays the same way. One static page, `index.html`, built on Tone.js. No build step.

- **Run:** `python3 -m http.server 8765` in this folder, open http://localhost:8765. (`.claude/launch.json` defines a `rad.io` preview server.)
- **Libraries (CDN, pinned):** Tone.js 14.8.49 (cdnjs), Prism 1.29.0 (cdnjs), CodeJar 4.2.0 (jsDelivr, loaded with a dynamic `import()`; the plain textarea is the fallback).
- **Samples (loaded at play time, not bundled, CC BY 3.0, credited in the footer and README):** Salamander piano (tonejs.github.io), electric guitar and bass from tonejs-instruments (nbrosowsky.github.io).
- **Repo:** github.com/seckela/rad.io. Work lives on branch `rock-metal-style`, **PR #1** (open, ready for review). Git identity for this repo: `Mikhail <me@mikhailthomas.com>`.

## How the code is organised (all in `index.html`)

1. **Composition (no audio code):** `composeTrack` reads the text and emits timed events (16th-note units, `{t, i, k, m, d, v, ...}`; `i` is the cursor's character index). `compose` splits lines across tracks and applies a style. Style transforms: `chillify` (+ `gridMelody`, `groupLeads`, `chillDrums`) and `metalify` (+ `metalDrums`). Default style is the raw `composeTrack` output.
2. **Audio:** `buildAudio` / `buildTrack` (Default, Chillstep) / `buildMetalTrack` build instruments per track (fg and bg); `sound(e, time)` plays one event; `loadAudio`, `loadMetalBuffers`, `loadBassBuffers` fetch samples; `applyMix` applies layer mutes.
3. **UI:** controls, the CodeJar editor, the playback view (`renderView`, `paintLine`, `highlight`), `schedule` onto the Tone.js Transport.

Styles: **Default**, **Chillstep** (70 BPM, Natural minor, half-time drums, sparse grid-aligned piano melody, piano chords, recorded bass, steady i-VI-III-VII chord loop), **Rock / Metal** (150 BPM, Phrygian, sampled guitars and bass, riff sections per line, synthesized layered drums). Background modes: Canon echo, Alternating lines, Off.

## Things that bit us (read before debugging audio)

- `Tone.Sampler` can't take pre-made `ToneAudioBuffer`s: decode once and pass the raw `AudioBuffer`s (`b.get()`).
- Tone is minified: `constructor.name` is useless; use `instanceof Tone.Sampler`.
- `sound()` wraps everything in `try/catch`; when a voice is silent, call its `triggerAttackRelease` directly to see the error.
- `Tone.Offline` needs `Tone.getTransport()`, not `Tone.Transport`. Inside it, schedule your own events and `await audio.reverb.ready` (and `Tone.loaded()` for samplers).
- Metal humanization nudges times by a few ms, so an event at exactly t=0 can land before the render starts: put test notes at t >= 4 units.
- The cursor (`Tone.Draw`) needs animation frames; they pause when the browser pane is hidden, so cursor checks fail there. That is not an app bug.
- Distortion flattens level: set amp-voice loudness with a `Volume` *after* the amp, not on the sampler.

## How we've been working

Claude can't hear the output, so all tuning was done **by measurement**: render each layer offline (`Tone.Offline`), then compute RMS and peak per window, note density, repetition, register, and what changes at each line break; compare before and after. Keep doing that, and say plainly when something is unverified by ear. The user does the listening and reports (usually a specific spot, e.g. "the f in function"), which is the best signal.

## State and open items

- Everything through the Chillstep line-break and harmony work is committed and pushed (PR #1). This file may be newer than the PR.
- **Unverified by ear:** the latest Chillstep changes (recorded bass, piano chords, low compact voicing, bass restating each bar, melody voice-leading) and all of Rock / Metal. Ask for listening notes first.
- **Default style** still picks chord roots from each line's text, uses a synth sine bass and saw pad, and likely has the same horn-like low tones and line-break jumps Chillstep had.
- Ideas not built: bends/slides and real vibrato for the metal lead (needs a custom lead voice; `Tone.Sampler` exposes no pitch bend); real recorded drums (no free, clearly licensed acoustic kit found; Tone.js's drum kits are low-fi machine clips); smoothing Default; a `tools/` folder for the offline measurement scripts (they currently live only in a scratch folder).

## Preferences

- New projects live in `~/code/<name>/`.
- Commit and push only when asked; the user says so explicitly.
- Report outcomes faithfully, including what wasn't tested.
