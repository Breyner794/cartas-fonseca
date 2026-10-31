// Carga de la colección. Todo lo que sale de aquí ya está normalizado: las
// listas existen aunque estén vacías y el acento es siempre un valor que el
// CSS puede usar, de modo que nadie más tiene que comprobar nada.

const DEFAULT_URL = "data/cards.json";
const HEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const FALLBACK_ACCENT = "var(--accent-default)";
// Por debajo de esta luminancia relativa el acento deja de cumplir su función.
// Un azul marino (#0b2545) la supera; un negro casi puro, no.
const MIN_ACCENT_LUMINANCE = 0.015;

export class DataError extends Error {
  constructor(message) {
    super(message);
    this.name = "DataError";
  }
}

export async function loadCollection(url = DEFAULT_URL) {
  const raw = await fetchJson(url);

  if (!raw || typeof raw !== "object" || !Array.isArray(raw.cards)) {
    throw new DataError(
      `El archivo ${url} no tiene el formato esperado: falta la lista "cards".`
    );
  }

  return {
    collection: {
      title: text(raw.collection?.title) || "Colección",
      subtitle: text(raw.collection?.subtitle),
    },
    cards: normalizeCards(raw.cards),
  };
}

async function fetchJson(url) {
  let response;

  try {
    // Revalidar siempre: si el navegador sirve la copia guardada, quien edite
    // los datos no verá sus cambios al recargar.
    response = await fetch(url, { cache: "no-cache" });
  } catch {
    throw new DataError(
      `No se pudo leer ${url}. Si has abierto la página con doble clic, ábrela desde un servidor local.`
    );
  }

  if (!response.ok) {
    throw new DataError(
      `No se pudo leer ${url}: el servidor respondió ${response.status}.`
    );
  }

  try {
    return await response.json();
  } catch {
    throw new DataError(
      `El archivo ${url} no es un JSON válido. Revisa que no falte o sobre una coma.`
    );
  }
}

function normalizeCards(entries) {
  const seen = new Set();
  const cards = [];

  for (const entry of entries) {
    if (!entry || typeof entry !== "object") continue;

    const id = text(entry.id);
    const name = text(entry.name);
    const image = text(entry.image);

    if (!id || !name || !image) {
      console.warn(
        "Carta omitida: faltan campos obligatorios (id, name, image).",
        entry
      );
      continue;
    }

    if (seen.has(id)) {
      console.warn(`Carta omitida: el id "${id}" ya estaba en uso.`, entry);
      continue;
    }

    seen.add(id);

    cards.push({
      id,
      name,
      subtitle: text(entry.subtitle),
      image,
      accent: accent(entry.accent),
      tags: tags(entry.tags),
      stats: stats(entry.stats),
      paragraphs: paragraphs(entry.description),
    });
  }

  return cards;
}

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function accent(value) {
  const candidate = text(value);

  if (!HEX.test(candidate)) {
    if (candidate) {
      console.warn(`Acento ignorado, no es un hexadecimal: "${candidate}".`);
    }
    return FALLBACK_ACCENT;
  }

  // Un acento casi negro no ilumina el resplandor, no se ve en los filetes y
  // deja los rótulos de los datos por debajo del contraste exigido.
  if (luminance(candidate) < MIN_ACCENT_LUMINANCE) {
    console.warn(
      `Acento ignorado por demasiado oscuro: "${candidate}". Elige un color que se vea sobre fondo oscuro.`
    );
    return FALLBACK_ACCENT;
  }

  return candidate;
}

function luminance(hex) {
  const digits =
    hex.length === 4
      ? [...hex.slice(1)].map((digit) => digit + digit)
      : [hex.slice(1, 3), hex.slice(3, 5), hex.slice(5, 7)];

  const [r, g, b] = digits
    .map((pair) => parseInt(pair, 16) / 255)
    .map((channel) =>
      channel <= 0.03928
        ? channel / 12.92
        : Math.pow((channel + 0.055) / 1.055, 2.4)
    );

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function tags(value) {
  if (!Array.isArray(value)) return [];
  return value.map(text).filter(Boolean);
}

function stats(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((entry) => entry && typeof entry === "object")
    .map((entry) => ({ label: text(entry.label), value: text(entry.value) }))
    .filter((entry) => entry.label && entry.value);
}

function paragraphs(value) {
  return text(value)
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}
