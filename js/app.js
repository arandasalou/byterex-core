import { isRemoteMode, requestReply } from "./assistant.js";
import { initializeObservatory } from "./observatory.js";

const STORAGE_KEY = "byterex-core-chat-v1";
const MAX_MESSAGES = 80;
const welcome = {
  role: "assistant",
  content: "Núcleo en espera. Soy ByteREX-Core, presentado aquí en modo demo: mis respuestas son simuladas y el historial permanece en este navegador. ¿Qué deseas explorar?",
  time: Date.now()
};

const list = document.querySelector("#message-list");
const form = document.querySelector("#chat-form");
const input = document.querySelector("#message-input");
const sendButton = document.querySelector("#send-button");
const status = document.querySelector("#chat-status");
const counter = document.querySelector("#session-count");
const clearButton = document.querySelector("#clear-chat");
const newChatButton = document.querySelector("#new-chat");
const quickPrompts = document.querySelector("#quick-prompts");
const modeLabel = document.querySelector("#mode-label");
const connectionLabel = document.querySelector("#connection-label");
const composerNote = document.querySelector("#composer-note");
const prepareConsultButton = document.querySelector("#prepare-observatory-chat");
const navButtons = [...document.querySelectorAll("[data-view-target]")];
const panels = {
  chat: document.querySelector("#chat-view"),
  record: document.querySelector("#record-view"),
  observatory: document.querySelector("#observatory-view")
};
const viewLabels = {
  chat: "SALA DE CONVERSACIÓN",
  record: "FICHA DEL NÚCLEO",
  observatory: "OBSERVATORIO GLOBAL"
};
let sending = false;
let messages = loadMessages();

function loadMessages() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (Array.isArray(value) && value.every((item) => ["assistant", "user"].includes(item.role) && typeof item.content === "string")) {
      return value.slice(-MAX_MESSAGES);
    }
  } catch { /* Private browsing or blocked storage: keep the session in memory. */ }
  return [];
}

function saveMessages() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-MAX_MESSAGES))); }
  catch { status.textContent = "El almacenamiento local no está disponible; el historial solo durará esta sesión."; }
}

function timeLabel(value) {
  try { return new Intl.DateTimeFormat("es-ES", { hour: "2-digit", minute: "2-digit" }).format(new Date(value)); }
  catch { return "ahora"; }
}

function renderMessage(message) {
  const item = document.createElement("li");
  item.className = `message message-${message.role}`;
  const marker = document.createElement("span");
  marker.className = "message-marker";
  marker.setAttribute("aria-hidden", "true");
  marker.textContent = message.role === "assistant" ? "BRX" : "TÚ";
  const body = document.createElement("div");
  body.className = "message-body";
  const meta = document.createElement("div");
  meta.className = "message-meta";
  const speaker = document.createElement("strong");
  speaker.textContent = message.role === "assistant" ? "BYTEREX-CORE" : "VISITANTE";
  const time = document.createElement("time");
  time.dateTime = new Date(message.time || Date.now()).toISOString();
  time.textContent = timeLabel(message.time || Date.now());
  const text = document.createElement("p");
  text.className = "message-text";
  text.textContent = message.content;
  meta.append(speaker, time);
  body.append(meta, text);
  item.append(marker, body);
  list.append(item);
}

function renderAll() {
  list.replaceChildren();
  if (!messages.length) messages = [{ ...welcome }];
  messages.forEach(renderMessage);
  counter.textContent = `${String(messages.length).padStart(2, "0")} ${messages.length === 1 ? "registro" : "registros"}`;
  list.scrollTop = list.scrollHeight;
}

function addMessage(role, content) {
  const message = { role, content, time: Date.now() };
  messages = [...messages, message].slice(-MAX_MESSAGES);
  renderMessage(message);
  saveMessages();
  counter.textContent = `${String(messages.length).padStart(2, "0")} ${messages.length === 1 ? "registro" : "registros"}`;
  list.scrollTop = list.scrollHeight;
  return message;
}

function setBusy(value) {
  sending = value;
  sendButton.disabled = value;
  input.disabled = value;
  sendButton.querySelector("span:first-child").textContent = value ? "Enviando" : "Enviar";
}

async function sendMessage(raw) {
  const text = raw.trim();
  if (!text || sending) return;
  input.value = "";
  input.style.height = "auto";
  addMessage("user", text);
  setBusy(true);
  status.textContent = isRemoteMode() ? "Contactando el endpoint configurado…" : "ByteREX está preparando una respuesta simulada…";
  const waiting = document.createElement("li");
  waiting.className = "message message-assistant message-thinking";
  waiting.setAttribute("aria-label", "ByteREX-Core está pensando");
  waiting.innerHTML = '<span class="message-marker" aria-hidden="true">BRX</span><div class="message-body"><div class="message-meta"><strong>BYTEREX-CORE</strong><span>procesando</span></div><span class="thinking-dots" aria-hidden="true"><i></i><i></i><i></i></span></div>';
  list.append(waiting);
  list.scrollTop = list.scrollHeight;
  try {
    const reply = await requestReply(text, messages);
    waiting.remove();
    addMessage("assistant", reply);
    status.textContent = isRemoteMode() ? "Respuesta recibida del endpoint configurado." : "Respuesta simulada localmente. No se ha contactado con ninguna IA.";
  } catch (error) {
    waiting.remove();
    const message = error instanceof Error ? error.message : "Error desconocido.";
    addMessage("assistant", `No se pudo completar la respuesta: ${message}`);
    status.textContent = "La conexión del endpoint falló; no se ha revelado ni enviado ninguna clave desde el navegador.";
  } finally {
    setBusy(false);
    input.focus();
  }
}

function resetChat() {
  messages = [{ ...welcome }];
  saveMessages();
  renderAll();
  status.textContent = "Nueva conversación local lista.";
  input.focus();
}

function setView(view) {
  if (!panels[view]) return;
  Object.entries(panels).forEach(([key, panel]) => { panel.hidden = key !== view; });
  document.querySelector("#breadcrumb-section").textContent = viewLabels[view];
  navButtons.forEach((button) => {
    const active = button.dataset.viewTarget === view;
    button.classList.toggle("is-active", active);
    if (active) button.setAttribute("aria-current", "page"); else button.removeAttribute("aria-current");
  });
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  void sendMessage(input.value);
});
input.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void sendMessage(input.value); }
});
input.addEventListener("input", () => { input.style.height = "auto"; input.style.height = `${Math.min(input.scrollHeight, 120)}px`; });
quickPrompts.addEventListener("click", (event) => {
  const button = event.target.closest(".prompt-chip");
  if (button) void sendMessage(button.textContent);
});
newChatButton.addEventListener("click", resetChat);
clearButton.addEventListener("click", () => {
  if (window.confirm("¿Borrar el historial de esta conversación guardado en este navegador?")) resetChat();
});
navButtons.forEach((button) => button.addEventListener("click", () => setView(button.dataset.viewTarget)));
prepareConsultButton.addEventListener("click", () => {
  const scenarioTitle = document.querySelector("#signal-title").textContent;
  input.value = `Prepara una nota consultiva sobre el escenario hipotético «${scenarioTitle}». Distingue hechos, hipótesis, incertidumbre y fuentes que harían falta. No emitas órdenes ni envíes mensajes a terceros.`;
  setView("chat");
  input.dispatchEvent(new Event("input", { bubbles: true }));
  status.textContent = "Consulta preparada en el campo local; no se ha enviado a nadie.";
  input.focus();
});

const remote = isRemoteMode();
modeLabel.textContent = remote ? "ENDPOINT SEGURO" : "DEMO LOCAL";
connectionLabel.textContent = remote ? "ENDPOINT CONFIGURADO" : "MODO DEMO · LOCAL";
if (remote) composerNote.innerHTML = '<span aria-hidden="true">⌁</span> El endpoint recibe mensajes; configura cualquier credencial solo en su servidor.';
initializeObservatory();
renderAll();
