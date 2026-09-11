const state = {
  dragons: [],
  filteredDragons: [],
  editingId: null,
  toastTimer: null,
};

const ELEMENT_COLORS = {
  Fire: "#e2784f",
  Water: "#639cb1",
  Air: "#8c83b0",
  Nature: "#62a17c",
  Earth: "#ac8b68",
  Ice: "#73a9bc",
  Lightning: "#d3aa52",
};

const elements = {
  total: document.getElementById("stat-total"),
  active: document.getElementById("stat-active"),
  elementCount: document.getElementById("stat-elements"),
  health: document.getElementById("stat-health"),
  totalNote: document.getElementById("stat-total-note"),
  activeNote: document.getElementById("stat-active-note"),
  elementNote: document.getElementById("stat-elements-note"),
  healthNote: document.getElementById("stat-health-note"),
  chart: document.getElementById("element-chart"),
  chartTotal: document.getElementById("chart-total"),
  table: document.getElementById("table-container"),
  recordCount: document.getElementById("record-count"),
  elementFilter: document.getElementById("element-filter"),
  statusFilter: document.getElementById("status-filter"),
  search: document.getElementById("search-input"),
  synced: document.getElementById("last-synced"),
  dragonModal: document.getElementById("dragon-modal"),
  importModal: document.getElementById("import-modal"),
  dragonForm: document.getElementById("dragon-form"),
  dragonFormError: document.getElementById("dragon-form-error"),
  importForm: document.getElementById("import-form"),
  importError: document.getElementById("import-form-error"),
  importSuccess: document.getElementById("import-form-success"),
  importButton: document.getElementById("import-button"),
  csvFile: document.getElementById("csv-file"),
  csvFileLabel: document.getElementById("csv-file-label"),
  sheetUrl: document.getElementById("sheet-url"),
  saveButton: document.getElementById("save-dragon-button"),
  modalTitle: document.getElementById("dragon-modal-title"),
  toast: document.getElementById("toast"),
};

document.addEventListener("DOMContentLoaded", () => {
  bindEvents();
  loadDragons();
});

function bindEvents() {
  document.getElementById("add-dragon-button").addEventListener("click", () => openDragonModal());
  document.getElementById("export-button").addEventListener("click", () => {
    window.location.href = "/api/export";
  });

  document.querySelectorAll("[data-open-import]").forEach((button) => {
    button.addEventListener("click", openImportModal);
  });
  document.querySelectorAll("[data-close-modal]").forEach((button) => {
    button.addEventListener("click", closeModals);
  });

  elements.search.addEventListener("input", render);
  elements.elementFilter.addEventListener("change", render);
  elements.statusFilter.addEventListener("change", render);
  elements.dragonForm.addEventListener("submit", saveDragon);
  elements.importForm.addEventListener("submit", importGoogleSheet);
  elements.csvFile.addEventListener("change", updateCsvFileLabel);
  elements.sheetUrl.addEventListener("input", () => {
    if (elements.sheetUrl.value && elements.csvFile.files.length) {
      elements.csvFile.value = "";
      updateCsvFileLabel();
    }
  });

  elements.table.addEventListener("click", (event) => {
    const action = event.target.closest("[data-action]");
    if (!action) return;
    const id = action.dataset.id;
    if (action.dataset.action === "edit") openDragonModal(id);
    if (action.dataset.action === "delete") deleteDragon(id);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeModals();
  });

  [elements.dragonModal, elements.importModal].forEach((modal) => {
    modal.addEventListener("click", (event) => {
      if (event.target === modal) closeModals();
    });
  });
}

async function apiRequest(url, options = {}) {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "Something went wrong.");
  return payload;
}

async function loadDragons() {
  try {
    const payload = await apiRequest("/api/dragons");
    state.dragons = Array.isArray(payload.dragons) ? payload.dragons : [];
    populateElementFilter();
    render();
    elements.synced.textContent = `Synced ${formatTime(payload.updatedAt)}`;
  } catch (error) {
    elements.table.innerHTML = `<div class="empty-state"><div><div class="empty-mark">!</div><strong>Could not load the registry</strong><p>${escapeHtml(error.message)}</p><button class="button button-primary" type="button" data-retry>Try again</button></div></div>`;
    elements.table.querySelector("[data-retry]").addEventListener("click", loadDragons);
  }
}

function render() {
  const search = elements.search.value.trim().toLowerCase();
  const element = elements.elementFilter.value;
  const status = elements.statusFilter.value;
  state.filteredDragons = state.dragons.filter((dragon) => {
    const searchable = [dragon.name, dragon.species, dragon.skin, dragon.rarity, dragon.element, dragon.location, dragon.account, dragon.notes]
      .join(" ")
      .toLowerCase();
    return (!search || searchable.includes(search)) &&
      (element === "all" || dragon.element === element) &&
      (status === "all" || dragon.status === status);
  });

  renderStats();
  renderChart();
  renderTable();
}

function renderStats() {
  const total = state.dragons.length;
  const active = state.dragons.filter((dragon) => dragon.status === "Active").length;
  const uniqueElements = new Set(state.dragons.map((dragon) => dragon.element).filter(Boolean)).size;
  const healthValues = state.dragons
    .map((dragon) => dragon.health)
    .filter((value) => value !== "" && value !== null && value !== undefined)
    .map(Number)
    .filter(Number.isFinite);
  const averageHealth = healthValues.length ? Math.round(healthValues.reduce((sum, value) => sum + value, 0) / healthValues.length) : null;

  elements.total.textContent = formatNumber(total);
  elements.active.textContent = formatNumber(active);
  elements.elementCount.textContent = formatNumber(uniqueElements);
  elements.health.textContent = averageHealth === null ? "—" : `${averageHealth}%`;
  elements.totalNote.textContent = total === 1 ? "in your registry" : "in your registry";
  elements.activeNote.textContent = active === 1 ? "currently active" : "currently active";
  elements.elementNote.textContent = uniqueElements === 1 ? "different affinity" : "different affinities";
  elements.healthNote.textContent = healthValues.length ? "across known dragons" : "no health data yet";
}

function renderChart() {
  const counts = new Map();
  state.dragons.forEach((dragon) => {
    const element = dragon.element || "Unknown";
    counts.set(element, (counts.get(element) || 0) + 1);
  });
  const entries = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  elements.chartTotal.textContent = `${state.dragons.length} ${state.dragons.length === 1 ? "record" : "records"}`;

  if (!entries.length) {
    elements.chart.innerHTML = `<div class="empty-state"><div><div class="empty-mark">◇</div><strong>No chart data yet</strong><p>Add a dragon or import a Google Sheet to see the element breakdown.</p></div></div>`;
    return;
  }

  const width = 680;
  const height = 214;
  const left = 96;
  const right = 32;
  const top = 11;
  const bottom = 30;
  const chartWidth = width - left - right;
  const chartHeight = height - top - bottom;
  const max = Math.max(...entries.map((entry) => entry[1]), 1);
  const step = chartHeight / entries.length;
  const barHeight = Math.min(20, step * 0.46);
  const tickCount = Math.min(max, 5);
  const ticks = Array.from({ length: tickCount + 1 }, (_, index) => Math.round((max * index) / tickCount));

  const grid = ticks.map((tick) => {
    const x = left + (tick / max) * chartWidth;
    return `<line class="chart-gridline" x1="${x}" y1="${top}" x2="${x}" y2="${height - bottom + 2}"></line><text class="chart-axis" x="${x}" y="${height - 8}" text-anchor="middle">${tick}</text>`;
  }).join("");

  const bars = entries.map(([label, count], index) => {
    const y = top + step * index + (step - barHeight) / 2;
    const barWidth = (count / max) * chartWidth;
    const color = ELEMENT_COLORS[label] || colorForLabel(label);
    return `<text class="chart-axis" x="${left - 13}" y="${y + barHeight / 2 + 3}" text-anchor="end">${escapeHtml(shorten(label, 15))}</text><rect class="chart-bar" x="${left}" y="${y}" width="${Math.max(barWidth, 4)}" height="${barHeight}" rx="${barHeight / 2}" fill="${color}"><title>${escapeHtml(label)}: ${count} ${count === 1 ? "dragon" : "dragons"}</title></rect><text class="chart-value" x="${left + barWidth + 9}" y="${y + barHeight / 2 + 3}">${count}</text>`;
  }).join("");

  elements.chart.innerHTML = `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${entries.map(([label, count]) => `${label}: ${count}`).join(", ")}"><g>${grid}${bars}</g></svg>`;
}

function renderTable() {
  const visibleCount = state.filteredDragons.length;
  elements.recordCount.textContent = visibleCount;

  if (!visibleCount) {
    const hasFilters = elements.search.value || elements.elementFilter.value !== "all" || elements.statusFilter.value !== "all";
    elements.table.innerHTML = `<div class="empty-state"><div><div class="empty-mark">${hasFilters ? "⌕" : "✦"}</div><strong>${hasFilters ? "No matching dragons" : "Your registry is empty"}</strong><p>${hasFilters ? "Try a different search or filter." : "Add your first dragon or import the sheet you already use."}</p>${hasFilters ? "" : '<button class="button button-primary" type="button" data-empty-add>Add your first dragon</button>'}</div></div>`;
    const addButton = elements.table.querySelector("[data-empty-add]");
    if (addButton) addButton.addEventListener("click", () => openDragonModal());
    return;
  }

  const rows = state.filteredDragons.map((dragon) => `
    <tr>
      <td><div class="dragon-cell"><span class="dragon-avatar" style="background:${colorForLabel(dragon.element)}">${escapeHtml(initials(dragon.name))}</span><div>${escapeHtml(dragon.name)}<small>${escapeHtml(dragon.id)}</small></div></div></td>
      <td>${escapeHtml(dragon.species || "—")}</td>
      <td>${dragon.skin ? `<span class="skin-chip">${escapeHtml(dragon.skin)}</span>` : "—"}</td>
      <td>${dragon.rarity ? `<span class="rarity-chip rarity-${String(dragon.rarity).toLowerCase()}">${escapeHtml(dragon.rarity)}</span>` : "—"}</td>
      <td><span class="element-chip">${escapeHtml(dragon.element || "Unknown")}</span></td>
      <td><span class="status-chip status-${String(dragon.status || "active").toLowerCase()}">${escapeHtml(dragon.status || "Active")}</span></td>
      <td>${escapeHtml(dragon.account || "—")}</td>
      <td>${escapeHtml(dragon.location || "—")}</td>
      <td>${escapeHtml(formatDate(dragon.lastSeen))}</td>
      <td><div class="row-actions"><button class="row-action" type="button" data-action="edit" data-id="${escapeHtml(dragon.id)}" aria-label="Edit ${escapeHtml(dragon.name)}">✎</button><button class="row-action delete" type="button" data-action="delete" data-id="${escapeHtml(dragon.id)}" aria-label="Delete ${escapeHtml(dragon.name)}">×</button></div></td>
    </tr>`).join("");

  elements.table.innerHTML = `<table class="records-table"><thead><tr><th>Dragon</th><th>Species</th><th>Skin</th><th>Rarity</th><th>Element</th><th>Status</th><th>Account</th><th>Location</th><th>Last seen</th><th><span class="sr-only">Actions</span></th></tr></thead><tbody>${rows}</tbody></table>`;
}

function populateElementFilter() {
  const selected = elements.elementFilter.value;
  const options = [...new Set(state.dragons.map((dragon) => dragon.element).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  elements.elementFilter.innerHTML = `<option value="all">All elements</option>${options.map((element) => `<option value="${escapeHtml(element)}">${escapeHtml(element)}</option>`).join("")}`;
  elements.elementFilter.value = options.includes(selected) ? selected : "all";
}

function openDragonModal(id = null) {
  state.editingId = id;
  elements.dragonForm.reset();
  elements.dragonFormError.textContent = "";
  elements.modalTitle.textContent = id ? "Edit dragon" : "Add a dragon";
  elements.saveButton.textContent = id ? "Save changes" : "Save record";
  const dragon = state.dragons.find((record) => record.id === id);
  if (dragon) {
    Object.entries(dragon).forEach(([key, value]) => {
      const field = elements.dragonForm.elements.namedItem(key);
      if (field) field.value = value ?? "";
    });
  }
  showModal(elements.dragonModal);
  elements.dragonForm.elements.name.focus();
}

function openImportModal() {
  elements.importForm.reset();
  updateCsvFileLabel();
  elements.importError.textContent = "";
  elements.importSuccess.textContent = "";
  elements.importButton.disabled = false;
  elements.importButton.textContent = "Import records";
  showModal(elements.importModal);
  document.getElementById("sheet-url").focus();
}

function showModal(modal) {
  elements.dragonModal.classList.add("hidden");
  elements.importModal.classList.add("hidden");
  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeModals() {
  elements.dragonModal.classList.add("hidden");
  elements.importModal.classList.add("hidden");
  document.body.style.overflow = "";
}

async function saveDragon(event) {
  event.preventDefault();
  elements.dragonFormError.textContent = "";
  elements.saveButton.disabled = true;
  const formData = new FormData(elements.dragonForm);
  const record = Object.fromEntries(formData.entries());
  try {
    if (state.editingId) {
      await apiRequest(`/api/dragons/${encodeURIComponent(state.editingId)}`, { method: "PUT", body: JSON.stringify(record) });
      showToast("Dragon record updated.");
    } else {
      await apiRequest("/api/dragons", { method: "POST", body: JSON.stringify(record) });
      showToast("Dragon added to the registry.");
    }
    closeModals();
    await loadDragons();
  } catch (error) {
    elements.dragonFormError.textContent = error.message;
  } finally {
    elements.saveButton.disabled = false;
  }
}

async function deleteDragon(id) {
  const dragon = state.dragons.find((record) => record.id === id);
  if (!dragon || !window.confirm(`Remove ${dragon.name} from the registry?`)) return;
  try {
    await apiRequest(`/api/dragons/${encodeURIComponent(id)}`, { method: "DELETE" });
    showToast(`${dragon.name} was removed.`);
    await loadDragons();
  } catch (error) {
    showToast(error.message, true);
  }
}

async function importGoogleSheet(event) {
  event.preventDefault();
  elements.importError.textContent = "";
  elements.importSuccess.textContent = "";
  elements.importButton.disabled = true;
  elements.importButton.textContent = "Reading sheet…";
  try {
    const url = String(new FormData(elements.importForm).get("url") || "").trim();
    const file = elements.csvFile.files[0];
    if (!url && !file) throw new Error("Paste a Google Sheets URL or choose a downloaded CSV file.");
    if (url && file) throw new Error("Choose either a Google Sheets URL or a CSV file, not both.");

    let result;
    if (file) {
      if (!file.name.toLowerCase().endsWith(".csv")) throw new Error("Please choose a CSV file downloaded from Google Sheets.");
      result = await uploadCsvFile(file);
    } else {
      result = await apiRequest("/api/import/google-sheet", { method: "POST", body: JSON.stringify({ url }) });
    }
    const summary = `${result.added} added · ${result.updated} updated${result.skipped ? ` · ${result.skipped} skipped` : ""}`;
    elements.importSuccess.textContent = `Import complete — ${summary}.`;
    showToast(`Sheet imported: ${result.added} added, ${result.updated} updated.`);
    await loadDragons();
    setTimeout(closeModals, 900);
  } catch (error) {
    elements.importError.textContent = error.message;
  } finally {
    elements.importButton.disabled = false;
    elements.importButton.textContent = "Import records";
  }
}

async function uploadCsvFile(file) {
  const response = await fetch("/api/import/csv", {
    method: "POST",
    headers: { "Content-Type": "text/csv" },
    body: file,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "The CSV file could not be imported.");
  return payload;
}

function updateCsvFileLabel() {
  const file = elements.csvFile.files[0];
  elements.csvFileLabel.textContent = file ? file.name : "Choose a downloaded CSV";
}

function showToast(message, isError = false) {
  clearTimeout(state.toastTimer);
  elements.toast.textContent = message;
  elements.toast.style.color = isError ? "#a95e51" : "#47756e";
  elements.toast.style.borderColor = isError ? "#f0cfc7" : "#cce5df";
  elements.toast.style.background = isError ? "#fff7f4" : "#f5fcfa";
  elements.toast.classList.remove("hidden");
  state.toastTimer = setTimeout(() => elements.toast.classList.add("hidden"), 3800);
}

function formatNumber(value) {
  return new Intl.NumberFormat().format(value);
}

function formatTime(value) {
  if (!value) return "just now";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "just now" : date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

function colorForLabel(label) {
  if (ELEMENT_COLORS[label]) return ELEMENT_COLORS[label];
  let hash = 0;
  for (const character of label) hash = character.charCodeAt(0) + ((hash << 5) - hash);
  const palette = ["#6d9d9a", "#9b7b91", "#8b9a69", "#aa8163", "#758dad"];
  return palette[Math.abs(hash) % palette.length];
}

function initials(name) {
  return String(name || "?")
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function shorten(value, maximum) {
  return value.length > maximum ? `${value.slice(0, maximum - 1)}…` : value;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
