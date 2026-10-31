# Colección Fonseca

Una página que presenta una colección de cartas como lo que son: piezas que se
miran de cerca. La carta activa flota en el centro de un abanico y reacciona al
puntero; al hacer clic se abre a pantalla completa junto a su ficha, y la
lámina acompaña al texto mientras se lee.

HTML, CSS y JavaScript sin dependencias ni compilación.

---

## Ver el proyecto

Hace falta **Python**. Comprueba que lo tienes:

```bash
python --version
```

Desde la carpeta del proyecto, arranca el servidor:

```bash
python dev-server.py
```

Y abre <http://localhost:5173> en el navegador. Para parar el servidor, `Ctrl+C`
en esa misma ventana. Si el puerto 5173 está ocupado, usa otro:

```bash
python dev-server.py 8080
```

**No sirve abrir `index.html` con doble clic.** La página lee los datos con
`fetch`, y el navegador bloquea esas peticiones cuando el archivo se abre
directamente desde el disco: verías la página en blanco con un mensaje de
error. `dev-server.py` es el servidor de Python con las cabeceras que impiden
al navegador guardar copias; sin eso, al editar los datos tendrías que recargar
varias veces para ver el cambio.

---

## Añadir una carta

### 1. Prepara la imagen

Una foto de móvil pesa unos 3,5 MB y haría que la página tardara en mostrar las
cartas. El script la deja en unos 300 KB sin que se note en pantalla:

```bash
pip install Pillow
```

```bash
python preparar-imagenes.py carta ruta/a/tu-foto.jpg
```

Puedes pasarle una carpeta entera y prepara todas de una vez:

```bash
python preparar-imagenes.py carta ruta/a/la-carpeta/
```

Procesa **todas** las imágenes que encuentre dentro, así que esa carpeta debe
tener solo cartas. No le pases `imagenes-cartas/` tal cual: ahí están también
los originales del fondo, y acabarías con cartas que no lo son.

Deja el resultado en `assets/cards/` y te escribe en pantalla la línea que hay
que copiar al JSON. El nombre del archivo se limpia solo: `La Crema.JPG` pasa a
ser `la-crema.jpg`.

> También puedes copiar la imagen a `assets/cards/` a mano. Funcionará igual,
> solo que la página irá más lenta cuanto más pese.

**Sobre el formato:** lo ideal es la lámina entera, vertical, en proporción de
carta (63×88 mm, o sea 0,71). Otras proporciones no se deforman: se recortan
centradas, así que puedes perder algo por los bordes.

### 2. Añade sus datos

Abre `data/cards.json` y añade una entrada a la lista `cards`:

```json
{
  "id": "la-crema",
  "name": "La Crema",
  "subtitle": "Nicolás González, artista orientozo",
  "image": "assets/cards/la-crema.jpg",
  "accent": "#ef3b2f",
  "tags": ["Personaje", "CSB"],
  "stats": [
    { "label": "Tipo", "value": "Personaje" },
    { "label": "Puntos", "value": "300 Atk" }
  ],
  "description": "Un párrafo.\n\nY otro, separado por una línea en blanco."
}
```

Cuidado con las comas: cada carta va separada de la siguiente por una coma, y
la última no lleva. Si te comes una o pones una de más, la página te lo dirá
con un mensaje en pantalla en vez de quedarse en blanco.

Recarga el navegador y la carta ya está.

### Qué significa cada campo

| Campo | | Qué hace |
|---|---|---|
| `id` | obligatorio | Identifica la carta. No puede repetirse. |
| `name` | obligatorio | El título de la ficha, y el texto que aparece si la imagen no carga. |
| `image` | obligatorio | Ruta desde la raíz del proyecto. |
| `subtitle` | opcional | Una línea bajo el título. |
| `accent` | opcional | El color propio de la carta, en hexadecimal. Tiñe el fondo de la página cuando esa carta está delante, más el resplandor, los filetes y las etiquetas. Nunca toca el cuerpo del texto. |
| `tags` | opcional | Tantas etiquetas como quieras. |
| `stats` | opcional | Pares de dato y valor, los que quieras y con los nombres que quieras. |
| `description` | opcional | Texto corrido. Una línea en blanco empieza un párrafo nuevo. |

Las secciones sin datos no se dibujan: una carta sin `tags` ni `stats` muestra
solo su nombre y su texto.

**Para elegir el `accent`,** toma un color que destaque en la propia lámina. Si
lo dejas vacío, no es un hexadecimal o es tan oscuro que no se vería sobre el
fondo, se usa el color por defecto y queda un aviso en la consola del navegador
(`F12` → pestaña Console).

---

## Cambiar una carta

- **Su texto, su color o sus datos:** edita su entrada en `data/cards.json` y
  recarga. No hay nada más que hacer.
- **Su imagen:** vuelve a pasar el script con la foto nueva. Si el archivo
  resultante se llama igual que el anterior, lo sustituye y basta con recargar.
  Si se llama distinto, acuérdate de cambiar también el campo `image`.
- **El orden del abanico:** es el orden de la lista `cards`. Mueve la entrada
  de sitio dentro del JSON.

## Quitar una carta

Borra su entrada de `data/cards.json`. La imagen puede quedarse en
`assets/cards/`; no molesta, solo ocupa sitio.

## Cambiar el fondo de la página

```bash
python preparar-imagenes.py fondo ruta/a/tu-foto.jpg
```

Sustituye `assets/fondo.jpg` y recarga. El script la difumina y la oscurece lo
justo para que el texto se siga leyendo. Si quieres más o menos desenfoque,
cambia `FONDO_DESENFOQUE` al principio de `preparar-imagenes.py` y vuelve a
ejecutarlo: 9 es el valor actual, más alto difumina más.

---

## Si algo va mal

| Lo que ves | Qué pasa |
|---|---|
| Página en blanco o mensaje de error al abrir | Abriste `index.html` con doble clic. Arranca `dev-server.py` y entra por `http://localhost:5173`. |
| «No se pudo leer data/cards.json» | El archivo no está donde debe, o el servidor se arrancó desde otra carpeta. |
| «El archivo data/cards.json no es un JSON válido» | Falta o sobra una coma, o una comilla. El mensaje aparece en la propia página. |
| Una carta no sale | Le falta `id`, `name` o `image`, o su `id` está repetido. El motivo aparece en la consola del navegador (`F12`). |
| Sale el nombre en vez de la lámina | La ruta de `image` no apunta a ningún archivo. Comprueba que coincide con el nombre real, mayúsculas incluidas. |
| Cambias los datos y no se nota | Recarga con `Ctrl+Shift+R`. Si sigue, es que el servidor está sirviendo otra carpeta. |

---

## Cómo está hecho

```
index.html
dev-server.py            servidor de desarrollo sin caché
preparar-imagenes.py     deja las fotos listas para la web
data/cards.json          los datos de la colección
assets/cards/            las imágenes de las cartas
assets/fondo.jpg         la foto de fondo, ya difuminada
imagenes-cartas/         los originales sin tocar
src/css/tokens.css       color, tipografía, espaciado, movimiento
src/css/base.css         reset, página, cabecera y fondo
src/css/holo.css         la carta: capas, brillo, inclinación
src/css/carousel.css     el abanico
src/css/detail.css       la ficha
src/js/main.js           arranque
src/js/data.js           carga y validación de los datos
src/js/holo-card.js      construcción de la carta y su inclinación
src/js/carousel.js       índice activo y navegación
src/js/detail.js         la ficha
```

El efecto holográfico vive entero en `holo.css`: el JavaScript solo escribe
cinco variables —la posición del puntero, dos ángulos y una intensidad— así que
se puede afinar cómo se siente la carta sin tocar una línea de código.

Las tipografías son Grenze Gotisch para los títulos, el contador y la ficha, y
Poppins para las descripciones. Se cargan de Google Fonts, así que sin conexión
la página se ve con otra letra.

El texto de las cartas de muestra está transcrito de las propias láminas. Se
respetaron los términos del habla de la colección —chakal, chakalozo,
orientozo, barrioza, gargoleo— y solo se corrigieron erratas de tecleo.

El diseño y el plan de implementación están en `docs/superpowers/`.
