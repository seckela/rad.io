# rad.io: Listen to your code

Turn the file you are editing into music. Every character becomes part of a track (letters make the melody, symbols make the drums, brackets make the chords), and the editor follows along: the character that is playing is highlighted and kept in view.

It is the [rad.io](https://github.com/seckela/rad.io) web app running in a panel inside VS Code, with 13 styles to choose from: Default, Chillstep, Lo-fi, Rock / Metal, Emo / Pop Punk, Chiptune, Ambient, Synthwave, Techno / House, Trance, Dubstep, Neo-classical and Cinematic. The same text always gives the same track.

## Using it

A **rad.io** tab opens in the bottom panel (next to Terminal and Problems) the first time you play. Drag it to a side bar if you prefer it there.

Open the Command Palette and type "rad.io":

| Command | What it does |
| --- | --- |
| **Play this file** (`Cmd+Alt+R` / `Ctrl+Alt+R`) | Plays the active file from the start. |
| **Play the selection** (also in the right-click menu) | Plays just the selected text. |
| **Play from the cursor** (also in the right-click menu) | Plays the file starting at the cursor. |
| **Stop** | Stops playback. The **rad.io** button in the status bar toggles play and stop. |
| **Show the player** | Opens the panel without playing, to change the style, tempo, key, scale, background voice, layers and seed. |

The first time, click **Play** in the panel once: audio cannot start without a click inside it, and the status bar tells you if a command was not enough. Keep the tab open (it can sit behind the terminal) while the music plays.

In a narrow side bar the player is a compact strip (the equalizer, Play / Stop, the Style menu and the track length), and the **Settings** button unfolds everything else. Drag the panel down to a thin strip and it becomes a mini player with just Play / Pause and Stop.

## Settings

| Setting | Default | What it does |
| --- | --- | --- |
| `radio.theme` | `editor` | `editor` follows your VS Code theme (colours, font, light or dark); `radio` keeps rad.io's own dark look. |
| `radio.followPlayback` | `true` | Highlights the character that is playing in the editor and scrolls to keep it in view. |

## Good to know

- **Network:** the instrument samples (piano, guitar, bass, cello and violin) are downloaded the first time a style needs them, from `tonejs.github.io` and `nbrosowsky.github.io`; with no connection the styles fall back to synthesized voices. Nothing about your code is sent anywhere: the music is made on your machine, and the extension collects no telemetry.
- **Your files are not changed.** The extension only reads the text of the file you play.
- The music is built from the characters of one file. It does not (yet) use errors, symbols or git history.

## Credits and licence

MIT licensed. Sounds are made with [Tone.js](https://tonejs.github.io/) (MIT); the piano samples are the Salamander Grand Piano by Alexander Holm (CC BY 3.0) and the guitar, bass, cello and violin samples come from [tonejs-instruments](https://github.com/nbrosowsky/tonejs-instruments) (CC BY 3.0). See `NOTICE.md`.

Issues and ideas: <https://github.com/seckela/rad.io/issues>
