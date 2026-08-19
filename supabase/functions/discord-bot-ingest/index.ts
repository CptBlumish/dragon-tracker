import { createClient } from "npm:@supabase/supabase-js@2";

// Server-only secrets authenticate the bot and grant controlled database access.
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const INGEST_SECRET = Deno.env.get("DRAGON_TRACKER_BOT_INGEST_SECRET") || "";
const HEARTBEAT_SECRET = Deno.env.get("DRAGON_TRACKER_HEARTBEAT_SECRET") || "";
const MAX_TEXT = 500;
const CLAN_DRAGON_QUERY_LIMIT = 2500;
const SPECIES = ["Flame Stalker", "Shadow Scale", "Acid Spitter", "Inferno Ravager", "Bio", "Blitz Striker", "Brood Watcher", "Mimikor", "Singe Crest", "Feathered Zygovo"];
const SEXES = ["Female", "Male", "Unknown"];
const STATUSES = ["Hatchie", "Juvi", "Grown", "4th Pointed", "Elder"];
const BLOODLINES = ["E", "D", "C", "B", "A"];
const GRADES = ["F", "E", "D-", "D", "D+", "C-", "C", "C+", "B-", "B", "B+", "A-", "A", "A+", "A++"];
const POINT_TRAITS = ["PvP", "Breeder", "Pure", "Dominant"];
const STAT_FIELDS = [
  ["lifeExpectancy", "Life Expectancy"], ["scaleThickness", "Scale Thickness"], ["endurance", "Endurance"],
  ["bileProduction", "Bile Production"], ["biteForce", "Bite Force"], ["power", "Power"], ["strength", "Strength"],
  ["nutrientAbsorption", "Nutrient Absorption"], ["waterRetention", "Water Retention"], ["toxinTolerance", "Toxin Tolerance"],
  ["impactResistance", "Impact Resistance"], ["pierceResistance", "Pierce Resistance"], ["fireResistance", "Fire Resistance"],
  ["frostResistance", "Frost Resistance"], ["plasmaResistance", "Plasma Resistance"], ["lightningResistance", "Lightning Resistance"],
  ["acidResistance", "Acid Resistance"], ["venomResistance", "Venom Resistance"]
] as const;
const FLAT_RANK: Record<string, number> = { F: 0, E: 1, D: 2, C: 3, B: 4, A: 5 };

type SubmissionType = "dragon" | "map_pin" | "note" | "egg_request" | "upstat" | "brood_pouch" | "current_nest";

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
  });
}

function clean(value: unknown, max = MAX_TEXT) {
  return String(value ?? "").trim().slice(0, max);
}

function canonicalKey(value: unknown) {
  return clean(value, 120).toLocaleLowerCase().replace(/[^a-z0-9]/g, "");
}

function canonicalChoice(value: unknown, choices: string[], fallback = "") {
  const key = canonicalKey(value);
  return choices.find((choice) => canonicalKey(choice) === key) || fallback;
}

// Bot forms accept short community names, while stored records keep one species name.
function canonicalSpecies(value: unknown) {
  const aliases: Record<string, string> = {
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
  return aliases[canonicalKey(value)] || canonicalChoice(value, SPECIES);
}

function canonicalGrade(value: unknown, fallback = "E") {
  const grade = clean(value, 4).toUpperCase();
  return GRADES.includes(grade) ? grade : fallback;
}

function canonicalBloodline(value: unknown, fallback = "E") {
  const grade = clean(value, 4).toUpperCase().replace(/[+-]+/g, "");
  return BLOODLINES.includes(grade) ? grade : fallback;
}

function optionalBoolean(value: unknown) {
  if (typeof value === "boolean") return value;
  const key = canonicalKey(value);
  if (["yes", "true", "on", "enabled", "1", "upstat"].includes(key)) return true;
  if (["no", "false", "off", "disabled", "0", "complete"].includes(key)) return false;
  return null;
}

function pointTraits(...values: unknown[]) {
  const found = new Set<string>();
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

function normalizedStats(value: unknown, bloodline: string, options: { inbred?: boolean; parentFourthPointed?: boolean } = {}) {
  const input = payloadRecord(value);
  const stats: Record<string, string> = {};
  for (const [key, label] of STAT_FIELDS) {
    const enteredGrade = clean(input[key], 4);
    const grade = options.inbred ? "F" : canonicalGrade(enteredGrade, enteredGrade ? "" : "E");
    if (!grade) throw new Error(`${label} has an invalid grade`);
    if ((FLAT_RANK[grade.charAt(0)] ?? 0) > (FLAT_RANK[bloodline] ?? 1)) throw new Error(`${label} ${grade} requires ${grade.charAt(0)} bloodline or better`);
    if (grade === "A++" && !options.parentFourthPointed) throw new Error(`${label} cannot be A++ unless at least one recorded parent is 4th Pointed or Elder`);
    stats[key] = grade;
  }
  return stats;
}

function statProgress(statsValue: unknown) {
  const stats = payloadRecord(statsValue);
  const aPlusCount = STAT_FIELDS.filter(([key]) => ["A+", "A++"].includes(canonicalGrade(stats[key], "E"))).length;
  return { aPlusCount, complete: aPlusCount === STAT_FIELDS.length, upstat: aPlusCount < STAT_FIELDS.length };
}

function requireUuid(value: unknown) {
  const text = clean(value, 80);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(text)) {
    throw new Error("A valid clan id is required");
  }
  return text;
}

function serviceClient() {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) throw new Error("Supabase server secrets are not configured");
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
}

function hasBearerToken(request: Request, secret: string) {
  return Boolean(secret) && request.headers.get("Authorization") === `Bearer ${secret}`;
}

function normalizeType(value: unknown): SubmissionType {
  const type = clean(value, 30);
  if (type === "dragon" || type === "map_pin" || type === "note" || type === "egg_request" || type === "upstat" || type === "brood_pouch" || type === "current_nest") return type;
  throw new Error("Unsupported submission type");
}

function normalizedLookupValue(value: unknown, max: number) {
  return clean(value, max).toLocaleLowerCase();
}

function includesLookupValue(value: unknown, query: unknown, max: number) {
  const needle = normalizedLookupValue(query, max);
  return !needle || normalizedLookupValue(value, max).includes(needle);
}

function boundedLimit(value: unknown, fallback = 8) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(1, Math.min(12, Math.round(parsed))) : fallback;
}

// Read models used by the bot's search and progress commands.
async function lookupUpstatProgress(database: ReturnType<typeof serviceClient>, clanId: string, input: Record<string, unknown>) {
  const species = canonicalSpecies(input.species);
  const skin = clean(input.skin, 100);
  if (!species || !skin) throw new Error("Species and skin are required for an upstat lookup");

  const { data, error } = await database
    .from("discord_bot_submissions")
    .select("submission_type,payload,discord_username,created_at")
    .eq("clan_id", clanId)
    .in("submission_type", ["dragon", "upstat"])
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw error;

  const speciesKey = normalizedLookupValue(species, 80);
  const skinKey = normalizedLookupValue(skin, 100);
  const matching = (data ?? []).filter((record) => {
    const payload = record.payload && typeof record.payload === "object" ? record.payload as Record<string, unknown> : {};
    return normalizedLookupValue(payload.species, 80) === speciesKey && normalizedLookupValue(payload.skin, 100) === skinKey;
  });
  const upstatRecords = matching
    .map((record) => {
      const payload = record.payload && typeof record.payload === "object" ? record.payload as Record<string, unknown> : {};
      const savedCount = Number(payload.aPlusCount);
      const derived = statProgress(payload.stats);
      const aPlusCount = Number.isFinite(savedCount) ? savedCount : derived.aPlusCount;
      return {
        aPlusCount: Number.isFinite(aPlusCount) ? Math.max(0, Math.min(18, Math.round(aPlusCount))) : 0,
        status: record.submission_type === "dragon"
          ? (aPlusCount >= 18 ? "18A+ Complete" : "In Progress")
          : clean(payload.status, 40) || "In Progress",
        submittedBy: clean(record.discord_username, 100) || "Discord user",
        createdAt: clean(record.created_at, 80),
        source: record.submission_type
      };
    });

  return {
    species,
    skin,
    matchingDragonCount: matching.filter((record) => record.submission_type === "dragon").length,
    upstatRecords
  };
}

// Convert app shares and bot submissions into one searchable dragon shape.
function normalizedDragonRecord(input: Record<string, unknown>, source: string, updatedAt: unknown) {
  const traits = pointTraits(
    input.pointTraits,
    input.traits,
    input.nestRole,
    input.dominantMutation ? "Dominant" : "",
    input.skin && input.recessiveSkin && canonicalKey(input.skin) === canonicalKey(input.recessiveSkin) ? "Pure" : ""
  );
  const stats = payloadRecord(input.stats);
  const progress = statProgress(stats);
  return {
    source,
    name: clean(input.displayName || input.name || input.accountName, 80),
    playerName: clean(input.playerName || input.username, 80),
    accountName: clean(input.accountName || input.name, 80),
    species: canonicalSpecies(input.species) || clean(input.species, 80),
    sex: clean(input.sex, 20),
    status: clean(input.status, 40),
    skin: clean(input.skin, 100),
    recessiveSkin: clean(input.recessiveSkin || input.recessive, 100),
    nestRole: clean(input.nestRole, 30) || "Unknown",
    pointTraits: traits,
    dominantMutation: Boolean(input.dominantMutation) || traits.includes("Dominant"),
    bloodline: clean(input.bloodline, 10),
    motherName: clean(input.motherName || input.mother, 100),
    fatherName: clean(input.fatherName || input.father, 100),
    stats,
    aPlusCount: Number.isFinite(Number(input.aPlusCount)) ? Number(input.aPlusCount) : progress.aPlusCount,
    upstat: typeof input.upstat === "boolean" ? input.upstat : progress.upstat,
    updatedAt: clean(updatedAt, 80)
  };
}

function dragonSearchKey(record: Record<string, unknown>) {
  return [record.playerName, record.accountName || record.name, record.species, record.sex]
    .map((value) => normalizedLookupValue(value, 100))
    .join("|");
}

function dragonMatchesSearch(record: Record<string, unknown>, input: Record<string, unknown>) {
  const species = normalizedLookupValue(canonicalSpecies(input.species), 80);
  const sex = normalizedLookupValue(input.sex, 20);
  const nestRole = normalizedLookupValue(input.nestRole, 30);
  const bloodline = normalizedLookupValue(input.bloodline, 10);
  const requestedTraits = pointTraits(input.pointTraits, input.traits, input.nestRole);
  if (species && species !== normalizedLookupValue(record.species, 80)) return false;
  if (sex && sex !== normalizedLookupValue(record.sex, 20)) return false;
  if (nestRole && nestRole !== normalizedLookupValue(record.nestRole, 30)) return false;
  if (bloodline && bloodline !== normalizedLookupValue(record.bloodline, 10)) return false;
  if (!requestedTraits.every((trait) => pointTraits(record.pointTraits, record.nestRole, record.dominantMutation ? "Dominant" : "").includes(trait))) return false;
  const upstat = optionalBoolean(input.upstat);
  if (upstat != null && Boolean(record.upstat) !== upstat) return false;
  return includesLookupValue(record.name, input.name, 80)
    && includesLookupValue(record.skin, input.skin, 100)
    && includesLookupValue(record.recessiveSkin, input.recessiveSkin, 100)
    && includesLookupValue(record.playerName, input.playerName, 80)
    && includesLookupValue(record.accountName || record.name, input.accountName, 80)
    && includesLookupValue(record.motherName, input.motherName || input.mother, 100)
    && includesLookupValue(record.fatherName, input.fatherName || input.father, 100);
}

async function searchClanDragons(database: ReturnType<typeof serviceClient>, clanId: string, input: Record<string, unknown>) {
  const [sharedResult, submittedResult] = await Promise.all([
    database
      .from("shared_dragons")
      .select("summary,updated_at")
      .eq("clan_id", clanId)
      .order("updated_at", { ascending: false })
      .limit(CLAN_DRAGON_QUERY_LIMIT),
    database
      .from("discord_bot_submissions")
      .select("payload,created_at")
      .eq("clan_id", clanId)
      .eq("submission_type", "dragon")
      .neq("status", "ignored")
      .order("created_at", { ascending: false })
      .limit(CLAN_DRAGON_QUERY_LIMIT)
  ]);
  if (sharedResult.error) throw sharedResult.error;
  if (submittedResult.error) throw submittedResult.error;

  // Prefer the app's actively shared record; a later bot submission can be the
  // same dragon waiting to be imported, so collapse by player/account/species/sex.
  const unique = new Map<string, Record<string, unknown>>();
  for (const row of sharedResult.data ?? []) {
    const record = normalizedDragonRecord(payloadRecord(row.summary), "shared", row.updated_at);
    if (!record.species) continue;
    unique.set(dragonSearchKey(record), record);
  }
  for (const row of submittedResult.data ?? []) {
    const record = normalizedDragonRecord(payloadRecord(row.payload), "discord", row.created_at);
    if (!record.species) continue;
    const key = dragonSearchKey(record);
    if (!unique.has(key)) unique.set(key, record);
  }

  const records = [...unique.values()];
  const pairingParent = findDragonByName(records, input.pairingParent, input.species);
  const matches = records.filter((record) => {
    if (!dragonMatchesSearch(record, input)) return false;
    if (!pairingParent) return true;
    if (sameDragonIdentity(record, pairingParent)) return false;
    return !inbredPairReason(record, pairingParent);
  });
  return {
    total: matches.length,
    records: matches.slice(0, boundedLimit(input.limit))
  };
}

function payloadRecord(value: unknown) {
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}

function dragonIdentityNames(record: Record<string, unknown>) {
  return [record.name, record.accountName, record.displayName].map(canonicalKey).filter(Boolean);
}

function dragonParentNames(record: Record<string, unknown>) {
  return [record.motherName || record.mother, record.fatherName || record.father].map(canonicalKey).filter(Boolean);
}

function sameDragonIdentity(first: Record<string, unknown>, second: Record<string, unknown>) {
  if (first.species && second.species && canonicalKey(first.species) !== canonicalKey(second.species)) return false;
  const secondNames = dragonIdentityNames(second);
  return dragonIdentityNames(first).some((name) => secondNames.includes(name));
}

function inbredPairReason(first: Record<string, unknown>, second: Record<string, unknown>) {
  if (first.species && second.species && canonicalKey(first.species) !== canonicalKey(second.species)) return "";
  const firstNames = dragonIdentityNames(first);
  const secondNames = dragonIdentityNames(second);
  const firstParents = dragonParentNames(first);
  const secondParents = dragonParentNames(second);
  if (firstNames.some((name) => secondParents.includes(name)) || secondNames.some((name) => firstParents.includes(name))) {
    return "one selected parent is the child of the other";
  }
  if (firstParents.some((name) => secondParents.includes(name))) return "the selected parents are siblings";
  return "";
}

function findDragonByName(records: Record<string, unknown>[], value: unknown, species: unknown = "") {
  const key = canonicalKey(value);
  const speciesKey = canonicalKey(species);
  return key ? records.find((record) => (
    (!speciesKey || canonicalKey(record.species) === speciesKey)
    && dragonIdentityNames(record).includes(key)
  )) || null : null;
}

async function clanDragonRecords(database: ReturnType<typeof serviceClient>, clanId: string) {
  const [sharedResult, submittedResult] = await Promise.all([
    database.from("shared_dragons").select("summary,updated_at").eq("clan_id", clanId).limit(CLAN_DRAGON_QUERY_LIMIT),
    database.from("discord_bot_submissions").select("payload,created_at").eq("clan_id", clanId).eq("submission_type", "dragon").neq("status", "ignored").limit(CLAN_DRAGON_QUERY_LIMIT)
  ]);
  if (sharedResult.error) throw sharedResult.error;
  if (submittedResult.error) throw submittedResult.error;
  return [
    ...(sharedResult.data ?? []).map((row) => normalizedDragonRecord(payloadRecord(row.summary), "shared", row.updated_at)),
    ...(submittedResult.data ?? []).map((row) => normalizedDragonRecord(payloadRecord(row.payload), "discord", row.created_at))
  ];
}

async function lineageContext(database: ReturnType<typeof serviceClient>, clanId: string, input: Record<string, unknown>) {
  const records = await clanDragonRecords(database, clanId);
  const mother = findDragonByName(records, input.motherName || input.mother, input.species);
  const father = findDragonByName(records, input.fatherName || input.father, input.species);
  const reason = mother && father ? inbredPairReason(mother, father) : "";
  const parentFourthPointed = [mother, father].some((parent) => parent && (
    ["4thpointed", "elder"].includes(canonicalKey(parent.status)) || Boolean(parent.dominantMutation)
  ));
  return { records, mother, father, inbredReason: reason, parentFourthPointed };
}

function isEggRequestMatch(requestPayload: Record<string, unknown>, dragonPayload: Record<string, unknown>, clanRecords: Record<string, unknown>[] = []) {
  const requestSpecies = normalizedLookupValue(requestPayload.species, 80);
  const dragonSpecies = normalizedLookupValue(dragonPayload.species, 80);
  if (!requestSpecies || requestSpecies !== dragonSpecies) return false;

  const requestedSkin = normalizedLookupValue(requestPayload.skin, 100);
  if (requestedSkin && requestedSkin !== normalizedLookupValue(dragonPayload.skin, 100)) return false;

  const requestedRecessive = normalizedLookupValue(requestPayload.recessiveSkin, 100);
  if (requestedRecessive && requestedRecessive !== normalizedLookupValue(dragonPayload.recessiveSkin, 100)) return false;

  const requestedSex = normalizedLookupValue(requestPayload.sex, 20);
  if (requestedSex && requestedSex !== "unknown" && requestedSex !== normalizedLookupValue(dragonPayload.sex, 20)) return false;

  const requestedBloodline = normalizedLookupValue(requestPayload.bloodline, 10);
  if (requestedBloodline && requestedBloodline !== normalizedLookupValue(dragonPayload.bloodline, 10)) return false;

  const requestedTraits = pointTraits(requestPayload.pointTraits, requestPayload.traits, requestPayload.goal);
  const dragonTraits = pointTraits(
    dragonPayload.pointTraits,
    dragonPayload.nestRole,
    dragonPayload.dominantMutation ? "Dominant" : "",
    dragonPayload.skin && dragonPayload.recessiveSkin && canonicalKey(dragonPayload.skin) === canonicalKey(dragonPayload.recessiveSkin) ? "Pure" : ""
  );
  if (!requestedTraits.every((trait) => dragonTraits.includes(trait))) return false;

  const requestedUpstat = optionalBoolean(requestPayload.upstat);
  if (requestedUpstat != null && statProgress(dragonPayload.stats).upstat !== requestedUpstat) return false;

  const pairingParent = findDragonByName(clanRecords, requestPayload.pairingParent, requestPayload.species);
  const candidate = normalizedDragonRecord(dragonPayload, "discord", "");
  if (pairingParent && (sameDragonIdentity(candidate, pairingParent) || inbredPairReason(candidate, pairingParent))) return false;

  return true;
}

async function eggMatchAlertPreference(database: ReturnType<typeof serviceClient>, clanId: string, input: Record<string, unknown>) {
  const discordUserId = clean(input.discord_user_id, 40);
  if (!discordUserId) throw new Error("A Discord user id is required");
  const setting = normalizedLookupValue(input.setting, 20);
  const sourceKey = `egg-alert-pref:${discordUserId}`;

  if (setting === "status") {
    const { data, error } = await database
      .from("discord_bot_submissions")
      .select("payload")
      .eq("clan_id", clanId)
      .eq("source_key", sourceKey)
      .maybeSingle();
    if (error) throw error;
    return { enabled: Boolean(payloadRecord(data?.payload).enabled) };
  }

  if (setting !== "enabled" && setting !== "disabled") throw new Error("Alert setting must be Enabled, Disabled, or Status");
  const { data, error } = await database
    .from("discord_bot_submissions")
    .upsert({
      clan_id: clanId,
      source_key: sourceKey,
      discord_user_id: discordUserId,
      discord_username: clean(input.discord_username, 100),
      submission_type: "note",
      payload: {
        kind: "egg_match_alert_preference",
        enabled: setting === "enabled"
      },
      status: "ignored"
    }, { onConflict: "clan_id,source_key" })
    .select("payload")
    .single();
  if (error) throw error;
  return { enabled: Boolean(payloadRecord(data?.payload).enabled) };
}

// Queue opt-in notifications without exposing another member's private data.
async function createEggMatchNotifications(
  database: ReturnType<typeof serviceClient>,
  clanId: string,
  eggRequestSubmissionId: string,
  sourceKey: string
) {
  const { data: eggRequest, error: requestError } = await database
    .from("discord_bot_submissions")
    .select("id,discord_user_id,discord_guild_id,discord_channel_id,payload")
    .eq("id", eggRequestSubmissionId)
    .eq("clan_id", clanId)
    .eq("source_key", sourceKey)
    .eq("submission_type", "egg_request")
    .single();
  if (requestError) throw requestError;
  const requestPayload = payloadRecord(eggRequest.payload);
  if (requestPayload.notifyOwners === false) return [];

  const { data: preferences, error: preferenceError } = await database
    .from("discord_bot_submissions")
    .select("discord_user_id,payload")
    .eq("clan_id", clanId)
    .eq("submission_type", "note")
    .eq("status", "ignored")
    .like("source_key", "egg-alert-pref:%")
    .limit(CLAN_DRAGON_QUERY_LIMIT);
  if (preferenceError) throw preferenceError;
  const optedInUserIds = new Set((preferences ?? [])
    .filter((row) => payloadRecord(row.payload).kind === "egg_match_alert_preference" && Boolean(payloadRecord(row.payload).enabled))
    .map((row) => clean(row.discord_user_id, 40))
    .filter(Boolean));
  if (!optedInUserIds.size) return [];

  const { data: dragons, error: dragonError } = await database
    .from("discord_bot_submissions")
    .select("id,discord_user_id,discord_username,payload")
    .eq("clan_id", clanId)
    .eq("submission_type", "dragon")
    .neq("status", "ignored")
    .order("created_at", { ascending: false })
    .limit(CLAN_DRAGON_QUERY_LIMIT);
  if (dragonError) throw dragonError;

  const allClanDragons = await clanDragonRecords(database, clanId);
  const notifications: Array<Record<string, unknown>> = [];
  for (const dragon of dragons ?? []) {
    const recipientDiscordUserId = clean(dragon.discord_user_id, 40);
    if (!recipientDiscordUserId || !optedInUserIds.has(recipientDiscordUserId)) continue;
    const dragonPayload = payloadRecord(dragon.payload);
    if (!isEggRequestMatch(requestPayload, dragonPayload, allClanDragons)) continue;

    const notificationSourceKey = `egg-match:${eggRequest.id}:${dragon.id}`;
    const { data: existingNotification, error: existingNotificationError } = await database
      .from("discord_bot_submissions")
      .select("id")
      .eq("clan_id", clanId)
      .eq("source_key", notificationSourceKey)
      .maybeSingle();
    if (existingNotificationError) throw existingNotificationError;
    if (existingNotification) continue;

    const { error: notificationError } = await database
      .from("discord_bot_submissions")
      .insert({
        clan_id: clanId,
        source_key: notificationSourceKey,
        discord_user_id: recipientDiscordUserId,
        discord_username: clean(dragon.discord_username, 100) || "Discord user",
        submission_type: "note",
        payload: {
          kind: "egg_match_notification",
          status: "pending",
          eggRequestSubmissionId: eggRequest.id,
          dragonSubmissionId: dragon.id
        },
        status: "ignored"
      });
    if (notificationError) {
      if (notificationError.code === "23505") continue;
      throw notificationError;
    }
    notifications.push({
      notificationSourceKey,
      recipientDiscordUserId,
      recipientUsername: clean(dragon.discord_username, 100),
      dragonName: clean(dragonPayload.name || dragonPayload.accountName, 80) || "Submitted dragon",
      dragonSpecies: clean(dragonPayload.species, 80),
      dragonSkin: clean(dragonPayload.skin, 100),
      dragonRecessiveSkin: clean(dragonPayload.recessiveSkin, 100),
      dragonSex: clean(dragonPayload.sex, 20),
      requester: clean(requestPayload.requester, 100),
      requestSpecies: clean(requestPayload.species, 80),
      requestSkin: clean(requestPayload.skin, 100),
      requestRecessiveSkin: clean(requestPayload.recessiveSkin, 100),
      requestSex: clean(requestPayload.sex, 20),
      requestBloodline: clean(requestPayload.bloodline, 10),
      requestPointTraits: pointTraits(requestPayload.pointTraits, requestPayload.traits, requestPayload.goal),
      requestUpstat: optionalBoolean(requestPayload.upstat) === true,
      requestNotes: clean(requestPayload.notes, 1000),
      discordGuildId: clean(eggRequest.discord_guild_id, 40),
      discordChannelId: clean(eggRequest.discord_channel_id, 40)
    });
  }
  return notifications;
}

async function recordEggMatchNotification(database: ReturnType<typeof serviceClient>, clanId: string, input: Record<string, unknown>) {
  const notificationSourceKey = clean(input.notification_source_key, 160);
  if (!notificationSourceKey.startsWith("egg-match:")) throw new Error("A valid notification key is required");
  const status = normalizedLookupValue(input.status, 20);
  if (!["sent", "blocked", "failed"].includes(status)) throw new Error("Unsupported notification status");

  const { data: existing, error: existingError } = await database
    .from("discord_bot_submissions")
    .select("payload")
    .eq("clan_id", clanId)
    .eq("source_key", notificationSourceKey)
    .maybeSingle();
  if (existingError) throw existingError;
  const existingPayload = payloadRecord(existing?.payload);
  if (existingPayload.kind !== "egg_match_notification") throw new Error("Egg match notification not found");

  const { error } = await database
    .from("discord_bot_submissions")
    .update({
      payload: {
        ...existingPayload,
        status,
        failureReason: status === "sent" ? "" : clean(input.failure_reason, 200),
        sentAt: status === "sent" ? new Date().toISOString() : "",
        updatedAt: new Date().toISOString()
      }
    })
    .eq("clan_id", clanId)
    .eq("source_key", notificationSourceKey);
  if (error) throw error;
  return { ok: true };
}

// Keep only the fields and lengths accepted for each submission type.
function normalizeDragonPayload(input: Record<string, unknown>, context: { inbredReason?: string; parentFourthPointed?: boolean } = {}) {
  const name = clean(input.name || input.accountName, 80);
  const species = canonicalSpecies(input.species);
  if (!name || !species) throw new Error("Dragon name and a valid species are required");

  const traits = pointTraits(input.pointTraits, input.traits, input.nestRole, input.dominantMutation ? "Dominant" : "");
  const skin = clean(input.skin || input.primarySkin, 100);
  let recessiveSkin = clean(input.recessiveSkin || input.recessive, 100);
  if (traits.includes("Pure") && !skin) throw new Error("Pure requires a primary skin");
  if (traits.includes("Pure") && skin && !recessiveSkin) recessiveSkin = skin;
  if (skin && recessiveSkin && canonicalKey(skin) === canonicalKey(recessiveSkin) && !traits.includes("Pure")) traits.push("Pure");

  const dominantMutation = traits.includes("Dominant");
  let status = canonicalChoice(input.status, STATUSES, "Hatchie");
  if (dominantMutation && STATUSES.indexOf(status) < STATUSES.indexOf("4th Pointed")) status = "4th Pointed";
  const enteredBloodline = clean(input.bloodline, 10).toUpperCase();
  if (enteredBloodline && !BLOODLINES.includes(enteredBloodline)) throw new Error("Bloodline must be E, D, C, B, or A");
  const bloodline = canonicalBloodline(enteredBloodline, enteredBloodline ? "" : "E");
  if (!bloodline) throw new Error("Bloodline must be E, D, C, B, or A");
  const inbredReason = clean(context.inbredReason || input.inbredReason, 180);
  // A++ is a lineage result, so only stored parent records can unlock it.
  const parentFourthPointed = Boolean(context.parentFourthPointed);
  const stats = normalizedStats(input.stats, bloodline, { inbred: Boolean(inbredReason), parentFourthPointed });
  const progress = statProgress(stats);
  const nestRole = traits.includes("Pure") ? "Pure" : traits.includes("Breeder") ? "Breeder" : traits.includes("PvP") ? "Fighter" : "Unknown";

  return {
    name,
    playerName: clean(input.playerName || input.username, 80),
    accountName: clean(input.accountName, 80) || name,
    species,
    sex: canonicalChoice(input.sex, SEXES, "Unknown"),
    status,
    skin,
    recessiveSkin,
    bloodline,
    nestRole,
    pointTraits: POINT_TRAITS.filter((trait) => traits.includes(trait)),
    dominantMutation,
    motherName: clean(input.motherName || input.mother, 100),
    fatherName: clean(input.fatherName || input.father, 100),
    parentFourthPointed,
    inbred: Boolean(inbredReason),
    inbredReason,
    stats,
    aPlusCount: progress.aPlusCount,
    upstat: progress.upstat,
    notes: clean(input.notes, 600)
  };
}

function normalizePayload(type: SubmissionType, input: Record<string, unknown>, context: { inbredReason?: string; parentFourthPointed?: boolean } = {}) {
  if (type === "dragon") {
    return normalizeDragonPayload(input, context);
  }

  if (type === "map_pin") {
    const x = Number(input.x);
    const y = Number(input.y);
    if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || x > 100 || y < 0 || y > 100) {
      throw new Error("Map pin x and y must be percentages from 0 to 100");
    }
    const payload = {
      label: clean(input.label, 80),
      type: clean(input.type, 40) || "Location",
      x,
      y,
      notes: clean(input.notes, 500)
    };
    if (!payload.label) throw new Error("Map pin label is required");
    return payload;
  }

  if (type === "egg_request") {
    const traits = pointTraits(input.pointTraits, input.traits, input.goal);
    const skin = clean(input.skin || input.primarySkin, 100);
    let recessiveSkin = clean(input.recessiveSkin || input.recessive, 100);
    const requestedBloodline = clean(input.bloodline, 10).toUpperCase();
    if (requestedBloodline && !BLOODLINES.includes(requestedBloodline)) throw new Error("Bloodline must be E, D, C, B, or A");
    if (traits.includes("Pure") && skin && !recessiveSkin) recessiveSkin = skin;
    if (skin && recessiveSkin && canonicalKey(skin) === canonicalKey(recessiveSkin) && !traits.includes("Pure")) traits.push("Pure");
    const payload = {
      requester: clean(input.requester || input.playerName || input.username, 100),
      accountName: clean(input.accountName || input.account, 80),
      species: canonicalSpecies(input.species),
      skin,
      recessiveSkin,
      sex: input.sex ? canonicalChoice(input.sex, SEXES) : "",
      bloodline: requestedBloodline,
      pointTraits: POINT_TRAITS.filter((trait) => traits.includes(trait)),
      pairingParent: clean(input.pairingParent, 100),
      upstat: optionalBoolean(input.upstat),
      notifyOwners: optionalBoolean(input.notifyOwners ?? input.pings) !== false,
      notes: clean(input.notes, 1000)
    };
    if (!payload.requester || !payload.species) throw new Error("Egg requester and species are required");
    return payload;
  }

  if (type === "upstat") {
    const aPlusCount = Number(input.aPlusCount ?? input.currentAPlus ?? input.aplus);
    const payload = {
      species: canonicalSpecies(input.species),
      skin: clean(input.skin, 100),
      status: clean(input.status, 40),
      aPlusCount: Number.isFinite(aPlusCount) ? Math.max(0, Math.min(18, Math.round(aPlusCount))) : 0,
      accountName: clean(input.accountName || input.account, 80),
      notes: clean(input.notes, 1000)
    };
    if (!payload.species || !payload.skin) throw new Error("Upstat species and skin are required");
    return payload;
  }

  if (type === "brood_pouch") {
    const dragon = normalizeDragonPayload({ ...input, name: input.name || input.eggName || input.accountName, status: "Hatchie" }, context);
    const payload = {
      ...dragon,
      brood: clean(input.brood || input.currentBrood, 80),
      dueAt: clean(input.dueAt || input.due || input.reminder, 80),
      oddsSummary: clean(input.oddsSummary || input.odds, 180),
      notes: clean(input.notes, 1000)
    };
    if (!payload.name || !payload.species || !payload.brood) throw new Error("Brood pouch name, species, and brood are required");
    return payload;
  }

  if (type === "current_nest") {
    if (context.inbredReason) throw new Error(`Inbred nest: ${context.inbredReason}. This pairing would result in F stats`);
    const payload = {
      father: clean(input.father, 100),
      mother: clean(input.mother, 100),
      species: canonicalSpecies(input.species),
      breeder: clean(input.breeder || input.playerName || input.username, 100),
      requester: clean(input.requester, 100),
      expectedSkin: clean(input.expectedSkin || input.skin, 120),
      broodWatcherBrooding: Boolean(input.broodWatcherBrooding || input.bwBrooding),
      notes: clean(input.notes, 1000)
    };
    if (!payload.father || !payload.mother || !payload.species) throw new Error("Nest father, mother, and species are required");
    return payload;
  }

  const payload = {
    title: clean(input.title, 120),
    notes: clean(input.notes, 1000)
  };
  if (!payload.title || !payload.notes) throw new Error("Note title and text are required");
  return payload;
}

// Single authenticated endpoint for bot writes, searches, and alert updates.
Deno.serve(async (request) => {
  try {
    if (request.method !== "POST") return json({ error: "POST required" }, 405);
    const body = await request.json();
    const input = body && typeof body === "object" ? body as Record<string, unknown> : {};
    if (clean(input.action, 40) === "heartbeat") {
      if (!hasBearerToken(request, HEARTBEAT_SECRET)) return json({ error: "Unauthorized" }, 401);
      return json({ ok: true, checkedAt: new Date().toISOString() });
    }

    if (!hasBearerToken(request, INGEST_SECRET)) return json({ error: "Unauthorized" }, 401);
    const clanId = requireUuid(input.clan_id);
    const database = serviceClient();
    const action = clean(input.action, 40);
    if (action === "test_data_cleanup") {
      const { data, error } = await database
        .from("discord_bot_submissions")
        .delete()
        .eq("clan_id", clanId)
        .like("source_key", "test-bank:%")
        .select("id");
      if (error) throw error;
      return json({ ok: true, deleted: data?.length ?? 0 });
    }
    if (action === "upstat_lookup") {
      return json(await lookupUpstatProgress(database, clanId, input));
    }
    if (action === "dragon_search") {
      return json(await searchClanDragons(database, clanId, input));
    }
    if (action === "egg_match_alerts") {
      return json(await eggMatchAlertPreference(database, clanId, input));
    }
    if (action === "record_egg_match_notification") {
      return json(await recordEggMatchNotification(database, clanId, input));
    }
    if (action === "update_dragon_stats") {
      const submissionId = requireUuid(input.submission_id);
      const discordUserId = clean(input.discord_user_id, 40);
      const { data: existing, error: existingError } = await database
        .from("discord_bot_submissions")
        .select("id,discord_user_id,submission_type,payload")
        .eq("id", submissionId)
        .eq("clan_id", clanId)
        .single();
      if (existingError) throw existingError;
      if (existing.submission_type !== "dragon") throw new Error("Only dragon submissions can receive 18-stat updates");
      if (!discordUserId || clean(existing.discord_user_id, 40) !== discordUserId) throw new Error("Only the original submitter can edit these stats");
      const existingPayload = payloadRecord(existing.payload);
      const context = await lineageContext(database, clanId, existingPayload);
      const payload = normalizeDragonPayload({ ...existingPayload, stats: payloadRecord(input.stats) }, context);
      const { error: updateError } = await database
        .from("discord_bot_submissions")
        .update({ payload })
        .eq("id", submissionId)
        .eq("clan_id", clanId);
      if (updateError) throw updateError;
      return json({ ok: true, name: payload.name, stats: payload.stats, aPlusCount: payload.aPlusCount, upstat: payload.upstat });
    }

    const type = normalizeType(input.type);
    const sourceKey = clean(input.source_key, 160);
    if (!sourceKey) throw new Error("source_key is required");

    const rawPayload = input.payload && typeof input.payload === "object" ? input.payload as Record<string, unknown> : {};
    const context = ["dragon", "brood_pouch", "current_nest"].includes(type)
      ? await lineageContext(database, clanId, rawPayload)
      : {};
    const payload = normalizePayload(type, rawPayload, context);
    const { data: submission, error } = await database.from("discord_bot_submissions").upsert({
      clan_id: clanId,
      source_key: sourceKey,
      discord_guild_id: clean(input.discord_guild_id, 40),
      discord_channel_id: clean(input.discord_channel_id, 40),
      discord_user_id: clean(input.discord_user_id, 40),
      discord_username: clean(input.discord_username, 100) || "Discord user",
      submission_type: type,
      payload,
      status: "pending"
    }, { onConflict: "clan_id,source_key" }).select("id").single();

    if (error) throw error;
    const eggMatchNotifications = type === "egg_request"
      ? await createEggMatchNotifications(database, clanId, submission.id, sourceKey)
      : [];
    return json({ ok: true, submissionId: submission.id, eggMatchNotifications });
  } catch (error) {
    console.error("discord-bot-ingest failed", error);
    return json({ error: error instanceof Error ? error.message : "Discord bot submission failed" }, 400);
  }
});
