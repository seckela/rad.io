# Third-party notices

rad.io for VS Code bundles, or loads at run time, the following. Each keeps its own licence.

| Component | Used for | Licence |
| --- | --- | --- |
| [Tone.js](https://tonejs.github.io/) 14.8.49 | Web Audio synthesis and scheduling (bundled in `media/vendor/`) | MIT |
| Salamander Grand Piano, by Alexander Holm (from [tonejs.github.io/audio/salamander](https://tonejs.github.io/audio/salamander/)) | Piano samples, fetched when a style needs them | CC BY 3.0 |
| [tonejs-instruments](https://github.com/nbrosowsky/tonejs-instruments) by Nicholas Brosowsky | Guitar, bass, cello and violin samples, fetched when a style needs them | CC BY 3.0 (as stated by that project) |

The samples are not bundled: they are downloaded from the sites above the first time a style that uses them is played, and the player falls back to synthesized voices if they cannot be reached.
