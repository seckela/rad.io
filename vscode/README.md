# rad.io for VS Code (proof of concept)

Listen to the file you're editing. The extension adds a **rad.io** tab to the bottom panel, next to Terminal and Problems (the player lives there, not in an editor tab; drag it to the sidebar or the secondary side bar if you prefer), hands it your text, and the editor follows along: the character that is playing is highlighted and kept in view.

## Commands (Command Palette, "rad.io")

| Command | What it does |
| --- | --- |
| **Play this file** (`Cmd/Ctrl+Alt+R`) | Plays the whole active file from the start. |
| **Play the selection** | Plays just the selected text. |
| **Play from the cursor** | Plays the file starting at the cursor. |
| **Stop** | Stops playback (also the status-bar button). |
| **Show the player** | Opens the drawer without playing, to change the style, tempo, key and the rest. |

All the controls of the web app (the 13 styles, key, scale, tempo, background voice, layers, seed) are in the panel. The setting `radio.followPlayback` turns the highlight off.

## Narrow and short layouts

In a side bar or a narrow panel the player is a compact strip: the equalizer, Play / Stop, the Style menu and the track's length. The **Settings** button (sliders icon, next to Stop) unfolds the style details, tempo, key, scale, layers and seed, and remembers your choice.

## Mini player

Drag the panel down to a thin strip (under about 190 px tall) and the player shrinks to a mini player: just the equalizer and the Play / Pause and Stop buttons. Drag it back up for the full controls.

## Running it

From source: open this folder (`vscode/`) in VS Code and press `F5` (Run Extension). It uses the web app one folder up.

As an installable file: `python3 vscode/build.py` copies the app into `vscode/media/` and writes `vscode/rad-io-<version>.vsix`; install it with **Extensions: Install from VSIX...**, then run **Developer: Reload Window**. When updating, uninstall the old copy first if the version number is unchanged.

## Notes and limits

- Browsers only start audio after a click inside the page, and a webview is no different: the first time, click **Play** in the drawer once (the status bar will say so). After that the commands work.
- The drawer has to be open or hidden but not closed (switching to another sidebar view is fine) for the music to keep playing.
- Instrument samples (piano, guitar, cello, violin) are fetched from the web the first time a style needs them, so a network connection is needed for those; without one the styles fall back to synthesized voices.
- This is a proof of concept: the music is built from the characters of one file; it doesn't yet use the language server (errors, symbols) or git.
