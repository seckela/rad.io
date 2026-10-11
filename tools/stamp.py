#!/usr/bin/env python3
"""Stamps index.html so browsers never pair a new script with an old cached one.

The app is plain ES modules with no build step, and each module is cached by its URL on its own, so after an upload a browser
can keep an old copy of one file while fetching a new copy of another (a "does not provide an export named ..." error is the
usual symptom). This script puts a short hash of each file's contents into its URL, through an import map in index.html, so a
file's URL changes exactly when the file does. Run it after changing anything under js/ or css/, and before uploading:

    python3 tools/stamp.py           # rewrite index.html
    python3 tools/stamp.py --check   # exit 1 if index.html is out of date (changes nothing)
"""
import hashlib, json, pathlib, re, sys

root = pathlib.Path(__file__).resolve().parent.parent
index = root / 'index.html'

def h(path):
    return hashlib.sha1(path.read_bytes()).hexdigest()[:8]

mods = sorted(p for p in (root / 'js').rglob('*.js'))
imports = {'./' + p.relative_to(root).as_posix(): './' + p.relative_to(root).as_posix() + '?v=' + h(p) for p in mods}
block = ('<!-- stamp:importmap (written by tools/stamp.py; do not edit by hand) -->\n'
         '<script type="importmap">\n' + json.dumps({'imports': imports}, indent=2) + '\n</script>\n'
         '<!-- /stamp:importmap -->')

src = index.read_text()
new = re.sub(r'<!-- stamp:importmap.*?<!-- /stamp:importmap -->', lambda m: block, src, flags=re.S)
new = re.sub(r'(href="css/style\.css)(?:\?v=\w+)?"', lambda m: m.group(1) + '?v=' + h(root / 'css/style.css') + '"', new)
new = re.sub(r'(src="js/main\.js)(?:\?v=\w+)?"', lambda m: m.group(1) + '?v=' + h(root / 'js/main.js') + '"', new)

if '--check' in sys.argv:
    if new != src:
        print('index.html is out of date: run python3 tools/stamp.py'); sys.exit(1)
    print('index.html is up to date'); sys.exit(0)
if new != src:
    index.write_text(new)
    print('index.html updated (%d modules)' % len(mods))
else:
    print('index.html already up to date')
