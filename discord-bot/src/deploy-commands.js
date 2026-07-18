import "dotenv/config";
import { REST, Routes } from "discord.js";
import { commandJson } from "./commands.js";

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

const token = requiredEnv("DISCORD_BOT_TOKEN");
const clientId = requiredEnv("DISCORD_CLIENT_ID");
const guildId = requiredEnv("DISCORD_GUILD_ID");
const rest = new REST({ version: "10" }).setToken(token);

await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commandJson() });
console.log("Dragon Tracker Discord commands deployed.");
