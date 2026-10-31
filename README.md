# Colección Fonseca

Una página que presenta una colección de cartas como lo que son: piezas que se
miran de cerca. La carta activa flota en el centro de un abanico y reacciona al
puntero; al hacer clic se abre a pantalla completa junto a sus datos.

HTML, CSS y JavaScript sin dependencias ni compilación.

## Arrancar

```bash
python -m http.server 5173
```

Y abrir <http://localhost:5173>.

Hace falta un servidor: la página lee los datos con `fetch`, y un navegador
bloquea esas peticiones cuando el archivo se abre directamente con `file://`.

## Dónde van el contenido y los datos

- Las imágenes, en `assets/cards/`. Una imagen por carta, la carta completa con
  su arte y su marco. Lo ideal es vertical en proporción 2:3; otras
  proporciones se recortan centradas.
- Los datos, en `data/cards.json`.

Los datos de este repositorio son de muestra. Están hechos a propósito para
provocar los casos difíciles —una descripción muy larga, una carta sin ficha,
una imagen que falta, un formato cuadrado— así que conviene conservarlos
mientras se trabaja en la página y sustituirlos al final.

## Estructura

```
index.html
data/cards.json          los datos de la colección
assets/cards/            las imágenes
src/css/tokens.css       color, tipografía, espaciado, movimiento
src/css/base.css         reset, página y cabecera
src/css/holo.css         la carta: capas, brillo, inclinación
src/css/carousel.css     el abanico
src/css/detail.css       la vista de detalle
src/js/main.js           arranque
src/js/data.js           carga y validación de los datos
src/js/holo-card.js      construcción de la carta y su inclinación
src/js/carousel.js       índice activo y navegación
src/js/detail.js         la vista de detalle
```

El diseño y el plan de implementación están en `docs/superpowers/`.
