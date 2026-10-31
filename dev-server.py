"""Servidor de desarrollo.

Igual que `python -m http.server`, pero pide al navegador que no guarde nada
en caché. Sin esto, al editar los datos o una hoja de estilo hay que recargar
dos o tres veces para ver el cambio.

    python dev-server.py [puerto]
"""

import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 5173


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        super().end_headers()


if __name__ == "__main__":
    print(f"Sirviendo en http://localhost:{PORT}")
    ThreadingHTTPServer(("", PORT), NoCacheHandler).serve_forever()
