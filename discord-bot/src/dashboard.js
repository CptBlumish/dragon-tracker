import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} from "discord.js";

const PREFIX = "dt-ui";

// Small builders keep every dashboard row and modal consistent.
function actionButton(action, label, style = ButtonStyle.Secondary) {
  return new ButtonBuilder()
    .setCustomId(`${PREFIX}:button:${action}`)
    .setLabel(label)
    .setStyle(style);
}

function actionRow(...components) {
  return new ActionRowBuilder().addComponents(...components);
}

function input(customId, label, options = {}) {
  const control = new TextInputBuilder()
    .setCustomId(customId)
    .setLabel(label)
    .setStyle(options.long ? TextInputStyle.Paragraph : TextInputStyle.Short)
    .setRequired(options.required !== false)
    .setMaxLength(options.maxLength || (options.long ? 1000 : 200));
  if (options.placeholder) control.setPlaceholder(options.placeholder);
  if (options.value) control.setValue(String(options.value).slice(0, options.maxLength || 200));
  return actionRow(control);
}

function modal(action, title, rows) {
  return new ModalBuilder()
    .setCustomId(`${PREFIX}:modal:${action}`)
    .setTitle(title)
    .addComponents(...rows);
}

// Main button menu shown by /dt.
export function dashboardMessage() {
  return {
    content: [
      "**Dragon Tracker**",
      "Choose an action below. The bot will open a short form and send the result to your clan tracker."
    ].join("\n"),
    components: [
      actionRow(
        actionButton("dragon", "Add Dragon", ButtonStyle.Primary),
        actionButton("egg", "Request Egg", ButtonStyle.Primary),
        actionButton("find", "Find Dragon"),
        actionButton("upstat-menu", "Upstat")
      ),
      actionRow(
        actionButton("brood", "Brood Pouch"),
        actionButton("nest", "Current Nest"),
        actionButton("location", "Map Pin")
      ),
      actionRow(
        actionButton("alerts-menu", "Nesting Alerts"),
        actionButton("help", "Help")
      )
    ]
  };
}

export function dragonStatsPromptMessage(submissionId, payload) {
  const name = String(payload?.name || "dragon").slice(0, 80);
  return {
    content: [
      `Saved **${name}** with the default 18 E stats.`,
      "Use Enter 18 Stats to replace them in Genetics-screen order, or leave them at E for now."
    ].join("\n"),
    components: [actionRow(actionButton(`dragon-stats.${submissionId}`, "Enter 18 Stats", ButtonStyle.Primary))]
  };
}

export function upstatMenuMessage() {
  return {
    content: "**Upstatting**\nSubmit new progress or check the clan's current progress for a skin.",
    components: [
      actionRow(
        actionButton("upstat-submit", "Submit Progress", ButtonStyle.Primary),
        actionButton("upstat-check", "Check Progress"),
        actionButton("dashboard", "Back")
      )
    ]
  };
}

export function alertMenuMessage() {
  return {
    content: [
      "**Nesting match alerts**",
      "Alerts are private and opt-in. Matching requests are condensed into at most one DM per minute."
    ].join("\n"),
    components: [
      actionRow(
        actionButton("alerts-enable", "Enable", ButtonStyle.Success),
        actionButton("alerts-disable", "Disable", ButtonStyle.Danger),
        actionButton("alerts-status", "Check Status"),
        actionButton("dashboard", "Back")
      )
    ]
  };
}

// Each action opens a short form that maps directly to one tracker submission type.
export function modalForAction(action, displayName = "") {
  if (action.startsWith("dragon-stats.")) {
    return modal(action, "Enter 18 Dragon Stats", [
      input("stats_1", "Life | Scale | Endurance | Bile", { value: "E | E | E | E", maxLength: 40 }),
      input("stats_2", "Bite | Power | Strength | Nutrient", { value: "E | E | E | E", maxLength: 40 }),
      input("stats_3", "Water | Toxin | Impact | Pierce", { value: "E | E | E | E", maxLength: 40 }),
      input("stats_4", "Fire | Frost | Plasma", { value: "E | E | E", maxLength: 30 }),
      input("stats_5", "Lightning | Acid | Venom", { value: "E | E | E", maxLength: 30 })
    ]);
  }
  if (action === "dragon") {
    return modal(action, "Add Dragon", [
      input("identity", "Dragon name | Species", { placeholder: "Harbinger | Flame Stalker", maxLength: 165 }),
      input("owner", "Player | Account", { placeholder: "Blumish | Main Account", maxLength: 165 }),
      input("profile", "Sex | Status | Bloodline", { placeholder: "Female | Elder | A", maxLength: 80 }),
      input("skins", "Primary skin | Recessive skin", { placeholder: "Ashfall | Ashfall", required: false, maxLength: 205 }),
      input("lineage", "Mother | Father | Point traits", { placeholder: "Dam | Sire | Breeder, Pure, Dominant", required: false, maxLength: 300 })
    ]);
  }
  if (action === "egg") {
    return modal(action, "Request an Egg", [
      input("request", "Requester | Species", { value: `${displayName} | `, placeholder: "Blumish | Bio", maxLength: 185 }),
      input("owner", "Account | Wanted sex", { placeholder: "Main Account | Female", required: false, maxLength: 105 }),
      input("skins", "Primary skin | Recessive skin", { placeholder: "Monarch | Monarch", required: false, maxLength: 205 }),
      input("filters", "Bloodline | Point traits", { placeholder: "A | Breeder, Pure, Dominant", required: false, maxLength: 150 }),
      input("details", "Pairing parent | Upstat | Pings | Notes", { placeholder: "Harbinger | yes | yes | Need an egg", required: false, long: true, maxLength: 1000 })
    ]);
  }
  if (action === "find") {
    return modal(action, "Find a Clan Dragon", [
      input("identity", "Dragon name | Species", { placeholder: "Harbinger | Bio", required: false, maxLength: 165 }),
      input("skins", "Primary skin | Recessive skin", { required: false, maxLength: 205 }),
      input("traits", "Sex | Bloodline | Point traits", { placeholder: "Female | A | Pure, Dominant", required: false, maxLength: 170 }),
      input("owner", "Player | Account", { required: false, maxLength: 165 }),
      input("lineage", "Mother | Father | Upstat yes/no", { required: false, maxLength: 220 })
    ]);
  }
  if (action === "upstat-submit") {
    return modal(action, "Submit Upstat Progress", [
      input("species", "Species", { maxLength: 80 }),
      input("skin", "Skin", { maxLength: 100 }),
      input("count", "Number of A+ stats (0-18)", { placeholder: "12", maxLength: 2 }),
      input("status", "Status", { placeholder: "In Progress", required: false, maxLength: 40 }),
      input("details", "Account | Notes", { required: false, long: true, maxLength: 1000 })
    ]);
  }
  if (action === "upstat-check") {
    return modal(action, "Check Upstat Progress", [
      input("species", "Species", { maxLength: 80 }),
      input("skin", "Skin", { maxLength: 100 })
    ]);
  }
  if (action === "brood") {
    return modal(action, "Add to Brood Pouch", [
      input("identity", "Egg name | Species", { maxLength: 165 }),
      input("owner", "Player | Account", { placeholder: "Blumish | Main Account", maxLength: 165 }),
      input("profile", "Current brood | Sex | Bloodline", { placeholder: "Brood 2 | Unknown | E", maxLength: 180 }),
      input("skins", "Primary skin | Recessive skin", { required: false, maxLength: 205 }),
      input("details", "Mother | Father | Traits | Upstat | Notes", { required: false, long: true, maxLength: 1000 })
    ]);
  }
  if (action === "nest") {
    return modal(action, "Add Current Nest", [
      input("father", "Father", { maxLength: 100 }),
      input("mother", "Mother", { maxLength: 100 }),
      input("species", "Species", { maxLength: 80 }),
      input("people", "Breeder | Requester", { placeholder: `${displayName} | Requester`, required: false, maxLength: 205 }),
      input("details", "Target skin | BW brooding yes/no | Notes", { required: false, long: true, maxLength: 1000 })
    ]);
  }
  if (action === "location") {
    return modal(action, "Add Map Pin", [
      input("label", "Location name", { maxLength: 80 }),
      input("position", "X percentage | Y percentage", { placeholder: "42.5 | 68", maxLength: 30 }),
      input("type", "Pin type", { placeholder: "Location", required: false, maxLength: 40 }),
      input("notes", "Notes", { required: false, long: true, maxLength: 500 })
    ]);
  }
  return null;
}

export function dashboardAction(customId, kind) {
  const prefix = `${PREFIX}:${kind}:`;
  return String(customId || "").startsWith(prefix)
    ? String(customId).slice(prefix.length)
    : "";
}

export function fieldValue(interaction, field) {
  return String(interaction.fields.getTextInputValue(field) || "").trim();
}

// Compact Discord fields use a pipe to fit related values into one modal row.
export function splitValues(value, count) {
  const parts = String(value || "").split("|").map((part) => part.trim());
  while (parts.length < count) parts.push("");
  if (parts.length > count) {
    parts[count - 1] = parts.slice(count - 1).join(" | ").trim();
    parts.length = count;
  }
  return parts;
}
