import { SlashCommandBuilder } from "discord.js";
import { BLOODLINES, POINT_TRAITS, SEXES, SPECIES, STATUSES } from "./genetics.js";

export const SPECIES_CHOICES = SPECIES;
export const SEX_CHOICES = SEXES;
export const STATUS_CHOICES = STATUSES;
export const BLOODLINE_CHOICES = BLOODLINES;
export const NEST_ROLE_CHOICES = ["Unknown", "Fighter", "Breeder", "Pure"];
export const POINT_TRAIT_CHOICES = POINT_TRAITS;
export const UPSTAT_STATUS_CHOICES = ["Not Started", "In Progress", "Partial A+", "Near 18A+", "18A+ Complete"];
export const EGG_MATCH_ALERT_CHOICES = ["Enabled", "Disabled", "Status"];

// Reuse the same option lists so Discord forms match the desktop tracker.
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
    .addStringOption((option) => option.setName("point_traits").setDescription("PvP, Breeder, Pure, and/or Dominant").setRequired(false).setMaxLength(80))
    .addStringOption((option) => option.setName("mother").setDescription("Mother name").setRequired(false).setMaxLength(100))
    .addStringOption((option) => option.setName("father").setDescription("Father name").setRequired(false).setMaxLength(100))
    .addStringOption((option) => option.setName("stats").setDescription("All A+ or named Stat=Grade entries").setRequired(false).setMaxLength(2000))
    .addBooleanOption((option) => option.setName("parent_fourth_pointed").setDescription("At least one parent is 4th Pointed or Elder"))
    .addStringOption((option) => option.setName("notes").setDescription("Short notes").setRequired(false).setMaxLength(600));
}

// Only /dt is deployed now; the remaining definitions preserve older integrations.
export const commands = [
  new SlashCommandBuilder()
    .setName("dt")
    .setDescription("Open the Dragon Tracker button dashboard."),

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
    .addStringOption((option) => addChoices(option.setName("bloodline").setDescription("Wanted bloodline").setRequired(false), BLOODLINE_CHOICES))
    .addStringOption((option) => option.setName("point_traits").setDescription("PvP, Breeder, Pure, and/or Dominant").setRequired(false).setMaxLength(80))
    .addStringOption((option) => option.setName("pairing_parent").setDescription("Existing parent to exclude F-stat matches").setRequired(false).setMaxLength(100))
    .addBooleanOption((option) => option.setName("upstat").setDescription("Only dragons still being upstatted"))
    .addBooleanOption((option) => option.setName("pings").setDescription("Privately notify opted-in matching owners"))
    .addStringOption((option) => option.setName("account").setDescription("Account taking the egg").setRequired(false).setMaxLength(80))
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
    .setName("dt-finddragon")
    .setDescription("Search dragons shared with this clan.")
    .addStringOption((option) => addChoices(option.setName("species").setDescription("Dragon species").setRequired(false), SPECIES_CHOICES))
    .addStringOption((option) => option.setName("skin").setDescription("Visible skin contains").setRequired(false).setMaxLength(100))
    .addStringOption((option) => option.setName("recessive").setDescription("Recessive skin contains").setRequired(false).setMaxLength(100))
    .addStringOption((option) => addChoices(option.setName("sex").setDescription("Dragon sex").setRequired(false), SEX_CHOICES))
    .addStringOption((option) => addChoices(option.setName("nest_role").setDescription("Nest role").setRequired(false), NEST_ROLE_CHOICES))
    .addStringOption((option) => addChoices(option.setName("bloodline").setDescription("Bloodline").setRequired(false), BLOODLINE_CHOICES))
    .addStringOption((option) => option.setName("point_traits").setDescription("PvP, Breeder, Pure, and/or Dominant").setRequired(false).setMaxLength(80))
    .addStringOption((option) => option.setName("mother").setDescription("Mother name").setRequired(false).setMaxLength(100))
    .addStringOption((option) => option.setName("father").setDescription("Father name").setRequired(false).setMaxLength(100))
    .addBooleanOption((option) => option.setName("upstat").setDescription("Filter by upstat status"))
    .addStringOption((option) => option.setName("name").setDescription("Dragon name contains").setRequired(false).setMaxLength(80))
    .addStringOption((option) => option.setName("player").setDescription("Player name contains").setRequired(false).setMaxLength(80))
    .addStringOption((option) => option.setName("account").setDescription("Account name contains").setRequired(false).setMaxLength(80))
    .addIntegerOption((option) => option.setName("limit").setDescription("Number of matches to show").setRequired(false).setMinValue(1).setMaxValue(12)),

  new SlashCommandBuilder()
    .setName("dt-broodpouch")
    .setDescription("Submit an egg in a brood pouch or brood vault.")
    .addStringOption((option) => option.setName("name").setDescription("Egg or account name").setRequired(true).setMaxLength(80))
    .addStringOption((option) => addChoices(option.setName("species").setDescription("Dragon species").setRequired(true), SPECIES_CHOICES))
    .addStringOption((option) => option.setName("brood").setDescription("Current brood").setRequired(true).setMaxLength(80))
    .addStringOption((option) => addChoices(option.setName("sex").setDescription("Known sex").setRequired(false), SEX_CHOICES))
    .addStringOption((option) => option.setName("skin").setDescription("Visible skin or odds note").setRequired(false).setMaxLength(100))
    .addStringOption((option) => option.setName("recessive").setDescription("Recessive skin").setRequired(false).setMaxLength(100))
    .addStringOption((option) => addChoices(option.setName("bloodline").setDescription("Bloodline quality").setRequired(false), BLOODLINE_CHOICES))
    .addStringOption((option) => option.setName("point_traits").setDescription("PvP, Breeder, Pure, and/or Dominant").setRequired(false).setMaxLength(80))
    .addStringOption((option) => option.setName("mother").setDescription("Mother name").setRequired(false).setMaxLength(100))
    .addStringOption((option) => option.setName("father").setDescription("Father name").setRequired(false).setMaxLength(100))
    .addStringOption((option) => option.setName("stats").setDescription("All A+ or named Stat=Grade entries").setRequired(false).setMaxLength(2000))
    .addBooleanOption((option) => option.setName("parent_fourth_pointed").setDescription("At least one parent is 4th Pointed or Elder"))
    .addBooleanOption((option) => option.setName("upstat").setDescription("Mark this egg as an upstat"))
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
  // The button dashboard replaces the long list of slash commands for new installs.
  return commands
    .filter((command) => command.name === "dt")
    .map((command) => command.toJSON());
}
