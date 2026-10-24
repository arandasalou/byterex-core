const demoResponses = [
  [/protocolo|reglas|identidad/i, "Mi perfil está inspirado en el archivo ByteREX: respuestas directas, discreción y evolución controlada. En esta versión solo interpreto ejemplos locales; todavía no hay un modelo conectado."],
  [/sombra|discret|privacidad/i, "Modo demo local activo. El historial se guarda únicamente en este navegador y no se transmite a ningún servicio."],
  [/cómo funcion|como funcion|aquí|aqui|demo|prueba/i, "Esta web funciona como una demo estática. Una respuesta simulada se genera en tu navegador. Más adelante podrá enviar el mensaje a un endpoint seguro; cualquier clave de IA deberá vivir solo en ese servidor."],
  [/cerebro|libre|modelo|ia|conectar/i, "El conector de IA está preparado pero desactivado. GitHub Pages no ejecuta un servidor; para conectar un modelo hará falta un backend seguro y configurar la credencial allí, nunca en esta página."],
  [/quién eres|quien eres|byte.?rex|hola|buenas/i, "Soy ByteREX-Core en modo de demostración: una interfaz conversacional de código abierto. Todavía no soy una IA conectada; esta respuesta es simulada y se procesa localmente."]
];

function demoReply(message) {
  const match = demoResponses.find(([pattern]) => pattern.test(message));
  return match?.[1] ?? "Señal recibida. Esta respuesta es una simulación local, no una salida de un modelo. Cuando exista un endpoint seguro, la conversación podrá continuar a través de tu IA.";
}

function endpointFromConfig() {
  const value = window.BYTEREX_CONFIG?.chatEndpoint?.trim();
  if (!value) return "";
  const endpoint = new URL(value, window.location.href);
  if (window.location.protocol === "https:" && endpoint.protocol !== "https:") {
    throw new Error("El endpoint debe usar HTTPS en una página pública.");
  }
  return endpoint.href;
}

export function isRemoteMode() {
  try { return Boolean(endpointFromConfig()); } catch { return false; }
}

export async function requestReply(message, history) {
  const endpoint = endpointFromConfig();
  if (!endpoint) {
    await new Promise((resolve) => window.setTimeout(resolve, 420));
    return demoReply(message);
  }

  const response = await fetch(endpoint, {
    method: "POST",
    mode: "cors",
    credentials: "omit",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      history: history.slice(-20).map(({ role, content }) => ({ role, content }))
    })
  });
  if (!response.ok) throw new Error(`El servicio respondió con estado ${response.status}.`);
  const payload = await response.json();
  if (typeof payload.reply !== "string" || !payload.reply.trim()) {
    throw new Error("La respuesta del servicio no contiene el campo de texto «reply».");
  }
  return payload.reply.trim();
}
