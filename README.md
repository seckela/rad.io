# rad.io

Turn any JavaScript file into music. Paste or drop in code, press play, and every character becomes part of the piece: letters drive the melody, operators become percussion, brackets become chords, and whitespace becomes rests. It isn't tied to JavaScript syntax. Any text works, and the same file always gives the same music.

It's a single static page built on [Tone.js](https://tonejs.github.io/), with [CodeJar](https://medv.io/codejar/) and [Prism](https://prismjs.com/) for the syntax-highlighted code box. There's no build step and nothing to install.

Three styles are included: an upbeat **Default**, a calm **Chillstep** for background listening, and a **Rock / Metal** style with sampled electric guitar and bass.

## Getting started

You need a modern browser, an internet connection (Tone.js, Prism, CodeJar, and the piano, guitar, and bass samples load from CDNs), and Python 3 or any other static file server.

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

- **Load code:** type or paste into the code box (JavaScript is syntax-highlighted, and the colors carry over to the playback view), use **File**, drop a file onto the code area, or press **Sample** for a small fizzbuzz example.
- **Play / Stop:** while playing, the code is shown with a moving cursor on the character being played.
- **Style:** *Default* is an upbeat arrangement. *Chillstep* sets about 70 BPM and a minor scale, with a half-time drum groove, a few long grid-aligned piano notes, and soft piano chords under it, and a recorded electric bass. The chords follow a steady i–VI–III–VII loop with one change per code line, so a new line shifts the harmony gently. The chords sit low under the melody and the bass restates the root every bar, so the harmony never drops out between lines. It's meant as calm background music.
*Rock / Metal* sets about 150 BPM and the Phrygian scale. Each line is a riff section with palm-muted guitar chugs (straight 8ths, a gallop, or a syncopated half-time rhythm) on a root note. The riff never stops between lines, and it changes bar to bar (rhythm variants, a root move every second bar, chord stabs, and a turnaround) so it doesn't loop. Only one part speeds up at a time: some sections have the lead guitar run up and down the scale in 8ths over a steady rhythm, and others end in a half-bar burst of 16th chugs and double kick while the lead rests. Brackets add power chords, the bass is its own part (several bar shapes that rotate, walking notes that follow the words in the line, and a walk up into the next section's root), the drums pick up accents from the code, and a lead guitar (with vibrato that fades in on held notes) plays over the other sections, mostly a note per beat or per 8th with stepwise pickup notes, and each section centers on a different scale step so the lead keeps moving. The guitar and bass are recorded samples; the drums are synthesized in layers (body tone plus noise or click, a room, and bus compression), and timing and velocity drift slightly, the same way every time, so it feels played rather than sequenced. The first Play in this style downloads about 3 MB of guitar and bass samples.
- **Lead:** a sampled grand piano (default), or a plain synth if you're offline. (Rock / Metal always uses a guitar lead.)
- **Key, Scale, Tempo, Loop:** these work while playing.
- **Melody pace:** Chillstep and Rock / Metal. Busy, Medium, or Relaxed sets how far apart the lead melody's notes are.
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
- **UI** has the controls, the code editor setup, the cursor highlighting, and scheduling onto the Tone.js Transport.

The musical tuning is easy to change. The lookup tables near the top of the script (`FREQ`, `DUR`, `STEPS`, `PROG`, `BASS`, `SCALES`) control the melody and harmony, and `buildTrack` holds the instrument settings.

## Notes

- Everything runs in the browser, and the code you load is never uploaded anywhere.
- If the piano samples can't be loaded, rad.io falls back to the synth lead, and if the guitar samples can't be loaded it falls back to the Default style. Either way it says so under the code box.
- If the highlighting libraries can't be loaded, the code box falls back to a plain text area, and the music is unaffected, since the sound never depends on syntax.

## Credits

- Audio engine: [Tone.js](https://tonejs.github.io/) (MIT).
- Piano samples: Salamander Grand Piano by Alexander Holm, [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/).
- Electric guitar and bass samples: [tonejs-instruments](https://github.com/nbrosowsky/tonejs-instruments), [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/).
- Syntax-highlighted code box: [CodeJar](https://medv.io/codejar/) (MIT) and [Prism](https://prismjs.com/) (MIT).

The samples are loaded from their public hosts when you play and aren't bundled in this repository.
