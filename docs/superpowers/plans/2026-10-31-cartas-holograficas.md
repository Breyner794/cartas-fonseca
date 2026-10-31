# Cartas holográficas — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Una página estática que presenta una colección de cartas coleccionables como cartas holográficas, en carrusel de abanico, con vista de detalle a pantalla completa y carta sticky junto a sus datos.

**Architecture:** Cinco módulos ES planos sin build. `data.js` carga y normaliza el JSON; `holo-card.js` construye el nodo de una carta y gobierna su inclinación escribiendo cinco variables CSS; `carousel.js` lleva el único estado de la aplicación —el índice activo— y lo traduce a un `--offset` por carta; `detail.js` abre un `<dialog>` y pinta los bloques de datos. Todo el aspecto vive en CSS.

**Tech Stack:** HTML, CSS, JavaScript con módulos ES nativos. Sin dependencias, sin build, sin framework de test.

**Spec:** `docs/superpowers/specs/2026-10-31-cartas-holograficas-design.md`

## Global Constraints

- Sin dependencias, sin paso de build. Solo HTML, CSS y módulos ES nativos.
- El texto procedente del JSON se inserta siempre con `textContent`, nunca con `innerHTML`.
- El cuerpo del texto mantiene un contraste mínimo de 7:1 con cualquier `accent`.
- El `accent` es solo decorativo: resplandor tras la carta, filetes, etiquetas y rótulos de los datos. Nunca en el cuerpo del texto ni en su fondo.
- El JS escribe únicamente las variables `--mx`, `--my`, `--rx`, `--ry` y `--glow`. Cualquier otro aspecto va en CSS.
- Las escrituras de variables se agrupan en un único `requestAnimationFrame` por frame.
- Solo la carta activa escucha eventos de puntero.
- Con `prefers-reduced-motion: reduce` no hay flotación ni inclinación.
- Campos obligatorios por carta: `id`, `name`, `image`. Los demás son opcionales y su sección no se renderiza si faltan.
- Transición del abanico: 450 ms. Breakpoint del detalle: 900 px. Navegación circular.
- Ningún fallo deja la página en blanco.

**Verificación:** el spec decidió no montar test automatizado; lo que hay que validar es visual. Cada tarea cierra con una comprobación en navegador de resultado observable, y los datos de muestra de la Tarea 1 están construidos para provocar los fallos que interesan. Donde aparece «Comprobar», el paso no está hecho hasta haber mirado la pantalla.

## Review Focus

Cinco condiciones que el spec implica y que ninguna de sus comprobaciones alcanza. Cada una tiene su verificación añadida a la tarea que posee el código:

1. **Colección de una o dos cartas.** Con navegación circular y `--offset` calculado por módulo, una colección de una carta puede situarse a sí misma en varias posiciones del abanico, y con dos cartas la misma carta puede aparecer a izquierda y derecha. Lo esperable: con una carta no hay flechas ni contador duplicado; con dos, cada carta aparece una sola vez. → Tarea 4.
2. **Nombre, etiqueta o valor largo sin espacios.** Un `id` de set o una URL pegada en un valor desborda el panel de datos y rompe la rejilla. Lo esperable: el texto se parte y el panel conserva su ancho. → Tarea 5.
3. **Imagen con proporción distinta de 2:3.** El cliente subirá cuadradas y panorámicas. Lo esperable: la carta mantiene su proporción y la imagen se recorta centrada, sin deformarse ni desbordar el marco. → Tarea 3.
4. **Pulsaciones rápidas de flecha durante la transición.** Lo esperable: el índice avanza una posición por pulsación, sin perder cartas ni acumular transiciones a medias. → Tarea 4.
5. **Descripción de una sola línea en el detalle.** Con contenido más corto que el alto de la carta, el `sticky` no tiene recorrido. Lo esperable: nada se estira ni deja un hueco vertical desproporcionado. → Tarea 5.

---

### Task 1: Andamiaje, tokens y datos de muestra

**Files:**
- Create: `index.html`, `src/css/tokens.css`, `src/css/base.css`, `data/cards.json`, `assets/cards/*.svg`, `README.md`, `.gitignore`

**Interfaces:**
- Consumes: nada.
- Produces: el contrato de datos que consume la Tarea 2 (el esquema de la sección 4 del spec); los tokens CSS que usan todas las hojas posteriores: `--surface-0`, `--surface-1`, `--text`, `--text-dim`, `--accent-default`, `--radius-card`, `--dur-fan` (450ms), `--ease-fan`; y la variable por carta `--accent`.

- [ ] **Step 1: Inicializar el repositorio**

```bash
git init
```

- [ ] **Step 2: Escribir `src/css/tokens.css`**

Paleta oscura neutra, con `--text` suficientemente claro para alcanzar 7:1 sobre `--surface-1`. `--accent-default: #6ae3ff`. Incluir también `--dur-fan: 450ms` y la curva de salida.

- [ ] **Step 3: Escribir `index.html` y `src/css/base.css`**

Estructura mínima: cabecera con `h1` y subtítulo de la colección (vacíos, los rellena la Tarea 2), un `<section class="carousel">` vacío, un `<dialog class="detail">` vacío, un `<p class="page__error" hidden>` para los fallos de carga, y `<script type="module" src="src/js/main.js">`. `base.css` lleva el reset, el fondo de página y la cabecera.

- [ ] **Step 4: Generar seis cartas de muestra en `assets/cards/`**

SVG verticales 2:3 con gradiente y marco, más una cuadrada y una panorámica para la condición 3 del Review Focus.

- [ ] **Step 5: Escribir `data/cards.json` con los datos de prueba**

Seis cartas que incluyan: una con descripción de unas 2000 palabras; una sin `tags` ni `stats`; una con `image` apuntando a un archivo inexistente; una con `accent` amarillo de alta luminancia (`#ffe066`); una con imagen cuadrada y otra panorámica; y en alguna, un valor largo sin espacios para la condición 2.

- [ ] **Step 6: Escribir `README.md`**

Cómo arrancar (`python -m http.server` y por qué `file://` no sirve), y dónde pone el cliente sus imágenes y sus datos.

- [ ] **Step 7: Comprobar en navegador**

Servir la carpeta y abrirla. Esperado: la página carga sin errores en consola, con el fondo y la cabecera en su sitio.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: andamiaje, tokens y datos de muestra"
```

---

### Task 2: Carga y normalización de datos

**Files:**
- Create: `src/js/data.js`, `src/js/main.js`

**Interfaces:**
- Consumes: `data/cards.json` (Tarea 1).
- Produces:
  - `class DataError extends Error` — su `message` es legible para una persona.
  - `async function loadCollection(url = 'data/cards.json'): Promise<{ collection: { title: string, subtitle: string }, cards: Card[] }>` — lanza `DataError` si la respuesta falla o el JSON es inválido.
  - `Card` normalizada: `{ id: string, name: string, subtitle: string, image: string, accent: string, tags: string[], stats: { label: string, value: string }[], paragraphs: string[] }`. Las listas siempre existen, posiblemente vacías. `paragraphs` sale de dividir `description` por líneas en blanco. `accent` ya está validado o sustituido por el de defecto.

- [ ] **Step 1: Implementar `loadCollection` y `DataError` en `src/js/data.js`**

Normalización según la sección 4 del spec: omitir con aviso por consola las cartas sin `id`, `name` o `image`; conservar el primero de los `id` repetidos avisando por consola; validar `accent` contra hexadecimal y caer al defecto; listas ausentes pasan a vacías.

- [ ] **Step 2: Implementar el arranque en `src/js/main.js`**

Llama a `loadCollection`, rellena el `h1` y el subtítulo con `textContent`, y deja los datos listos para las tareas siguientes. Si captura `DataError`, muestra su mensaje en `.page__error` y lo revela. Si la lista de cartas queda vacía —porque el JSON la trae vacía o porque todas se omitieron en la validación—, muestra en el mismo sitio el mensaje de colección vacía.

- [ ] **Step 3: Comprobar los cuatro caminos en navegador**

Esperado: con el JSON válido, cabecera rellena y seis cartas en el objeto devuelto, con la inválida omitida y su aviso en consola. Renombrando `cards.json`, mensaje legible en la página. Con una coma de más en el JSON, mensaje legible en la página. Con `"cards": []`, el mensaje de colección vacía. En los tres casos de fallo, nunca pantalla en blanco.

- [ ] **Step 4: Commit**

```bash
git add data/cards.json src/js/data.js src/js/main.js
git commit -m "feat: carga y normalizacion de datos"
```

---

### Task 3: La carta holográfica

**Files:**
- Create: `src/js/holo-card.js`, `src/css/holo.css`
- Modify: `index.html` (enlazar `holo.css`), `src/js/main.js` (montar una carta de prueba al centro)

**Interfaces:**
- Consumes: `Card` de la Tarea 2; los tokens de la Tarea 1.
- Produces:
  - `function createCard(card: Card): HTMLElement` — devuelve el `<article class="card">` con `data-id`, `--accent` fijado en el estilo inline, y la estructura `card__float > card__tilt > (card__img, card__glare, card__holo, card__fallback)`. El `card__fallback` lleva el nombre y se revela con el evento `error` de la imagen.
  - `function enableTilt(cardEl: HTMLElement): void` y `function disableTilt(cardEl: HTMLElement): void` — alta y baja de los escuchadores de puntero. `enableTilt` no hace nada si `prefers-reduced-motion` está activo.

- [ ] **Step 1: Escribir `src/css/holo.css`**

Las tres capas de la sección 5 del spec con sus blend modes, el marco y la proporción 2:3 de la carta, la imagen con `object-fit: cover` para la condición 3 del Review Focus, la flotación en `card__float`, la inclinación en `card__tilt` con `transform-style: preserve-3d`, el `card__fallback` y el bloque `prefers-reduced-motion`.

- [ ] **Step 2: Implementar `createCard`, `enableTilt` y `disableTilt` en `src/js/holo-card.js`**

El manejador de `pointermove` calcula las cinco variables y las escribe en un único `requestAnimationFrame` coalescido (una bandera, no un rAF por evento). `pointerleave` las devuelve a su valor neutro.

- [ ] **Step 3: Montar una carta de prueba en `main.js` y comprobarla**

Esperado: la carta flota en reposo; con el puntero encima se inclina siguiéndolo y el holo barre la superficie sin retardo; al salir, vuelve suavemente a flotar.

- [ ] **Step 4: Comprobar imagen caída y proporciones (Review Focus 3)**

Esperado: la carta de imagen inexistente muestra el marcador con su nombre y conserva su forma. Las cartas cuadrada y panorámica mantienen la proporción 2:3 con la imagen recortada centrada, sin deformarse ni salirse del marco.

- [ ] **Step 5: Comprobar `prefers-reduced-motion`**

Activarlo en el sistema o emularlo en las herramientas del navegador. Esperado: sin flotación ni inclinación; el holo queda estático y tenue.

- [ ] **Step 6: Commit**

```bash
git add src/css/holo.css src/js/holo-card.js index.html src/js/main.js
git commit -m "feat: carta holografica con tilt y holo"
```

---

### Task 4: Carrusel en abanico

**Files:**
- Create: `src/js/carousel.js`, `src/css/carousel.css`
- Modify: `index.html` (flechas, `carousel__stage`, contador, enlazar `carousel.css`), `src/js/main.js` (sustituir la carta de prueba por el carrusel)

**Interfaces:**
- Consumes: `createCard`, `enableTilt`, `disableTilt` (Tarea 3); `Card[]` (Tarea 2).
- Produces:
  - `function createCarousel({ stage: HTMLElement, prev: HTMLButtonElement, next: HTMLButtonElement, counter: HTMLElement, cards: Card[], onOpen: (index: number, cardEl: HTMLElement) => void }): { goTo(index: number): void }`
  - `goTo` acepta cualquier entero y lo normaliza circularmente. Es el único camino por el que cambia el índice: flechas, teclado, swipe y clic en vecina llaman a `goTo`.
  - `onOpen` se dispara solo al hacer clic en la carta activa, y recibe su elemento para que la Tarea 5 pueda devolverle el foco.

- [ ] **Step 1: Escribir `src/css/carousel.css`**

El escenario con perspectiva; la derivación de `translateX`, `scale`, `rotateY`, `z-index` y brillo a partir de `--offset`; ocultar y sacar del árbol de accesibilidad lo que tenga `|offset| > 2`; las flechas y el contador. Una única transición de `--dur-fan`.

- [ ] **Step 2: Implementar `createCarousel` en `src/js/carousel.js`**

Mantiene el índice, escribe `--offset` en cada carta y mueve `enableTilt`/`disableTilt` al cambiar de activa. El `--offset` se calcula por la distancia circular más corta. Las teclas `←` y `→` se escuchan en el documento y solo actúan si no hay `<dialog>` abierto y el foco no está en un campo de entrada. El swipe usa eventos de puntero con umbral de distancia.

- [ ] **Step 3: Comprobar la navegación por los cuatro caminos**

Esperado: flechas, teclado, swipe y clic en vecina centran la carta elegida; el clic en la activa dispara `onOpen`; el contador acompaña; la navegación da la vuelta en ambos extremos.

- [ ] **Step 4: Comprobar colecciones de una y dos cartas (Review Focus 1)**

Recortar temporalmente `cards.json`. Esperado: con una carta, ninguna aparece duplicada en el abanico, las flechas no hacen nada visible o se deshabilitan, y el contador dice «1 / 1». Con dos, cada carta ocupa una sola posición.

- [ ] **Step 5: Comprobar pulsaciones rápidas (Review Focus 4)**

Pulsar la flecha siguiente seis veces lo más rápido posible. Esperado: el índice avanza exactamente seis posiciones, el contador concuerda y no queda ninguna carta a medio camino.

- [ ] **Step 6: Commit**

```bash
git add src/css/carousel.css src/js/carousel.js index.html src/js/main.js
git commit -m "feat: carrusel en abanico"
```

---

### Task 5: Vista de detalle

**Files:**
- Create: `src/js/detail.js`, `src/css/detail.css`
- Modify: `index.html` (contenido del `<dialog>`, enlazar `detail.css`), `src/js/main.js` (conectar `onOpen` con `open`)

**Interfaces:**
- Consumes: `Card` (Tarea 2); `createCard` (Tarea 3); el `onOpen` del carrusel (Tarea 4).
- Produces:
  - `function createDetail(dialog: HTMLDialogElement): { open(card: Card, returnFocusTo: HTMLElement): void }`
  - `open` pinta el contenido, fija `--accent` en el diálogo, llama a `showModal()` y recuerda a quién devolver el foco. El cierre lo gobierna el propio `<dialog>` (Esc, botón, `close`), y el evento `close` restituye el foco.

- [ ] **Step 1: Escribir el contenido del `<dialog>` en `index.html`**

`detail__bg`, `detail__close`, y `detail__grid` con `detail__card-col` y `detail__info` (`detail__name`, `detail__subtitle`, `detail__tags`, `detail__stats` como `<dl>`, `detail__body`).

- [ ] **Step 2: Escribir `src/css/detail.css`**

El `::backdrop` con desenfoque y saturación; `detail__bg` con la imagen ampliada y muy desenfocada, teñida con `--accent`; la rejilla de dos columnas con `detail__card-col` en `sticky`; el scroll en el diálogo; `detail__info` sobre superficie oscura neutra con su propio desenfoque; el `accent` solo en resplandor, filetes, etiquetas y rótulos de `<dt>`; y a una columna por debajo de 900 px con la carta pegada arriba y reducida. Añadir el corte de palabras largas en nombre, etiquetas y valores.

- [ ] **Step 3: Implementar `createDetail` en `src/js/detail.js`**

Rellena los nodos con `textContent`, un párrafo por entrada de `paragraphs`, y omite por completo las secciones cuyas listas estén vacías.

- [ ] **Step 4: Comprobar apertura, cierre y foco**

Esperado: el clic en la carta activa abre el overlay con fundido y escala; Esc y el botón lo cierran; al cerrar, el foco vuelve a la carta que lo abrió.

- [ ] **Step 5: Comprobar el sticky con la descripción de 2000 palabras**

Esperado: la carta acompaña al scroll sin solaparse con la cabecera ni cortarse, y el texto baja a su lado.

- [ ] **Step 6: Comprobar legibilidad sobre el `accent` amarillo**

Medir el contraste del cuerpo de texto con las herramientas del navegador. Esperado: 7:1 o mejor, y ningún amarillo en el texto ni en su fondo.

- [ ] **Step 7: Comprobar texto largo sin espacios y descripción de una línea (Review Focus 2 y 5)**

Esperado: el valor largo se parte y el panel conserva su ancho sin scroll horizontal. En la carta de descripción corta, nada se estira y no queda un hueco vertical desproporcionado.

- [ ] **Step 8: Comprobar a 375 px**

Esperado: una sola columna, carta pegada arriba y reducida, texto fluyendo debajo, sin scroll horizontal.

- [ ] **Step 9: Commit**

```bash
git add src/css/detail.css src/js/detail.js index.html src/js/main.js
git commit -m "feat: vista de detalle con carta sticky"
```

---

### Task 6: Recorrido final y entrega

**Files:**
- Modify: cualquiera, según lo que salga del recorrido; `README.md`

- [ ] **Step 1: Recorrer la lista de comprobación de la sección 9 del spec, de principio a fin**

Los ocho puntos seguidos, sobre los datos de muestra completos y restaurados, en una ventana ancha y a 375 px.

- [ ] **Step 2: Corregir lo que aparezca**

- [ ] **Step 3: Revisar la consola en un recorrido completo**

Esperado: ningún error. Solo los avisos previstos de la carta inválida y del `id` duplicado.

- [ ] **Step 4: Completar el `README.md` con la guía para el cliente**

Cómo añadir una carta: dejar la imagen en `assets/cards/` y añadir su entrada en `data/cards.json`, con la lista de campos y cuáles son obligatorios.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: recorrido de verificacion y guia del cliente"
```
