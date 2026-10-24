const scenarios = {
  water: {
    code: "DOSSIER A/01",
    category: "CLIMA Y AGUA / SIMULACIÓN",
    title: "Estrés hídrico en una cuenca compartida",
    context: "Hipótesis creada para demostrar la interfaz. No describe un lugar ni un hecho en curso.",
    sources: "Ninguna",
    uncertainty: "No evaluada",
    advisory: "Antes de valorar opciones, contrastar observaciones hidrológicas recientes con equipos técnicos de los territorios implicados y escuchar a las comunidades afectadas. Cualquier decisión corresponde a las autoridades legítimas tras revisión humana.",
    evidence: "Sin fuentes externas: ejemplo ficticio. No se consultaron datos actuales."
  },
  heat: {
    code: "DOSSIER A/02",
    category: "SALUD / SIMULACIÓN",
    title: "Continuidad de servicios ante calor",
    context: "Hipótesis ilustrativa sobre planificación de servicios durante un episodio de calor; no es una previsión ni una alerta.",
    sources: "Ninguna",
    uncertainty: "No evaluada",
    advisory: "En un análisis real, contrastar pronósticos oficiales y capacidad local de los servicios de salud, con atención a los grupos más expuestos. La publicación de cualquier alerta exigiría fuentes fechadas y revisión humana autorizada.",
    evidence: "Sin fuentes externas: ejemplo ficticio. No se identifican regiones ni personas."
  },
  supply: {
    code: "DOSSIER A/03",
    category: "SUMINISTRO / SIMULACIÓN",
    title: "Interrupción hipotética de suministro",
    context: "Escenario de práctica sobre una posible demora logística. No representa un evento real ni confirma escasez alguna.",
    sources: "Ninguna",
    uncertainty: "No evaluada",
    advisory: "Un equipo humano podría comparar registros públicos de transporte con datos locales de disponibilidad, documentar desacuerdos y examinar opciones con los actores afectados. Esta ficha no instruye a activar medidas.",
    evidence: "Sin fuentes externas: ejemplo ficticio. No se consultaron registros logísticos."
  }
};

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function selectScenario(id, buttons) {
  const scenario = scenarios[id];
  if (!scenario) return;
  buttons.forEach((button) => {
    const active = button.dataset.signalId === id;
    button.setAttribute("aria-pressed", String(active));
    button.classList.toggle("is-selected", active);
  });
  setText("briefing-code", scenario.code);
  setText("signal-category", scenario.category);
  setText("signal-title", scenario.title);
  setText("signal-context", scenario.context);
  setText("signal-sources", scenario.sources);
  setText("signal-uncertainty", scenario.uncertainty);
  setText("signal-advisory", scenario.advisory);
  setText("signal-evidence", scenario.evidence);
}

export function initializeObservatory() {
  const list = document.getElementById("signal-list");
  if (!list) return;
  const scenarioButtons = [...list.querySelectorAll("[data-signal-id]")];
  const filters = [...document.querySelectorAll("[data-filter]")];
  const entries = [...list.children];
  let activeFilter = "all";

  function applyFilter(filter) {
    activeFilter = filter;
    filters.forEach((button) => {
      const active = button.dataset.filter === filter;
      button.setAttribute("aria-pressed", String(active));
      button.classList.toggle("is-active", active);
    });
    entries.forEach((entry) => {
      entry.hidden = filter !== "all" && entry.dataset.category !== filter;
    });
    const selectedVisible = scenarioButtons.some((button) => {
      return button.getAttribute("aria-pressed") === "true" && !button.closest("li").hidden;
    });
    if (!selectedVisible) {
      const firstVisible = scenarioButtons.find((button) => !button.closest("li").hidden);
      if (firstVisible) selectScenario(firstVisible.dataset.signalId, scenarioButtons);
    }
  }

  scenarioButtons.forEach((button) => {
    button.addEventListener("click", () => selectScenario(button.dataset.signalId, scenarioButtons));
  });
  filters.forEach((button) => {
    button.addEventListener("click", () => applyFilter(button.dataset.filter));
  });
  applyFilter(activeFilter);
}
