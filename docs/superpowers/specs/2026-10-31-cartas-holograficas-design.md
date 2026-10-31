# Cartas holográficas — diseño del frontend

Fecha: 2026-10-31
Estado: aprobado (diseño). Pendiente: plan de implementación.

## 1. Propósito

Una página web que presenta una colección temática de cartas coleccionables como
cartas holográficas físicas. La carta activa flota en el centro de un abanico y
reacciona al puntero con brillo e inclinación; al hacer clic se abre a pantalla
completa junto a sus datos.

Esta primera entrega es solo el frontend. Los datos se leen de un archivo JSON
estático. Más adelante se construirá un panel sencillo para que el cliente
escriba ese JSON; el frontend no se modificará para ello.

### Criterios de éxito

1. La carta se percibe como un objeto físico: el holo convence y la inclinación
   responde sin retardo perceptible.
2. Abrir y cerrar una carta es fluido, sin saltos de layout.
3. Una descripción de 2000 palabras se lee con comodidad y la carta permanece
   siempre a la vista.
4. El color propio de cada carta se nota en la interfaz sin perjudicar la
   legibilidad del texto.
5. Funciona con teclado, en móvil a 375 px y con `prefers-reduced-motion`.

### Fuera de alcance

- Panel de administración y persistencia (entrega posterior).
- Backend, autenticación, subida de imágenes.
- Variantes de holo por rareza, máscaras por carta, URL por carta,
  búsqueda y filtros.

## 2. Decisiones tomadas

| Decisión | Elección | Motivo |
|---|---|---|
| Stack | HTML + CSS + JS vanilla, módulos ES, sin build | El efecto se gana en CSS; cero dependencias permite iterar sobre la sensación de la carta |
| Arquitectura JS | Módulos planos con una responsabilidad cada uno | Cada archivo se lee de una sentada; migrable a React si hiciera falta |
| Efecto holo | Único para todas las cartas, sobre la imagen completa | La imagen ya incluye arte y marco; no exige que el cliente clasifique nada |
| Carrusel | Abanico con vecinas visibles | Comunica que hay una colección y aporta profundidad |
| Detalle | Overlay a pantalla completa con `<dialog>` | Esc, gestión de foco y bloqueo del fondo sin código propio |
| Datos | Campos fijos más listas libres de etiquetas y pares dato/valor | El cliente añade información sin tocar código |

Alternativas descartadas: Web Components (el Shadow DOM estorba justo a los
`mix-blend-mode` y filtros heredados que más se van a tocar) y GSAP (70 KB para
algo que CSS y `requestAnimationFrame` resuelven; no aporta en la escritura de
variables CSS por frame).

## 3. Estructura de archivos

```
index.html
data/cards.json
assets/cards/                 imágenes de las cartas
src/css/tokens.css            color, tipografía, espaciado, duraciones
src/css/base.css              reset, layout de página, cabecera
src/css/holo.css              capas, blend modes y animaciones de la carta
src/css/carousel.css          abanico, flechas, contador
src/css/detail.css            overlay, rejilla, sticky, panel de datos
src/js/main.js                arranque: carga datos y conecta módulos
src/js/data.js                fetch, validación y normalización
src/js/holo-card.js           nodo de carta, tilt y brillo
src/js/carousel.js            índice activo, abanico, navegación
src/js/detail.js              overlay y render de los bloques de datos
```

El JSON se carga con `fetch`, por lo que la página requiere un servidor local
(`python -m http.server`) y no funciona abierta con `file://`. Queda documentado
en el README.

## 4. Modelo de datos

```json
{
  "collection": {
    "title": "Colección Fonseca",
    "subtitle": "Texto corto bajo el título"
  },
  "cards": [
    {
      "id": "nombre-slug",
      "name": "Nombre de la carta",
      "subtitle": "Línea corta bajo el título",
      "image": "assets/cards/nombre.jpg",
      "accent": "#6ae3ff",
      "tags": ["Edición 2024", "Primera tirada"],
      "stats": [{ "label": "Rareza", "value": "Holo Rare" }],
      "description": "Párrafos separados por una línea en blanco."
    }
  ]
}
```

Reglas:

- Obligatorios: `id`, `name`, `image`. El resto es opcional.
- `tags` y `stats` son listas de longitud libre. Si están vacías o ausentes, su
  sección no se renderiza.
- `description` es texto plano. Se divide por líneas en blanco en párrafos. No
  se interpreta Markdown ni HTML: el texto se inserta como contenido de texto,
  nunca como HTML.
- `accent` es un color hexadecimal. Si falta o es inválido, se usa el color de
  acento por defecto de `tokens.css`.
- `id` debe ser único; si se repite, se conserva el primero y se avisa por
  consola.

## 5. Efecto holográfico

### Capas

Dentro de la carta, apiladas:

1. `.card__img` — la imagen.
2. `.card__glare` — gradiente radial centrado en el puntero,
   `mix-blend-mode: soft-light`.
3. `.card__holo` — franjas de color repetidas más una textura fina,
   `mix-blend-mode: color-dodge`, con opacidad proporcional a la intensidad.

### Contrato JS ↔ CSS

El JavaScript solo escribe estas custom properties en el elemento de la carta:

| Variable | Rango | Significado |
|---|---|---|
| `--mx` | 0–100% | posición horizontal del puntero sobre la carta |
| `--my` | 0–100% | posición vertical del puntero sobre la carta |
| `--rx` | grados | rotación en X, derivada de `--my` |
| `--ry` | grados | rotación en Y, derivada de `--mx` |
| `--glow` | 0–1 | intensidad; máxima en el centro, decae hacia los bordes |

Todo el aspecto vive en `holo.css`. Afinar el efecto no requiere tocar JS.

### Movimiento

- La inclinación se aplica en un envoltorio distinto al de la flotación, para
  que ambas transformaciones no se sobrescriban.
- En reposo la carta flota en bucle con `@keyframes`. Al entrar el puntero la
  flotación se pausa y manda la inclinación; al salir, las variables vuelven a
  su valor neutro con una transición y la flotación se reanuda.
- Las escrituras de variables se agrupan en un único `requestAnimationFrame`
  por frame. Solo la carta activa escucha eventos de puntero.
- En táctil no hay puntero: la carta activa conserva la flotación y un barrido
  lento del holo.
- Con `prefers-reduced-motion: reduce` se desactivan flotación e inclinación, y
  el holo queda estático y tenue.

## 6. Carrusel

Estado: un entero, el índice de la carta activa.

Cada carta recibe `--offset`, su distancia firmada al índice activo. El CSS
deriva de ahí `translateX`, `scale`, `rotateY`, `z-index` y el oscurecimiento:
el centro al frente, a tamaño completo y sin filtro; las vecinas más pequeñas,
giradas hacia dentro y atenuadas. Con `|offset| > 2` la carta se oculta y queda
fuera del árbol de accesibilidad, de modo que el número total de cartas no
afecta al rendimiento.

La transición es una única transición CSS de 450 ms con curva de salida suave.

Navegación, todas sobre el mismo método `goTo(index)`:

- Flechas laterales (botones con etiqueta accesible).
- Teclas `←` y `→`: escuchadas en el documento y activas únicamente cuando el
  overlay de detalle está cerrado y el foco no está en un campo de entrada.
- Swipe horizontal mediante eventos de puntero con umbral de distancia.
- Clic en una carta vecina: la trae al centro, no la abre.
- Clic en la carta activa: abre el detalle.

La navegación es circular. Debajo del abanico, un contador discreto («3 / 12»).

## 7. Vista de detalle

Elemento `<dialog>` abierto con `showModal()`, que aporta Esc, trampa de foco y
bloqueo del fondo sin código propio. Al cerrar, el foco vuelve a la carta que lo
abrió.

### Layout

- Rejilla de dos columnas: la carta a la izquierda en `position: sticky` con su
  desplazamiento superior; los datos a la derecha. El scroll es el del propio
  diálogo, de modo que la carta acompaña al texto mientras se lee.
- Por debajo de 900 px: una columna, la carta pegada arriba y reducida de
  tamaño, el texto fluyendo debajo.

### Fondo y legibilidad

- Fondo: la imagen de la carta ampliada y muy desenfocada, más `backdrop-filter`
  con desenfoque y saturación en el `::backdrop`, teñido con el `accent` de la
  carta.
- El panel de texto se apoya en una superficie oscura neutra con su propio
  desenfoque. El `accent` queda confinado a lo decorativo: resplandor tras la
  carta, filetes, etiquetas y rótulos pequeños de los datos.
- El cuerpo del texto es gris muy claro sobre oscuro neutro, con contraste
  mínimo de 7:1 independientemente del `accent` elegido por el cliente.

### Contenido del panel

En orden: nombre, subtítulo, etiquetas, tabla de pares dato/valor, y la
descripción en párrafos. Las secciones sin datos no se renderizan.

### Transición

Apertura y cierre con fundido y escala. La animación en la que la carta viaja
desde su posición en el abanico hasta el detalle (medición FLIP) queda como
mejora posterior, no entra en esta entrega.

## 8. Fallos y degradación

| Fallo | Comportamiento |
|---|---|
| `cards.json` ausente o con JSON inválido | Mensaje legible en la página, nunca pantalla en blanco |
| Carta sin `id`, `name` o `image` | Se omite y se avisa por consola; el resto se muestra |
| `id` duplicado | Se conserva el primero, se avisa por consola |
| Imagen que no carga | Marcador con el nombre de la carta en su lugar |
| `accent` inválido | Se usa el acento por defecto |
| `tags` o `stats` vacíos | Su sección no se renderiza |
| Lista de cartas vacía | Mensaje de colección vacía |

## 9. Verificación

No se monta infraestructura de test automatizado: para una página de esta
naturaleza sería más andamiaje que obra, y lo que hay que validar es visual.

**Datos de ejemplo pensados para romper cosas.** Seis cartas que incluyan: una
con descripción de unas 2000 palabras, una sin `tags` ni `stats`, una con la
ruta de imagen inexistente, y una con un `accent` amarillo de alta luminancia.

**Imágenes.** El proyecto no tiene imágenes. Se generan cartas de muestra en SVG
con gradientes y marco, sustituibles por las reales dejándolas en
`assets/cards/`.

**Lista de comprobación en navegador**, recorrida antes de dar por terminado:

1. Navegación con flechas, teclado y swipe; circularidad en ambos extremos.
2. Clic en vecina centra; clic en activa abre.
3. Esc cierra y el foco vuelve a la carta de origen.
4. Carta sticky con la descripción de 2000 palabras: acompaña al scroll sin
   solaparse ni cortarse.
5. Ancho de 375 px: abanico legible, detalle en una columna.
6. `prefers-reduced-motion`: sin flotación ni inclinación.
7. Contraste del cuerpo de texto medido sobre la carta de `accent` amarillo.
8. Imagen inexistente: muestra el marcador, no rompe el abanico.
