import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const INGEST_SECRET = Deno.env.get("DRAGON_TRACKER_BOT_INGEST_SECRET") || "";
const HEARTBEAT_SECRET = Deno.env.get("DRAGON_TRACKER_HEARTBEAT_SECRET") || "";
const MAX_TEXT = 500;
const CLAN_DRAGON_QUERY_LIMIT = 2500;

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

async function lookupUpstatProgress(database: ReturnType<typeof serviceClient>, clanId: string, input: Record<string, unknown>) {
  const species = clean(input.species, 80);
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
    .filter((record) => record.submission_type === "upstat")
    .map((record) => {
      const payload = record.payload && typeof record.payload === "object" ? record.payload as Record<string, unknown> : {};
      const aPlusCount = Number(payload.aPlusCount);
      return {
        aPlusCount: Number.isFinite(aPlusCount) ? Math.max(0, Math.min(18, Math.round(aPlusCount))) : 0,
        status: clean(payload.status, 40) || "In Progress",
        submittedBy: clean(record.discord_username, 100) || "Discord user",
        createdAt: clean(record.created_at, 80)
      };
    });

  return {
    species,
    skin,
    matchingDragonCount: matching.filter((record) => record.submission_type === "dragon").length,
    upstatRecords
  };
}

function normalizedDragonRecord(input: Record<string, unknown>, source: string, updatedAt: unknown) {
  return {
    source,
    name: clean(input.displayName || input.name || input.accountName, 80),
    playerName: clean(input.playerName || input.username, 80),
    accountName: clean(input.accountName || input.name, 80),
    species: clean(input.species, 80),
    sex: clean(input.sex, 20),
    status: clean(input.status, 40),
    skin: clean(input.skin, 100),
    recessiveSkin: clean(input.recessiveSkin || input.recessive, 100),
    nestRole: clean(input.nestRole, 30) || "Unknown",
    updatedAt: clean(updatedAt, 80)
  };
}

function dragonSearchKey(record: Record<string, unknown>) {
  return [record.playerName, record.accountName || record.name, record.species, record.sex]
    .map((value) => normalizedLookupValue(value, 100))
    .join("|");
}

function dragonMatchesSearch(record: Record<string, unknown>, input: Record<string, unknown>) {
  const species = normalizedLookupValue(input.species, 80);
  const sex = normalizedLookupValue(input.sex, 20);
  const nestRole = normalizedLookupValue(input.nestRole, 30);
  if (species && species !== normalizedLookupValue(record.species, 80)) return false;
  if (sex && sex !== normalizedLookupValue(record.sex, 20)) return false;
  if (nestRole && nestRole !== normalizedLookupValue(record.nestRole, 30)) return false;
  return includesLookupValue(record.skin, input.skin, 100)
    && includesLookupValue(record.recessiveSkin, input.recessiveSkin, 100)
    && includesLookupValue(record.playerName, input.playerName, 80)
    && includesLookupValue(record.accountName || record.name, input.accountName, 80);
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

  const matches = [...unique.values()].filter((record) => dragonMatchesSearch(record, input));
  return {
    total: matches.length,
    records: matches.slice(0, boundedLimit(input.limit))
  };
}

function payloadRecord(value: unknown) {
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}

function isEggRequestMatch(requestPayload: Record<string, unknown>, dragonPayload: Record<string, unknown>) {
  const requestSpecies = normalizedLookupValue(requestPayload.species, 80);
  const dragonSpecies = normalizedLookupValue(dragonPayload.species, 80);
  if (!requestSpecies || requestSpecies !== dragonSpecies) return false;

  const requestedSkin = normalizedLookupValue(requestPayload.skin, 100);
  if (requestedSkin && requestedSkin !== normalizedLookupValue(dragonPayload.skin, 100)) return false;

  const requestedRecessive = normalizedLookupValue(requestPayload.recessiveSkin, 100);
  if (requestedRecessive && requestedRecessive !== normalizedLookupValue(dragonPayload.recessiveSkin, 100)) return false;

  const requestedSex = normalizedLookupValue(requestPayload.sex, 20);
  if (requestedSex && requestedSex !== "unknown" && requestedSex !== normalizedLookupValue(dragonPayload.sex, 20)) return false;

  const goal = normalizedLookupValue(requestPayload.goal, 120);
  const nestRole = normalizedLookupValue(dragonPayload.nestRole, 30);
  if (goal.includes("ultra") && nestRole !== "ultra pure") return false;
  if (!goal.includes("ultra") && goal.includes("pure") && !["pure", "ultra pure"].includes(nestRole)) return false;

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

  const requestPayload = payloadRecord(eggRequest.payload);
  const notifications: Array<Record<string, unknown>> = [];
  for (const dragon of dragons ?? []) {
    const recipientDiscordUserId = clean(dragon.discord_user_id, 40);
    if (!recipientDiscordUserId || !optedInUserIds.has(recipientDiscordUserId)) continue;
    const dragonPayload = payloadRecord(dragon.payload);
    if (!isEggRequestMatch(requestPayload, dragonPayload)) continue;

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
      requestGoal: clean(requestPayload.goal, 120),
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

function normalizePayload(type: SubmissionType, input: Record<string, unknown>) {
  if (type === "dragon") {
    const payload = {
      name: clean(input.name, 80),
      playerName: clean(input.playerName || input.username, 80),
      accountName: clean(input.accountName, 80),
      species: clean(input.species, 80),
      sex: clean(input.sex, 20),
      status: clean(input.status, 40),
      skin: clean(input.skin, 100),
      recessiveSkin: clean(input.recessiveSkin, 100),
      bloodline: clean(input.bloodline, 10),
      nestRole: clean(input.nestRole, 30),
      notes: clean(input.notes, 600)
    };
    if (!payload.name || !payload.species || !payload.sex || !payload.status) throw new Error("Dragon name, species, sex, and status are required");
    return payload;
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
    const payload = {
      requester: clean(input.requester || input.playerName || input.username, 100),
      species: clean(input.species, 80),
      skin: clean(input.skin, 100),
      recessiveSkin: clean(input.recessiveSkin || input.recessive, 100),
      sex: clean(input.sex, 20),
      goal: clean(input.goal, 120),
      notes: clean(input.notes, 1000)
    };
    if (!payload.requester || !payload.species) throw new Error("Egg requester and species are required");
    return payload;
  }

  if (type === "upstat") {
    const aPlusCount = Number(input.aPlusCount ?? input.currentAPlus ?? input.aplus);
    const payload = {
      species: clean(input.species, 80),
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
    const payload = {
      name: clean(input.name || input.eggName || input.accountName, 80),
      playerName: clean(input.playerName || input.username, 80),
      accountName: clean(input.accountName || input.account || input.name, 80),
      species: clean(input.species, 80),
      sex: clean(input.sex, 20),
      skin: clean(input.skin, 100),
      recessiveSkin: clean(input.recessiveSkin || input.recessive, 100),
      brood: clean(input.brood || input.currentBrood, 80),
      dueAt: clean(input.dueAt || input.due || input.reminder, 80),
      oddsSummary: clean(input.oddsSummary || input.odds, 180),
      notes: clean(input.notes, 1000)
    };
    if (!payload.name || !payload.species || !payload.brood) throw new Error("Brood pouch name, species, and brood are required");
    return payload;
  }

  if (type === "current_nest") {
    const payload = {
      father: clean(input.father, 100),
      mother: clean(input.mother, 100),
      species: clean(input.species, 80),
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

    const type = normalizeType(input.type);
    const sourceKey = clean(input.source_key, 160);
    if (!sourceKey) throw new Error("source_key is required");

    const payload = normalizePayload(type, input.payload && typeof input.payload === "object" ? input.payload : {});
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
    return json({ ok: true, eggMatchNotifications });
  } catch (error) {
    console.error("discord-bot-ingest failed", error);
    return json({ error: error instanceof Error ? error.message : "Discord bot submission failed" }, 400);
  }
});
