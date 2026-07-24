import "dotenv/config";
import { appendFileSync, existsSync, mkdirSync, renameSync, statSync } from "node:fs";
import { join } from "node:path";
import { Client, GatewayIntentBits, MessageFlags, PermissionFlagsBits } from "discord.js";
import {
  alertMenuMessage,
  dashboardAction,
  dashboardMessage,
  fieldValue,
  modalForAction,
  splitValues,
  upstatMenuMessage
} from "./dashboard.js";

const REQUEST_TIMEOUT_MS = 15_000;
const TRACKER_REQUEST_ATTEMPTS = 2;
const DEFAULT_BREEDER_ROLE_NAME = "Breeder";
const BOT_LOG_PATH = join(process.env.LOCALAPPDATA || process.cwd(), "Dragon Tracker", "discord-bot.log");
const BOT_LOG_MAX_BYTES = 2 * 1024 * 1024;
const EGG_ALERT_DIGEST_WINDOW_MS = Math.max(15_000, Math.min(10 * 60_000, Number(process.env.EGG_ALERT_DIGEST_WINDOW_MS) || 60_000));
const commandCooldowns = new Map();
const eggAlertDigests = new Map();

function writeBotLog(level, values) {
  const details = values.map((value) => {
    if (value instanceof Error) return value.stack || value.message;
    if (typeof value === "string") return value;
    try { return JSON.stringify(value); } catch (_) { return String(value); }
  }).join(" ");
  try {
    mkdirSync(join(process.env.LOCALAPPDATA || process.cwd(), "Dragon Tracker"), { recursive: true });
    if (existsSync(BOT_LOG_PATH) && statSync(BOT_LOG_PATH).size > BOT_LOG_MAX_BYTES) {
      renameSync(BOT_LOG_PATH, BOT_LOG_PATH.replace(/\.log$/, ".previous.log"));
    }
    appendFileSync(BOT_LOG_PATH, `[${new Date().toISOString()}] ${level}: ${details}\n`);
  } catch (_) {
    // Logging must never prevent the bot from acknowledging Discord commands.
  }
}

const standardLog = console.log.bind(console);
const standardError = console.error.bind(console);
console.log = (...values) => {
  standardLog(...values);
  writeBotLog("INFO", values);
};
console.error = (...values) => {
  standardError(...values);
  writeBotLog("ERROR", values);
};

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function optionalEnv(name, fallback = "") {
  return process.env[name] || fallback;
}

function clean(value, max = 500) {
  return String(value ?? "").trim().slice(0, max);
}

function endpointUrl() {
  const base = requiredEnv("SUPABASE_URL").replace(/\/$/, "");
  return `${base}/functions/v1/discord-bot-ingest`;
}

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function requestFailure(message, retryable = false) {
  const error = new Error(message);
  error.retryable = retryable;
  return error;
}

function configuredGuildId() {
  return optionalEnv("DISCORD_GUILD_ID");
}

function isConfiguredGuild(interaction) {
  const guildId = configuredGuildId();
  return !guildId || interaction.guildId === guildId;
}

function commandCooldownMs(commandName) {
  if (commandName === "dt-eggrequest") return 8_000;
  if (["dt-dragon", "dt-createdragon", "dt-upstat", "dt-broodpouch", "dt-currentnest", "dt-location", "dt-note"].includes(commandName)) return 2_000;
  return 0;
}

function commandCooldownRemaining(interaction) {
  const cooldown = commandCooldownMs(interaction.commandName);
  if (!cooldown) return 0;
  const key = `${interaction.guildId || "direct"}:${interaction.user.id}:${interaction.commandName}`;
  const now = Date.now();
  const last = commandCooldowns.get(key) || 0;
  if (last && now - last < cooldown) return cooldown - (now - last);
  commandCooldowns.set(key, now);
  if (commandCooldowns.size > 2_000) {
    for (const [storedKey, timestamp] of commandCooldowns) {
      if (now - timestamp > 60_000) commandCooldowns.delete(storedKey);
    }
  }
  return 0;
}

async function submitToTracker(interaction, type, payload) {
  return trackerRequest({
    clan_id: requiredEnv("DRAGON_TRACKER_CLAN_ID"),
    source_key: interaction.id,
    discord_guild_id: interaction.guildId || "",
    discord_channel_id: interaction.channelId || "",
    discord_user_id: interaction.user.id,
    discord_username: interaction.member?.displayName || interaction.user.globalName || interaction.user.username,
    type,
    payload
  });
}

async function trackerRequest(payload) {
  let failure = null;
  for (let attempt = 1; attempt <= TRACKER_REQUEST_ATTEMPTS; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(endpointUrl(), {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Authorization": `Bearer ${requiredEnv("DRAGON_TRACKER_BOT_INGEST_SECRET")}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const text = await response.text();
      let body = null;
      try { body = text ? JSON.parse(text) : null; } catch (_) { body = text; }
      if (!response.ok) {
        const message = typeof body === "object" && body ? body.error : "";
        throw requestFailure(message || `Tracker ingest failed (${response.status})`, response.status === 429 || response.status >= 500);
      }
      return body;
    } catch (error) {
      const timeoutFailure = error?.name === "AbortError";
      failure = timeoutFailure ? requestFailure("Dragon Tracker took too long to respond. Please try again.", true) : error;
      if (!failure?.retryable || attempt === TRACKER_REQUEST_ATTEMPTS) throw failure;
      console.error(`Tracker request attempt ${attempt} failed; retrying once.`);
      await wait(500 * attempt);
    } finally {
      clearTimeout(timeout);
    }
  }
  throw failure || new Error("The tracker could not receive that submission.");
}

async function lookupUpstatProgress(interaction) {
  const species = clean(interaction.options.getString("species", true), 80);
  const skin = clean(interaction.options.getString("skin", true), 100);
  return trackerRequest({
    action: "upstat_lookup",
    clan_id: requiredEnv("DRAGON_TRACKER_CLAN_ID"),
    discord_guild_id: interaction.guildId || "",
    species,
    skin
  });
}

function findDragonPayload(interaction) {
  return {
    species: clean(interaction.options.getString("species"), 80),
    skin: clean(interaction.options.getString("skin"), 100),
    recessiveSkin: clean(interaction.options.getString("recessive"), 100),
    sex: clean(interaction.options.getString("sex"), 20),
    nestRole: clean(interaction.options.getString("nest_role"), 30),
    playerName: clean(interaction.options.getString("player"), 80),
    accountName: clean(interaction.options.getString("account"), 80),
    limit: interaction.options.getInteger("limit") ?? 8
  };
}

async function findClanDragons(interaction) {
  return trackerRequest({
    action: "dragon_search",
    clan_id: requiredEnv("DRAGON_TRACKER_CLAN_ID"),
    discord_guild_id: interaction.guildId || "",
    ...findDragonPayload(interaction)
  });
}

function dragonSearchMessage(result) {
  const records = Array.isArray(result?.records) ? result.records : [];
  const total = Math.max(0, Number(result?.total) || 0);
  if (!records.length) return "No clan dragons match that search yet. Try a broader skin, recessive, player, or account search.";
  const lines = records.map((record) => {
    const title = clean(record?.name || record?.accountName, 80) || "Unnamed dragon";
    const details = [
      clean(record?.species, 80),
      clean(record?.sex, 20),
      clean(record?.status, 40),
      record?.skin ? `Skin: ${clean(record.skin, 100)}` : "",
      record?.recessiveSkin ? `Res: ${clean(record.recessiveSkin, 100)}` : "",
      record?.nestRole && clean(record.nestRole, 30) !== "Unknown" ? `Role: ${clean(record.nestRole, 30)}` : "",
      compactOwner(record)
    ].filter(Boolean);
    return `- **${title}** - ${details.join(" | ")}`;
  });
  const shown = records.length;
  return [`Found ${total} clan dragon${total === 1 ? "" : "s"}; showing ${shown}.`, ...lines].join("\n");
}

function compactOwner(record) {
  const player = clean(record?.playerName, 80);
  const account = clean(record?.accountName, 80);
  if (player && account) return `${player} / ${account}`;
  return player || account;
}

function upstatProgressMessage(result) {
  const species = clean(result?.species, 80) || "Unknown species";
  const skin = clean(result?.skin, 100) || "Unknown skin";
  const records = Array.isArray(result?.upstatRecords) ? result.upstatRecords : [];
  const dragonCount = Number(result?.matchingDragonCount || 0);
  if (!records.length) {
    return `${species} ${skin}: no submitted upstat progress yet. ${dragonCount ? `${dragonCount} matching dragon submission${dragonCount === 1 ? "" : "s"} found.` : ""}`.trim();
  }

  const best = Math.max(...records.map((record) => Math.max(0, Math.min(18, Number(record?.aPlusCount) || 0))));
  const latest = records[0];
  const latestCount = Math.max(0, Math.min(18, Number(latest?.aPlusCount) || 0));
  const latestStatus = clean(latest?.status, 40) || "In Progress";
  const submittedBy = clean(latest?.submittedBy, 100) || "a clan member";
  return [
    `${species} ${skin}: best submitted progress is ${best}/18 A+.`,
    `Latest update: ${latestCount}/18 A+ - ${latestStatus} (${submittedBy}).`,
    `${records.length} upstat update${records.length === 1 ? "" : "s"}; ${dragonCount} matching dragon submission${dragonCount === 1 ? "" : "s"}.`
  ].join("\n");
}

function dragonPayload(interaction) {
  const name = clean(interaction.options.getString("name", true), 80);
  return {
    name,
    accountName: clean(interaction.options.getString("account"), 80) || name,
    playerName: clean(interaction.options.getString("player"), 80) || interaction.member?.displayName || interaction.user.username,
    species: clean(interaction.options.getString("species", true), 80),
    sex: clean(interaction.options.getString("sex", true), 20),
    status: clean(interaction.options.getString("status", true), 40),
    skin: clean(interaction.options.getString("skin"), 100),
    recessiveSkin: clean(interaction.options.getString("recessive"), 100),
    bloodline: clean(interaction.options.getString("bloodline"), 10),
    nestRole: clean(interaction.options.getString("nest_role"), 30) || "Unknown",
    notes: clean(interaction.options.getString("notes"), 600)
  };
}

function hasBreederAccess(member, permissions) {
  if (permissions?.has?.(PermissionFlagsBits.Administrator)) return true;
  const requiredRoleId = optionalEnv("DISCORD_BREEDER_ROLE_ID");
  const roles = member?.roles?.cache;
  if (!roles) return false;
  if (requiredRoleId) return roles.has(requiredRoleId);
  return roles.some((role) => role.name === DEFAULT_BREEDER_ROLE_NAME);
}

async function announceDragonSubmission(channel, payload, submittedBy) {
  if (!channel?.isTextBased?.()) return;
  const details = [
    `**${payload.name}**`,
    [payload.species, payload.sex, payload.status].filter(Boolean).join(" | "),
    payload.skin ? `Skin: ${payload.skin}` : "",
    payload.recessiveSkin ? `Recessive: ${payload.recessiveSkin}` : "",
    payload.nestRole && payload.nestRole !== "Unknown" ? `Nest role: ${payload.nestRole}` : "",
    `Submitted by: ${submittedBy || "a breeder"}`
  ].filter(Boolean);
  await channel.send({
    content: [`**Dragon Tracker - Breeder Submission**`, ...details].join("\n"),
    allowedMentions: { parse: [] }
  });
}

async function announceEggRequest(channel, payload, submittedBy) {
  if (!channel?.isTextBased?.()) return;
  const details = [
    `**${payload.requester}** is looking for an egg`,
    [payload.species, payload.sex].filter(Boolean).join(" | "),
    payload.skin ? `Skin: ${payload.skin}` : "",
    payload.recessiveSkin ? `Recessive: ${payload.recessiveSkin}` : "",
    payload.goal ? `Goal: ${payload.goal}` : "",
    payload.notes ? `Notes: ${payload.notes}` : "",
    `Submitted by: ${submittedBy || "a clan member"}`,
    "Breeders: contact the requester when you have a suitable nest."
  ].filter(Boolean);
  await channel.send({
    content: ["**Dragon Tracker - Egg Request**", ...details].join("\n"),
    allowedMentions: { parse: [] }
  });
}

async function announceTrackerUpdate(channel, title, details) {
  if (!channel?.isTextBased?.()) return;
  await channel.send({
    content: [`**Dragon Tracker - ${title}**`, ...details.filter(Boolean)].join("\n"),
    allowedMentions: { parse: [] }
  });
}

async function updateEggMatchAlerts(interaction, setting) {
  return trackerRequest({
    action: "egg_match_alerts",
    clan_id: requiredEnv("DRAGON_TRACKER_CLAN_ID"),
    discord_user_id: interaction.user.id,
    discord_username: interaction.member?.displayName || interaction.user.globalName || interaction.user.username,
    setting
  });
}

async function recordEggMatchNotification(notificationSourceKey, status, failureReason = "") {
  try {
    await trackerRequest({
      action: "record_egg_match_notification",
      clan_id: requiredEnv("DRAGON_TRACKER_CLAN_ID"),
      notification_source_key: notificationSourceKey,
      status,
      failure_reason: clean(failureReason, 200)
    });
  } catch (error) {
    console.error(`Could not record egg match notification ${notificationSourceKey}: ${error instanceof Error ? error.message : "unknown error"}`);
  }
}

function eggRequestKey(match) {
  return clean(match?.notificationSourceKey, 160).split(":")[1] || clean(match?.notificationSourceKey, 160);
}

function eggMatchDigestMessage(matches) {
  const requests = new Map();
  for (const match of matches) {
    const key = eggRequestKey(match);
    const group = requests.get(key) || [];
    group.push(match);
    requests.set(key, group);
  }

  const lines = [
    "**Dragon Tracker - Nesting Request Digest**",
    `${requests.size} new request${requests.size === 1 ? "" : "s"} matched your submitted dragons.`
  ];
  const requestGroups = [...requests.values()];
  requestGroups.slice(0, 8).forEach((group) => {
    const first = group[0] || {};
    const requestDetails = [
      first.requestSpecies,
      first.requestSkin ? `Skin: ${first.requestSkin}` : "",
      first.requestRecessiveSkin ? `Res: ${first.requestRecessiveSkin}` : "",
      first.requestSex ? `Sex: ${first.requestSex}` : "",
      first.requestGoal ? `Goal: ${first.requestGoal}` : ""
    ].filter(Boolean).join(" | ");
    const dragonNames = [...new Set(group.map((match) => clean(match.dragonName, 80)).filter(Boolean))];
    const shownNames = dragonNames.slice(0, 4).join(", ");
    const extraNames = Math.max(0, dragonNames.length - 4);
    lines.push(
      `\n**${clean(first.requester, 100) || "A clan member"}**: ${requestDetails || "matching egg"}`,
      `Matches: ${shownNames || `${group.length} submitted dragon${group.length === 1 ? "" : "s"}`}${extraNames ? `, plus ${extraNames} more` : ""}`
    );
    if (first.requestNotes) lines.push(`Notes: ${clean(first.requestNotes, 240)}`);
    if (first.discordGuildId && first.discordChannelId) {
      lines.push(`Request: https://discord.com/channels/${first.discordGuildId}/${first.discordChannelId}`);
    }
  });
  if (requestGroups.length > 8) lines.push(`\nPlus ${requestGroups.length - 8} more matching request${requestGroups.length - 8 === 1 ? "" : "s"}.`);
  return lines.join("\n").slice(0, 1_950);
}

function dmFailureStatus(error) {
  return Number(error?.code) === 50007 ? "blocked" : "failed";
}

async function flushEggMatchDigest(recipientId) {
  const digest = eggAlertDigests.get(recipientId);
  if (!digest) return "missing";
  eggAlertDigests.delete(recipientId);
  const matches = [...digest.matches.values()];
  if (!matches.length) return "empty";
  try {
    const recipient = await client.users.fetch(recipientId);
    await recipient.send({ content: eggMatchDigestMessage(matches), allowedMentions: { parse: [] } });
    await Promise.all(matches.map((match) => recordEggMatchNotification(match.notificationSourceKey, "sent")));
    return "sent";
  } catch (error) {
    const status = dmFailureStatus(error);
    const reason = error instanceof Error ? error.message : "Discord could not deliver the direct message";
    await Promise.all(matches.map((match) => recordEggMatchNotification(match.notificationSourceKey, status, reason)));
    console.error(`Could not DM nesting-request digest to ${recipientId}: ${reason}`);
    return status;
  }
}

function queueEggMatchDigest(recipientId, matches) {
  let digest = eggAlertDigests.get(recipientId);
  if (!digest) {
    digest = { matches: new Map(), timer: null };
    digest.timer = setTimeout(() => {
      void flushEggMatchDigest(recipientId);
    }, EGG_ALERT_DIGEST_WINDOW_MS);
    digest.timer.unref?.();
    eggAlertDigests.set(recipientId, digest);
  }
  matches.forEach((match) => digest.matches.set(match.notificationSourceKey, match));
}

async function deliverEggMatchNotifications(submissionResult) {
  const notifications = Array.isArray(submissionResult?.eggMatchNotifications)
    ? submissionResult.eggMatchNotifications.filter((item) => item?.notificationSourceKey && item?.recipientDiscordUserId)
    : [];
  const result = {
    matchingDragons: notifications.length,
    matchingOwners: 0,
    queuedOwners: 0
  };
  const recipientGroups = new Map();
  for (const notification of notifications) {
    const key = clean(notification.recipientDiscordUserId, 40);
    if (!key) continue;
    const group = recipientGroups.get(key) || [];
    group.push(notification);
    recipientGroups.set(key, group);
  }
  result.matchingOwners = recipientGroups.size;
  for (const [recipientId, matches] of recipientGroups) {
    queueEggMatchDigest(recipientId, matches);
    result.queuedOwners += 1;
  }
  return result;
}

function eggMatchDeliveryMessage(delivery) {
  if (!delivery?.matchingDragons) return " No alert-eligible submitted dragons matched this request.";
  const matchLabel = `${delivery.matchingDragons} matching submitted dragon${delivery.matchingDragons === 1 ? "" : "s"}`;
  if (delivery.queuedOwners) {
    return ` Found ${matchLabel}. ${delivery.queuedOwners} owner${delivery.queuedOwners === 1 ? "" : "s"} will receive one condensed DM within ${Math.ceil(EGG_ALERT_DIGEST_WINDOW_MS / 60_000)} minute${EGG_ALERT_DIGEST_WINDOW_MS > 60_000 ? "s" : ""}.`;
  }
  return ` Found ${matchLabel}, but no eligible owner could be queued.`;
}

function eggRequestPayload(interaction) {
  return {
    requester: clean(interaction.options.getString("requester", true), 100),
    species: clean(interaction.options.getString("species", true), 80),
    skin: clean(interaction.options.getString("skin"), 100),
    recessiveSkin: clean(interaction.options.getString("recessive"), 100),
    sex: clean(interaction.options.getString("sex"), 20),
    goal: clean(interaction.options.getString("goal"), 120),
    notes: clean(interaction.options.getString("notes"), 1000)
  };
}

function upstatPayload(interaction) {
  return {
    species: clean(interaction.options.getString("species", true), 80),
    skin: clean(interaction.options.getString("skin", true), 100),
    aPlusCount: interaction.options.getInteger("aplus_count") ?? 0,
    status: clean(interaction.options.getString("status"), 40) || "In Progress",
    accountName: clean(interaction.options.getString("account"), 80),
    notes: clean(interaction.options.getString("notes"), 1000)
  };
}

function broodPouchPayload(interaction) {
  const name = clean(interaction.options.getString("name", true), 80);
  return {
    name,
    accountName: clean(interaction.options.getString("account"), 80) || name,
    playerName: clean(interaction.options.getString("player"), 80) || interaction.member?.displayName || interaction.user.username,
    species: clean(interaction.options.getString("species", true), 80),
    sex: clean(interaction.options.getString("sex"), 20) || "Unknown",
    skin: clean(interaction.options.getString("skin"), 100),
    recessiveSkin: clean(interaction.options.getString("recessive"), 100),
    brood: clean(interaction.options.getString("brood", true), 80),
    dueAt: clean(interaction.options.getString("due"), 80),
    oddsSummary: clean(interaction.options.getString("odds"), 180),
    notes: clean(interaction.options.getString("notes"), 1000)
  };
}

function currentNestPayload(interaction) {
  return {
    father: clean(interaction.options.getString("father", true), 100),
    mother: clean(interaction.options.getString("mother", true), 100),
    species: clean(interaction.options.getString("species", true), 80),
    breeder: clean(interaction.options.getString("breeder"), 100) || interaction.member?.displayName || interaction.user.username,
    requester: clean(interaction.options.getString("requester"), 100),
    expectedSkin: clean(interaction.options.getString("expected_skin"), 120),
    broodWatcherBrooding: Boolean(interaction.options.getBoolean("bw_brooding")),
    notes: clean(interaction.options.getString("notes"), 1000)
  };
}

function locationPayload(interaction) {
  return {
    label: clean(interaction.options.getString("label", true), 80),
    x: interaction.options.getNumber("x", true),
    y: interaction.options.getNumber("y", true),
    type: clean(interaction.options.getString("type"), 40) || "Location",
    notes: clean(interaction.options.getString("notes"), 500)
  };
}

function notePayload(interaction) {
  return {
    title: clean(interaction.options.getString("title", true), 120),
    notes: clean(interaction.options.getString("notes", true), 1000)
  };
}

function interactionDisplayName(interaction) {
  return clean(interaction.member?.displayName || interaction.user.globalName || interaction.user.username, 100);
}

function modalPayload(interaction, action) {
  if (action === "dragon") {
    const [playerName, accountName] = splitValues(fieldValue(interaction, "owner"), 2);
    const [sex, status] = splitValues(fieldValue(interaction, "profile"), 2);
    const [skin, recessiveSkin, bloodline, nestRole] = splitValues(fieldValue(interaction, "genetics"), 4);
    const name = clean(fieldValue(interaction, "name"), 80);
    return {
      name,
      playerName: clean(playerName, 80) || interactionDisplayName(interaction),
      accountName: clean(accountName, 80) || name,
      species: clean(fieldValue(interaction, "species"), 80),
      sex: clean(sex, 20) || "Unknown",
      status: clean(status, 40) || "Hatchie",
      skin: clean(skin, 100),
      recessiveSkin: clean(recessiveSkin, 100),
      bloodline: clean(bloodline, 10),
      nestRole: clean(nestRole, 30) || "Unknown",
      notes: ""
    };
  }
  if (action === "egg") {
    const [skin, recessiveSkin] = splitValues(fieldValue(interaction, "skins"), 2);
    const [sex, goal] = splitValues(fieldValue(interaction, "target"), 2);
    return {
      requester: clean(fieldValue(interaction, "requester"), 100),
      species: clean(fieldValue(interaction, "species"), 80),
      skin: clean(skin, 100),
      recessiveSkin: clean(recessiveSkin, 100),
      sex: clean(sex, 20),
      goal: clean(goal, 120),
      notes: clean(fieldValue(interaction, "notes"), 1000)
    };
  }
  if (action === "find") {
    const [sex, nestRole] = splitValues(fieldValue(interaction, "traits"), 2);
    const [playerName, accountName] = splitValues(fieldValue(interaction, "owner"), 2);
    return {
      species: clean(fieldValue(interaction, "species"), 80),
      skin: clean(fieldValue(interaction, "skin"), 100),
      recessiveSkin: clean(fieldValue(interaction, "recessive"), 100),
      sex: clean(sex, 20),
      nestRole: clean(nestRole, 30),
      playerName: clean(playerName, 80),
      accountName: clean(accountName, 80),
      limit: 10
    };
  }
  if (action === "upstat-submit") {
    const [accountName, notes] = splitValues(fieldValue(interaction, "details"), 2);
    return {
      species: clean(fieldValue(interaction, "species"), 80),
      skin: clean(fieldValue(interaction, "skin"), 100),
      aPlusCount: Math.max(0, Math.min(18, Number(fieldValue(interaction, "count")) || 0)),
      status: clean(fieldValue(interaction, "status"), 40) || "In Progress",
      accountName: clean(accountName, 80),
      notes: clean(notes, 1000)
    };
  }
  if (action === "upstat-check") {
    return {
      species: clean(fieldValue(interaction, "species"), 80),
      skin: clean(fieldValue(interaction, "skin"), 100)
    };
  }
  if (action === "brood") {
    const [playerName, accountName] = splitValues(fieldValue(interaction, "owner"), 2);
    const [sex, skin, recessiveSkin, dueAt, oddsSummary, notes] = splitValues(fieldValue(interaction, "details"), 6);
    const name = clean(fieldValue(interaction, "name"), 80);
    return {
      name,
      playerName: clean(playerName, 80) || interactionDisplayName(interaction),
      accountName: clean(accountName, 80) || name,
      species: clean(fieldValue(interaction, "species"), 80),
      brood: clean(fieldValue(interaction, "brood"), 80),
      sex: clean(sex, 20) || "Unknown",
      skin: clean(skin, 100),
      recessiveSkin: clean(recessiveSkin, 100),
      dueAt: clean(dueAt, 80),
      oddsSummary: clean(oddsSummary, 180),
      notes: clean(notes, 1000)
    };
  }
  if (action === "nest") {
    const [breeder, requester] = splitValues(fieldValue(interaction, "people"), 2);
    const [expectedSkin, broodWatcherBrooding, notes] = splitValues(fieldValue(interaction, "details"), 3);
    return {
      father: clean(fieldValue(interaction, "father"), 100),
      mother: clean(fieldValue(interaction, "mother"), 100),
      species: clean(fieldValue(interaction, "species"), 80),
      breeder: clean(breeder, 100) || interactionDisplayName(interaction),
      requester: clean(requester, 100),
      expectedSkin: clean(expectedSkin, 120),
      broodWatcherBrooding: ["yes", "true", "1", "y"].includes(clean(broodWatcherBrooding, 10).toLowerCase()),
      notes: clean(notes, 1000)
    };
  }
  if (action === "location") {
    const [x, y] = splitValues(fieldValue(interaction, "position"), 2).map(Number);
    if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || x > 100 || y < 0 || y > 100) {
      throw new Error("Map X and Y must both be percentages from 0 to 100.");
    }
    return {
      label: clean(fieldValue(interaction, "label"), 80),
      x,
      y,
      type: clean(fieldValue(interaction, "type"), 40) || "Location",
      notes: clean(fieldValue(interaction, "notes"), 500)
    };
  }
  throw new Error("That Dragon Tracker form is not supported.");
}

function modalCooldownRemaining(interaction, action) {
  const commandName = action === "egg" ? "dt-eggrequest"
    : action === "dragon" ? "dt-createdragon"
      : action === "upstat-submit" ? "dt-upstat"
        : action === "brood" ? "dt-broodpouch"
          : action === "nest" ? "dt-currentnest"
            : action === "location" ? "dt-location"
              : "";
  return commandName ? commandCooldownRemaining({
    commandName,
    guildId: interaction.guildId,
    user: interaction.user
  }) : 0;
}

async function handleDashboardButton(interaction) {
  if (!interaction.isButton()) return false;
  const action = dashboardAction(interaction.customId, "button");
  if (!action) return false;
  if (!isConfiguredGuild(interaction)) {
    await interaction.reply({ content: "This Dragon Tracker bot is configured for a different clan server.", flags: MessageFlags.Ephemeral });
    return true;
  }
  if (action === "dashboard") {
    await interaction.update(dashboardMessage());
    return true;
  }
  if (action === "upstat-menu") {
    await interaction.update(upstatMenuMessage());
    return true;
  }
  if (action === "alerts-menu") {
    await interaction.update(alertMenuMessage());
    return true;
  }
  if (action === "help") {
    await interaction.reply({
      content: [
        "**Dragon Tracker help**",
        "Add Dragon is limited to members with the Breeder role.",
        "Request Egg posts the request and privately alerts opted-in owners whose submitted dragons match.",
        "Find Dragon searches the shared clan library without importing another member's dragons into your local collection.",
        "Use `|` only where a form label shows multiple values."
      ].join("\n"),
      flags: MessageFlags.Ephemeral
    });
    return true;
  }
  if (action.startsWith("alerts-")) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const setting = action === "alerts-enable" ? "Enabled" : action === "alerts-disable" ? "Disabled" : "Status";
    const result = await updateEggMatchAlerts(interaction, setting);
    await interaction.editReply(setting === "Status"
      ? `Nesting match alerts are ${result?.enabled ? "enabled" : "disabled"}.`
      : `Nesting match alerts are now ${result?.enabled ? "enabled" : "disabled"}.`);
    return true;
  }
  const form = modalForAction(action, interactionDisplayName(interaction));
  if (!form) return false;
  await interaction.showModal(form);
  return true;
}

async function handleDashboardModal(interaction) {
  if (!interaction.isModalSubmit()) return false;
  const action = dashboardAction(interaction.customId, "modal");
  if (!action) return false;
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  try {
    if (!isConfiguredGuild(interaction)) throw new Error("This Dragon Tracker bot is configured for a different clan server.");
    const cooldownRemaining = modalCooldownRemaining(interaction, action);
    if (cooldownRemaining) {
      await interaction.editReply(`Please wait ${Math.ceil(cooldownRemaining / 1000)} seconds before submitting that again.`);
      return true;
    }
    const payload = modalPayload(interaction, action);
    if (action === "dragon") {
      if (!hasBreederAccess(interaction.member, interaction.memberPermissions)) {
        await interaction.editReply("Only members with the Discord `Breeder` role can submit dragons.");
        return true;
      }
      await submitToTracker(interaction, "dragon", payload);
      await announceDragonSubmission(interaction.channel, payload, interactionDisplayName(interaction));
      await interaction.editReply(`Sent ${payload.name} to the Dragon Tracker Discord Inbox.`);
    }
    if (action === "egg") {
      const submissionResult = await submitToTracker(interaction, "egg_request", payload);
      await announceEggRequest(interaction.channel, payload, interactionDisplayName(interaction));
      const delivery = await deliverEggMatchNotifications(submissionResult);
      await interaction.editReply(`Posted ${payload.requester}'s egg request.${eggMatchDeliveryMessage(delivery)}`);
    }
    if (action === "find") {
      const result = await trackerRequest({
        action: "dragon_search",
        clan_id: requiredEnv("DRAGON_TRACKER_CLAN_ID"),
        discord_guild_id: interaction.guildId || "",
        ...payload
      });
      await interaction.editReply(dragonSearchMessage(result));
    }
    if (action === "upstat-submit") {
      await submitToTracker(interaction, "upstat", payload);
      await interaction.editReply(`Sent ${payload.species} ${payload.skin} upstat progress to the tracker.`);
    }
    if (action === "upstat-check") {
      const result = await trackerRequest({
        action: "upstat_lookup",
        clan_id: requiredEnv("DRAGON_TRACKER_CLAN_ID"),
        discord_guild_id: interaction.guildId || "",
        ...payload
      });
      await interaction.editReply(upstatProgressMessage(result));
    }
    if (action === "brood") {
      await submitToTracker(interaction, "brood_pouch", payload);
      await announceTrackerUpdate(interaction.channel, "Brood Pouch", [
        `**${payload.name}**`,
        [payload.species, payload.sex].filter(Boolean).join(" | "),
        `Brood: ${payload.brood}`,
        payload.skin ? `Skin: ${payload.skin}` : "",
        `Submitted by: ${interactionDisplayName(interaction)}`
      ]);
      await interaction.editReply(`Sent ${payload.name} on ${payload.brood} to the tracker.`);
    }
    if (action === "nest") {
      await submitToTracker(interaction, "current_nest", payload);
      await announceTrackerUpdate(interaction.channel, "Current Nest", [
        `**${payload.father} x ${payload.mother}**`,
        payload.species,
        payload.expectedSkin ? `Target skin: ${payload.expectedSkin}` : "",
        `Breeder: ${payload.breeder}`
      ]);
      await interaction.editReply(`Sent ${payload.father} x ${payload.mother} to the tracker.`);
    }
    if (action === "location") {
      await submitToTracker(interaction, "map_pin", payload);
      await interaction.editReply(`Sent ${payload.label} to the tracker.`);
    }
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : "The tracker could not receive that submission.";
    console.error(`Dashboard form ${action} failed: ${message}`);
    await interaction.editReply(`Could not send to Dragon Tracker: ${message}`);
    return true;
  }
}

async function handleCommand(interaction) {
  if (!interaction.isChatInputCommand()) return;
  console.log(`Received /${interaction.commandName} from ${interaction.user.id} in ${interaction.guildId || "direct messages"}.`);
  try {
    if (!isConfiguredGuild(interaction)) {
      await interaction.reply({ content: "This Dragon Tracker bot is configured for a different clan server.", flags: MessageFlags.Ephemeral });
      return;
    }
    // Acknowledge every slash command immediately so Discord cannot expire it.
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const cooldownRemaining = commandCooldownRemaining(interaction);
    if (cooldownRemaining) {
      await interaction.editReply(`Please wait ${Math.ceil(cooldownRemaining / 1000)} second${cooldownRemaining > 1_000 ? "s" : ""} before submitting that again.`);
      return;
    }

    if (interaction.commandName === "dt") {
      await interaction.editReply(dashboardMessage());
      return;
    }

    if (interaction.commandName === "dt-help") {
      await interaction.editReply([
        "Dragon Tracker bot commands:",
        "`/dt-dragon` sends a dragon record to the clan inbox.",
        "`/dt-createdragon` is the same dragon helper with a clearer breeder name.",
        "`/dt-eggrequest` posts an egg request for breeders and saves it to the tracker inbox.",
        "`/dt-alerts` controls opt-in private egg-request match alerts for your submitted dragons.",
        "`/dt-upstat` sends upstat progress.",
        "`/dt-upstat-progress` checks submitted progress for a species and skin.",
        "`/dt-finddragon` searches clan-shared and bot-submitted dragons by skin, recessive, sex, role, player, or account.",
        "`/dt-broodpouch` sends an egg in a brood pouch or brood vault.",
        "`/dt-currentnest` sends a current nest note.",
        "`/dt-location` sends a map pin to the clan inbox.",
        "`/dt-note` sends a note for review.",
        "Open Dragon Tracker > Clans > Discord Inbox to import or ignore submissions."
      ].join("\n"));
      return;
    }

    if (interaction.commandName === "dt-dragon" || interaction.commandName === "dt-createdragon") {
      if (!hasBreederAccess(interaction.member, interaction.memberPermissions)) {
        await interaction.editReply("Only members with the Discord `Breeder` role can submit dragons. Ask a server administrator to assign it.");
        return;
      }
      const payload = dragonPayload(interaction);
      await submitToTracker(interaction, "dragon", payload);
      await announceDragonSubmission(interaction.channel, payload, interaction.member?.displayName || interaction.user.username);
      await interaction.editReply(`Sent ${payload.name} to the Dragon Tracker Discord Inbox.`);
      return;
    }
    if (interaction.commandName === "dt-alerts") {
      const setting = clean(interaction.options.getString("setting", true), 20);
      const result = await updateEggMatchAlerts(interaction, setting);
      if (setting.toLowerCase() === "status") {
        await interaction.editReply(result?.enabled
          ? "Egg-request match alerts are enabled for your dragons submitted through this bot."
          : "Egg-request match alerts are off. Use `/dt-alerts` with `Enabled` to opt in.");
      } else {
        await interaction.editReply(result?.enabled
          ? "Egg-request match alerts are now enabled. You will receive a private DM only when one of your bot-submitted dragons matches a future request."
          : "Egg-request match alerts are now disabled. No new match DMs will be sent to you.");
      }
      return;
    }
    if (interaction.commandName === "dt-eggrequest") {
      const payload = eggRequestPayload(interaction);
      const submissionResult = await submitToTracker(interaction, "egg_request", payload);
      await announceEggRequest(interaction.channel, payload, interaction.member?.displayName || interaction.user.username);
      const delivery = await deliverEggMatchNotifications(submissionResult);
      await interaction.editReply(`Posted ${payload.requester}'s egg request for breeders and saved it to the Dragon Tracker Discord Inbox.${eggMatchDeliveryMessage(delivery)}`);
      return;
    }
    if (interaction.commandName === "dt-upstat") {
      const payload = upstatPayload(interaction);
      await submitToTracker(interaction, "upstat", payload);
      await interaction.editReply(`Sent ${payload.species} ${payload.skin} upstat progress to the Dragon Tracker Discord Inbox.`);
      return;
    }
    if (interaction.commandName === "dt-upstat-progress") {
      const result = await lookupUpstatProgress(interaction);
      await interaction.editReply(upstatProgressMessage(result));
      return;
    }
    if (interaction.commandName === "dt-finddragon") {
      const result = await findClanDragons(interaction);
      await interaction.editReply(dragonSearchMessage(result));
      return;
    }
    if (interaction.commandName === "dt-broodpouch") {
      const payload = broodPouchPayload(interaction);
      await submitToTracker(interaction, "brood_pouch", payload);
      await announceTrackerUpdate(interaction.channel, "Brood Pouch", [
        `**${payload.name}**`,
        [payload.species, payload.sex].filter(Boolean).join(" | "),
        `Brood: ${payload.brood}`,
        payload.skin ? `Skin: ${payload.skin}` : "",
        payload.recessiveSkin ? `Recessive: ${payload.recessiveSkin}` : "",
        payload.dueAt ? `Due: ${payload.dueAt}` : "",
        `Submitted by: ${interaction.member?.displayName || interaction.user.username}`
      ]);
      await interaction.editReply(`Sent ${payload.name} on ${payload.brood} to the Dragon Tracker Discord Inbox.`);
      return;
    }
    if (interaction.commandName === "dt-currentnest") {
      const payload = currentNestPayload(interaction);
      await submitToTracker(interaction, "current_nest", payload);
      await announceTrackerUpdate(interaction.channel, "Current Nest", [
        `**${payload.father} x ${payload.mother}**`,
        payload.species,
        payload.expectedSkin ? `Target skin: ${payload.expectedSkin}` : "",
        payload.requester ? `Requester: ${payload.requester}` : "",
        payload.broodWatcherBrooding ? "Brood Watcher brooding marked" : "",
        `Breeder: ${payload.breeder}`
      ]);
      await interaction.editReply(`Sent current nest ${payload.father} x ${payload.mother} to the Dragon Tracker Discord Inbox.`);
      return;
    }
    if (interaction.commandName === "dt-location") {
      const payload = locationPayload(interaction);
      await submitToTracker(interaction, "map_pin", payload);
      await interaction.editReply(`Sent ${payload.label} to the Dragon Tracker Discord Inbox.`);
      return;
    }
    if (interaction.commandName === "dt-note") {
      const payload = notePayload(interaction);
      await submitToTracker(interaction, "note", payload);
      await interaction.editReply(`Sent ${payload.title} to the Dragon Tracker Discord Inbox.`);
      return;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "The tracker could not receive that submission.";
    console.error(`Command ${interaction.commandName} failed: ${message}`);
    if (interaction.deferred || interaction.replied) {
      try {
        await interaction.editReply(`Could not send to Dragon Tracker: ${message}`);
      } catch (replyError) {
        console.error(`Could not report ${interaction.commandName} failure: ${replyError instanceof Error ? replyError.message : "unknown error"}`);
      }
    }
  }
}

function parsePrefixArgs(content) {
  const [, command = "", rest = ""] = content.match(/^!(\S+)\s*(.*)$/) || [];
  const args = {};
  const pattern = /(\w+)=("([^"]*)"|'([^']*)'|[^\s]+)/g;
  let match;
  while ((match = pattern.exec(rest))) {
    args[match[1].toLowerCase()] = clean(match[3] ?? match[4] ?? match[2], 1000);
  }
  return { command: command.toLowerCase(), args };
}

function prefixValue(args, ...keys) {
  for (const key of keys) {
    const value = args[key.toLowerCase()];
    if (value) return value;
  }
  return "";
}

async function submitPrefixMessage(message, type, payload) {
  const interactionLike = {
    id: message.id,
    guildId: message.guildId || "",
    channelId: message.channelId || "",
    user: message.author,
    member: message.member
  };
  const result = await submitToTracker(interactionLike, type, payload);
  await message.reply(`Sent to the Dragon Tracker Discord Inbox.`);
  return result;
}

async function handlePrefixMessage(message) {
  if (message.author.bot || optionalEnv("ENABLE_PREFIX_COMMANDS", "false").toLowerCase() !== "true") return;
  if (!message.content.startsWith("!")) return;
  const { command, args } = parsePrefixArgs(message.content);
  try {
    if (command === "createdragon") {
      if (!hasBreederAccess(message.member, message.member?.permissions)) {
        await message.reply("Only members with the Discord `Breeder` role can submit dragons. Ask a server administrator to assign it.");
        return;
      }
      const payload = {
        name: prefixValue(args, "name", "dragon", "account"),
        accountName: prefixValue(args, "account", "name", "dragon"),
        playerName: prefixValue(args, "player", "user") || message.member?.displayName || message.author.username,
        species: prefixValue(args, "species", "sp"),
        sex: prefixValue(args, "sex"),
        status: prefixValue(args, "status") || "Hatchie",
        skin: prefixValue(args, "skin"),
        recessiveSkin: prefixValue(args, "recessive", "res"),
        bloodline: prefixValue(args, "bloodline", "bl"),
        nestRole: prefixValue(args, "nest_role", "nestrole", "role") || "Unknown",
        notes: prefixValue(args, "notes", "note")
      };
      await submitPrefixMessage(message, "dragon", payload);
      await announceDragonSubmission(message.channel, payload, message.member?.displayName || message.author.username);
    }
    if (command === "eggrequest") {
      const payload = {
        requester: prefixValue(args, "requester", "player") || message.member?.displayName || message.author.username,
        species: prefixValue(args, "species", "sp"),
        skin: prefixValue(args, "skin"),
        recessiveSkin: prefixValue(args, "recessive", "res"),
        sex: prefixValue(args, "sex"),
        goal: prefixValue(args, "goal"),
        notes: prefixValue(args, "notes", "note")
      };
      const submissionResult = await submitPrefixMessage(message, "egg_request", payload);
      await announceEggRequest(message.channel, payload, message.member?.displayName || message.author.username);
      await deliverEggMatchNotifications(submissionResult);
    }
    if (command === "upstat") {
      await submitPrefixMessage(message, "upstat", {
        species: prefixValue(args, "species", "sp"),
        skin: prefixValue(args, "skin"),
        aPlusCount: Number(prefixValue(args, "aplus", "aplus_count", "count")) || 0,
        status: prefixValue(args, "status") || "In Progress",
        accountName: prefixValue(args, "account"),
        notes: prefixValue(args, "notes", "note")
      });
    }
    if (command === "broodpouch" || command === "broodvault") {
      await submitPrefixMessage(message, "brood_pouch", {
        name: prefixValue(args, "name", "egg", "account"),
        accountName: prefixValue(args, "account", "name", "egg"),
        playerName: prefixValue(args, "player", "user") || message.member?.displayName || message.author.username,
        species: prefixValue(args, "species", "sp"),
        sex: prefixValue(args, "sex") || "Unknown",
        skin: prefixValue(args, "skin"),
        recessiveSkin: prefixValue(args, "recessive", "res"),
        brood: prefixValue(args, "brood"),
        dueAt: prefixValue(args, "due", "reminder"),
        oddsSummary: prefixValue(args, "odds"),
        notes: prefixValue(args, "notes", "note")
      });
    }
    if (command === "currentnest") {
      await submitPrefixMessage(message, "current_nest", {
        father: prefixValue(args, "father", "dad"),
        mother: prefixValue(args, "mother", "mom"),
        species: prefixValue(args, "species", "sp"),
        breeder: prefixValue(args, "breeder") || message.member?.displayName || message.author.username,
        requester: prefixValue(args, "requester"),
        expectedSkin: prefixValue(args, "expected", "skin"),
        broodWatcherBrooding: ["true", "yes", "1"].includes(prefixValue(args, "bw", "bw_brooding").toLowerCase()),
        notes: prefixValue(args, "notes", "note")
      });
    }
  } catch (error) {
    await message.reply(`Could not send to Dragon Tracker: ${error instanceof Error ? error.message : "unknown error"}`);
  }
}

const intents = [GatewayIntentBits.Guilds];
if (optionalEnv("ENABLE_PREFIX_COMMANDS", "false").toLowerCase() === "true") {
  intents.push(GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent);
}
const client = new Client({ intents });
client.once("clientReady", () => {
  console.log(`Dragon Tracker bot online as ${client.user?.tag || "unknown"}.`);
  if (optionalEnv("DRAGON_TRACKER_CLAN_ID")) console.log("Default Dragon Tracker clan configured.");
});
client.on("interactionCreate", (interaction) => {
  void (async () => {
    if (await handleDashboardButton(interaction)) return;
    if (await handleDashboardModal(interaction)) return;
    await handleCommand(interaction);
  })().catch(async (error) => {
    console.error(`Unhandled Discord interaction error: ${error instanceof Error ? error.message : "unknown error"}`);
    const message = "Dragon Tracker could not complete that action. Please try once more.";
    try {
      if (interaction.deferred || interaction.replied) await interaction.editReply(message);
      else if (interaction.isRepliable()) await interaction.reply({ content: message, flags: MessageFlags.Ephemeral });
    } catch (_) {
      // The interaction may have expired while Discord or the tracker was unavailable.
    }
  });
});
client.on("error", (error) => {
  console.error(`Discord client error: ${error instanceof Error ? error.message : "unknown error"}`);
});
client.on("messageCreate", (message) => {
  void handlePrefixMessage(message);
});

async function flushQueuedAlertsBeforeExit() {
  const recipientIds = [...eggAlertDigests.keys()];
  await Promise.all(recipientIds.map((recipientId) => flushEggMatchDigest(recipientId)));
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, () => {
    void flushQueuedAlertsBeforeExit().finally(() => process.exit(0));
  });
}

await client.login(requiredEnv("DISCORD_BOT_TOKEN"));
