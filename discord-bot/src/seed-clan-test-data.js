import "dotenv/config";

const SPECIES_SKINS = [
  ["Flame Stalker", ["Lava Rock", "Ashfall", "Blue Flame", "Lion Fang", "Burnout"]],
  ["Shadow Scale", ["Sunset", "Eclipse", "Twilight", "Stellar Nebula"]],
  ["Acid Spitter", ["Wild Savannah", "Pack Hunter", "Hyena", "Purple Roan", "Alpine Burst"]],
  ["Inferno Ravager", ["Burning Ash", "Ember Dawn", "Tigerclaw", "Hot Iron", "Hellfire", "Sulfire"]],
  ["Bio", ["Monarch", "Rosebud", "Orchid Bloom", "Mythic", "Iris Blossom", "Violet Petals", "Luna"]],
  ["Blitz Striker", ["Thunder Flash", "Constrictor", "Copperhead", "Vertigo", "Aftershock"]],
  ["Brood Watcher", ["Fractured", "Bone Breaker", "Broken", "Severed"]]
];

// These are the skins marked All in the tracker's skin catalog.
const ALL_SPECIES_SKINS = ["Iconic", "Brindle", "Crimson", "Golden", "Melanistic", "Leumelan", "Leucistic", "Albino", "Piebald"];
const SEXES = ["Female", "Male", "Unknown"];
const STATUSES = ["Hatchie", "Juvi", "Grown", "4th Pointed", "Elder"];
const NEST_ROLES = ["Unknown", "Fighter", "Breeder", "Pure"];
const BLOODLINES = ["E", "D", "C", "B", "A"];
const UPSTAT_STATUSES = ["Not Started", "In Progress", "Partial A+", "Near 18A+", "18A+ Complete"];
const CONCURRENCY = 8;

function clean(value, max = 160) {
  return String(value ?? "").trim().slice(0, max);
}

function slug(value) {
  return clean(value, 100).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required in discord-bot/.env`);
  return value;
}

function argument(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? clean(process.argv[index + 1], 100) : "";
}

function endpointUrl() {
  return `${requiredEnv("SUPABASE_URL").replace(/\/$/, "")}/functions/v1/discord-bot-ingest`;
}

async function requestTracker(payload) {
  let failure = null;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      const response = await fetch(endpointUrl(), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${requiredEnv("DRAGON_TRACKER_BOT_INGEST_SECRET")}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      const body = await response.json().catch(() => ({}));
      if (response.ok) return body;
      failure = new Error(clean(body?.error || `Tracker request failed (${response.status})`, 240));
      if (response.status !== 429 && response.status < 500) throw failure;
    } catch (error) {
      failure = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 400 * attempt));
  }
  throw failure || new Error("Tracker request failed");
}

async function mapWithConcurrency(items, worker) {
  let cursor = 0;
  const workers = Array.from({ length: Math.min(CONCURRENCY, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      await worker(items[index], index);
    }
  });
  await Promise.all(workers);
}

function submissionBase(ownerId, ownerName, sourceKey, type, payload) {
  return {
    clan_id: requiredEnv("DRAGON_TRACKER_CLAN_ID"),
    source_key: sourceKey,
    discord_guild_id: process.env.DISCORD_GUILD_ID || "",
    discord_channel_id: "",
    discord_user_id: ownerId,
    discord_username: ownerName,
    type,
    payload
  };
}

function buildTestBank(ownerId, ownerName) {
  const submissions = [];
  let dragonIndex = 0;
  let upstatIndex = 0;

  for (const [species, speciesOnlySkins] of SPECIES_SKINS) {
    const skins = [...new Set([...ALL_SPECIES_SKINS, ...speciesOnlySkins])];
    for (const skin of skins) {
      for (const recessiveSkin of skins) {
        const index = dragonIndex;
        const name = `[TEST] ${species} ${skin}/${recessiveSkin}`.slice(0, 80);
        submissions.push(submissionBase(ownerId, ownerName,
          `test-bank:v1:dragon:${slug(species)}:${slug(skin)}:${slug(recessiveSkin)}`,
          "dragon",
          {
            name,
            playerName: "Dragon Tracker Test Bank",
            accountName: `Test ${slug(species)} ${String(index + 1).padStart(3, "0")}`,
            species,
            sex: SEXES[index % SEXES.length],
            status: STATUSES[index % STATUSES.length],
            skin,
            recessiveSkin,
            bloodline: BLOODLINES[index % BLOODLINES.length],
            nestRole: NEST_ROLES[index % NEST_ROLES.length],
            notes: "Automated test-bank dragon. Do not import into a personal tracker."
          }));
        dragonIndex += 1;
      }
    }

    for (const skin of skins) {
      const index = upstatIndex;
      submissions.push(submissionBase(ownerId, ownerName,
        `test-bank:v1:upstat:${slug(species)}:${slug(skin)}`,
        "upstat",
        {
          species,
          skin,
          aPlusCount: index % 19,
          status: UPSTAT_STATUSES[index % UPSTAT_STATUSES.length],
          accountName: `Test Upstat ${slug(species)} ${String(index + 1).padStart(2, "0")}`,
          notes: "Automated test-bank upstat record."
        }));
      upstatIndex += 1;
    }

    for (const sex of SEXES) {
      const index = submissions.length;
      const skin = skins[index % skins.length];
      const recessiveSkin = skins[(index + 1) % skins.length];
      submissions.push(submissionBase(ownerId, ownerName,
        `test-bank:v1:brood-pouch:${slug(species)}:${slug(sex)}`,
        "brood_pouch",
        {
          name: `[TEST EGG] ${species} ${sex}`,
          playerName: "Dragon Tracker Test Bank",
          accountName: `Test Brood ${slug(species)}`,
          species,
          sex,
          skin,
          recessiveSkin,
          brood: `Test Brood ${(index % 3) + 1}`,
          dueAt: "Test reminder",
          oddsSummary: "Automated test record",
          notes: "Automated test-bank brood-pouch record."
        }));
    }

    submissions.push(submissionBase(ownerId, ownerName,
      `test-bank:v1:current-nest:${slug(species)}`,
      "current_nest",
      {
        father: `[TEST] ${species} Father`,
        mother: `[TEST] ${species} Mother`,
        species,
        breeder: "Dragon Tracker Test Bank",
        requester: "Test Requester",
        expectedSkin: skins[0],
        broodWatcherBrooding: species === "Brood Watcher",
        notes: "Automated test-bank current nest."
      }));
  }

  return {
    submissions,
    dragonCount: dragonIndex,
    upstatCount: upstatIndex,
    broodCount: SPECIES_SKINS.length * SEXES.length,
    nestCount: SPECIES_SKINS.length
  };
}

async function verifyTestBank(ownerId) {
  const [dragonSearch, upstatLookup] = await Promise.all([
    requestTracker({
      action: "dragon_search",
      clan_id: requiredEnv("DRAGON_TRACKER_CLAN_ID"),
      discord_guild_id: process.env.DISCORD_GUILD_ID || "",
      species: "Bio",
      skin: "Monarch",
      recessiveSkin: "Monarch",
      limit: 3
    }),
    requestTracker({
      action: "upstat_lookup",
      clan_id: requiredEnv("DRAGON_TRACKER_CLAN_ID"),
      discord_guild_id: process.env.DISCORD_GUILD_ID || "",
      species: "Bio",
      skin: "Monarch"
    })
  ]);
  if (!Array.isArray(dragonSearch?.records) || !dragonSearch.records.length) {
    throw new Error("Test bank verification could not find Bio Monarch/Monarch.");
  }
  if (!Array.isArray(upstatLookup?.upstatRecords) || !upstatLookup.upstatRecords.length) {
    throw new Error("Test bank verification could not find Bio Monarch upstat progress.");
  }
  console.log(`Verified test owner ${ownerId}: Bio Monarch/Monarch and Bio Monarch upstat progress are searchable.`);
}

async function clearTestBank() {
  const result = await requestTracker({
    action: "test_data_cleanup",
    clan_id: requiredEnv("DRAGON_TRACKER_CLAN_ID")
  });
  console.log(`Removed ${Number(result?.deleted) || 0} automated test-bank submissions.`);
}

async function main() {
  if (process.argv.includes("--clear")) {
    await clearTestBank();
    return;
  }

  const ownerId = argument("--user-id");
  if (!/^[0-9]{16,22}$/.test(ownerId)) {
    throw new Error("Provide the Discord owner with --user-id <Discord user id>.");
  }
  const ownerName = argument("--owner-name") || "Dragon Tracker Test Bank";
  const bank = buildTestBank(ownerId, ownerName);
  console.log(`Seeding ${bank.dragonCount} dragons, ${bank.upstatCount} upstat records, ${bank.broodCount} brood-pouch records, and ${bank.nestCount} current nests.`);

  let complete = 0;
  await mapWithConcurrency(bank.submissions, async (submission) => {
    await requestTracker(submission);
    complete += 1;
    if (complete % 100 === 0 || complete === bank.submissions.length) {
      console.log(`Seeded ${complete}/${bank.submissions.length} test records.`);
    }
  });
  await verifyTestBank(ownerId);
  console.log("Test bank is ready. Use --clear to remove only automated test-bank submissions later.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
