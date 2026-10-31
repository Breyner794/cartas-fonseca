// El nodo de una carta y su reacción al puntero. Lo único que este módulo
// decide sobre el aspecto son cinco números; el resto está en holo.css.

const MAX_TILT = 12;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const listeners = new WeakMap();
const pending = new Map();
let frame = 0;

export function createCard(card) {
  const el = document.createElement("article");
  el.className = "card";
  el.dataset.id = card.id;
  el.style.setProperty("--accent", card.accent);

  const float = document.createElement("div");
  float.className = "card__float";

  const tilt = document.createElement("div");
  tilt.className = "card__tilt";

  const img = document.createElement("img");
  img.className = "card__img";
  img.src = card.image;
  img.alt = card.subtitle ? `${card.name}. ${card.subtitle}` : card.name;
  img.decoding = "async";
  // Una lámina escaneada tarda en decodificar. Sin esto aparece de golpe, y
  // mientras tanto la carta parece rota en lugar de estar cargando.
  if (img.complete && img.naturalWidth > 0) el.classList.add("is-loaded");
  img.addEventListener("load", () => el.classList.add("is-loaded"), {
    once: true,
  });
  img.addEventListener("error", () => el.classList.add("is-missing"), {
    once: true,
  });

  const fallback = document.createElement("div");
  fallback.className = "card__fallback";
  const fallbackName = document.createElement("span");
  fallbackName.textContent = card.name;
  fallback.append(fallbackName);

  const glare = document.createElement("div");
  glare.className = "card__glare";

  const holo = document.createElement("div");
  holo.className = "card__holo";

  tilt.append(img, fallback, glare, holo);
  float.append(tilt);
  el.append(float);

  return el;
}

export function enableTilt(cardEl) {
  if (reduceMotion.matches || listeners.has(cardEl)) return;

  const handlers = {
    move: (event) => track(cardEl, event),
    leave: () => release(cardEl),
  };

  cardEl.addEventListener("pointermove", handlers.move);
  cardEl.addEventListener("pointerleave", handlers.leave);
  cardEl.addEventListener("pointercancel", handlers.leave);
  listeners.set(cardEl, handlers);
}

export function disableTilt(cardEl) {
  const handlers = listeners.get(cardEl);
  if (!handlers) return;

  cardEl.removeEventListener("pointermove", handlers.move);
  cardEl.removeEventListener("pointerleave", handlers.leave);
  cardEl.removeEventListener("pointercancel", handlers.leave);
  listeners.delete(cardEl);
  release(cardEl);
}

function track(cardEl, event) {
  if (event.pointerType === "touch") return;
  schedule(cardEl, { x: event.clientX, y: event.clientY });
}

function release(cardEl) {
  pending.delete(cardEl);
  cardEl.classList.remove("is-tilting");
  cardEl.style.setProperty("--mx", "50%");
  cardEl.style.setProperty("--my", "50%");
  cardEl.style.setProperty("--rx", "0deg");
  cardEl.style.setProperty("--ry", "0deg");
  cardEl.style.setProperty("--glow", "0");
}

// Un pointermove puede llegar varias veces por frame. Se guarda el último y
// se escribe una sola vez, cuando el navegador va a pintar.
function schedule(cardEl, point) {
  pending.set(cardEl, point);
  if (frame) return;
  frame = requestAnimationFrame(flush);
}

function flush() {
  frame = 0;

  for (const [cardEl, point] of pending) {
    const rect = cardEl.getBoundingClientRect();
    if (!rect.width || !rect.height) continue;

    const px = clamp((point.x - rect.left) / rect.width);
    const py = clamp((point.y - rect.top) / rect.height);
    const distance = Math.min(1, Math.hypot(px - 0.5, py - 0.5) / 0.52);

    cardEl.classList.add("is-tilting");
    cardEl.style.setProperty("--mx", `${(px * 100).toFixed(2)}%`);
    cardEl.style.setProperty("--my", `${(py * 100).toFixed(2)}%`);
    cardEl.style.setProperty("--rx", `${((0.5 - py) * 2 * MAX_TILT).toFixed(2)}deg`);
    cardEl.style.setProperty("--ry", `${((px - 0.5) * 2 * MAX_TILT).toFixed(2)}deg`);
    cardEl.style.setProperty("--glow", (1 - distance).toFixed(3));
  }

  pending.clear();
}

function clamp(value) {
  return Math.min(1, Math.max(0, value));
}
