<p align="center">
  <img src="icons/icon-192.png" alt="rad.io icon" width="128" height="128">
</p>

<h1 align="center">rad.io</h1>

Turn any JavaScript file into music. Paste or drop in code, press play, and every character becomes part of the piece: letters drive the melody, operators become percussion, brackets become chords, and whitespace becomes rests. It isn't tied to JavaScript syntax. Any text works, and the same file always gives the same music.

It's a static page (plain ES modules, no bundler) built on [Tone.js](https://tonejs.github.io/), with [CodeJar](https://medv.io/codejar/) and [Prism](https://prismjs.com/) for the syntax-highlighted code box. There's no build step and nothing to install.

Ten styles are included: an upbeat **Default**, a calm **Chillstep** for background listening, a dusty **Lo-fi** beat for studying, a **Rock / Metal** style with sampled electric guitar and bass, a bright **Chiptune** style with console-style synth voices, a slow, drumless **Ambient** style, a neon **Synthwave** style, a four-on-the-floor **Techno / House** style, an uplifting **Trance** style, and a **Dubstep** style with build-ups and drops. Pick one from the Style menu; a card underneath says what it offers.

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

- **Every text gets its own track:** a seed built from coarse features of the text (its length and line count in powers of two, how much of it is punctuation, capitals, digits and indentation, how long its lines are, and its three most common letters) changes the melody (which note-length table it uses, whether its contour is flipped, how jumpy its steps are, and where the tables start), the starting note and how often the chords return to the tonic in every style, and it also changes the foundation: whole drum grooves and bass lines picked from families in `js/compose/groove.js` (boom-bap, half-time, broken beat, shuffle, four on the floor and more for drums; long root, pulse, offbeat, syncopated, octave and walking lines for bass), so the parts under the melody differ too, even for text with no symbols. The seed also sets where each style's **tempo, scale and key** start, within a range that still suits the style (for example Lo-fi 72–90 BPM in a minor, Dorian, Major or Lydian scale), when a new seed takes effect: picking a style, loading an example or a file, or changing the seed (not while typing, and you can change them afterwards). Lo-fi also gets its own tape tone (how dark, wobbly and saturated it is, and the crackle level), a seeded chord colour (9th, 7th, 6th or plain) and chord loop (8 options), and its melody sometimes sits an octave higher. Each style also makes its own choices from it: the chord loop (Chillstep, Lo-fi, Ambient, Trance, Dubstep), arpeggio shapes and bass bounce (Chiptune), bass line and hat patterns (Synthwave, Techno / House), stab rhythms, kick and hat grooves, drone intervals and chime density (Ambient), riff and kick patterns (Rock / Metal), and in Trance which phrase plays when and small changes to every phrase. The same text always gives the same track, and a small edit (a typo, a changed word, an added line) keeps the same seed, so the music doesn't change under you while you type. The seed's 7-character code shows in the **Seed** box (as the placeholder while it follows the text). **Pin** keeps the current text's seed, so you can swap in any other text and keep the same musical choices; **Random** tries a new one; **Auto** goes back to the text's own. You can also type a code you were given, or any word or phrase (a phrase is turned into a seed), to use that seed with any text. See `js/compose/seed.js`.
- **Share a session:** **Export** saves the text, the seed and the settings (style, key, scale, tempo, melody pace, lead, loop, evolving harmony, background voice, volume and layers) as a small `session.radio.json` file. **Import** (or dropping that file onto the code area) restores all of it, so someone else hears exactly what you did. The seed is always saved, even when it came from the text. Imported files are treated as data: only known fields are read and every value is checked, so an odd file can't change anything it shouldn't.
- **Load code:** type or paste into the code box (JavaScript is syntax-highlighted, and the colors carry over to the playback view), use **File**, drop a file onto the code area, or pick something from the **Load an example** menu: two code snippets, plus public-domain poems, prose and traditional songs (old text works just as well as code, and examples that aren't code are shown without syntax colours).
- **Play / Pause / Stop:** while playing, the code is shown with a moving cursor on the character being played. Play becomes **Pause** (then **Resume**) and a separate **Stop** button appears. Pausing freezes the audio exactly where it is; Stop ends the session and returns to the editor.
- **Start or jump to a character:** while playing or paused, click any character in the code to jump there. To start from a spot, click into the code in the editor and press Play; click at the very start (or type or paste) to start from the beginning again. Chords that began before the spot you jump to aren't re-played, so the harmony catches up at the next chord.
- **Style:** *Default* is an upbeat arrangement. *Chillstep* sets about 70 BPM and a minor scale, with a half-time drum groove, a few long grid-aligned piano notes, and soft piano chords under it, and a recorded electric bass. The chords follow a steady i–VI–III–VII loop with one change per code line, so a new line shifts the harmony gently. The chords sit low under the melody and the bass restates the root every bar, so the harmony never drops out between lines. It's meant as calm background music.
- **Lo-fi:** about 80 BPM in a minor scale, built on the same melody and chord loop as Chillstep but played like a lo-fi beat. The chords gain a 9th and are played as short stabs that follow a boom-bap kick, the bass plays short round notes on the kick pattern, the snare lands on 2 and 4 a touch late with swung hats, and the timing and volumes are slightly loose. The piano and chords go through a gentle tape wobble, a little saturation and a dark lowpass, in a small room, with quiet vinyl crackle on top. Like Chillstep it needs the piano and bass samples and falls back to synths without them.
- **Chiptune:** about 140 BPM in a major scale, built on the default composition and played on simple console-style voices: a pulse-wave lead, chords turned into fast arpeggios, a triangle-wave bass that bounces between octaves on every 8th note, and a tight kick / snare / hat beat in place of the character-driven drum hits. Everything is synthesized, so there is nothing to download.
- **Ambient:** about 60 BPM, built on the Chillstep layout but with nothing struck: each chord change becomes one long, soft drone (chord, low root and fifth) that lasts until the next change, the melody is thinned to a note every few beats and rings long, every few bars a soft gust of wind chimes drifts through, and there are no drums. Soft synthesized voices in a very large reverb; nothing to download.
- **Synthwave:** about 100 BPM in Natural minor, built on the default composition: a bright detuned saw lead with a dotted echo over a wide saw pad, a pulsing 16th-note saw bass on each line's root, and a four-on-the-floor beat in place of the character-driven drum hits. Everything is synthesized; nothing to download.
- **Techno / House:** about 124 BPM in Dorian, built on the default composition: a four-on-the-floor beat (kick, clap on 2 and 4, offbeat open hats, 16th hats) in place of the character-driven drum hits, an offbeat saw bass on each line's root, minor-7th chord stabs in a syncopated rhythm, a thinned, plucky lead, and the kick ducking the bass and stabs for the pump. Everything is synthesized; nothing to download.
- **Trance:** about 140 BPM in Natural minor, built on the default composition: a held supersaw pad per line with a fast pluck arpeggio over it, a rolling 16th bass between the kicks, a supersaw lead that plays like a chorus, in for three two-bar phrases and out for two while the arpeggio gets louder, as two-bar syncopated phrases on each section's chord (long and short notes, a real pause at the end of each phrase with the last note ringing out, a higher lift phrase every fourth; chords follow one of a few minor loops, picked by the text, such as i – v – VI – VII – III) with a dotted echo, arpeggio shapes that change bar to bar, a building snare roll before long chords end, a four-on-the-floor beat in place of the character-driven drum hits, and the kick ducking the pad, arpeggio and bass for the pump. Everything is synthesized; nothing to download.
*Rock / Metal* sets about 150 BPM and the Phrygian scale. Each line is a riff section with palm-muted guitar chugs (straight 8ths, a gallop, or a syncopated half-time rhythm) on a root note. The riff never stops between lines, and it changes bar to bar (rhythm variants, a root move every second bar, chord stabs, and a turnaround) so it doesn't loop. Only one part speeds up at a time: some sections have the lead guitar run up and down the scale in 8ths over a steady rhythm, and others end in a half-bar burst of 16th chugs and double kick while the lead rests. Brackets add power chords, the bass is its own part (several bar shapes that rotate, walking notes that follow the words in the line, and a walk up into the next section's root), the drums pick up accents from the code, and a lead guitar (with vibrato that fades in on held notes) plays over the other sections, mostly a note per beat or per 8th with stepwise pickup notes, and each section centers on a different scale step so the lead keeps moving. The guitar and bass are recorded samples; the drums are synthesized in layers (body tone plus noise or click, a room, and bus compression), and timing and velocity drift slightly, the same way every time, so it feels played rather than sequenced. The first Play in this style downloads about 3 MB of guitar and bass samples.
- **Dubstep:** about 140 BPM in Natural minor, arranged in cycles of intro, build-up and drop (a quarter, a quarter and a half of the cycle, so 4, 4 and 8 bars for 16; a long text repeats the cycle (the first starts with a soft intro; after a drop the intro becomes a breakdown where the tune comes forward over a half-time kick, snare and hats, a louder pad and the sub, with no wobble, and the drops are never closer than half a cycle apart), and even a short one gets at least 8 bars). The intro has a soft pad, a sparse lead phrase, a kick now and then and light hats; the build-up has a lead arpeggio that climbs and gets louder, a riser, and a snare roll that speeds up from quarters to 32nds, then a beat of silence; the drop starts with an impact and is half-time: a held sub, a wobble bass (a distorted FM saw through two band-pass filters swept against each other by tempo-synced LFOs, with a pitch dive into each note, in rhythms that change half-way and fill at the end of every four bars), a hard kick, a snare on beat 3, hats and chord stabs, with the kick ducking the pad, stabs, sub and wobble. Sharp high tones (a bright FM square with a quick pitch dive, plus a rising scream into each four-bar fill) sit between the wobble notes. Every drop develops from the one before: it moves to another chord loop, other wobble rhythms, stab, zap and kick patterns, and a brighter wobble. The seed picks where this starts, the chord loop, the two wobble rhythms, how bright the wobble gets, the stab rhythm, the kick and hat patterns and the intro lead phrase. Text shorter than 200 characters is too little for an intro, a build-up and a drop, so Play is held back with a message saying how many more to add (a style can set `minChars` in `js/styles.js`). Call and response: in some bars the wobble stops and the sharp high tones, doubled by the lead, play a melody of their own that cuts through, then the wobble comes back (one bar in four from the third bar of the first drop, more in later drops). The build-up's climbing lead returns over the drop as an accent (an 8-note run in each fill bar with a short riser, a 4-note run every second bar once the drop has got going). The last bar of every drop is a fill with a falling sweep, and the breakdown lands on a softer impact. In split mode the second half of the text only moves the highlight. Everything is synthesized; nothing to download.
- **Lead:** a sampled grand piano (default), or a plain synth if you're offline. (Rock / Metal always uses a guitar lead and Chiptune a pulse wave and Ambient a soft sine and Synthwave a saw synth and Techno / House a pluck synth and Trance a supersaw and Dubstep a saw.)
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
    groove.js          Drum-groove and bass-line families the seed picks from
    default.js         The Default style's seeded bass line and drum groove
    feel.js            Where each style's tempo, scale and key start for a given seed
    seed.js            The text's seed (coarse features of the text) and the choices it makes
    melody.js          Melody helpers shared by Chillstep, Lo-fi and Rock / Metal
    chill.js           Chillstep transform and drums
    lofi.js            Lo-fi transform (built on Chillstep) and drums
    ambient.js         Ambient transform (held drones, no drums)
    house.js           Techno / House transform (offbeat bass, stabs) and drums
    trance.js          Trance transform (pad, arpeggio, rolling bass, snare builds) and drums
    dubstep.js         Dubstep arrangement (intro, build-up, drop cycles; sub, wobble, stabs) and drums
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
    dubstep-track.js   Dubstep voices (sub, LFO-swept wobble bass, stabs, riser, impact, drums)
    metal-track.js     Rock / Metal voices
    samples.js         Sample URLs and loaders
    play.js            Plays one event
  ui/                  Page behaviour
    dom.js             Shared element lookups
    minimal.js         Minimal view (equalizer only, controls on mouse move)
    settings.js        Reads the style, key, scale and other controls
    editor.js          The code box (CodeJar and Prism, or a plain textarea)
    view.js            The playback view and cursor highlighting
    share.js           Export / import a session (text, seed and settings) as a JSON file
    playback.js        Play, pause, stop, seek, scheduling onto the Tone.js Transport
.claude/launch.json    Preview server config for Claude Code
```

The musical tuning is easy to change. The lookup tables at the top of `js/compose/track.js` (`FREQ`, `DUR`, `STEPS`, `PROG`, `BASS`) and `js/scales.js` (`SCALES`) control the melody and harmony, the riff tables are in `js/compose/metal.js`, and the instrument settings are in `js/audio/track.js` and `js/audio/metal-track.js`.

## Adding a style

Every style takes its seeded choices through one helper, so a new style gets the same behaviour as the rest. In `js/compose/index.js` each style gets a `variant` made from the text's seed and the style's name (`variant(seed, 'mystyle')`, from `js/compose/seed.js`) and passes it to its transform and its drums: `mystyleify(r, v)` and `mystyleDrums(total, v)`. Inside, ask it for choices:

- `v.pick('name', n)`: a whole number from 0 to n-1, for choosing a table row or a pattern.
- `v.of('name', list)`: one item from a list.
- `v.chance('name', p)`: yes or no with probability p.
- `v.noise('name')`: a function `x => [0, 1)` for choices made note by note (chimes, crackle).

Rules of thumb:

0. **Vary the foundation too, not only the top.** The seed should change what the bass and the drums do (pick families from `js/compose/groove.js` that suit the style, or add new ones there), otherwise different texts get different melodies over the same bottom end.
1. **Vary the arrangement, not the identity.** Tempo, voices and the overall feel stay the same; the seed picks between versions of that style (a chord loop, a bass rhythm, a hat pattern, a fill), each of which should still sound right on its own.
2. **Offer 2 to 5 options per choice, all of them good.** More choices that matter beat more options per choice. Aim for 3 or 4 independent choices spread across harmony, bass, drums and any signature element.
3. **Use a different name for every choice** within a style, so choices don't move together. Different styles are independent automatically.
4. **Everything must be a pure function of the seed.** Never use `Math.random`; the same text and seed must always give the same track (that is what makes Export and Pin work).
5. **Keep the defaults first**: when a list has an obvious "classic" version, put it first and repeat it so it still comes up often.
6. **Say where the style's feel can move.** Add the style to `FEEL` in `js/compose/feel.js` (a tempo range, the scales that suit it, whether the key may move). If its voices have a tone that can vary (filters, wobble, noise levels), return a `feel(v)` function from its track builder, as `js/audio/lofi-track.js` does.
7. Mention what the seed changes in the style's README paragraph and in its `STYLES` blurb if it is worth knowing.

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
