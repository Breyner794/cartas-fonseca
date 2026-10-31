# Colección Fonseca

Una página que presenta una colección de cartas como lo que son: piezas que se
miran de cerca. La carta activa flota en el centro de un abanico y reacciona al
puntero; al hacer clic se abre a pantalla completa junto a su ficha, y la
lámina acompaña al texto mientras se lee.

HTML, CSS y JavaScript sin dependencias ni compilación.

## Arrancar

```bash
python dev-server.py
```

Y abrir <http://localhost:5173>. Para otro puerto, `python dev-server.py 8080`.

Hace falta un servidor: la página lee los datos con `fetch`, y el navegador
bloquea esas peticiones cuando el archivo se abre directamente con `file://`.
`dev-server.py` es `http.server` con las cabeceras que impiden al navegador
guardar copias; sin eso, al editar los datos hay que recargar varias veces para
ver el cambio.

## Añadir una carta

1. Deja la imagen en `assets/cards/`. Es la lámina entera. Lo ideal es vertical
   en proporción de carta (63×88 mm, o sea 0,71); otras proporciones se
   recortan centradas sin deformarse.
2. Añade su entrada a la lista `cards` de `data/cards.json`.

```json
{
  "id": "el-crema",
  "name": "La Crema",
  "subtitle": "Nicolás González, artista orientozo",
  "image": "assets/cards/el-crema.jpg",
  "accent": "#ef3b2f",
  "tags": ["Personaje", "CSB"],
  "stats": [
    { "label": "Tipo", "value": "Personaje" },
    { "label": "Puntos", "value": "300 Atk" }
  ],
  "description": "Un párrafo.\n\nY otro, separado por una línea en blanco."
}
```

| Campo | | Qué hace |
|---|---|---|
| `id` | obligatorio | Identifica la carta. No puede repetirse. |
| `name` | obligatorio | El título de la ficha y el texto que aparece si la imagen falta. |
| `image` | obligatorio | Ruta desde la raíz del proyecto. |
| `subtitle` | opcional | Una línea bajo el título. |
| `accent` | opcional | Color propio de la carta, en hexadecimal. Tiñe el resplandor, los filetes y las etiquetas, nunca el cuerpo del texto. Si falta, no es un hexadecimal o es casi negro —y entonces no se vería sobre el fondo oscuro—, se usa el color por defecto y queda el aviso en la consola. |
| `tags` | opcional | Tantas etiquetas como quieras. |
| `stats` | opcional | Pares de dato y valor, los que quieras y con los nombres que quieras. |
| `description` | opcional | Texto corrido. Una línea en blanco empieza un párrafo nuevo. |

Las secciones sin datos no se dibujan: una carta sin `tags` ni `stats` muestra
solo su nombre y su texto. Una entrada a la que le falte un campo obligatorio se
omite y queda avisada en la consola del navegador, sin tumbar el resto.

## Las imágenes

`imagenes-cartas/` guarda los originales tal como salieron de la cámara, a
unos 3,5 MB cada uno. Lo que sirve la página son las versiones de
`assets/cards/`: 900 px de ancho y unos 300 KB, que se ven nítidas incluso en
pantallas de densidad doble porque la carta nunca se muestra a más de ~340 px.

Para preparar una imagen nueva, el ajuste que se aplicó fue redimensionar a
900 px de ancho y guardar como JPEG de calidad 84, progresivo y optimizado.

`assets/fondo.jpg` es la foto de la calle que hay detrás de todo. Va ya
difuminada desde el archivo, no con `filter: blur()`: el desenfoque en CSS se
recalcula en cada repintado, y una imagen difuminada comprime tanto que esta
pesa 39 KB. Se preparó a 1800 px con un desenfoque gaussiano de radio 26.
El original está en `imagenes-cartas/fondo-original.jpg`.

El texto de cada carta está transcrito de la propia lámina. Se respetaron los
términos del habla de la colección —chakal, chakalozo, orientozo, barrioza,
gargoleo— y solo se corrigieron erratas de tecleo.

## Estructura

```
index.html
dev-server.py            servidor de desarrollo sin caché
data/cards.json          los datos de la colección
assets/cards/            las imágenes de las cartas
assets/fondo.jpg         la foto de fondo, ya difuminada
src/css/tokens.css       color, tipografía, espaciado, movimiento
src/css/base.css         reset, página y cabecera
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

El diseño y el plan de implementación están en `docs/superpowers/`.
