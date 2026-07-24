import { SlashCommandBuilder } from "discord.js";

export const SPECIES_CHOICES = [
  "Flame Stalker",
  "Shadow Scale",
  "Acid Spitter",
  "Inferno Ravager",
  "Bio",
  "Blitz Striker",
  "Brood Watcher"
];

export const SEX_CHOICES = ["Female", "Male", "Unknown"];
export const STATUS_CHOICES = ["Hatchie", "Juvi", "Grown", "4th Pointed", "Elder"];
export const BLOODLINE_CHOICES = ["F", "E", "D", "C", "B", "A"];
export const NEST_ROLE_CHOICES = ["Unknown", "Breeder", "Pure", "Ultra Pure"];
export const UPSTAT_STATUS_CHOICES = ["Not Started", "In Progress", "Partial A+", "Near 18A+", "18A+ Complete"];
export const EGG_MATCH_ALERT_CHOICES = ["Enabled", "Disabled", "Status"];

function addChoices(option, values) {
  return option.addChoices(...values.map((value) => ({ name: value, value })));
}

function dragonCommand(name, description) {
  return new SlashCommandBuilder()
    .setName(name)
    .setDescription(description)
    .addStringOption((option) => option.setName("name").setDescription("Dragon or account name").setRequired(true).setMaxLength(80))
    .addStringOption((option) => addChoices(option.setName("species").setDescription("Dragon species").setRequired(true), SPECIES_CHOICES))
    .addStringOption((option) => addChoices(option.setName("sex").setDescription("Dragon sex").setRequired(true), SEX_CHOICES))
    .addStringOption((option) => addChoices(option.setName("status").setDescription("Current status").setRequired(true), STATUS_CHOICES))
    .addStringOption((option) => option.setName("skin").setDescription("Visible skin").setRequired(false).setMaxLength(100))
    .addStringOption((option) => option.setName("recessive").setDescription("Recessive skin").setRequired(false).setMaxLength(100))
    .addStringOption((option) => option.setName("player").setDescription("Player name").setRequired(false).setMaxLength(80))
    .addStringOption((option) => option.setName("account").setDescription("Account name if different from dragon name").setRequired(false).setMaxLength(80))
    .addStringOption((option) => addChoices(option.setName("bloodline").setDescription("Bloodline quality").setRequired(false), BLOODLINE_CHOICES))
    .addStringOption((option) => addChoices(option.setName("nest_role").setDescription("Tracker nest role, not a Discord server role").setRequired(false), NEST_ROLE_CHOICES))
    .addStringOption((option) => option.setName("notes").setDescription("Short notes").setRequired(false).setMaxLength(600));
}

export const commands = [
  dragonCommand("dt-dragon", "Submit a dragon to the Dragon Tracker clan inbox."),
  dragonCommand("dt-createdragon", "Submit a dragon to the Dragon Tracker clan inbox."),

  new SlashCommandBuilder()
    .setName("dt-location")
    .setDescription("Submit a map pin to the Dragon Tracker clan inbox.")
    .addStringOption((option) => option.setName("label").setDescription("Location name").setRequired(true).setMaxLength(80))
    .addNumberOption((option) => option.setName("x").setDescription("Map X percentage, 0 to 100").setRequired(true).setMinValue(0).setMaxValue(100))
    .addNumberOption((option) => option.setName("y").setDescription("Map Y percentage, 0 to 100").setRequired(true).setMinValue(0).setMaxValue(100))
    .addStringOption((option) => option.setName("type").setDescription("Pin type").setRequired(false).addChoices(
      { name: "Dragon", value: "Dragon" },
      { name: "Food", value: "Food" },
      { name: "Crystal", value: "Crystal" },
      { name: "Nest", value: "Nest" },
      { name: "Location", value: "Location" }
    ))
    .addStringOption((option) => option.setName("notes").setDescription("Short notes").setRequired(false).setMaxLength(500)),

  new SlashCommandBuilder()
    .setName("dt-note")
    .setDescription("Submit a general tracker note for clan review.")
    .addStringOption((option) => option.setName("title").setDescription("Note title").setRequired(true).setMaxLength(120))
    .addStringOption((option) => option.setName("notes").setDescription("Note text").setRequired(true).setMaxLength(1000)),

  new SlashCommandBuilder()
    .setName("dt-eggrequest")
    .setDescription("Submit an egg request for breeder review.")
    .addStringOption((option) => option.setName("requester").setDescription("Who wants the egg").setRequired(true).setMaxLength(100))
    .addStringOption((option) => addChoices(option.setName("species").setDescription("Wanted species").setRequired(true), SPECIES_CHOICES))
    .addStringOption((option) => option.setName("skin").setDescription("Wanted visible skin").setRequired(false).setMaxLength(100))
    .addStringOption((option) => option.setName("recessive").setDescription("Wanted recessive skin").setRequired(false).setMaxLength(100))
    .addStringOption((option) => addChoices(option.setName("sex").setDescription("Wanted sex").setRequired(false), SEX_CHOICES))
    .addStringOption((option) => option.setName("goal").setDescription("Pure, ultra, upstat, mutation, etc.").setRequired(false).setMaxLength(120))
    .addStringOption((option) => option.setName("notes").setDescription("Request notes").setRequired(false).setMaxLength(1000)),

  new SlashCommandBuilder()
    .setName("dt-alerts")
    .setDescription("Control private egg-request match alerts for your submitted dragons.")
    .addStringOption((option) => addChoices(option.setName("setting").setDescription("Alert preference").setRequired(true), EGG_MATCH_ALERT_CHOICES)),

  new SlashCommandBuilder()
    .setName("dt-upstat")
    .setDescription("Submit upstat progress for tracker review.")
    .addStringOption((option) => addChoices(option.setName("species").setDescription("Dragon species").setRequired(true), SPECIES_CHOICES))
    .addStringOption((option) => option.setName("skin").setDescription("Skin being upstatted").setRequired(true).setMaxLength(100))
    .addIntegerOption((option) => option.setName("aplus_count").setDescription("How many A+ stats right now").setRequired(false).setMinValue(0).setMaxValue(18))
    .addStringOption((option) => addChoices(option.setName("status").setDescription("Current process").setRequired(false), UPSTAT_STATUS_CHOICES))
    .addStringOption((option) => option.setName("account").setDescription("Account holding it").setRequired(false).setMaxLength(80))
    .addStringOption((option) => option.setName("notes").setDescription("Progress notes").setRequired(false).setMaxLength(1000)),

  new SlashCommandBuilder()
    .setName("dt-upstat-progress")
    .setDescription("Check submitted upstat progress for a skin.")
    .addStringOption((option) => addChoices(option.setName("species").setDescription("Dragon species").setRequired(true), SPECIES_CHOICES))
    .addStringOption((option) => option.setName("skin").setDescription("Visible skin being upstatted").setRequired(true).setMaxLength(100)),

  new SlashCommandBuilder()
    .setName("dt-broodpouch")
    .setDescription("Submit an egg in a brood pouch or brood vault.")
    .addStringOption((option) => option.setName("name").setDescription("Egg or account name").setRequired(true).setMaxLength(80))
    .addStringOption((option) => addChoices(option.setName("species").setDescription("Dragon species").setRequired(true), SPECIES_CHOICES))
    .addStringOption((option) => option.setName("brood").setDescription("Current brood").setRequired(true).setMaxLength(80))
    .addStringOption((option) => addChoices(option.setName("sex").setDescription("Known sex").setRequired(false), SEX_CHOICES))
    .addStringOption((option) => option.setName("skin").setDescription("Visible skin or odds note").setRequired(false).setMaxLength(100))
    .addStringOption((option) => option.setName("recessive").setDescription("Recessive skin").setRequired(false).setMaxLength(100))
    .addStringOption((option) => option.setName("player").setDescription("Player taking the egg").setRequired(false).setMaxLength(80))
    .addStringOption((option) => option.setName("account").setDescription("Account taking the egg").setRequired(false).setMaxLength(80))
    .addStringOption((option) => option.setName("due").setDescription("Reminder time, if known").setRequired(false).setMaxLength(80))
    .addStringOption((option) => option.setName("odds").setDescription("Skin/stat odds note").setRequired(false).setMaxLength(180))
    .addStringOption((option) => option.setName("notes").setDescription("Brood notes").setRequired(false).setMaxLength(1000)),

  new SlashCommandBuilder()
    .setName("dt-currentnest")
    .setDescription("Submit a current nest for breeder review.")
    .addStringOption((option) => option.setName("father").setDescription("Father name").setRequired(true).setMaxLength(100))
    .addStringOption((option) => option.setName("mother").setDescription("Mother name").setRequired(true).setMaxLength(100))
    .addStringOption((option) => addChoices(option.setName("species").setDescription("Nest species").setRequired(true), SPECIES_CHOICES))
    .addStringOption((option) => option.setName("breeder").setDescription("Breeder handling it").setRequired(false).setMaxLength(100))
    .addStringOption((option) => option.setName("requester").setDescription("Requester").setRequired(false).setMaxLength(100))
    .addStringOption((option) => option.setName("expected_skin").setDescription("Expected or target skin").setRequired(false).setMaxLength(120))
    .addBooleanOption((option) => option.setName("bw_brooding").setDescription("Brood Watcher brooding marked"))
    .addStringOption((option) => option.setName("notes").setDescription("Nest notes").setRequired(false).setMaxLength(1000)),

  new SlashCommandBuilder()
    .setName("dt-help")
    .setDescription("Show Dragon Tracker bot help.")
];

export function commandJson() {
  return commands.map((command) => command.toJSON());
}
