# Publishing to the VS Code Marketplace

This file is for the maintainer; it is not part of the packaged extension.

## One-time setup

1. **Publisher:** sign in at <https://marketplace.visualstudio.com/manage> with a Microsoft account and create the publisher **MikhailThomas** (its ID must match `publisher` in `package.json`).
2. **Token:** at <https://dev.azure.com> (user settings, Personal Access Tokens) create a token with **Organization: All accessible organizations** and scope **Marketplace > Manage**. Keep it secret.
3. **Tools** (needs Node 18+ and Python 3):
   ```
   cd vscode
   npm install
   npx vsce login MikhailThomas      # paste the token
   ```

## Before the first release

- [ ] Try the extension in real VS Code (`python3 vscode/build.py`, install the `.vsix`, or press `F5` in the `vscode/` folder) and check the panel, commands, highlight, themes and compact layouts.
- [ ] Add a screenshot or short GIF to `README.md` (host it in the repo and link the https URL; the Marketplace page is mostly the README).
- [ ] Confirm the sample licences in `NOTICE.md`, especially the cello and violin samples inside tonejs-instruments, which come from other sources.
- [ ] Decide whether to keep `"preview": true` (shows a Preview badge).

## Release

```
cd vscode
npx vsce package          # builds the app into media/ (with Tone.js bundled), checks the manifest and writes rad-io-<version>.vsix
npx vsce publish          # the same, then uploads it
```

`vsce` runs `python3 build.py --media --vendor` first (the `vscode:prepublish` script), which downloads Tone.js 14.8.49, so run it somewhere with network access. For later releases, bump `version` in `package.json`, add a section to `CHANGELOG.md`, and publish again (`npx vsce publish patch` bumps the patch number for you).

## Optional: Open VSX

VSCodium, Cursor and some other editors use <https://open-vsx.org>:

```
npx ovsx publish rad-io-<version>.vsix -p <open-vsx-token>
```
