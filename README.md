<p align="center">
  <img src="icons/icon-192.png" alt="rad.io icon" width="128" height="128">
</p>

<h1 align="center">rad.io</h1>

Turn any JavaScript file into music. Paste or drop in code, press play, and every character becomes part of the piece: letters drive the melody, operators become percussion, brackets become chords, and whitespace becomes rests. It isn't tied to JavaScript syntax. Any text works, and the same file always gives the same music.

It's a static page (plain ES modules, no bundler) built on [Tone.js](https://tonejs.github.io/), with [CodeJar](https://medv.io/codejar/) and [Prism](https://prismjs.com/) for the syntax-highlighted code box. There's no build step and nothing to install.

Nine styles are included: an upbeat **Default**, a calm **Chillstep** for background listening, a dusty **Lo-fi** beat for studying, a **Rock / Metal** style with sampled electric guitar and bass, a bright **Chiptune** style with console-style synth voices, a slow, drumless **Ambient** style, a neon **Synthwave** style, a four-on-the-floor **Techno / House** style, and an uplifting **Trance** style. Pick one from the Style menu; a card underneath says what it offers.

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

- **Load code:** type or paste into the code box (JavaScript is syntax-highlighted, and the colors carry over to the playback view), use **File**, drop a file onto the code area, or pick something from the **Load an example** menu: two code snippets, plus public-domain poems, prose and traditional songs (old text works just as well as code, and examples that aren't code are shown without syntax colours).
- **Play / Pause / Stop:** while playing, the code is shown with a moving cursor on the character being played. Play becomes **Pause** (then **Resume**) and a separate **Stop** button appears. Pausing freezes the audio exactly where it is; Stop ends the session and returns to the editor.
- **Start or jump to a character:** while playing or paused, click any character in the code to jump there. To start from a spot, click into the code in the editor and press Play; click at the very start (or type or paste) to start from the beginning again. Chords that began before the spot you jump to aren't re-played, so the harmony catches up at the next chord.
- **Style:** *Default* is an upbeat arrangement. *Chillstep* sets about 70 BPM and a minor scale, with a half-time drum groove, a few long grid-aligned piano notes, and soft piano chords under it, and a recorded electric bass. The chords follow a steady i–VI–III–VII loop with one change per code line, so a new line shifts the harmony gently. The chords sit low under the melody and the bass restates the root every bar, so the harmony never drops out between lines. It's meant as calm background music.
- **Lo-fi:** about 80 BPM in a minor scale, built on the same melody and chord loop as Chillstep but played like a lo-fi beat. The chords gain a 9th and are played as short stabs that follow a boom-bap kick, the bass plays short round notes on the kick pattern, the snare lands on 2 and 4 a touch late with swung hats, and the timing and volumes are slightly loose. The piano and chords go through a gentle tape wobble, a little saturation and a dark lowpass, in a small room, with quiet vinyl crackle on top. Like Chillstep it needs the piano and bass samples and falls back to synths without them.
- **Chiptune:** about 140 BPM in a major scale, built on the default composition and played on simple console-style voices: a pulse-wave lead, chords turned into fast arpeggios, a triangle-wave bass that bounces between octaves on every 8th note, and a tight kick / snare / hat beat in place of the character-driven drum hits. Everything is synthesized, so there is nothing to download.
- **Ambient:** about 60 BPM, built on the Chillstep layout but with nothing struck: each chord change becomes one long, soft drone (chord, low root and fifth) that lasts until the next change, the melody is thinned to a note every few beats and rings long, every few bars a soft gust of wind chimes drifts through, and there are no drums. Soft synthesized voices in a very large reverb; nothing to download.
- **Synthwave:** about 100 BPM in Natural minor, built on the default composition: a bright detuned saw lead with a dotted echo over a wide saw pad, a pulsing 16th-note saw bass on each line's root, and a four-on-the-floor beat in place of the character-driven drum hits. Everything is synthesized; nothing to download.
- **Techno / House:** about 124 BPM in Dorian, built on the default composition: a four-on-the-floor beat (kick, clap on 2 and 4, offbeat open hats, 16th hats) in place of the character-driven drum hits, an offbeat saw bass on each line's root, minor-7th chord stabs in a syncopated rhythm, a thinned, plucky lead, and the kick ducking the bass and stabs for the pump. Everything is synthesized; nothing to download.
- **Trance:** about 140 BPM in Natural minor, built on the default composition: a held supersaw pad per line with a fast pluck arpeggio over it, a rolling 16th bass between the kicks, a supersaw lead that plays like a chorus, in for three two-bar phrases and out for two while the arpeggio gets louder, as two-bar syncopated phrases on each section's chord (long and short notes, a real pause at the end of each phrase with the last note ringing out, a higher lift phrase every fourth; chords follow a fixed i – v – VI – VII – III minor loop) with a dotted echo, arpeggio shapes that change bar to bar, a building snare roll before long chords end, a four-on-the-floor beat in place of the character-driven drum hits, and the kick ducking the pad, arpeggio and bass for the pump. Everything is synthesized; nothing to download.
*Rock / Metal* sets about 150 BPM and the Phrygian scale. Each line is a riff section with palm-muted guitar chugs (straight 8ths, a gallop, or a syncopated half-time rhythm) on a root note. The riff never stops between lines, and it changes bar to bar (rhythm variants, a root move every second bar, chord stabs, and a turnaround) so it doesn't loop. Only one part speeds up at a time: some sections have the lead guitar run up and down the scale in 8ths over a steady rhythm, and others end in a half-bar burst of 16th chugs and double kick while the lead rests. Brackets add power chords, the bass is its own part (several bar shapes that rotate, walking notes that follow the words in the line, and a walk up into the next section's root), the drums pick up accents from the code, and a lead guitar (with vibrato that fades in on held notes) plays over the other sections, mostly a note per beat or per 8th with stepwise pickup notes, and each section centers on a different scale step so the lead keeps moving. The guitar and bass are recorded samples; the drums are synthesized in layers (body tone plus noise or click, a room, and bus compression), and timing and velocity drift slightly, the same way every time, so it feels played rather than sequenced. The first Play in this style downloads about 3 MB of guitar and bass samples.
- **Lead:** a sampled grand piano (default), or a plain synth if you're offline. (Rock / Metal always uses a guitar lead and Chiptune a pulse wave and Ambient a soft sine and Synthwave a saw synth and Techno / House a pluck synth and Trance a supersaw.)
- **Key, Scale, Tempo, Loop:** these work while playing.
- **Melody pace:** Chillstep, Lo-fi, Ambient and Rock / Metal. Busy, Medium, or Relaxed sets how far apart the lead melody's notes are.
- **Evolving harmony:** gives each line its own chord and register so the music changes more over a file.
- **Background:** *Canon* echoes the melody an octave up a beat to two bars later. *Alternating lines* plays odd and even lines at the same time as two tracks. *Off* is a single track. **Canon delay** and **BG volume** adjust the background.
- **Minimal view:** the button next to Play hides everything but the {rad.io} strip, which fills the page and becomes the equalizer while music plays. Moving the mouse (or tapping) shows Play / Pause, Stop and Full view for a couple of seconds; Esc goes back and Space plays or pauses.
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
index.html             Markup, plus the Tone.js and Prism script tags
css/style.css          Styles
js/
  main.js              Entry point: fills the menus, wires up the controls
  sample.js            The example texts behind the Examples menu
  scales.js            Keys and scales
  compose/             Text to timed events (no audio code)
    track.js           Per-line composition and the melody/harmony lookup tables
    melody.js          Melody helpers shared by Chillstep, Lo-fi and Rock / Metal
    chill.js           Chillstep transform and drums
    lofi.js            Lo-fi transform (built on Chillstep) and drums
    ambient.js         Ambient transform (held drones, no drums)
    house.js           Techno / House transform (offbeat bass, stabs) and drums
    trance.js          Trance transform (pad, arpeggio, rolling bass, snare builds) and drums
    synthwave.js       Synthwave transform (pulsing bass, held chords) and drums
    chip.js            Chiptune transform (arpeggios, bouncing bass) and drums
    metal.js           Rock / Metal transform, riff tables and drums
    index.js           compose(): splits lines across tracks and applies a style
  audio/               Tone.js instruments and playback
    engine.js          The current set of voices, plus build and dispose
    track.js           Default and Chillstep voices
    lofi-track.js      Lo-fi voices and tape effects
    chip-track.js      Chiptune voices
    ambient-track.js   Ambient voices
    synthwave-track.js Synthwave voices
    house-track.js     Techno / House voices
    trance-track.js    Trance voices
    metal-track.js     Rock / Metal voices
    samples.js         Sample URLs and loaders
    play.js            Plays one event
  ui/                  Page behaviour
    dom.js             Shared element lookups
    minimal.js         Minimal view (equalizer only, controls on mouse move)
    settings.js        Reads the style, key, scale and other controls
    editor.js          The code box (CodeJar and Prism, or a plain textarea)
    view.js            The playback view and cursor highlighting
    playback.js        Play, pause, stop, seek, scheduling onto the Tone.js Transport
.claude/launch.json    Preview server config for Claude Code
```

The musical tuning is easy to change. The lookup tables at the top of `js/compose/track.js` (`FREQ`, `DUR`, `STEPS`, `PROG`, `BASS`) and `js/scales.js` (`SCALES`) control the melody and harmony, the riff tables are in `js/compose/metal.js`, and the instrument settings are in `js/audio/track.js` and `js/audio/metal-track.js`.

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

## Deploying

Browsers cache each script on its own, so after an upload one can keep an old copy of a file next to new copies of the rest (the page then fails with "does not provide an export named ..."). `index.html` therefore lists every module with a short hash of its contents in its URL (an import map), so a file's URL changes exactly when the file does. After changing anything under `js/` or `css/`, run

```
python3 tools/stamp.py
```

before uploading (`python3 tools/stamp.py --check` reports whether `index.html` is up to date without changing it). Browsers without import map support just load the plain URLs, as before.
