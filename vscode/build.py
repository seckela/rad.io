#!/usr/bin/env python3
"""Copies the web app into vscode/media/ so the extension can run on its own, and writes an installable .vsix.

Run from anywhere:  python3 vscode/build.py          (writes vscode/rad-io-<version>.vsix)
Install it in VS Code with  Extensions: Install from VSIX...  (or  code --install-extension rad-io-0.0.1.vsix).

A .vsix is a zip with a small manifest, so this needs no npm; `npx @vscode/vsce package` in vscode/ does the same job if you prefer it.
"""
import json, mimetypes, pathlib, shutil, zipfile
from xml.sax.saxutils import escape

here = pathlib.Path(__file__).resolve().parent
root = here.parent
media = here / 'media'
if media.exists():
    shutil.rmtree(media)
media.mkdir()
for name in ['index.html', 'css', 'js', 'icons']:
    src = root / name
    (shutil.copytree if src.is_dir() else shutil.copy)(src, media / name)

pkg = json.loads((here / 'package.json').read_text())
files = ['package.json', 'extension.js', 'README.md'] + sorted(p.relative_to(here).as_posix() for p in media.rglob('*') if p.is_file())
exts = sorted({pathlib.Path(f).suffix.lstrip('.').lower() for f in files} | {'vsixmanifest'})
types = {'js': 'application/javascript', 'json': 'application/json', 'md': 'text/markdown', 'html': 'text/html', 'css': 'text/css',
         'svg': 'image/svg+xml', 'png': 'image/png', 'ico': 'image/x-icon', 'webmanifest': 'application/manifest+json', 'vsixmanifest': 'text/xml'}
content_types = '<?xml version="1.0" encoding="utf-8"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/Content-Types">' + ''.join(
    f'<Default Extension="{e}" ContentType="{types.get(e) or mimetypes.types_map.get("." + e, "application/octet-stream")}"/>' for e in exts) + '</Types>'
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
  </Metadata>
  <Installation><InstallationTarget Id="Microsoft.VisualStudio.Code"/></Installation>
  <Dependencies/>
  <Assets>
    <Asset Type="Microsoft.VisualStudio.Code.Manifest" Path="extension/package.json" Addressable="true"/>
    <Asset Type="Microsoft.VisualStudio.Services.Content.Details" Path="extension/README.md" Addressable="true"/>
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
