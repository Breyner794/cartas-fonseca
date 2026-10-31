import { loadCollection, DataError } from "./data.js";
import { createCard, enableTilt } from "./holo-card.js";

const titleEl = document.getElementById("collection-title");
const subtitleEl = document.getElementById("collection-subtitle");
const errorEl = document.getElementById("page-error");
const carouselEl = document.getElementById("carousel");

start();

async function start() {
  let data;

  try {
    data = await loadCollection();
  } catch (error) {
    if (!(error instanceof DataError)) throw error;
    showMessage(error.message);
    return;
  }

  titleEl.textContent = data.collection.title;
  subtitleEl.textContent = data.collection.subtitle;
  document.title = data.collection.title;

  if (data.cards.length === 0) {
    showMessage(
      "Todavía no hay cartas en la colección. Añade la primera en data/cards.json."
    );
    return;
  }

  // Montaje provisional: el carrusel lo sustituye en la tarea siguiente.
  const nodes = data.cards.map(createCard);
  carouselEl.append(...nodes);
  nodes[0].classList.add("is-active");
  enableTilt(nodes[0]);
}

function showMessage(message) {
  errorEl.textContent = message;
  errorEl.hidden = false;
  carouselEl.hidden = true;
}
