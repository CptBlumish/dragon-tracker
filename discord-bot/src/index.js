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
      body: JSON.stringify({
        clan_id: requiredEnv("DRAGON_TRACKER_CLAN_ID"),
        source_key: interaction.id,
        discord_guild_id: interaction.guildId || "",
        discord_channel_id: interaction.channelId || "",
        discord_user_id: interaction.user.id,
        discord_username: interaction.member?.displayName || interaction.user.globalName || interaction.user.username,
        type,
        payload
      })
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
  if (interaction.commandName === "dt-help") {
    await interaction.reply({
      ephemeral: true,
      content: [
        "Dragon Tracker bot commands:",
        "`/dt-dragon` sends a dragon record to the clan inbox.",
        "`/dt-location` sends a map pin to the clan inbox.",
        "`/dt-note` sends a note for review.",
        "Open Dragon Tracker > Clans > Discord Inbox to import or ignore submissions."
      ].join("\n")
    });
    return;
  }

  await interaction.deferReply({ ephemeral: true });
  try {
    if (interaction.commandName === "dt-dragon") {
      const payload = dragonPayload(interaction);
      await submitToTracker(interaction, "dragon", payload);
      await interaction.editReply(`Sent ${payload.name} to the Dragon Tracker Discord Inbox.`);
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
    await interaction.editReply(`Could not send to Dragon Tracker: ${message}`);
  }
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.once("ready", () => {
  console.log(`Dragon Tracker bot online as ${client.user?.tag || "unknown"}.`);
  if (optionalEnv("DRAGON_TRACKER_CLAN_ID")) console.log("Default Dragon Tracker clan configured.");
});
client.on("interactionCreate", (interaction) => {
  void handleCommand(interaction);
});

await client.login(requiredEnv("DISCORD_BOT_TOKEN"));
