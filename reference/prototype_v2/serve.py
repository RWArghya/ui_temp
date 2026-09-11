#!/usr/bin/env python3
"""Static server that tells the browser not to cache anything.

python -m http.server sends Last-Modified and no Cache-Control, so browsers
heuristically cache the HTML and JS. While iterating on a prototype that means
you reload and still see old code — which looks exactly like a bug in the page.
A <meta http-equiv="Cache-Control"> does NOT fix this; browsers largely ignore
meta cache directives for the document itself. The header has to come from here.

    python serve.py            # http://localhost:8777
    python serve.py 9000       # another port
"""
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class NoCache(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def log_message(self, fmt, *args):        # quiet unless something breaks
        if not str(args[1]).startswith('2'):
            super().log_message(fmt, *args)


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8777
    # ASCII only — the default Windows console codepage can't encode much else
    print(f'H2S IPUF prototype: http://localhost:{port}  (no-cache, Ctrl+C to stop)')
    ThreadingHTTPServer(('', port), NoCache).serve_forever()
