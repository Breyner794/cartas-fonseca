"""Deja una imagen lista para la página.

Una foto de móvil ronda los 3,5 MB. Servida tal cual, la página tarda
segundos en mostrar las cartas. Esto la reduce a unos 300 KB sin que se
note en pantalla.

    python preparar-imagenes.py carta mis-fotos/la-crema.jpg
    python preparar-imagenes.py carta mis-fotos/          (toda la carpeta)
    python preparar-imagenes.py fondo mis-fotos/calle.jpg

Las cartas van a assets/cards/ y el fondo a assets/fondo.jpg, que es donde
la página las busca. Necesita Pillow:  pip install Pillow
"""

import os
import sys
import unicodedata

# Sin esto, la consola de Windows parte los acentos de los mensajes. stderr
# también, que es por donde sale la ayuda.
for flujo in (sys.stdout, sys.stderr):
    if hasattr(flujo, "reconfigure"):
        flujo.reconfigure(encoding="utf-8", errors="replace")

try:
    from PIL import Image, ImageEnhance, ImageFilter
except ImportError:
    sys.exit("Falta Pillow. Instálalo con:  pip install Pillow")

RAIZ = os.path.dirname(os.path.abspath(__file__))
DESTINO_CARTAS = os.path.join(RAIZ, "assets", "cards")
DESTINO_FONDO = os.path.join(RAIZ, "assets", "fondo.jpg")

# 900 px bastan: la carta nunca se muestra a más de ~340 px, y eso deja
# margen de sobra en pantallas de densidad doble.
CARTA_ANCHO = 900
CARTA_CALIDAD = 84

# El fondo va difuminado desde el archivo. Hacerlo en CSS obligaría al
# navegador a recalcular el desenfoque en cada repintado.
FONDO_ANCHO = 1800
FONDO_DESENFOQUE = 9
FONDO_BRILLO = 0.92
FONDO_CALIDAD = 72

EXTENSIONES = (".jpg", ".jpeg", ".png", ".webp")


def slug(nombre):
    """nombre-de-archivo-limpio, sin acentos ni espacios."""
    base = os.path.splitext(os.path.basename(nombre))[0].lower()
    base = unicodedata.normalize("NFKD", base).encode("ascii", "ignore").decode()
    limpio = "".join(c if c.isalnum() else "-" for c in base)
    return "-".join(parte for parte in limpio.split("-") if parte)


def kb(ruta):
    return os.path.getsize(ruta) / 1024


def preparar_carta(origen):
    destino = os.path.join(DESTINO_CARTAS, f"{slug(origen)}.jpg")
    os.makedirs(DESTINO_CARTAS, exist_ok=True)

    with Image.open(origen) as img:
        img = img.convert("RGB")
        ancho, alto = img.size
        nuevo_alto = round(CARTA_ANCHO * alto / ancho)
        img = img.resize((CARTA_ANCHO, nuevo_alto), Image.LANCZOS)
        img.save(
            destino, "JPEG", quality=CARTA_CALIDAD, optimize=True, progressive=True
        )

    print(
        f"  {os.path.basename(origen)} ({kb(origen):.0f} KB)"
        f"  ->  assets/cards/{os.path.basename(destino)} ({kb(destino):.0f} KB)"
    )
    return destino


def preparar_fondo(origen):
    os.makedirs(os.path.dirname(DESTINO_FONDO), exist_ok=True)

    with Image.open(origen) as img:
        img = img.convert("RGB")
        ancho, alto = img.size
        nuevo_alto = round(FONDO_ANCHO * alto / ancho)
        img = img.resize((FONDO_ANCHO, nuevo_alto), Image.LANCZOS)
        img = img.filter(ImageFilter.GaussianBlur(FONDO_DESENFOQUE))
        img = ImageEnhance.Brightness(img).enhance(FONDO_BRILLO)
        img.save(
            DESTINO_FONDO,
            "JPEG",
            quality=FONDO_CALIDAD,
            optimize=True,
            progressive=True,
        )

    print(
        f"  {os.path.basename(origen)} ({kb(origen):.0f} KB)"
        f"  ->  assets/fondo.jpg ({kb(DESTINO_FONDO):.0f} KB), difuminada"
    )


def imagenes_de(ruta):
    if os.path.isfile(ruta):
        return [ruta]
    if os.path.isdir(ruta):
        return [
            os.path.join(ruta, nombre)
            for nombre in sorted(os.listdir(ruta))
            if nombre.lower().endswith(EXTENSIONES)
        ]
    sys.exit(f"No existe: {ruta}")


def main():
    if len(sys.argv) < 3 or sys.argv[1] not in ("carta", "fondo"):
        sys.exit(__doc__)

    modo, ruta = sys.argv[1], sys.argv[2]
    archivos = imagenes_de(ruta)

    if not archivos:
        sys.exit(f"No hay imágenes en {ruta}")

    if modo == "fondo":
        preparar_fondo(archivos[0])
        print("\nListo. Recarga la página para verlo.")
        return

    print(f"Preparando {len(archivos)} imagen(es):")
    nombres = [os.path.splitext(os.path.basename(preparar_carta(a)))[0] for a in archivos]

    print("\nListo. Ahora añade cada carta a data/cards.json, por ejemplo:\n")
    for nombre in nombres:
        print(f'  {{ "id": "{nombre}", "name": "...", "image": "assets/cards/{nombre}.jpg" }}')


if __name__ == "__main__":
    main()
