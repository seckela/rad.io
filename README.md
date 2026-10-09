# rad.io

Turn any JavaScript file into music. Paste or drop in code, press play, and every character becomes part of the piece: letters drive the melody, operators become percussion, brackets become chords, and whitespace becomes rests. It isn't tied to JavaScript syntax. Any text works, and the same file always gives the same music.

It's a single static page built on [Tone.js](https://tonejs.github.io/), with no build step and no dependencies to install.

## Getting started

You need a modern browser, an internet connection (Tone.js and the piano samples load from CDNs), and Python 3 or any other static file server.

1. Clone the repo and start a local server from its folder:

   ```bash
   git clone https://github.com/seckela/rad.io.git
   cd rad.io
   python3 -m http.server 8765
   ```

2. Open <http://localhost:8765> in your browser.
3. Press **Play**. Browsers only allow audio after a click, so nothing sounds until you do. The first Play also downloads the piano samples (about 1 MB), so the button reads "Loading piano…" for a moment.

Any static server works if you'd rather not use Python, for example `npx serve`. If you use Claude Code or the Claude desktop app, `.claude/launch.json` already defines a `rad.io` preview server on port 8765.

## Using it

- **Load code:** paste into the text area, use **File**, drop a file onto the code area, or press **Sample** for a small fizzbuzz example.
- **Play / Stop:** while playing, the code is shown with a moving cursor on the character being played.
- **Style:** *Default* is an upbeat arrangement. *Chillstep* sets about 70 BPM and a minor scale, with a half-time drum groove, a few long grid-aligned piano notes, and a soft pad and bass. It's meant as calm background music.
- **Lead:** a sampled grand piano (default), or a plain synth if you're offline.
- **Key, Scale, Tempo, Loop:** these work while playing.
- **Melody pace:** Chillstep only. Busy, Medium, or Relaxed sets how far apart the melody notes are.
- **Evolving harmony:** gives each line its own chord and register so the music changes more over a file.
- **Background:** *Canon* echoes the melody an octave up a beat to two bars later. *Alternating lines* plays odd and even lines at the same time as two tracks. *Off* is a single track. **Canon delay** and **BG volume** adjust the background.
- **Layer toggles:** mute melody, bass, chords, bells and digits, or percussion.

## How characters map to sound

| Character | Sound |
|---|---|
| Letters, `_`, `$` | Lead melody. Step size depends on the letter pair, doubled letters repeat, and the pair also picks the note length. Capitals are accented. |
| Digits | Plucked note at that scale degree (Default style only) |
| `=` | Kick |
| `+ - * / %` | Hi-hat |
| `< > ! & \| ^ ~` | Snare |
| `( [ {` | Pad chord that follows nesting depth; the melody climbs as you nest deeper |
| `) ] }` | Soft resolution chord on the tonic |
| `" ' \`` `;` `?` | Bell tones |
| Space, `, . :` | Rest |
| Newline | Short rest, snapped to the 8th-note grid; blank lines add no extra pause |
| Indentation | Sets the bass note at the start of each line |

The same table is on the page under "How characters map to sound".

## Project layout

```
index.html           The whole app: markup, styles and script
.claude/launch.json  Preview server config for Claude Code
```

Inside `index.html`, the script has three parts:

- **Composition** (`composeTrack`, `compose`, `chillify`, `chillDrums`) turns text into a list of timed events and has no audio code.
- **Audio** (`buildAudio`, `buildTrack`, `sound`) holds the Tone.js instruments and plays events.
- **UI** has the controls, the cursor highlighting, and scheduling onto the Tone.js Transport.

The musical tuning is easy to change. The lookup tables near the top of the script (`FREQ`, `DUR`, `STEPS`, `PROG`, `BASS`, `SCALES`) control the melody and harmony, and `buildTrack` holds the instrument settings.

## Notes

- Everything runs in the browser, and the code you load is never uploaded anywhere.
- If the piano samples can't be loaded, rad.io falls back to the synth lead and says so under the code box.
