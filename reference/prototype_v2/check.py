#!/usr/bin/env python3
"""Syntax-check every .js file and every inline <script> in every page.

A broken inline script fails silently in the browser — the page renders, the
handlers just never bind. That happened once (a mangled quote killed all of
onboarding.html) and cost more to find than this check costs to run.

    python check.py        # exit 0 = clean

Also verifies that every relative href resolves to a file that exists, and that
no two .js files loaded by the same page declare the same top-level name.

That last one exists because it cost real time. `PERSONAS` was declared in both
app.js and programs.js. Each file passes `node --check` on its own, so this
script said OK — but in a browser the second declaration is a parse-time
SyntaxError that takes out the WHOLE file, so every function in programs.js
became undefined and pages rendered blank panels with no error the user could
see. Per-file syntax checking cannot see it. This can.
"""
import glob, os, re, subprocess, sys, urllib.parse

fails = []


def top_level_names(path):
    """Top-level declarations in a script, split by whether a duplicate is fatal.

    Only column-0 declarations, which is what this codebase's style guarantees
    for anything global; an indented one is inside a function and cannot collide.

    const / let / class  -> redeclaring across two loaded files is a parse-time
                            SyntaxError that kills the entire second file.
    var / function       -> legal; the later declaration simply wins. Still worth
                            saying out loud, because a silently overridden helper
                            is its own kind of afternoon (data.js and programs.js
                            have both declared daysLeft for a while).
    """
    fatal, soft = {}, {}
    for n, line in enumerate(open(path, encoding='utf-8'), 1):
        m = re.match(r'(const|let|class|var|function)\s+([A-Za-z_$][\w$]*)', line)
        if m:
            (fatal if m.group(1) in ('const', 'let', 'class') else soft).setdefault(m.group(2), n)
    return fatal, soft

for f in sorted(glob.glob('*.js')):
    r = subprocess.run(['node', '--check', f], capture_output=True, text=True)
    if r.returncode:
        fails.append(f'{f}: {r.stderr.splitlines()[1] if len(r.stderr.splitlines()) > 1 else r.stderr}')

# which .js files each page loads, in order
page_scripts = {}
for f in sorted(glob.glob('*.html')):
    src = open(f, encoding='utf-8').read()
    page_scripts[f] = [s for s in re.findall(r'<script[^>]*\bsrc="([^"]+)"', src)
                       if not s.startswith('http')]

declared = {f: top_level_names(f) for f in sorted(glob.glob('*.js'))}
warns = []
seen_pairs = set()
for page, scripts in page_scripts.items():
    for i, a in enumerate(scripts):
        for b in scripts[i + 1:]:
            if a not in declared or b not in declared or (a, b) in seen_pairs:
                continue
            seen_pairs.add((a, b))
            (fa, sa), (fb, sb) = declared[a], declared[b]
            for name in sorted(set(fa) & set(fb)):
                fails.append(
                    f'{a}:{fa[name]} and {b}:{fb[name]} both declare top-level '
                    f'const/let "{name}" — loaded together by {page}, so the second '
                    f'throws at parse time and takes out the whole file')
            for name in sorted((set(sa) | set(fa)) & (set(sb) | set(fb))):
                if name in fa and name in fb:
                    continue
                warns.append(f'{a} and {b} both declare "{name}"; '
                             f'the later one silently wins (loaded by {page})')

for f in sorted(glob.glob('*.html')):
    src = open(f, encoding='utf-8').read()
    for i, body in enumerate(re.findall(r'<script(?![^>]*\bsrc=)[^>]*>(.*?)</script>', src, re.S)):
        tmp = f'.chk_{i}.mjs'
        open(tmp, 'w', encoding='utf-8').write(body)
        r = subprocess.run(['node', '--check', tmp], capture_output=True, text=True)
        os.remove(tmp)
        if r.returncode:
            line = next((l for l in r.stderr.splitlines() if 'Error' in l), r.stderr.strip())
            fails.append(f'{f} inline script #{i}: {line}')

    for href in re.findall(r'href="([^"#][^"]*)"', src):
        href = href.split('?')[0]
        if href.startswith(('http', 'mailto:', '${')) or not href:
            continue
        if not os.path.exists(urllib.parse.unquote(href)):
            fails.append(f'{f}: dead link -> {href}')

for w in dict.fromkeys(warns):
    print('  warn:', w)

if fails:
    print('FAIL')
    for x in fails:
        print('  ', x)
    sys.exit(1)
print(f'OK — {len(glob.glob("*.js"))} js files, {len(glob.glob("*.html"))} pages, '
      f'no syntax errors, no duplicate globals, no dead links')
