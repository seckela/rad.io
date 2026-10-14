#!/usr/bin/env python3
"""Prepares the extension: copies the web app into vscode/media/ (the extension runs it in a webview) and, by default, writes an installable .vsix.

    python3 vscode/build.py                 copy the app, bundle Tone.js if it can be downloaded, write vscode/rad-io-<version>.vsix
    python3 vscode/build.py --media         only copy the app into media/ (what `vsce package` and `vsce publish` run first)
    python3 vscode/build.py --vendor        require Tone.js to be bundled (fail if it cannot be downloaded): used for publishing
    python3 vscode/build.py --tone FILE     bundle this copy of Tone.js 14.8.49 instead of downloading it

Why Tone.js is bundled: the web page loads it from a CDN, and an extension should work offline and not depend on one. The page's Prism
script (code colours for the page's own code box, which is hidden inside VS Code) is dropped. Instrument samples are still fetched on demand.

The hand-made .vsix is for trying the extension locally. To publish, use the real packager from vscode/:  npm install && npx vsce publish
(see the README's "Publishing" section).
"""
import argparse, json, mimetypes, pathlib, re, shutil, sys, urllib.request, zipfile
from xml.sax.saxutils import escape

TONE_URL = 'https://cdnjs.cloudflare.com/ajax/libs/tone/14.8.49/Tone.js'
here = pathlib.Path(__file__).resolve().parent
root = here.parent
media = here / 'media'

ap = argparse.ArgumentParser()
ap.add_argument('--media', action='store_true', help='only copy the app into media/ (no .vsix)')
ap.add_argument('--vendor', action='store_true', help='require Tone.js to be bundled')
ap.add_argument('--tone', help='path to a copy of Tone.js to bundle')
args = ap.parse_args()

if media.exists():
    shutil.rmtree(media)
media.mkdir()
for name in ['index.html', 'css', 'js', 'icons']:
    src = root / name
    (shutil.copytree if src.is_dir() else shutil.copy)(src, media / name)

# Bundle Tone.js and drop the Prism script.
tone = None
try:
    tone = pathlib.Path(args.tone).read_bytes() if args.tone else urllib.request.urlopen(TONE_URL, timeout=60).read()
    if b'Tone' not in tone[:200000] or len(tone) < 100000:
        raise ValueError('that does not look like Tone.js')
except Exception as e:
    if args.vendor:
        sys.exit(f'Could not get Tone.js ({e}). Run this where the network works, or pass --tone FILE.')
    print(f'warning: Tone.js was not bundled ({e}); the page will load it from the CDN')
page = (media / 'index.html').read_text()
page = re.sub(r'<script src="https://cdnjs\.cloudflare\.com/ajax/libs/prism/[^"]*"></script>\n?', '', page)
if tone:
    (media / 'vendor').mkdir()
    (media / 'vendor' / 'Tone.js').write_bytes(tone)
    page = page.replace(f'<script src="{TONE_URL}"></script>', '<script src="vendor/Tone.js"></script>')
(media / 'index.html').write_text(page)
print('copied the app into', media, '(Tone.js bundled)' if tone else '(Tone.js from the CDN)')
if args.media:
    sys.exit(0)

# An installable .vsix: a zip with a small manifest.
pkg = json.loads((here / 'package.json').read_text())
top = ['package.json', 'extension.js', 'README.md', 'LICENSE', 'CHANGELOG.md', 'NOTICE.md', 'icon.png', 'icon.svg']
files = top + sorted(p.relative_to(here).as_posix() for p in media.rglob('*') if p.is_file())
exts = sorted({pathlib.Path(f).suffix.lstrip('.').lower() for f in files if '.' in f} | {'vsixmanifest'})
types = {'js': 'application/javascript', 'json': 'application/json', 'md': 'text/markdown', 'html': 'text/html', 'css': 'text/css',
         'svg': 'image/svg+xml', 'png': 'image/png', 'ico': 'image/x-icon', 'webmanifest': 'application/manifest+json', 'vsixmanifest': 'text/xml'}
content_types = '<?xml version="1.0" encoding="utf-8"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/Content-Types">' + ''.join(
    f'<Default Extension="{e}" ContentType="{types.get(e) or mimetypes.types_map.get("." + e, "application/octet-stream")}"/>' for e in exts) + '<Default Extension="" ContentType="text/plain"/></Types>'
manifest = f'''<?xml version="1.0" encoding="utf-8"?>
<PackageManifest Version="2.0.0" xmlns="http://schemas.microsoft.com/developer/vsx-schema/2011" xmlns:d="http://schemas.microsoft.com/developer/vsx-schema-design/2011">
  <Metadata>
    <Identity Language="en-US" Id="{pkg['name']}" Version="{pkg['version']}" Publisher="{pkg['publisher']}"/>
    <DisplayName>{escape(pkg['displayName'])}</DisplayName>
    <Description xml:space="preserve">{escape(pkg['description'])}</Description>
    <Categories>{','.join(pkg.get('categories', ['Other']))}</Categories>
    <Properties>
      <Property Id="Microsoft.VisualStudio.Code.Engine" Value="{pkg['engines']['vscode']}"/>
    </Properties>
    <License>extension/LICENSE</License>
    <Icon>extension/icon.png</Icon>
  </Metadata>
  <Installation><InstallationTarget Id="Microsoft.VisualStudio.Code"/></Installation>
  <Dependencies/>
  <Assets>
    <Asset Type="Microsoft.VisualStudio.Code.Manifest" Path="extension/package.json" Addressable="true"/>
    <Asset Type="Microsoft.VisualStudio.Services.Content.Details" Path="extension/README.md" Addressable="true"/>
    <Asset Type="Microsoft.VisualStudio.Services.Content.Changelog" Path="extension/CHANGELOG.md" Addressable="true"/>
    <Asset Type="Microsoft.VisualStudio.Services.Content.License" Path="extension/LICENSE" Addressable="true"/>
    <Asset Type="Microsoft.VisualStudio.Services.Icons.Default" Path="extension/icon.png" Addressable="true"/>
  </Assets>
</PackageManifest>
'''
out = here / f"{pkg['name']}-{pkg['version']}.vsix"
with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as z:
    z.writestr('[Content_Types].xml', content_types)
    z.writestr('extension.vsixmanifest', manifest)
    for f in files:
        z.write(here / f, 'extension/' + f)
print('wrote', out, f'({out.stat().st_size // 1024} KB, {len(files)} files)')
