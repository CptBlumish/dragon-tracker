import "dotenv/config";
import { Client, GatewayIntentBits } from "discord.js";

const REQUEST_TIMEOUT_MS = 10_000;

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
      throw new Error(message || `Tracker ingest failed (${response.status})`);
    }
    return body;
  } finally {
    clearTimeout(timeout);
  }
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
    notes: clean(interaction.options.getString("notes"), 600)
  };
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

async function handleCommand(interaction) {
  if (!interaction.isChatInputCommand()) return;
  try {
    // Acknowledge every slash command immediately so Discord cannot expire it.
    await interaction.deferReply({ ephemeral: true });

    if (interaction.commandName === "dt-help") {
      await interaction.editReply([
        "Dragon Tracker bot commands:",
        "`/dt-dragon` sends a dragon record to the clan inbox.",
        "`/dt-createdragon` is the same dragon helper with a clearer breeder name.",
        "`/dt-eggrequest` sends an egg request.",
        "`/dt-upstat` sends upstat progress.",
        "`/dt-upstat-progress` checks submitted progress for a species and skin.",
        "`/dt-broodpouch` sends an egg in a brood pouch or brood vault.",
        "`/dt-currentnest` sends a current nest note.",
        "`/dt-location` sends a map pin to the clan inbox.",
        "`/dt-note` sends a note for review.",
        "Open Dragon Tracker > Clans > Discord Inbox to import or ignore submissions."
      ].join("\n"));
      return;
    }

    if (interaction.commandName === "dt-dragon" || interaction.commandName === "dt-createdragon") {
      const payload = dragonPayload(interaction);
      await submitToTracker(interaction, "dragon", payload);
      await interaction.editReply(`Sent ${payload.name} to the Dragon Tracker Discord Inbox.`);
      return;
    }
    if (interaction.commandName === "dt-eggrequest") {
      const payload = eggRequestPayload(interaction);
      await submitToTracker(interaction, "egg_request", payload);
      await interaction.editReply(`Sent ${payload.requester}'s egg request to the Dragon Tracker Discord Inbox.`);
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
    if (interaction.commandName === "dt-broodpouch") {
      const payload = broodPouchPayload(interaction);
      await submitToTracker(interaction, "brood_pouch", payload);
      await interaction.editReply(`Sent ${payload.name} on ${payload.brood} to the Dragon Tracker Discord Inbox.`);
      return;
    }
    if (interaction.commandName === "dt-currentnest") {
      const payload = currentNestPayload(interaction);
      await submitToTracker(interaction, "current_nest", payload);
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
  await submitToTracker(interactionLike, type, payload);
  await message.reply(`Sent to the Dragon Tracker Discord Inbox.`);
}

async function handlePrefixMessage(message) {
  if (message.author.bot || optionalEnv("ENABLE_PREFIX_COMMANDS", "false").toLowerCase() !== "true") return;
  if (!message.content.startsWith("!")) return;
  const { command, args } = parsePrefixArgs(message.content);
  try {
    if (command === "createdragon") {
      await submitPrefixMessage(message, "dragon", {
        name: prefixValue(args, "name", "dragon", "account"),
        accountName: prefixValue(args, "account", "name", "dragon"),
        playerName: prefixValue(args, "player", "user") || message.member?.displayName || message.author.username,
        species: prefixValue(args, "species", "sp"),
        sex: prefixValue(args, "sex"),
        status: prefixValue(args, "status") || "Hatchie",
        skin: prefixValue(args, "skin"),
        recessiveSkin: prefixValue(args, "recessive", "res"),
        bloodline: prefixValue(args, "bloodline", "bl"),
        notes: prefixValue(args, "notes", "note")
      });
    }
    if (command === "eggrequest") {
      await submitPrefixMessage(message, "egg_request", {
        requester: prefixValue(args, "requester", "player") || message.member?.displayName || message.author.username,
        species: prefixValue(args, "species", "sp"),
        skin: prefixValue(args, "skin"),
        recessiveSkin: prefixValue(args, "recessive", "res"),
        sex: prefixValue(args, "sex"),
        goal: prefixValue(args, "goal"),
        notes: prefixValue(args, "notes", "note")
      });
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
  void handleCommand(interaction).catch((error) => {
    console.error(`Unhandled Discord interaction error: ${error instanceof Error ? error.message : "unknown error"}`);
  });
});
client.on("messageCreate", (message) => {
  void handlePrefixMessage(message);
});

await client.login(requiredEnv("DISCORD_BOT_TOKEN"));
