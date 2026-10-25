const TOPIC_LABELS = {
  climate_water: "Clima y agua",
  health: "Salud pública",
  food_security: "Seguridad alimentaria"
};
const SOURCE_STATE_LABELS = {
  never: ["Pendiente", "never"],
  checking: ["Consultando", "checking"],
  ok: ["Responde", "ok"],
  limited: ["Límite temporal", "limited"],
  error: ["Error", "error"]
};
const state = { items: [], status: null, topic: "all", language: "all", loading: false };
const ui = {
  list: document.getElementById("news-list"),
  empty: document.getElementById("news-empty"),
  emptyTitle: document.getElementById("news-empty-title"),
  emptyCopy: document.getElementById("news-empty-copy"),
  error: document.getElementById("news-error"),
  errorCopy: document.getElementById("news-error-copy"),
  statusText: document.getElementById("news-status-text"),
  stateIndicator: document.getElementById("news-state-indicator"),
  lastSweep: document.getElementById("news-last-sweep"),
  resultCount: document.getElementById("news-result-count"),
  resultContext: document.getElementById("news-result-context"),
  sources: document.getElementById("news-source-status"),
  refresh: document.getElementById("news-refresh-button")
};

function getApiBase() {
  const configured = String(window.BYTEREX_CONFIG?.newsApiBase || "").trim();
  if (configured) {
    const url = new URL(configured, window.location.origin);
    const localHttp = url.protocol === "http:" && ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
    if ((url.protocol !== "https:" && !localHttp) || url.username || url.password || url.search || url.hash || (url.pathname !== "/" && url.pathname !== "")) {
      throw new Error("La configuración pública del API debe ser un origen HTTPS, sin credenciales ni rutas.");
    }
    return url.origin;
  }
  const host = window.location.hostname.toLowerCase();
  if (host === "github.io" || host.endsWith(".github.io")) return "";
  return window.location.origin;
}

function setText(element, value) {
  if (element) element.textContent = value;
}

function formatDate(value) {
  if (!value) return "Fecha no indicada";
  const date = new Date(String(value).replace(/(\.\d{3})\d+Z$/, "$1Z"));
  if (Number.isNaN(date.getTime())) return "Fecha no indicada";
  return `${new Intl.DateTimeFormat("es-ES", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(date)} UTC`;
}

function safeExternalUrl(value) {
  try {
    const url = new URL(String(value));
    if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) return null;
    return url.href;
  } catch { return null; }
}

function addText(parent, tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  element.textContent = text;
  parent.append(element);
  return element;
}

function setOverview(stateName, message) {
  setText(ui.statusText, message);
  if (ui.stateIndicator) ui.stateIndicator.dataset.state = stateName;
}

function renderSources(sources) {
  if (!ui.sources) return;
  ui.sources.replaceChildren();
  if (!Array.isArray(sources) || sources.length === 0) {
    const item = document.createElement("li");
    item.className = "news-source-card news-source-card-unavailable";
    addText(item, "strong", "news-source-name", "Estado no disponible");
    addText(item, "span", "news-source-state", "Sin respuesta del API");
    ui.sources.append(item);
    return;
  }

  for (const source of sources) {
    const item = document.createElement("li");
    const [label, stateClass] = SOURCE_STATE_LABELS[source.state] || ["Sin estado", "unknown"];
    item.className = "news-source-card";
    item.dataset.state = stateClass;
    const name = addText(item, "strong", "news-source-name", source.name || source.sourceId || "Fuente pública");
    const feedUrl = safeExternalUrl(source.feedUrl);
    if (feedUrl) {
      const link = document.createElement("a");
      link.className = "news-source-link";
      link.href = feedUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.setAttribute("aria-label", `Abrir feed de ${source.name || "la fuente"}`);
      link.textContent = "Abrir feed ↗";
      name.after(link);
    }
    addText(item, "span", "news-source-state", label);
    const lastSuccess = source.lastSuccessAt ? `Último éxito: ${formatDate(source.lastSuccessAt)}` : "Sin recolección exitosa";
    addText(item, "span", "news-source-detail", lastSuccess);
    if (source.state === "limited" && source.nextAllowedAt) {
      addText(item, "span", "news-source-detail", `Nuevo intento permitido: ${formatDate(source.nextAllowedAt)}`);
    } else if (Number.isInteger(source.itemCount)) {
      addText(item, "span", "news-source-detail", `${source.itemCount} registros en el último intento`);
    }
    if (source.errorCode) addText(item, "span", "news-source-error", `Código: ${source.errorCode}`);
    ui.sources.append(item);
  }
}

function visibleItems() {
  return state.items.filter((item) => {
    const topicMatches = state.topic === "all" || item.topic === state.topic;
    const languageMatches = state.language === "all" || item.language === state.language;
    return topicMatches && languageMatches;
  });
}

function renderItems() {
  if (!ui.list) return;
  const items = visibleItems();
  ui.list.replaceChildren();
  for (const item of items) {
    const listItem = document.createElement("li");
    const article = document.createElement("article");
    article.className = "news-item";
    const metadata = document.createElement("div");
    metadata.className = "news-item-meta";
    addText(metadata, "span", "news-topic-tag", TOPIC_LABELS[item.topic] || "Tema sin clasificar");
    addText(metadata, "span", "news-language-tag", String(item.language || "—").toUpperCase());
    const time = document.createElement("time");
    time.className = "news-item-date";
    if (item.publishedAt) time.dateTime = String(item.publishedAt);
    time.textContent = formatDate(item.publishedAt);
    metadata.append(time);
    article.append(metadata);

    const title = String(item.title || "Titular sin título");
    const safeUrl = safeExternalUrl(item.url);
    if (safeUrl) {
      const heading = document.createElement("h4");
      heading.className = "news-item-title";
      const link = document.createElement("a");
      link.href = safeUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = title;
      heading.append(link);
      article.append(heading);
    } else {
      addText(article, "h4", "news-item-title", title);
    }

    addText(article, "p", "news-item-summary", item.summary || "El feed no ofrece un extracto breve. Abre la fuente original para leer la noticia.");
    addText(article, "p", "news-item-source", `Fuente: ${item.sourceNames || "no indicada por el feed"}`);
    const footer = document.createElement("div");
    footer.className = "news-item-footer";
    addText(footer, "span", "news-item-seen", `Archivado: ${formatDate(item.firstSeenAt)}`);
    if (safeUrl) {
      const open = document.createElement("a");
      open.href = safeUrl;
      open.target = "_blank";
      open.rel = "noopener noreferrer";
      open.textContent = "Abrir original ↗";
      footer.append(open);
    }
    article.append(footer);
    listItem.append(article);
    ui.list.append(listItem);
  }

  setText(ui.resultCount, String(items.length));
  setText(ui.resultContext, `Mostrando ${items.length} de ${state.items.length} noticias archivadas.`);
  if (ui.empty) ui.empty.hidden = items.length !== 0;
  if (items.length === 0 && ui.emptyTitle && ui.emptyCopy) {
    if (state.items.length === 0) {
      ui.emptyTitle.textContent = "Todavía no hay registros";
      ui.emptyCopy.textContent = "La consulta no devolvió titulares archivados. El sistema no sustituye la ausencia de datos por escenarios ficticios.";
    } else {
      ui.emptyTitle.textContent = "Sin noticias para estos filtros";
      ui.emptyCopy.textContent = "Prueba otro tema o idioma para revisar los registros disponibles.";
    }
  }
}

function renderStatus(status) {
  state.status = status;
  renderSources(status?.sources);
  const latestRun = status?.latestRun;
  const lastTime = latestRun?.finishedAt || status?.lastUpdated || null;
  setText(ui.lastSweep, lastTime ? formatDate(lastTime) : "Sin registro");
  if (!latestRun && !status?.lastUpdated) {
    setOverview("never", "Esperando la primera recolección programada.");
  } else if (latestRun?.status === "partial_success" || status?.sources?.some((source) => ["limited", "error"].includes(source.state))) {
    setOverview("partial", "Archivo disponible; una o más fuentes tuvieron respuesta parcial.");
  } else {
    setOverview("ok", "Archivo consultable; las fuentes se muestran por separado.");
  }
}

async function fetchJson(apiBase, endpoint) {
  const response = await fetch(new URL(endpoint, apiBase), {
    method: "GET",
    mode: "cors",
    credentials: "omit",
    cache: "no-store",
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(12000)
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("application/json")) throw new Error("Respuesta del API no válida");
  return response.json();
}

async function loadArchive() {
  if (state.loading) return;
  state.loading = true;
  if (ui.refresh) { ui.refresh.disabled = true; ui.refresh.setAttribute("aria-busy", "true"); }
  setOverview("checking", "Consultando el archivo público…");
  if (ui.error) ui.error.hidden = true;
  try {
    const apiBase = getApiBase();
    if (!apiBase) throw new Error("El origen público no tiene configurada la URL de la API de noticias.");
    const [newsResult, statusResult] = await Promise.allSettled([
      fetchJson(apiBase, "/api/news?limit=50"),
      fetchJson(apiBase, "/api/status")
    ]);
    if (statusResult.status === "fulfilled") renderStatus(statusResult.value);
    else {
      renderSources(null);
      setText(ui.lastSweep, "Estado no disponible");
    }
    if (newsResult.status === "rejected") throw newsResult.reason;
    state.items = Array.isArray(newsResult.value?.items) ? newsResult.value.items : [];
    if (ui.error) ui.error.hidden = true;
    renderItems();
    if (statusResult.status === "rejected") setOverview("partial", "Noticias recibidas; no se pudo leer el estado de las fuentes.");
  } catch (error) {
    state.items = [];
    if (ui.list) ui.list.replaceChildren();
    if (ui.empty) ui.empty.hidden = true;
    if (ui.error) ui.error.hidden = false;
    const reason = error instanceof Error ? error.message : "Error de conexión";
    setText(ui.errorCopy, `${reason}. Revisa la conexión o la configuración pública del API; no se mostrarán datos de ejemplo.`);
    setOverview("error", "Archivo no disponible en este momento.");
    setText(ui.resultCount, "—");
    setText(ui.resultContext, "No hay datos de noticias cargados.");
    if (state.status?.sources) renderSources(state.status.sources);
    else renderSources(null);
  } finally {
    state.loading = false;
    if (ui.refresh) { ui.refresh.disabled = false; ui.refresh.removeAttribute("aria-busy"); }
  }
}

function bindFilters(attribute, key) {
  const buttons = [...document.querySelectorAll(`[${attribute}]`)];
  buttons.forEach((button) => button.addEventListener("click", () => {
    const value = button.getAttribute(attribute);
    if (key === "topic") state.topic = value;
    else state.language = value;
    buttons.forEach((candidate) => candidate.setAttribute("aria-pressed", String(candidate === button)));
    renderItems();
  }));
}

export function initializeObservatory() {
  if (!ui.list) return;
  bindFilters("data-news-topic", "topic");
  bindFilters("data-news-language", "language");
  ui.refresh?.addEventListener("click", () => void loadArchive());
  void loadArchive();
}
