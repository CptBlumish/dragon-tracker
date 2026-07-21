import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const INGEST_SECRET = Deno.env.get("DRAGON_TRACKER_BOT_INGEST_SECRET") || "";
const MAX_TEXT = 500;

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

function authorize(request: Request) {
  const expected = `Bearer ${INGEST_SECRET}`;
  if (!INGEST_SECRET || request.headers.get("Authorization") !== expected) {
    return false;
  }
  return true;
}

function normalizeType(value: unknown): SubmissionType {
  const type = clean(value, 30);
  if (type === "dragon" || type === "map_pin" || type === "note" || type === "egg_request" || type === "upstat" || type === "brood_pouch" || type === "current_nest") return type;
  throw new Error("Unsupported submission type");
}

function normalizePayload(type: SubmissionType, input: Record<string, unknown>) {
  if (type === "dragon") {
    return {
      name: clean(input.name, 80),
      playerName: clean(input.playerName || input.username, 80),
      accountName: clean(input.accountName, 80),
      species: clean(input.species, 80),
      sex: clean(input.sex, 20),
      status: clean(input.status, 40),
      skin: clean(input.skin, 100),
      recessiveSkin: clean(input.recessiveSkin, 100),
      bloodline: clean(input.bloodline, 10),
      notes: clean(input.notes, 600)
    };
  }

  if (type === "map_pin") {
    const x = Number(input.x);
    const y = Number(input.y);
    if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || x > 100 || y < 0 || y > 100) {
      throw new Error("Map pin x and y must be percentages from 0 to 100");
    }
    return {
      label: clean(input.label, 80),
      type: clean(input.type, 40) || "Location",
      x,
      y,
      notes: clean(input.notes, 500)
    };
  }

  if (type === "egg_request") {
    return {
      requester: clean(input.requester || input.playerName || input.username, 100),
      species: clean(input.species, 80),
      skin: clean(input.skin, 100),
      recessiveSkin: clean(input.recessiveSkin || input.recessive, 100),
      sex: clean(input.sex, 20),
      goal: clean(input.goal, 120),
      notes: clean(input.notes, 1000)
    };
  }

  if (type === "upstat") {
    const aPlusCount = Number(input.aPlusCount ?? input.currentAPlus ?? input.aplus);
    return {
      species: clean(input.species, 80),
      skin: clean(input.skin, 100),
      status: clean(input.status, 40),
      aPlusCount: Number.isFinite(aPlusCount) ? Math.max(0, Math.min(18, Math.round(aPlusCount))) : 0,
      accountName: clean(input.accountName || input.account, 80),
      notes: clean(input.notes, 1000)
    };
  }

  if (type === "brood_pouch") {
    return {
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
  }

  if (type === "current_nest") {
    return {
      father: clean(input.father, 100),
      mother: clean(input.mother, 100),
      species: clean(input.species, 80),
      breeder: clean(input.breeder || input.playerName || input.username, 100),
      requester: clean(input.requester, 100),
      expectedSkin: clean(input.expectedSkin || input.skin, 120),
      broodWatcherBrooding: Boolean(input.broodWatcherBrooding || input.bwBrooding),
      notes: clean(input.notes, 1000)
    };
  }

  return {
    title: clean(input.title, 120),
    notes: clean(input.notes, 1000)
  };
}

Deno.serve(async (request) => {
  try {
    if (request.method !== "POST") return json({ error: "POST required" }, 405);
    if (!authorize(request)) return json({ error: "Unauthorized" }, 401);

    const body = await request.json();
    const type = normalizeType(body.type);
    const clanId = requireUuid(body.clan_id);
    const sourceKey = clean(body.source_key, 160);
    if (!sourceKey) throw new Error("source_key is required");

    const payload = normalizePayload(type, body.payload && typeof body.payload === "object" ? body.payload : {});
    const database = serviceClient();
    const { error } = await database.from("discord_bot_submissions").upsert({
      clan_id: clanId,
      source_key: sourceKey,
      discord_guild_id: clean(body.discord_guild_id, 40),
      discord_channel_id: clean(body.discord_channel_id, 40),
      discord_user_id: clean(body.discord_user_id, 40),
      discord_username: clean(body.discord_username, 100) || "Discord user",
      submission_type: type,
      payload,
      status: "pending"
    }, { onConflict: "clan_id,source_key" });

    if (error) throw error;
    return json({ ok: true });
  } catch (error) {
    console.error("discord-bot-ingest failed", error);
    return json({ error: error instanceof Error ? error.message : "Discord bot submission failed" }, 400);
  }
});
