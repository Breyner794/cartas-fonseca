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

1. Deja la imagen en `assets/cards/`. Es la carta entera, con su arte y su
   marco. Lo ideal es vertical en proporción 2:3; otras proporciones se
   recortan centradas sin deformarse.
2. Añade su entrada a la lista `cards` de `data/cards.json`.

```json
{
  "id": "halo-lunar",
  "name": "Halo lunar",
  "subtitle": "Tres anillos discontinuos",
  "image": "assets/cards/halo-lunar.svg",
  "accent": "#cfdcff",
  "tags": ["Fenómenos", "Primera tirada"],
  "stats": [
    { "label": "Rareza", "value": "Común" },
    { "label": "Número", "value": "3 de 6" }
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
| `accent` | opcional | Color propio de la carta, en hexadecimal. Tiñe el resplandor, los filetes y las etiquetas, nunca el texto. Si falta o no es un hexadecimal, se usa el color por defecto. |
| `tags` | opcional | Tantas etiquetas como quieras. |
| `stats` | opcional | Pares de dato y valor, los que quieras y con los nombres que quieras. |
| `description` | opcional | Texto corrido. Una línea en blanco empieza un párrafo nuevo. |

Las secciones sin datos no se dibujan: una carta sin `tags` ni `stats` muestra
solo su nombre y su texto. Una entrada a la que le falte un campo obligatorio se
omite y queda avisada en la consola del navegador, sin tumbar el resto.

## Los datos de muestra

Los de este repositorio son de prueba y están hechos a propósito para provocar
los casos difíciles: una descripción de 2000 palabras, una carta sin ficha, una
imagen que no existe, un formato cuadrado y otro panorámico, una referencia
larguísima sin espacios y un acento amarillo de alta luminancia. Conviene
conservarlos mientras se trabaja en la página y sustituirlos al final.

## Estructura

```
index.html
dev-server.py            servidor de desarrollo sin caché
data/cards.json          los datos de la colección
assets/cards/            las imágenes
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
