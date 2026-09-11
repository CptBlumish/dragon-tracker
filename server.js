const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");
const { URL } = require("node:url");

const PORT = Number(process.env.PORT || 3000);
const PUBLIC_DIR = path.join(__dirname, "public");
const DATA_FILE = path.resolve(process.env.DRAGON_CSV_PATH || path.join(__dirname, "data", "dragons.csv"));
const MAX_BODY_BYTES = 1024 * 1024;
const MAX_IMPORT_BYTES = 5 * 1024 * 1024;

const CSV_HEADERS = [
  "id",
  "name",
  "species",
  "skin",
  "rarity",
  "element",
  "age",
  "health",
  "weight",
  "status",
  "location",
  "account",
  "lastSeen",
  "notes",
];

const STATUS_VALUES = new Set(["Active", "Hatched", "Missing", "Retired"]);
const RARITY_VALUES = new Set(["Common", "Uncommon", "Rare", "Epic", "Legendary"]);
const SHEET_HOSTS = new Set(["docs.google.com", "docs.googleusercontent.com"]);

async function ensureDataFile() {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, `${CSV_HEADERS.join(",")}\n`, "utf8");
  }
}

function parseCsvRows(text) {
  const input = String(text || "").replace(/^\uFEFF/, "");
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];

    if (inQuotes) {
      if (character === '"') {
        if (input[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += character;
      }
      continue;
    }

    if (character === '"' && field.length === 0) {
      inQuotes = true;
    } else if (character === ",") {
      row.push(field);
      field = "";
    } else if (character === "\n") {
      row.push(field.replace(/\r$/, ""));
      if (row.some((value) => value.trim() !== "")) rows.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }

  if (field !== "" || row.length > 0) {
    row.push(field.replace(/\r$/, ""));
    if (row.some((value) => value.trim() !== "")) rows.push(row);
  }

  return rows;
}

function parseCsv(text) {
  const rows = parseCsvRows(text);
  if (rows.length === 0) return { headers: [], records: [] };

  const headers = rows[0].map((header, index) => header.trim() || `column_${index + 1}`);
  const records = rows.slice(1).map((values) => {
    const record = {};
    headers.forEach((header, index) => {
      record[header] = String(values[index] ?? "").trim();
    });
    return record;
  });

  return { headers, records };
}

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function toCsv(records) {
  const lines = [CSV_HEADERS.join(",")];
  for (const record of records) {
    lines.push(CSV_HEADERS.map((header) => csvEscape(record[header])).join(","));
  }
  return `${lines.join("\n")}\n`;
}

async function readRecords() {
  await ensureDataFile();
  const text = await fs.readFile(DATA_FILE, "utf8");
  const parsed = parseCsv(text);
  return parsed.records
    .map((record) => normalizeRecord(record))
    .filter((record) => record.name);
}

async function writeRecords(records) {
  await ensureDataFile();
  const temporaryFile = `${DATA_FILE}.tmp`;
  await fs.writeFile(temporaryFile, toCsv(records), "utf8");
  await fs.rename(temporaryFile, DATA_FILE);
}

function cleanText(value, maximum = 200) {
  return String(value ?? "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .trim()
    .slice(0, maximum);
}

function parseNumber(value, { integer = false, minimum = 0, maximum = Number.MAX_SAFE_INTEGER } = {}) {
  const raw = cleanText(value, 40).replace(/,/g, "");
  if (!raw) return "";
  const match = raw.match(/-?\d+(?:\.\d+)?/);
  if (!match) return "";
  const number = Number(match[0]);
  if (!Number.isFinite(number)) return "";
  const rounded = integer ? Math.round(number) : Math.round(number * 10) / 10;
  return Math.min(maximum, Math.max(minimum, rounded));
}

function normalizeDate(value) {
  const raw = cleanText(value, 80);
  if (!raw) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  // Google Sheets may export dates as serial day numbers.
  if (/^\d+(?:\.\d+)?$/.test(raw)) {
    const serial = Number(raw);
    if (serial > 20000 && serial < 100000) {
      const date = new Date(Date.UTC(1899, 11, 30) + serial * 86400000);
      return date.toISOString().slice(0, 10);
    }
  }

  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? raw.slice(0, 40) : date.toISOString().slice(0, 10);
}

function normalizeStatus(value) {
  const raw = cleanText(value, 30);
  if (!raw) return "Active";
  const normalized = raw.toLowerCase();
  const aliases = {
    active: "Active",
    alive: "Active",
    hatched: "Hatched",
    hatchling: "Hatched",
    missing: "Missing",
    lost: "Missing",
    retired: "Retired",
  };
  return aliases[normalized] || (STATUS_VALUES.has(raw) ? raw : "Active");
}

function normalizeRarity(value, skin) {
  if (!cleanText(skin, 80)) return "";
  const raw = cleanText(value, 30);
  if (!raw) return "Common";
  const aliases = {
    common: "Common",
    uncommon: "Uncommon",
    rare: "Rare",
    epic: "Epic",
    legendary: "Legendary",
  };
  return aliases[raw.toLowerCase()] || (RARITY_VALUES.has(raw) ? raw : "Common");
}

function createId() {
  return `DRG-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

function normalizeRecord(input = {}, forcedId = "") {
  const skin = cleanText(input.skin, 80);
  return {
    id: cleanText(input.id || forcedId, 60) || forcedId || createId(),
    name: cleanText(input.name, 80),
    species: cleanText(input.species, 80) || "Unknown species",
    skin,
    rarity: normalizeRarity(input.rarity, skin),
    element: cleanText(input.element, 40) || "Unknown",
    age: parseNumber(input.age, { integer: true, maximum: 100000 }),
    health: parseNumber(input.health, { integer: true, maximum: 100 }),
    weight: parseNumber(input.weight, { maximum: 100000000 }),
    status: normalizeStatus(input.status),
    location: cleanText(input.location, 120),
    account: cleanText(input.account, 80),
    lastSeen: normalizeDate(input.lastSeen),
    notes: cleanText(input.notes, 300),
  };
}

function validateRecord(input) {
  const rawHealth = parseNumber(input.health, { integer: true, maximum: Number.MAX_SAFE_INTEGER });
  if (rawHealth !== "" && rawHealth > 100) {
    return { error: "Health must be between 0 and 100." };
  }
  const record = normalizeRecord(input, input.id);
  if (!record.name) return { error: "Dragon name is required." };
  return { record };
}

function normalizeHeader(header) {
  return String(header || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

const IMPORT_ALIASES = {
  id: ["id", "dragonid", "recordid"],
  name: ["name", "dragon", "dragonname", "dragon_name"],
  species: ["species", "type", "dragontype"],
  skin: ["skin", "skinname", "appearance", "variant"],
  rarity: ["rarity", "tier", "raritytier"],
  element: ["element", "elements", "affinity", "power"],
  age: ["age", "dragonage"],
  health: ["health", "hp", "healthpercent", "healthpercentage"],
  weight: ["weight", "mass"],
  status: ["status", "state"],
  location: ["location", "area", "zone", "region"],
  account: ["account", "accountname", "player", "owner", "username"],
  lastSeen: ["lastseen", "lastseenat", "lastsighting", "seen", "date"],
  notes: ["notes", "note", "description", "comments"],
};

function mapImportHeaders(headers) {
  const normalizedHeaders = headers.map(normalizeHeader);
  const mapping = {};

  for (const [field, aliases] of Object.entries(IMPORT_ALIASES)) {
    const aliasIndex = aliases
      .map(normalizeHeader)
      .map((alias) => normalizedHeaders.indexOf(alias))
      .find((index) => index >= 0);
    if (aliasIndex !== undefined) mapping[field] = headers[aliasIndex];
  }

  // A one-column sheet with no header named "name" is still useful: treat its
  // first column as the dragon name rather than making players edit the sheet.
  if (!mapping.name && headers.length > 0) mapping.name = headers[0];
  return mapping;
}

function hasValue(value) {
  return cleanText(value, 500) !== "";
}

function mapImportedRecord(row, mapping) {
  const input = {};
  for (const field of CSV_HEADERS) {
    if (mapping[field]) input[field] = row[mapping[field]] ?? "";
  }
  return input;
}

function mergeImport(existingRecords, importRecords) {
  const records = [...existingRecords];
  let added = 0;
  let updated = 0;
  let skipped = 0;

  for (const incoming of importRecords) {
    if (!incoming.name) {
      skipped += 1;
      continue;
    }

    const incomingId = cleanText(incoming.id, 60).toLowerCase();
    const incomingName = cleanText(incoming.name, 80).toLowerCase();
    const incomingAccount = cleanText(incoming.account, 80).toLowerCase();
    let matchIndex = -1;
    if (incomingId) {
      matchIndex = records.findIndex((record) => record.id.toLowerCase() === incomingId);
    } else {
      const nameMatches = records
        .map((record, index) => ({ record, index }))
        .filter(({ record }) => record.name.toLowerCase() === incomingName);
      if (incomingAccount) {
        matchIndex = nameMatches.find(({ record }) => record.account.toLowerCase() === incomingAccount)?.index ?? -1;
      } else if (nameMatches.length === 1) {
        // If the sheet has no account column, a unique name is still a safe match.
        matchIndex = nameMatches[0].index;
      }
    }

    if (matchIndex >= 0) {
      records[matchIndex] = normalizeRecord({ ...records[matchIndex], ...incoming }, records[matchIndex].id);
      updated += 1;
    } else {
      records.push(normalizeRecord(incoming));
      added += 1;
    }
  }

  return { records, added, updated, skipped };
}

function getGoogleSheetCsvUrl(rawUrl) {
  let url;
  try {
    url = new URL(String(rawUrl || "").trim());
  } catch {
    throw new Error("Enter a valid Google Sheets URL.");
  }

  if (url.protocol !== "https:" || !SHEET_HOSTS.has(url.hostname.toLowerCase())) {
    throw new Error("For safety, imports must come from a Google Sheets URL.");
  }

  if (!url.pathname.startsWith("/spreadsheets/")) {
    throw new Error("That does not look like a Google Sheets document URL.");
  }

  const gidFromHash = (url.hash.match(/gid=([\d-]+)/) || [])[1];
  const gid = url.searchParams.get("gid") || gidFromHash;
  const isPublished = url.pathname.includes("/pub");

  if (isPublished) {
    url.searchParams.set("output", "csv");
    if (gid) url.searchParams.set("gid", gid);
    url.hash = "";
    return url.toString();
  }

  const match = url.pathname.match(/^\/spreadsheets\/d\/([^/]+)/);
  if (!match) throw new Error("Could not find a spreadsheet ID in that URL.");

  const exportUrl = new URL(`https://docs.google.com/spreadsheets/d/${match[1]}/export`);
  exportUrl.searchParams.set("format", "csv");
  if (gid) exportUrl.searchParams.set("gid", gid);
  return exportUrl.toString();
}

async function fetchGoogleSheetCsv(rawUrl) {
  const csvUrl = getGoogleSheetCsvUrl(rawUrl);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(csvUrl, { signal: controller.signal, redirect: "follow" });
    if (!SHEET_HOSTS.has(new URL(response.url).hostname.toLowerCase())) {
      throw new Error("The sheet redirected to an unsupported location.");
    }
    if (!response.ok) {
      throw new Error(`Google Sheets returned ${response.status}. Check that the sheet is shared for viewing.`);
    }
    const contentLength = Number(response.headers.get("content-length") || 0);
    if (contentLength > MAX_IMPORT_BYTES) throw new Error("That sheet is too large to import (5 MB maximum).");
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length > MAX_IMPORT_BYTES) throw new Error("That sheet is too large to import (5 MB maximum).");
    const text = buffer.toString("utf8");
    if (/^\s*<(?:!doctype\s+)?html/i.test(text)) {
      throw new Error("Google Sheets returned a web page. Set the sheet to 'Anyone with the link can view' or publish it to the web.");
    }
    return text;
  } catch (error) {
    if (error.name === "AbortError") throw new Error("The Google Sheets import timed out. Try again.");
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function sendJson(response, statusCode, payload) {
  const body = JSON.stringify(payload);
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(body);
}

function sendError(response, statusCode, message) {
  sendJson(response, statusCode, { error: message });
}

async function readJsonBody(request) {
  const chunks = [];
  let total = 0;

  for await (const chunk of request) {
    total += chunk.length;
    if (total > MAX_BODY_BYTES) throw new Error("Request is too large.");
    chunks.push(chunk);
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
  } catch {
    throw new Error("Request body must be valid JSON.");
  }
}

function contentTypeFor(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  return {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
  }[extension] || "application/octet-stream";
}

async function serveStatic(request, response, pathname) {
  const requestedPath = pathname === "/" ? "/index.html" : pathname;
  const filePath = path.resolve(PUBLIC_DIR, `.${requestedPath}`);
  if (!filePath.startsWith(`${PUBLIC_DIR}${path.sep}`)) {
    sendError(response, 403, "Forbidden.");
    return;
  }

  try {
    const file = await fs.readFile(filePath);
    response.writeHead(200, {
      "Content-Type": contentTypeFor(filePath),
      "Cache-Control": "no-cache",
    });
    response.end(file);
  } catch (error) {
    if (error.code === "ENOENT") sendError(response, 404, "Not found.");
    else sendError(response, 500, "Unable to read that file.");
  }
}

async function handleRequest(request, response) {
  const requestUrl = new URL(request.url, `http://${request.headers.host || "localhost"}`);
  const { pathname } = requestUrl;

  try {
    if (pathname === "/api/dragons" && request.method === "GET") {
      const dragons = await readRecords();
      sendJson(response, 200, { dragons, updatedAt: new Date().toISOString() });
      return;
    }

    if (pathname === "/api/dragons" && request.method === "POST") {
      const body = await readJsonBody(request);
      const validation = validateRecord(body);
      if (validation.error) return sendError(response, 400, validation.error);
      const dragons = await readRecords();
      const record = normalizeRecord(validation.record);
      record.id = createId();
      dragons.push(record);
      await writeRecords(dragons);
      sendJson(response, 201, { dragon: record });
      return;
    }

    const dragonMatch = pathname.match(/^\/api\/dragons\/([^/]+)$/);
    if (dragonMatch && request.method === "PUT") {
      const id = decodeURIComponent(dragonMatch[1]);
      const body = await readJsonBody(request);
      const validation = validateRecord(body);
      if (validation.error) return sendError(response, 400, validation.error);
      const dragons = await readRecords();
      const index = dragons.findIndex((dragon) => dragon.id === id);
      if (index < 0) return sendError(response, 404, "Dragon not found.");
      const record = normalizeRecord(validation.record, id);
      record.id = id;
      dragons[index] = record;
      await writeRecords(dragons);
      sendJson(response, 200, { dragon: record });
      return;
    }

    if (dragonMatch && request.method === "DELETE") {
      const id = decodeURIComponent(dragonMatch[1]);
      const dragons = await readRecords();
      const remaining = dragons.filter((dragon) => dragon.id !== id);
      if (remaining.length === dragons.length) return sendError(response, 404, "Dragon not found.");
      await writeRecords(remaining);
      sendJson(response, 200, { deletedId: id });
      return;
    }

    if (pathname === "/api/import/google-sheet" && request.method === "POST") {
      const body = await readJsonBody(request);
      const csvText = await fetchGoogleSheetCsv(body.url);
      const parsed = parseCsv(csvText);
      if (parsed.headers.length === 0) return sendError(response, 400, "The sheet is empty.");
      const mapping = mapImportHeaders(parsed.headers);
      const imported = parsed.records.map((row) => mapImportedRecord(row, mapping));
      const existing = await readRecords();
      const result = mergeImport(existing, imported);
      if (result.added + result.updated === 0) {
        return sendError(response, 400, "No dragon rows were found. Add a Name column or put dragon names in the first column.");
      }
      await writeRecords(result.records);
      sendJson(response, 200, {
        ...result,
        total: result.records.length,
        mappedFields: Object.keys(mapping),
      });
      return;
    }

    if (pathname === "/api/export" && request.method === "GET") {
      const dragons = await readRecords();
      const csv = toCsv(dragons);
      response.writeHead(200, {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="dragons.csv"',
        "Cache-Control": "no-store",
      });
      response.end(csv);
      return;
    }

    if (request.method === "GET") {
      await serveStatic(request, response, pathname);
      return;
    }

    sendError(response, 405, "Method not allowed.");
  } catch (error) {
    console.error(error);
    sendError(response, 400, error.message || "Something went wrong.");
  }
}

const server = http.createServer((request, response) => {
  handleRequest(request, response);
});

ensureDataFile()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Dragon Tracker is running at http://localhost:${PORT}`);
      console.log(`CSV data file: ${DATA_FILE}`);
    });
  })
  .catch((error) => {
    console.error("Unable to initialize Dragon Tracker:", error);
    process.exitCode = 1;
  });

process.on("SIGINT", () => server.close(() => process.exit(0)));
process.on("SIGTERM", () => server.close(() => process.exit(0)));
