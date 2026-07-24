import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} from "discord.js";

const PREFIX = "dt-ui";

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

export function modalForAction(action, displayName = "") {
  if (action === "dragon") {
    return modal(action, "Add Dragon", [
      input("name", "Dragon name", { maxLength: 80 }),
      input("owner", "Player | Account", { placeholder: "Blumish | Main Account", maxLength: 165 }),
      input("species", "Species", { placeholder: "Flame Stalker", maxLength: 80 }),
      input("profile", "Sex | Status", { placeholder: "Female | Elder", maxLength: 70 }),
      input("genetics", "Skin | Recessive | Bloodline | Role", { placeholder: "Ashfall | Ashfall | A | Pure", required: false, maxLength: 260 })
    ]);
  }
  if (action === "egg") {
    return modal(action, "Request an Egg", [
      input("requester", "Requester", { value: displayName, maxLength: 100 }),
      input("species", "Species", { placeholder: "Bio", maxLength: 80 }),
      input("skins", "Visible skin | Recessive skin", { placeholder: "Monarch | Monarch", required: false, maxLength: 205 }),
      input("target", "Wanted sex | Goal", { placeholder: "Female | Pure", required: false, maxLength: 145 }),
      input("notes", "Notes", { required: false, long: true, maxLength: 1000 })
    ]);
  }
  if (action === "find") {
    return modal(action, "Find a Clan Dragon", [
      input("species", "Species", { placeholder: "Bio", required: false, maxLength: 80 }),
      input("skin", "Visible skin contains", { required: false, maxLength: 100 }),
      input("recessive", "Recessive skin contains", { required: false, maxLength: 100 }),
      input("traits", "Sex | Nest role", { placeholder: "Female | Pure", required: false, maxLength: 55 }),
      input("owner", "Player | Account", { required: false, maxLength: 165 })
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
      input("name", "Egg name", { maxLength: 80 }),
      input("owner", "Player | Account", { placeholder: "Blumish | Main Account", maxLength: 165 }),
      input("species", "Species", { maxLength: 80 }),
      input("brood", "Current brood", { maxLength: 80 }),
      input("details", "Sex | Skin | Recessive | Due | Odds | Notes", { required: false, long: true, maxLength: 1000 })
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

export function splitValues(value, count) {
  const parts = String(value || "").split("|").map((part) => part.trim());
  while (parts.length < count) parts.push("");
  if (parts.length > count) {
    parts[count - 1] = parts.slice(count - 1).join(" | ").trim();
    parts.length = count;
  }
  return parts;
}

