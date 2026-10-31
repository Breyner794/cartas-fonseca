// La ficha de una carta. El <dialog> aporta Esc, la trampa de foco y el
// bloqueo del fondo; aquí solo se pinta el contenido y se devuelve el foco.

import { createCard, enableTilt, disableTilt } from "./holo-card.js";

export function createDetail(dialog) {
  const bg = dialog.querySelector("#detail-bg");
  const closeButton = dialog.querySelector("#detail-close");
  const cardCol = dialog.querySelector("#detail-card");
  const nameEl = dialog.querySelector("#detail-name");
  const bodyEl = dialog.querySelector("#detail-body");

  let cardNode = null;
  let returnFocusTo = null;

  closeButton.addEventListener("click", requestClose);

  // Esc llega como `cancel`: se intercepta para que el cierre también se anime.
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    requestClose();
  });

  // Clic fuera del contenido, es decir sobre el propio diálogo
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) requestClose();
  });

  dialog.addEventListener("close", () => {
    if (cardNode) disableTilt(cardNode);
    cardNode = null;
    cardCol.replaceChildren();
    dialog.classList.remove("is-closing");
    returnFocusTo?.focus();
    returnFocusTo = null;
  });

  return { open };

  function open(card, focusTarget) {
    returnFocusTo = focusTarget ?? null;

    dialog.style.setProperty("--accent", card.accent);

    // Absoluta a propósito: una url() dentro de una custom property se
    // resuelve contra la hoja que la usa (src/css/), no contra el documento.
    const image = new URL(card.image, document.baseURI).href;
    bg.style.setProperty("--card-image", `url(${JSON.stringify(image)})`);

    nameEl.textContent = card.name;
    renderBody(card.paragraphs);

    cardNode = createCard(card);
    // Sin esto, en táctil la carta de la ficha se queda sin barrido holográfico
    // justo en la vista donde se mira de cerca.
    cardNode.classList.add("is-active");
    cardCol.replaceChildren(cardNode);
    enableTilt(cardNode);

    dialog.showModal();
    dialog.scrollTop = 0;
  }

  function requestClose() {
    if (dialog.classList.contains("is-closing")) return;

    dialog.classList.add("is-closing");

    // Esperar a las animaciones reales, no a un evento: sin animación —con
    // `prefers-reduced-motion`— el evento no llega y la ficha no cerraría.
    const animations = dialog.getAnimations();

    if (animations.length === 0) {
      dialog.close();
      return;
    }

    Promise.allSettled(animations.map((animation) => animation.finished)).then(
      () => dialog.close()
    );
  }

  function renderBody(paragraphs) {
    bodyEl.replaceChildren(
      ...paragraphs.map((paragraph) => {
        const node = document.createElement("p");
        node.textContent = paragraph;
        return node;
      })
    );
  }
}
