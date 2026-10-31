// El abanico. Todo el estado es un número: el índice de la carta activa.

import { createCard, enableTilt, disableTilt } from "./holo-card.js";

const SWIPE_THRESHOLD = 48;

export function createCarousel({ stage, prev, next, counter, cards, onOpen }) {
  const nodes = cards.map(createCard);
  const total = nodes.length;

  let index = 0;
  let active = null;
  let swipeStart = null;
  let swiped = false;

  nodes.forEach((node, position) => {
    node.setAttribute("role", "button");
    node.addEventListener("click", () => {
      if (swiped) return;
      if (position === index) onOpen(position, node);
      else goTo(position);
    });
    node.addEventListener("keydown", (event) => {
      if (position !== index) return;
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      onOpen(position, node);
    });
    stage.append(node);
  });

  prev.addEventListener("click", () => goTo(index - 1));
  next.addEventListener("click", () => goTo(index + 1));
  prev.disabled = total < 2;
  next.disabled = total < 2;

  document.addEventListener("keydown", onArrowKey);
  stage.addEventListener("pointerdown", onPointerDown);
  // En la ventana, no en el escenario: así el final del gesto llega aunque el
  // dedo se levante fuera, que es lo normal en un barrido que se pasa de largo.
  // Capturar el puntero conseguiría lo mismo, pero desviaría el clic al
  // escenario y la carta dejaría de abrirse.
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("pointercancel", () => {
    swipeStart = null;
  });

  render();

  return { goTo };

  function goTo(next) {
    const wrapped = ((next % total) + total) % total;
    if (wrapped === index) return;
    index = wrapped;
    render();
  }

  function render() {
    // Si el foco estaba en una carta, tiene que viajar con la activa: si no,
    // acaba sobre una carta oculta y la persona pierde su sitio en el abanico.
    const focusWasInStage = stage.contains(document.activeElement);

    nodes.forEach((node, position) => {
      const offset = shortestOffset(position, index, total);
      const far = Math.abs(offset) > 2;

      node.style.setProperty("--offset", offset);
      node.dataset.offset = far ? "far" : String(offset);
      node.setAttribute("aria-hidden", far ? "true" : "false");
      node.tabIndex = offset === 0 ? 0 : -1;
      node.setAttribute(
        "aria-label",
        offset === 0 ? `Abrir la ficha de ${cards[position].name}` : cards[position].name
      );
    });

    const node = nodes[index];
    if (node !== active) {
      if (active) {
        disableTilt(active);
        active.classList.remove("is-active");
      }
      node.classList.add("is-active");
      enableTilt(node);
      active = node;
    }

    if (focusWasInStage && document.activeElement !== node) {
      node.focus({ preventScroll: true });
    }

    // El fondo de la página se tiñe con el color de la carta que hay delante.
    document.documentElement.style.setProperty(
      "--page-accent",
      cards[index].accent
    );

    counter.textContent = `${index + 1} / ${total}`;
  }

  function onArrowKey(event) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    if (document.querySelector("dialog[open]")) return;
    if (isTyping(document.activeElement)) return;

    event.preventDefault();
    goTo(index + (event.key === "ArrowRight" ? 1 : -1));
  }

  function onPointerDown(event) {
    swiped = false;
    swipeStart = { x: event.clientX, y: event.clientY, id: event.pointerId };
  }

  function onPointerUp(event) {
    if (!swipeStart || event.pointerId !== swipeStart.id) return;

    const dx = event.clientX - swipeStart.x;
    const dy = event.clientY - swipeStart.y;
    swipeStart = null;

    if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) <= Math.abs(dy)) return;

    // Un arrastre no es un clic: si no, soltar sobre la carta abriría su ficha.
    swiped = true;
    goTo(index + (dx < 0 ? 1 : -1));
  }
}

// La distancia circular más corta, para que ninguna carta ocupe dos sitios.
function shortestOffset(position, index, total) {
  const half = Math.floor(total / 2);
  let offset = position - index;

  while (offset > half) offset -= total;
  while (offset < -half) offset += total;

  return offset;
}

function isTyping(element) {
  if (!element) return false;
  return (
    element.isContentEditable ||
    ["INPUT", "TEXTAREA", "SELECT"].includes(element.tagName)
  );
}
