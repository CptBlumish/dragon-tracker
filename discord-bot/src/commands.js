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

function addChoices(option, values) {
  return option.addChoices(...values.map((value) => ({ name: value, value })));
}

export const commands = [
  new SlashCommandBuilder()
    .setName("dt-dragon")
    .setDescription("Submit a dragon to the Dragon Tracker clan inbox.")
    .addStringOption((option) => option.setName("name").setDescription("Dragon or account name").setRequired(true).setMaxLength(80))
    .addStringOption((option) => addChoices(option.setName("species").setDescription("Dragon species").setRequired(true), SPECIES_CHOICES))
    .addStringOption((option) => addChoices(option.setName("sex").setDescription("Dragon sex").setRequired(true), SEX_CHOICES))
    .addStringOption((option) => addChoices(option.setName("status").setDescription("Current status").setRequired(true), STATUS_CHOICES))
    .addStringOption((option) => option.setName("skin").setDescription("Visible skin").setRequired(false).setMaxLength(100))
    .addStringOption((option) => option.setName("recessive").setDescription("Recessive skin").setRequired(false).setMaxLength(100))
    .addStringOption((option) => option.setName("player").setDescription("Player name").setRequired(false).setMaxLength(80))
    .addStringOption((option) => option.setName("account").setDescription("Account name if different from dragon name").setRequired(false).setMaxLength(80))
    .addStringOption((option) => addChoices(option.setName("bloodline").setDescription("Bloodline quality").setRequired(false), BLOODLINE_CHOICES))
    .addStringOption((option) => option.setName("notes").setDescription("Short notes").setRequired(false).setMaxLength(600)),

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
    .setName("dt-help")
    .setDescription("Show Dragon Tracker bot help.")
];

export function commandJson() {
  return commands.map((command) => command.toJSON());
}
