export const SPECIES = [
  "Flame Stalker",
  "Shadow Scale",
  "Acid Spitter",
  "Inferno Ravager",
  "Bio",
  "Blitz Striker",
  "Brood Watcher",
  "Mimikor",
  "Singe Crest",
  "Feathered Zygovo"
];

export const SEXES = ["Female", "Male", "Unknown"];
export const STATUSES = ["Hatchie", "Juvi", "Grown", "4th Pointed", "Elder"];
export const BLOODLINES = ["E", "D", "C", "B", "A"];
export const GRADES = ["F", "E", "D-", "D", "D+", "C-", "C", "C+", "B-", "B", "B+", "A-", "A", "A+", "A++"];
export const POINT_TRAITS = ["PvP", "Breeder", "Pure", "Dominant"];

export const STAT_FIELDS = [
  { key: "lifeExpectancy", label: "Life Expectancy", short: "Life" },
  { key: "scaleThickness", label: "Scale Thickness", short: "Scale" },
  { key: "endurance", label: "Endurance", short: "Endurance" },
  { key: "bileProduction", label: "Bile Production", short: "Bile" },
  { key: "biteForce", label: "Bite Force", short: "Bite" },
  { key: "power", label: "Power", short: "Power" },
  { key: "strength", label: "Strength", short: "Strength" },
  { key: "nutrientAbsorption", label: "Nutrient Absorption", short: "Nutrient" },
  { key: "waterRetention", label: "Water Retention", short: "Water" },
  { key: "toxinTolerance", label: "Toxin Tolerance", short: "Toxin" },
  { key: "impactResistance", label: "Impact Resistance", short: "Impact" },
  { key: "pierceResistance", label: "Pierce Resistance", short: "Pierce" },
  { key: "fireResistance", label: "Fire Resistance", short: "Fire" },
  { key: "frostResistance", label: "Frost Resistance", short: "Frost" },
  { key: "plasmaResistance", label: "Plasma Resistance", short: "Plasma" },
  { key: "lightningResistance", label: "Lightning Resistance", short: "Lightning" },
  { key: "acidResistance", label: "Acid Resistance", short: "Acid" },
  { key: "venomResistance", label: "Venom Resistance", short: "Venom" }
];

const FLAT_RANK = new Map([["F", 0], ["E", 1], ["D", 2], ["C", 3], ["B", 4], ["A", 5]]);
const STATUS_RANK = new Map(STATUSES.map((status, index) => [status, index]));
const STAT_BY_NAME = new Map();

for (const field of STAT_FIELDS) {
  [field.key, field.label, field.short].forEach((name) => STAT_BY_NAME.set(canonicalKey(name), field));
}

function clean(value, max = 500) {
  return String(value ?? "").trim().slice(0, max);
}

function canonicalKey(value) {
  return clean(value, 100).toLowerCase().replace(/[^a-z0-9]/g, "");
}

function canonicalChoice(value, choices, fallback = "") {
  const key = canonicalKey(value);
  return choices.find((choice) => canonicalKey(choice) === key) || fallback;
}

export function canonicalSpecies(value) {
  const key = canonicalKey(value);
  const aliases = {
    fs: "Flame Stalker",
    ss: "Shadow Scale",
    as: "Acid Spitter",
    asd: "Acid Spitter",
    acidspitterdrake: "Acid Spitter",
    ir: "Inferno Ravager",
    bio: "Bio",
    bioluminescent: "Bio",
    bioleuminecent: "Bio",
    bs: "Blitz Striker",
    bw: "Brood Watcher",
    sc: "Singe Crest",
    fz: "Feathered Zygovo"
  };
  return aliases[key] || canonicalChoice(value, SPECIES);
}

// Discord combines an account/name and species into one field, so accept common separators and pasted pipe characters.
export function parseSpeciesPair(value) {
  const raw = clean(value, 300);
  const separated = raw.split(/[|｜│┃¦/;,\n]+/).map((part) => part.trim()).filter(Boolean);
  if (separated.length > 1) {
    const enteredSpecies = separated.slice(1).join(" ");
    return [separated[0], canonicalSpecies(enteredSpecies) || enteredSpecies];
  }

  const words = raw.split(/\s+/).filter(Boolean);
  for (let index = 0; index < words.length; index += 1) {
    const species = canonicalSpecies(words.slice(index).join(" "));
    if (!species) continue;
    const identity = words.slice(0, index).join(" ").replace(/[|｜│┃¦/;,:-]+$/g, "").trim();
    return [identity, species];
  }
  return [raw, ""];
}

export function canonicalGrade(value, fallback = "") {
  const grade = clean(value, 4).toUpperCase();
  return GRADES.includes(grade) ? grade : fallback;
}

export function canonicalBloodline(value, fallback = "E") {
  const bloodline = clean(value, 4).toUpperCase().replace(/[+-]+/g, "");
  return BLOODLINES.includes(bloodline) ? bloodline : fallback;
}

export function parseBooleanChoice(value, fallback = null) {
  if (typeof value === "boolean") return value;
  const key = canonicalKey(value);
  if (["yes", "true", "on", "enabled", "1", "upstat"].includes(key)) return true;
  if (["no", "false", "off", "disabled", "0", "complete"].includes(key)) return false;
  return fallback;
}

export function parsePointTraits(...values) {
  const found = new Set();
  values.flatMap((value) => Array.isArray(value) ? value : [value]).forEach((value) => {
    clean(value, 300).split(/[,/;+|]/).forEach((part) => {
      const key = canonicalKey(part);
      if (["pvp", "fighter", "combat"].includes(key)) found.add("PvP");
      if (["breeder", "social"].includes(key)) found.add("Breeder");
      if (["pure", "ultrapure"].includes(key)) found.add("Pure");
      if (["dominant", "dom", "dominantmutation"].includes(key)) found.add("Dominant");
    });
  });
  return POINT_TRAITS.filter((trait) => found.has(trait));
}

function statsFromNamedText(value) {
  const stats = {};
  const entries = clean(value, 2_000).split(/[\n,;]+/).map((entry) => entry.trim()).filter(Boolean);
  for (const entry of entries) {
    const match = entry.match(/^(.+?)(?:=|:)\s*([A-F](?:\+\+|\+|-)?)$/i);
    if (!match) throw new Error(`Use Stat=Grade entries; could not read "${entry}".`);
    const field = STAT_BY_NAME.get(canonicalKey(match[1]));
    if (!field) throw new Error(`Unknown stat name "${match[1].trim()}".`);
    const grade = canonicalGrade(match[2]);
    if (!grade) throw new Error(`Invalid grade "${match[2]}" for ${field.label}.`);
    stats[field.key] = grade;
  }
  return stats;
}

export function parseStats(value, defaultGrade = "E") {
  const fallback = canonicalGrade(defaultGrade, "E");
  const stats = Object.fromEntries(STAT_FIELDS.map((field) => [field.key, fallback]));
  if (value == null || value === "") return stats;

  if (typeof value === "object" && !Array.isArray(value)) {
    for (const [name, gradeValue] of Object.entries(value)) {
      const field = STAT_BY_NAME.get(canonicalKey(name));
      if (!field) continue;
      const grade = canonicalGrade(gradeValue);
      if (!grade) throw new Error(`Invalid grade "${gradeValue}" for ${field.label}.`);
      stats[field.key] = grade;
    }
    return stats;
  }

  const text = clean(value, 2_000);
  const allMatch = text.match(/^(?:all\s*)?(?:18\s*[x*]?\s*)?([A-F](?:\+\+|\+|-)?)$/i);
  if (allMatch) {
    const grade = canonicalGrade(allMatch[1]);
    if (!grade) throw new Error(`Invalid stat grade "${allMatch[1]}".`);
    return Object.fromEntries(STAT_FIELDS.map((field) => [field.key, grade]));
  }

  const ordered = text.split(/\s*\|\s*/).map((grade) => canonicalGrade(grade));
  if (ordered.length === STAT_FIELDS.length && ordered.every(Boolean)) {
    return Object.fromEntries(STAT_FIELDS.map((field, index) => [field.key, ordered[index]]));
  }

  return { ...stats, ...statsFromNamedText(text) };
}

export function validateStats(statsInput, bloodlineInput, options = {}) {
  const bloodline = canonicalBloodline(bloodlineInput);
  const stats = options.inbred
    ? Object.fromEntries(STAT_FIELDS.map((field) => [field.key, "F"]))
    : parseStats(statsInput, options.defaultGrade || "E");
  const parentFourthPointed = Boolean(options.parentFourthPointed);

  for (const field of STAT_FIELDS) {
    const grade = canonicalGrade(stats[field.key], "E");
    const flat = grade.charAt(0);
    if ((FLAT_RANK.get(flat) ?? 0) > (FLAT_RANK.get(bloodline) ?? 1)) {
      throw new Error(`${field.label} ${grade} requires ${flat} bloodline or better.`);
    }
    if (grade === "A++" && !parentFourthPointed) {
      throw new Error(`${field.label} cannot be A++ unless at least one recorded parent is 4th Pointed or Elder.`);
    }
    stats[field.key] = grade;
  }
  return stats;
}

export function statProgress(statsInput) {
  const stats = parseStats(statsInput, "E");
  const aPlusCount = STAT_FIELDS.filter((field) => ["A+", "A++"].includes(stats[field.key])).length;
  return { aPlusCount, complete: aPlusCount === STAT_FIELDS.length, upstat: aPlusCount < STAT_FIELDS.length };
}

export function normalizeDragonGenetics(input = {}, defaults = {}) {
  const species = canonicalSpecies(input.species);
  if (!species) throw new Error("Choose a valid species. In Add Dragon, use Account name | Species, for example Maximus | IR.");
  const name = clean(input.name || input.accountName, 80);
  if (!name) throw new Error("Dragon name is required.");

  const pointTraits = parsePointTraits(input.pointTraits, input.traits, input.nestRole, input.dominantMutation ? "Dominant" : "");
  let skin = clean(input.skin || input.primarySkin, 100);
  let recessiveSkin = clean(input.recessiveSkin || input.recessive, 100);
  if (pointTraits.includes("Pure") && !skin) throw new Error("Pure requires a primary skin.");
  if (pointTraits.includes("Pure") && skin && !recessiveSkin) recessiveSkin = skin;
  if (skin && recessiveSkin && canonicalKey(skin) === canonicalKey(recessiveSkin) && !pointTraits.includes("Pure")) pointTraits.push("Pure");

  const dominantMutation = pointTraits.includes("Dominant");
  let status = canonicalChoice(input.status, STATUSES, "Hatchie");
  if (dominantMutation && (STATUS_RANK.get(status) ?? 0) < STATUS_RANK.get("4th Pointed")) status = "4th Pointed";
  const enteredBloodline = clean(input.bloodline, 10).toUpperCase();
  if (enteredBloodline && !BLOODLINES.includes(enteredBloodline)) throw new Error("Bloodline must be E, D, C, B, or A.");
  const bloodline = canonicalBloodline(enteredBloodline, enteredBloodline ? "" : "E");
  if (!bloodline) throw new Error("Bloodline must be E, D, C, B, or A.");
  const stats = validateStats(input.stats, bloodline, {
    defaultGrade: "E",
    inbred: Boolean(input.inbred),
    parentFourthPointed: Boolean(input.parentFourthPointed)
  });
  const progress = statProgress(stats);
  const upstat = progress.upstat;
  const nestRole = pointTraits.includes("Pure") ? "Pure"
    : pointTraits.includes("Breeder") ? "Breeder"
      : pointTraits.includes("PvP") ? "Fighter"
        : "Unknown";

  return {
    name,
    playerName: clean(input.playerName || defaults.playerName, 80),
    accountName: clean(input.accountName, 80) || name,
    species,
    sex: canonicalChoice(input.sex, SEXES, "Unknown"),
    status,
    skin,
    recessiveSkin,
    bloodline,
    nestRole,
    pointTraits: POINT_TRAITS.filter((trait) => pointTraits.includes(trait)),
    dominantMutation,
    motherName: clean(input.motherName || input.mother, 100),
    fatherName: clean(input.fatherName || input.father, 100),
    parentFourthPointed: Boolean(input.parentFourthPointed),
    inbred: Boolean(input.inbred),
    inbredReason: clean(input.inbredReason, 180),
    stats,
    aPlusCount: progress.aPlusCount,
    upstat,
    notes: clean(input.notes, 600)
  };
}

export function normalizeDragonFilters(input = {}) {
  const pointTraits = parsePointTraits(input.pointTraits, input.traits, input.nestRole);
  const enteredSpecies = clean(input.species, 80);
  const species = canonicalSpecies(enteredSpecies);
  if (enteredSpecies && !species) throw new Error("Choose a valid dragon species.");
  const enteredBloodline = clean(input.bloodline, 10).toUpperCase();
  if (enteredBloodline && !BLOODLINES.includes(enteredBloodline)) throw new Error("Bloodline must be E, D, C, B, or A.");
  const bloodline = enteredBloodline ? canonicalBloodline(enteredBloodline, "") : "";
  if (enteredBloodline && !bloodline) throw new Error("Bloodline must be E, D, C, B, or A.");
  let skin = clean(input.skin || input.primarySkin, 100);
  let recessiveSkin = clean(input.recessiveSkin || input.recessive, 100);
  if (pointTraits.includes("Pure") && skin && !recessiveSkin) recessiveSkin = skin;
  if (skin && recessiveSkin && canonicalKey(skin) === canonicalKey(recessiveSkin) && !pointTraits.includes("Pure")) pointTraits.push("Pure");
  return {
    name: clean(input.name, 80),
    species,
    skin,
    recessiveSkin,
    sex: canonicalChoice(input.sex, SEXES),
    bloodline,
    pointTraits: POINT_TRAITS.filter((trait) => pointTraits.includes(trait)),
    playerName: clean(input.playerName, 80),
    accountName: clean(input.accountName, 80),
    motherName: clean(input.motherName || input.mother, 100),
    fatherName: clean(input.fatherName || input.father, 100),
    pairingParent: clean(input.pairingParent, 100),
    upstat: parseBooleanChoice(input.upstat, null),
    notifyOwners: parseBooleanChoice(input.notifyOwners ?? input.pings, true),
    requester: clean(input.requester, 100),
    notes: clean(input.notes, 1000),
    limit: Math.max(1, Math.min(12, Number(input.limit) || 8))
  };
}

function lineageNames(record) {
  return [record?.motherName || record?.mother, record?.fatherName || record?.father]
    .map((value) => canonicalKey(value))
    .filter(Boolean);
}

function identityNames(record) {
  return [record?.name, record?.accountName, record?.displayName]
    .map((value) => canonicalKey(value))
    .filter(Boolean);
}

export function inbredPairReason(first, second) {
  if (!first || !second) return "";
  const firstSpecies = canonicalSpecies(first.species);
  const secondSpecies = canonicalSpecies(second.species);
  if (firstSpecies && secondSpecies && firstSpecies !== secondSpecies) return "";
  const firstIdentities = identityNames(first);
  const secondIdentities = identityNames(second);
  const firstParents = lineageNames(first);
  const secondParents = lineageNames(second);
  if (firstIdentities.some((name) => secondParents.includes(name)) || secondIdentities.some((name) => firstParents.includes(name))) {
    return "one selected parent is the child of the other";
  }
  if (firstParents.some((name) => secondParents.includes(name))) return "the selected parents are siblings";
  return "";
}

export function dragonPointTraits(record = {}) {
  return parsePointTraits(
    record.pointTraits,
    record.traits,
    record.nestRole,
    record.dominantMutation ? "Dominant" : "",
    record.skin && record.recessiveSkin && canonicalKey(record.skin) === canonicalKey(record.recessiveSkin) ? "Pure" : ""
  );
}

export function dragonMatchesFilters(record = {}, filtersInput = {}) {
  const filters = normalizeDragonFilters(filtersInput);
  const exact = (left, right) => !right || canonicalKey(left) === canonicalKey(right);
  const includes = (left, right) => !right || canonicalKey(left).includes(canonicalKey(right));
  if (!includes(record.name || record.accountName, filters.name)) return false;
  if (!exact(record.species, filters.species)) return false;
  if (!exact(record.skin, filters.skin) || !exact(record.recessiveSkin, filters.recessiveSkin)) return false;
  if (!exact(record.sex, filters.sex) || !exact(record.bloodline, filters.bloodline)) return false;
  if (!includes(record.playerName, filters.playerName) || !includes(record.accountName || record.name, filters.accountName)) return false;
  if (!exact(record.motherName || record.mother, filters.motherName) || !exact(record.fatherName || record.father, filters.fatherName)) return false;
  const traits = dragonPointTraits(record);
  if (!filters.pointTraits.every((trait) => traits.includes(trait))) return false;
  if (filters.upstat != null && statProgress(record.stats).upstat !== filters.upstat) return false;
  return true;
}

export function formatStatsSummary(statsInput) {
  const stats = parseStats(statsInput, "E");
  const grades = STAT_FIELDS.map((field) => stats[field.key]);
  if (new Set(grades).size === 1) return `18x ${grades[0]}`;
  const progress = statProgress(stats);
  return `${progress.aPlusCount}/18 A+ or better`;
}
