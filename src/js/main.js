import { loadCollection, DataError } from "./data.js";
import { createCarousel } from "./carousel.js";
import { createDetail } from "./detail.js";

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

  const detail = createDetail(document.getElementById("detail"));

  createCarousel({
    stage: document.getElementById("carousel-stage"),
    prev: document.getElementById("carousel-prev"),
    next: document.getElementById("carousel-next"),
    counter: document.getElementById("carousel-counter"),
    cards: data.cards,
    onOpen: (position, cardEl) => detail.open(data.cards[position], cardEl),
  });
}

function showMessage(message) {
  errorEl.textContent = message;
  errorEl.hidden = false;
  carouselEl.hidden = true;
}
