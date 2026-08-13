const STORAGE_KEY = "day-of-dragons-tracker.v1";
const HISTORY_KEY = "day-of-dragons-tracker.undo.v1";
const LAST_SEEN_VERSION_KEY = "dragon-tracker.last-seen-version.v1";
const AUTO_SYNC_INTERVAL_MS = 30_000;
const APP_VERSION = new URLSearchParams(window.location.search).get("appVersion") || "1.3.18";
const ELDER_TICK_INTERVAL_MS = 6 * 60 * 60 * 1000;
const MAX_UNDO_HISTORY = 12;

const DEFAULT_SPECIES = [
  { name: "Flame Stalker", className: "5", element: "Fire", diet: "Carnivore" },
  { name: "Shadow Scale", className: "4", element: "Plasma", diet: "Carnivore" },
  { name: "Acid Spitter", className: "", element: "Acid", diet: "Carnivore" },
  { name: "Inferno Ravager", className: "", element: "Fire", diet: "Carnivore" },
  { name: "Bio", className: "2", element: "Bioluminescence", diet: "Nectarivore" },
  { name: "Blitz Striker", className: "", element: "Lightning", diet: "Carnivore" },
  { name: "Brood Watcher", className: "6", element: "None", diet: "Herbivore" },
  { name: "Mimikor", className: "", element: "", diet: "", upcoming: true },
  { name: "Singe Crest", className: "", element: "", diet: "", upcoming: true },
  { name: "Feathered Zygovo", className: "", element: "", diet: "", upcoming: true }
];
const UPCOMING_SPECIES = new Set(DEFAULT_SPECIES.filter((species) => species.upcoming).map((species) => species.name));

const SEXES = ["Unknown", "Female", "Male"];
const STATUSES = ["Hatchie", "Juvi", "Grown", "4th Pointed", "Elder"];
const FOURTH_POINT_ELDER_THRESHOLD = 25;
const STATUS_ALIASES = new Map([
  ["egg", "Hatchie"],
  ["hatchling", "Hatchie"],
  ["hatchie", "Hatchie"],
  ["juvenile", "Juvi"],
  ["juvi", "Juvi"],
  ["sub adult", "Grown"],
  ["adult", "Grown"],
  ["alpha", "Grown"],
  ["grown", "Grown"],
  ["4th pointed", "4th Pointed"],
  ["fourth pointed", "4th Pointed"],
  ["elder", "Elder"]
]);
const ADULT_OR_HIGHER_STATUSES = new Set(["Grown", "4th Pointed", "Elder"]);
const MUTATION_POINTS_BY_STATUS = {
  Hatchie: 1,
  Juvi: 2,
  Grown: 3,
  "4th Pointed": 4,
  Elder: 7
};
const SOCIAL_LOCK_NEST_ROLES = new Set(["Breeder", "Pure"]);
const SOCIAL_ZERO_NEST_ROLES = new Set(["Fighter"]);
const SOCIAL_POINTS_MAX = 3;
const AGILE_POINTS_MAX = 3;
const SCAVENGER_POINTS_MAX = 3;
const NEST_ROLES = ["Unknown", "Fighter", "Breeder", "Pure"];
const NEST_ROLE_ALIASES = new Map([
  ["ultra", "Pure"],
  ["ultra pure", "Pure"]
]);
const ELDER_CRYSTAL_STAGES = [
  { key: "green", label: "Green", max: 15 },
  { key: "cyan", label: "Cyan", max: 30 },
  { key: "blue", label: "Blue", max: 45 },
  { key: "magenta", label: "Magenta", max: 60 },
  { key: "red", label: "Red", max: 75 },
  { key: "yellow", label: "Yellow", max: 100 }
];
const DLC_OPTIONS = [
  { key: "patreonLt15", label: "LT15" },
  { key: "patreonLt100", label: "LT100" },
  { key: "patreonLt200", label: "LT200" },
  { key: "patreonLt300", label: "LT300" },
  { key: "kickstarter", label: "Kickstarter" },
  { key: "brindleSkin", label: "Brindle Skin" },
  { key: "blitzStrikerSpecies", label: "Blitz Striker Species" },
  { key: "acidSpitterSpecies", label: "Acid Spitter Species" },
  { key: "flameStalkerEmotePack", label: "Flame Stalker Emote Pack" },
  { key: "shadowScaleEmotePack", label: "Shadow Scale Emote Pack" },
  { key: "infernoRavagerEmotePack", label: "Inferno Ravager Emote Pack" },
  { key: "broodWatcherEmotePack", label: "Brood Watcher Emote Pack" },
  { key: "goldenHoard", label: "Golden Hoard" }
];
const DLC_LEGACY_ALIASES = new Map([
  ["emotePack", ["flameStalkerEmotePack", "shadowScaleEmotePack", "infernoRavagerEmotePack", "broodWatcherEmotePack"]]
]);
const SKIN_TYPES = ["Unknown", "Common", "Uncommon", "Rare", "Exclusive", "Exotic", "Mutation", "Pearl Overlay", "Golden Hoard Overlay", "Event", "DLC", "Custom"];
const GRADES = ["Unknown", "F", "E", "D-", "D", "D+", "C-", "C", "C+", "B-", "B", "B+", "A-", "A", "A+", "A++"];
const BLOODLINE_GRADES = ["Unknown", "F", "E", "D", "C", "B", "A"];
const GRADE_ALIASES = new Map([
  ["f", "E"],
  ["e+", "E"]
]);
const UPSTAT_STATUSES = ["Not Started", "In Progress", "Partial A+", "Near 18A+", "18A+ Complete"];
const MAP_LAYERS = ["locations", "crystals", "food"];
const MAP_REFERENCE_BASE = "./assets/map/references/";
const MAP_REFERENCE_AREAS = [
  { id: "67", region: "Elder Forest", name: "67", files: ["67.png", "67-1.png"], button: [7.2, 85.6, 5, 4.5] },
  { id: "530", region: "Elder Forest", name: "530", files: ["530.png"], button: [7.9, 80.9, 6, 4.5] },
  { id: "crows", region: "Elder Forest", name: "Crows", files: ["crows.png", "crows1.png", "crows2.png"], button: [16.2, 95.6, 11, 4.5] },
  { id: "suicide", region: "Elder Forest", name: "Suicide", files: ["suicd.png"], button: [13.8, 70.6, 10, 4.5] },
  { id: "boot", region: "Elder Forest", name: "Boot", files: ["bt.png", "bt1.png"], button: [20.7, 69.3, 7, 4.5] },
  { id: "playground", region: "Elder Forest", name: "Playground", files: ["plgrd.png"], button: [13.6, 60.9, 13, 4.5] },
  { id: "bunker", region: "Elder Forest", name: "Bunker", files: ["bnkr.png", "bnkr1.png"], button: [15.5, 64.6, 9, 4.5] },
  { id: "cliff", region: "Elder Forest", name: "Cliff", files: ["clf.png"], button: [4.6, 68.6, 7, 4.5] },
  { id: "sliver", region: "Elder Forest", name: "Sliver", files: ["slvr.png"], button: [3.5, 78.5, 8, 4.5] },
  { id: "murder", region: "Elder Forest", name: "Murder", files: ["mrdr.png"], button: [7.0, 73.1, 9, 4.5] },
  { id: "ridge", region: "Elder Forest", name: "Ridge", files: ["ridge.png"], button: [14.2, 48.5, 8, 4.5] },
  { id: "muffins", region: "Elder Forest", name: "Muffins", files: ["mfns.png"], button: [26.7, 60.1, 9, 4.5] },
  { id: "elder-tree", region: "Elder Forest", name: "Elder Tree", files: ["ET.png", "ET1.png"], button: [13.3, 76.9, 12, 4.5] },
  { id: "fallen", region: "East Redwood", name: "Fallen Log", files: ["fallen.png", "fallen1.png", "fallen3.png"], button: [66.9, 33.1, 10, 4.5] },
  { id: "400", region: "East Redwood", name: "400", files: ["400.png"], button: [78.8, 35.0, 6, 4.5] },
  { id: "500", region: "East Redwood", name: "500", files: ["500.png"], button: [87.8, 33.0, 6, 4.5] },
  { id: "pride-flight", region: "East Redwood", name: "Pride / Flight", files: ["prdflgt.png"], button: [82.9, 41.9, 13, 4.5] },
  { id: "arch", region: "Central", name: "Arch", files: ["arch.png", "arch1.png", "arch2.png", "arch3.png", "arch4.png"], button: [58.0, 34.8, 8, 4.5] },
  { id: "sanctuary", region: "Central", name: "Sanctuary", files: ["snctry.png"], button: [60.3, 40.1, 12, 4.5] },
  { id: "arch-hatchie", region: "Central", name: "Arch Hatchie", files: ["arch hatchie.png"], button: [61.3, 37.6, 13, 4.5] },
  { id: "br", region: "Central", name: "BR", files: ["BR.png", "BR1.png", "BR3.png"], button: [54.5, 54.8, 6, 4.5] },
  { id: "island", region: "Central", name: "Island", files: ["island.png"], button: [62.3, 45.6, 8, 4.5] },
  { id: "paradise", region: "Central", name: "Paradise", files: ["parads.png"], button: [44.2, 40.5, 10, 4.5] },
  { id: "oasis", region: "Central", name: "Oasis", files: ["Oasis.png"], button: [46.5, 62.3, 8, 4.5] },
  { id: "waterfall", region: "Central", name: "Waterfall", files: ["Wtrfl.png", "Wtrfl1.png"], button: [40.0, 59.3, 10, 4.5] },
  { id: "world-tree", region: "Central", name: "World Tree", files: ["WrldTree.png", "WrldTree1.png"], button: [47.2, 55.2, 12, 4.5] },
  { id: "river", region: "Central", name: "River", files: ["rivr.png", "rivr1.png", "rivr2.png", "rivr3.png", "rivr4.png", "rivr5.png", "rivr6.png", "rivr7.png"], button: [47.8, 71.7, 7, 4.5] },
  { id: "ghost-ponds", region: "Central", name: "Ghost Ponds", files: ["ghstpnd.png"], button: [38.3, 70.0, 13, 4.5] },
  { id: "bug-planes", region: "Central", name: "Bug Planes", files: ["bgplns.png"], button: [47.0, 45.6, 12, 4.5] },
  { id: "little-snowy", region: "Central", name: "Little Snowy", files: ["litlsnwy.png"], button: [31.4, 32.0, 14, 4.5] },
  { id: "90-pond", region: "Central", name: "90 Pond", files: ["90s.png"], button: [76.0, 39.1, 8, 4.5] },
  { id: "sticks", region: "Central", name: "Sticks", files: ["stks.png"], button: [71.3, 49.4, 8, 4.5] },
  { id: "throne", region: "Central", name: "Throne", files: ["thrn.png", "thrn1.png"], button: [74.8, 69.4, 9, 4.5] },
  { id: "lone-rock", region: "Central", name: "Lone Rock", files: ["lnrck.png"], button: [63.8, 65.5, 11, 4.5] },
  { id: "snowy", region: "Corners", name: "Snowy", files: ["snwy.png"], button: [69.5, 13.8, 9, 4.5] },
  { id: "lime", region: "Corners", name: "Lime", files: ["lm.png"], button: [18.4, 26.4, 8, 4.5] },
  { id: "misty", region: "Corners", name: "Misty", files: ["msty.png"], button: [16.0, 3.3, 8, 4.5] },
  { id: "mini-lime", region: "Corners", name: "Mini Lime", files: ["mnlm.png"], button: [20.0, 17.3, 13, 4.5] },
  { id: "crater", region: "Corners", name: "Crater", files: ["crtr.png"], button: [92.1, 71.1, 9, 4.5] },
  { id: "ravine", region: "Corners", name: "Ravine", files: ["rvin.png", "rvin1.png"], button: [74.4, 79.9, 9, 4.5] },
  { id: "swamp", region: "Corners", name: "Swamp", files: ["swmp.png", "swmp1.png"], button: [53.2, 95.8, 10, 4.5] },
  { id: "four-ponds", region: "Corners", name: "Four Ponds", files: ["frpnds.png"], button: [43.9, 85.0, 11, 4.5] },
  { id: "far-pond", region: "Corners", name: "Far Pond", files: ["farpnd.png"], button: [3.2, 5.1, 9, 4.5] }
];
const DEFAULT_TAB = "home";
const TAB_NAMES = ["home", "dragons", "players", "breeding", "skins", "map", "clans", "settings"];
const ACTIVE_CLAN_STORAGE_KEY = "dragon-tracker.active-clan.v1";
const CLAN_LIBRARY_SOURCE_FILTERS = [
  { value: "", label: "All shared dragons" },
  { value: "mine", label: "Shared by me" },
  { value: "others", label: "Shared by others" },
  { value: "missing-local", label: "Not in my tracker" },
  { value: "breeders", label: "Breeders" },
  { value: "fourth", label: "4th pointed" },
  { value: "elder", label: "Elders" }
];
const AUTO_IMPORTABLE_DISCORD_SUBMISSION_TYPES = new Set(["dragon", "map_pin", "upstat", "brood_pouch"]);
const CLAN_SYNCED_DISCORD_DRAGON_TYPES = new Set(["dragon", "brood_pouch"]);
const CHANGELOG_ITEMS = [
  "Updated the confirmed Albino and Piebald mutation chances to 0.5%.",
  "Clarified local-browser Clan Sync support and the exact Windows, macOS, and Linux return addresses organizers must allow.",
  "Selecting Pure now keeps a dragon's visible and recessive skins matched in the dragon editor.",
  "Pure is now assigned automatically whenever a dragon's visible and recessive skins match, without requiring recorded parents.",
  "Added daytime elder crystal colors to dragon surfaces while keeping exact elder percentages inside dragon details.",
  "Replaced Ultra Pure with Fighter; Fighter dragons keep Social at zero while legacy Ultra Pure records become Pure.",
  "Fixed primary account selection for aliased and imported players, and kept the primary account first in account views.",
  "Added Singe Crest turntables for Leumelan, Melanistic, and the three currently unnamed C1-C3 concept skins.",
  "Added a primary account preference beneath the primary player and placed that account first on Home.",
  "Prepared roster, skin, and Discord species selectors for Mimikor, Singe Crest, and Feathered Zygovo.",
  "Added a share-safe HTML roster chart that opens offline in any browser without Dragon Tracker or Discord.",
  "Fixed Continue in Background so update progress stays dismissed while the download continues.",
  "Discord submissions now enter local Players and Dragons only for their matching connected Discord user; other members see them only in the Clan Library.",
  "Improved player alias saving with immediate list updates and clear duplicate or primary-name feedback.",
  "Fixed Clan Library rendering so refreshed shared dragons and Discord submissions display correctly.",
  "Made saved player aliases visible in Settings and beside player names on Home and Players.",
  "Added player name aliases so alternate names can keep future dragons and accounts under one familiar player.",
  "Simplified navigation by grouping the Nesting Planner and Brood Pouch under Breeding, and Upstats under Dragons.",
  "Moved elder tick controls onto Home and split Settings into General, Backup, Sync, and Diagnostics views.",
  "Added optional automatic import for your own Discord bot submissions, with imported dragons syncing across your tracker installs.",
  "Added breeder-focused Discord bot submissions and a Pure-only clan library filter.",
  "Made elder tick timers fully local so Steam is no longer required.",
  "Added compact sex markers to account species grid cells.",
  "Added the Players species grid to Home for the selected Home player.",
  "Moved the personal Home player selector onto the Home screen.",
  "Added a personal Home player setting so Home can focus on one player's accounts.",
  "Fixed startup panel styling and account-row hover controls.",
  "Added a Home page for account-first startup and improved account-detail editing.",
  "Fixed status downgrades from 4th Pointed, upstat species/skin dropdowns, and several button hit targets.",
  "Added Discord bot inbox support so clan members can import bot-submitted dragons and map pins.",
  "Added global search for dragons, players, accounts, skins, upstats, map areas, and clan records.",
  "Added safer backup tools: import preview, undo last change, safe export, data health, and recent-change panels.",
  "Added account roster matrix, per-account elder tick timers, pairing helper targets, skin wishlists, and richer brood pouch fields.",
  "Added map favorites, pin visibility toggles, clan library source filters, and better shared-record visibility."
];
const STAT_FIELDS = [
  { key: "lifeExpectancy", label: "Life Expectancy" },
  { key: "scaleThickness", label: "Scale Thickness" },
  { key: "endurance", label: "Endurance" },
  { key: "bileProduction", label: "Bile Production" },
  { key: "biteForce", label: "Bite Force" },
  { key: "power", label: "Power" },
  { key: "strength", label: "Strength" },
  { key: "nutrientAbsorption", label: "Nutrient Absorption" },
  { key: "waterRetention", label: "Water Retention" },
  { key: "toxinTolerance", label: "Toxin Tolerance" },
  { key: "impactResistance", label: "Impact Resistance" },
  { key: "pierceResistance", label: "Pierce Resistance" },
  { key: "fireResistance", label: "Fire Resistance" },
  { key: "frostResistance", label: "Frost Resistance" },
  { key: "plasmaResistance", label: "Plasma Resistance" },
  { key: "lightningResistance", label: "Lightning Resistance" },
  { key: "acidResistance", label: "Acid Resistance" },
  { key: "venomResistance", label: "Venom Resistance" }
];
const GENETICS_IMPORT_ROW_RATIOS = [0.452, 0.505, 0.557, 0.609, 0.661, 0.713, 0.765, 0.817, 0.868];
const GENETICS_IMPORT_COLUMNS = [
  { start: 0, count: 9, x0: 0.34, x1: 0.50 },
  { start: 9, count: 9, x0: 0.78, x1: 0.94 }
];
const GENETICS_IMPORT_ROW_HALF_HEIGHT = 0.023;
const GENETICS_IMPORT_BLOODLINE_REGION = { x0: 0.62, x1: 0.86, y0: 0.85, y1: 0.98 };
const GENETICS_TEMPLATE_WIDTH = 32;
const GENETICS_TEMPLATE_HEIGHT = 42;
let geneticsLetterTemplates = null;

const DISCORD_SKIN_SOURCE = "Discord SMOKE #skins DRAGON SKINS";
const MUTATION_RULES = {
  albinoChance: 0.5,
  piebaldChance: 0.5
};
const ODDS_COLORS = ["#14726f", "#b94a2c", "#b8861c", "#4d6d3c", "#5b5b8f", "#a73535", "#2f6f8f", "#7a5b35", "#996c9e"];
const SKIN_TURNTABLES = new Map([
  ["Flame Stalker::ashfall", "flame-stalker/ashfall.mp4"],
  ["Flame Stalker::blue flame", "flame-stalker/blue-flame.mp4"],
  ["Flame Stalker::brindle", "flame-stalker/brindle.mp4"],
  ["Flame Stalker::burnout", "flame-stalker/burnout.mp4"],
  ["Flame Stalker::iconic", "flame-stalker/iconic.mp4"],
  ["Flame Stalker::lava rock", "flame-stalker/lava-rock.mp4"],
  ["Flame Stalker::leucistic", "flame-stalker/leucistic.mp4"],
  ["Flame Stalker::leumelan", "flame-stalker/leumelan.mp4"],
  ["Flame Stalker::lion fang", "flame-stalker/lion-fang.mp4"],
  ["Flame Stalker::melanistic", "flame-stalker/melanistic.mp4"],
  ["Acid Spitter::alpine burst", "acid-spitter/alpine-burst.mp4"],
  ["Acid Spitter::brindle", "acid-spitter/brindle.mp4"],
  ["Acid Spitter::hyena", "acid-spitter/hyena.mp4"],
  ["Acid Spitter::iconic", "acid-spitter/iconic.mp4"],
  ["Acid Spitter::leucistic", "acid-spitter/leucistic.mp4"],
  ["Acid Spitter::leumelan", "acid-spitter/leumelan.mp4"],
  ["Acid Spitter::melanistic", "acid-spitter/melanistic.mp4"],
  ["Acid Spitter::pack hunter", "acid-spitter/pack-hunter.mp4"],
  ["Acid Spitter::purple roan", "acid-spitter/purple-roan.mp4"],
  ["Acid Spitter::wild savannah", "acid-spitter/wild-savannah.mp4"],
  ["Bio::brindle", "bio/brindle.mp4"],
  ["Bio::iconic", "bio/iconic.mp4"],
  ["Bio::iris blossom", "bio/iris-blossom.mp4"],
  ["Bio::leucistic", "bio/leucistic.mp4"],
  ["Bio::luna", "bio/luna.mp4"],
  ["Bio::melanistic", "bio/melanistic.mp4"],
  ["Bio::monarch", "bio/monarch.mp4"],
  ["Bio::mythic", "bio/mythic.mp4"],
  ["Bio::orchid bloom", "bio/orchid-bloom.mp4"],
  ["Bio::rosebud", "bio/rosebud.mp4"],
  ["Bio::sand slayer", "bio/sand-slayer.mp4"],
  ["Bio::snow slayer", "bio/snow-slayer.mp4"],
  ["Bio::violet petals", "bio/violet-petals.mp4"],
  ["Blitz Striker::aftershock", "blitz-striker/aftershock.mp4"],
  ["Blitz Striker::brindle", "blitz-striker/brindle.mp4"],
  ["Blitz Striker::constrictor", "blitz-striker/constrictor.mp4"],
  ["Blitz Striker::iconic", "blitz-striker/iconic.mp4"],
  ["Blitz Striker::melanistic", "blitz-striker/melanistic.mp4"],
  ["Blitz Striker::thunder flash", "blitz-striker/thunder-flash.mp4"],
  ["Blitz Striker::vertigo", "blitz-striker/vertigo.mp4"],
  ["Inferno Ravager::brindle", "inferno-ravager/brindle.mp4"],
  ["Inferno Ravager::burning ash", "inferno-ravager/burning-ash.mp4"],
  ["Inferno Ravager::ember dawn", "inferno-ravager/ember-dawn.mp4"],
  ["Inferno Ravager::hellfire", "inferno-ravager/hellfire.mp4"],
  ["Inferno Ravager::hot iron", "inferno-ravager/hot-iron.mp4"],
  ["Inferno Ravager::iconic", "inferno-ravager/iconic.mp4"],
  ["Inferno Ravager::leumelan", "inferno-ravager/leumelan.mp4"],
  ["Inferno Ravager::melanistic", "inferno-ravager/melanistic.mp4"],
  ["Inferno Ravager::sulfire", "inferno-ravager/sulfire.mp4"],
  ["Inferno Ravager::tigerclaw", "inferno-ravager/tigerclaw.mp4"],
  ["Shadow Scale::brindle", "shadow-scale/brindle.mp4"],
  ["Shadow Scale::eclipse", "shadow-scale/eclipse.mp4"],
  ["Shadow Scale::leucistic", "shadow-scale/leucistic.mp4"],
  ["Shadow Scale::leumelan", "shadow-scale/leumelan.mp4"],
  ["Shadow Scale::melanistic", "shadow-scale/melanistic.mp4"],
  ["Shadow Scale::piebald", "shadow-scale/piebald.mp4"],
  ["Shadow Scale::stardust", "shadow-scale/stardust.mp4"],
  ["Shadow Scale::stellar nebula", "shadow-scale/stellar-nebula.mp4"],
  ["Shadow Scale::sunset", "shadow-scale/sunset.mp4"],
  ["Shadow Scale::twilight", "shadow-scale/twilight.mp4"],
  ["Brood Watcher::bone breaker", "brood-watcher/bone-breaker.mp4"],
  ["Brood Watcher::brindle", "brood-watcher/brindle.mp4"],
  ["Brood Watcher::broken", "brood-watcher/broken.mp4"],
  ["Brood Watcher::fractured", "brood-watcher/fractured.mp4"],
  ["Brood Watcher::leucistic", "brood-watcher/leucistic.mp4"],
  ["Brood Watcher::melanistic", "brood-watcher/melanistic.mp4"],
  ["Brood Watcher::severed", "brood-watcher/severed.mp4"],
  ["Singe Crest::leumelan", "singe-crest/leumelan.mp4"],
  ["Singe Crest::melanistic", "singe-crest/melanistic.mp4"],
  ["Singe Crest::unnamed concept c1", "singe-crest/concept-c1.mp4"],
  ["Singe Crest::unnamed concept c2", "singe-crest/concept-c2.mp4"],
  ["Singe Crest::unnamed concept c3", "singe-crest/concept-c3.mp4"]
]);
const SPECIES_ALIASES = new Map([
  ["shadow scale", "Shadow Scale"],
  ["shadow stalker", "Shadow Scale"],
  ["bioluminescent dragon", "Bio"],
  ["biolumen", "Bio"],
  ["biolumin", "Bio"],
  ["bio", "Bio"],
  ["mimikor", "Mimikor"],
  ["singe crest", "Singe Crest"],
  ["singecrest", "Singe Crest"],
  ["singecreat", "Singe Crest"],
  ["feathered zygovo", "Feathered Zygovo"],
  ["micro feathered zygovo", "Feathered Zygovo"],
  ["feathered micro zygovo", "Feathered Zygovo"]
]);

const SHARED_DISCORD_SKINS = [
  ["Crimson", "Exotic", "Patreon LT15 spawnable"],
  ["Golden", "Exotic", "Patreon LT200 spawnable"],
  ["Melanistic", "Exotic", "Unlocked after growing a nested dragon"],
  ["Leumelan", "Exotic", "Kickstarter spawnable"],
  ["Leucistic", "Exotic", "Kickstarter spawnable"],
  ["Albino", "Mutation", "A confirmed 0.5% mutation chance from breeding any two skins together", "", "", "Confirmed mutation chance: 0.5%."],
  ["Piebald", "Mutation", "A confirmed 0.5% mutation chance when one parent's primary skin is Exotic and the other parent's primary skin is non-Exotic", "Exotic primary", "Non-Exotic primary", "Confirmed mutation chance: 0.5%."],
  ["Sand Slayer", "Pearl Overlay", "Boss drop"],
  ["Snow Slayer", "Pearl Overlay", "Boss and Winter Quest drop"],
  ["Crimson Shard of Nharoghk", "Pearl Overlay", "Patreon LT15"],
  ["Pearl of the Golden Hoard", "Pearl Overlay", "Patreon LT200"],
  ["Content Creator", "Pearl Overlay", "Event reward"],
  ["Firstborn Pearl of Creation", "Pearl Overlay", "Kickstarter"],
  ["Golden Crimson", "Golden Hoard Overlay", "Golden Hoard overlay for Crimson", "Crimson", "Pearl of the Golden Hoard"],
  ["Golden Melanistic", "Golden Hoard Overlay", "Golden Hoard overlay for Melanistic", "Melanistic", "Pearl of the Golden Hoard"],
  ["Golden Leumelan", "Golden Hoard Overlay", "Golden Hoard overlay for Leumelan", "Leumelan", "Pearl of the Golden Hoard"],
  ["Golden Leucistic", "Golden Hoard Overlay", "Golden Hoard overlay for Leucistic", "Leucistic", "Pearl of the Golden Hoard"]
];

const SPECIES_SKIN_GROUPS = [
  {
    species: "Flame Stalker",
    skins: [
      ["Iconic", "Common", "Spawnable"],
      ["Lava Rock", "Rare", "Spawnable"],
      ["Ashfall", "Rare", "Spawnable"],
      ["Blue Flame", "Rare", "Spawnable"],
      ["Lion Fang", "Rare", "Spawnable"],
      ["Burnout", "Exotic", "Flame Stalker Emote Pack spawnable"]
    ]
  },
  {
    species: "Shadow Scale",
    skins: [
      ["Iconic", "Common", "Spawnable"],
      ["Sunset", "Rare", "Spawnable"],
      ["Eclipse", "Rare", "Spawnable"],
      ["Twilight", "Rare", "Spawnable"],
      ["Stellar Nebula", "Exotic", "Shadow Scale Emote Pack spawnable"]
    ]
  },
  {
    species: "Acid Spitter",
    skins: [
      ["Iconic", "Common", "Spawnable"],
      ["Wild Savannah", "Rare", "Spawnable"],
      ["Pack Hunter", "Rare", "Spawnable"],
      ["Hyena", "Exotic", "Acid Spitter Species DLC spawnable"]
    ]
  },
  {
    species: "Inferno Ravager",
    skins: [
      ["Iconic", "Common", "Spawnable"],
      ["Burning Ash", "Uncommon", "Spawnable"],
      ["Ember Dawn", "Rare", "Spawnable"],
      ["Tigerclaw", "Rare", "Spawnable"],
      ["Hot Iron", "Exotic", "Inferno Ravager Emote Pack spawnable"]
    ]
  },
  {
    species: "Bio",
    skins: [
      ["Iconic", "Common", "Kickstarter spawnable"],
      ["Monarch", "Uncommon", "Kickstarter spawnable"],
      ["Rosebud", "Uncommon", "Kickstarter spawnable"],
      ["Orchid Bloom", "Uncommon", "Kickstarter spawnable"],
      ["Mythic", "Rare", "Kickstarter spawnable"],
      ["Iris Blossom", "Rare", "Kickstarter spawnable"],
      ["Violet Petals", "Rare", "Kickstarter spawnable"],
      ["Luna", "Rare", "Kickstarter spawnable"]
    ]
  },
  {
    species: "Blitz Striker",
    skins: [
      ["Iconic", "Common", "Spawnable"],
      ["Thunder Flash", "Uncommon", "Spawnable", "", "", "Discord master post spells this as Thunderflash."],
      ["Constrictor", "Rare", "Spawnable"],
      ["Copperhead", "Rare", "Spawnable"],
      ["Vertigo", "Rare", "Spawnable"],
      ["Aftershock", "Exotic", "Blitz Striker Species DLC spawnable"]
    ]
  },
  {
    species: "Brood Watcher",
    skins: [
      ["Iconic", "Common", "Spawnable"],
      ["Fractured", "Uncommon", "Spawnable"],
      ["Bone Breaker", "Rare", "Spawnable"],
      ["Broken", "Rare", "Spawnable"],
      ["Severed", "Exotic", "Brood Watcher Emote Pack spawnable"]
    ]
  },
  {
    species: "Mimikor",
    skins: []
  },
  {
    species: "Singe Crest",
    skins: [
      ["Unnamed Concept C1", "Unknown", "Official Singe Crest concept; final name and classification pending"],
      ["Unnamed Concept C2", "Unknown", "Official Singe Crest concept; final name and classification pending"],
      ["Unnamed Concept C3", "Unknown", "Official Singe Crest concept; final name and classification pending"]
    ]
  },
  {
    species: "Feathered Zygovo",
    skins: []
  }
];

const VISIBLE_FORUM_POST_SKINS = [
  ["Acid Spitter", "Purple Roan", "Rare", "Spawnable"],
  ["Inferno Ravager", "Hellfire", "Rare", "Spawnable"],
  ["Inferno Ravager", "Sulfire", "Rare", "Spawnable"],
  ["Acid Spitter", "Alpine Burst", "Uncommon", "Spawnable"]
];
const ALL_SPECIES_SKINS = [
  ["Iconic", "Common", "Spawnable", "", "", "", true],
  ["Brindle", "Exotic", "Brindle Skin DLC spawnable"],
  ...SHARED_DISCORD_SKINS.filter(([, type]) => ["Exotic", "Mutation"].includes(type))
];
const ALL_SPECIES_SKIN_NAMES = new Set(ALL_SPECIES_SKINS.map(([name]) => name));
const SHARED_STARTER_SKIN_NAMES = new Set([
  "Iconic",
  "Brindle",
  ...SHARED_DISCORD_SKINS.map(([name]) => name)
]);
const DEPRECATED_PLACEHOLDER_SKIN_KEYS = new Set([
  "all::random common",
  "all::rare spawn",
  "all::custom"
]);

const STARTER_SKINS = buildStarterSkins();

let state = loadState();
let currentTab = DEFAULT_TAB;
let currentDragonView = "collection";
let currentBreedingView = "planner";
let currentSettingsView = "general";
let toastTimer = null;
let autoSyncTimer = null;
let elderTickTimer = null;
let lastKnownStateText = "";
let mapPinPlacementActive = false;
let clanShareConfirmationResolve = null;
let pendingImportState = null;
let desktopUpdateStatus = null;
let updateProgressBackgrounded = false;
const clanSync = window.DragonTrackerSyncClient ? new window.DragonTrackerSyncClient() : null;
const clanUi = {
  activeClanId: localStorage.getItem(ACTIVE_CLAN_STORAGE_KEY) || "",
  busy: false,
  error: "",
  inviteCode: "",
  discordSubmissions: [],
  identityLinks: [],
  lastSignature: "",
  libraryFilters: { dragon: "", skin: "", recessive: "", sex: "", pure: "", source: "" },
  loading: false,
  lastLoadedAt: "",
  lastRefreshError: "",
  members: [],
  memberships: [],
  sharedDragons: [],
  sharedPins: [],
  user: null
};

const els = {
  tabs: document.querySelectorAll(".tab"),
  panels: document.querySelectorAll(".tab-panel"),
  globalSearch: document.querySelector("#globalSearch"),
  globalSearchResults: document.querySelector("#globalSearchResults"),
  syncStatusBadge: document.querySelector("#syncStatusBadge"),
  dragonSearch: document.querySelector("#dragonSearch"),
  speciesFilter: document.querySelector("#speciesFilter"),
  statusFilter: document.querySelector("#statusFilter"),
  sortBy: document.querySelector("#sortBy"),
  hideInactive: document.querySelector("#hideInactive"),
  statsBar: document.querySelector("#statsBar"),
  dragonList: document.querySelector("#dragonList"),
  addDragonBtn: document.querySelector("#addDragonBtn"),
  homeAccountList: document.querySelector("#homeAccountList"),
  homeAccountSpeciesMatrix: document.querySelector("#homeAccountSpeciesMatrix"),
  homeAddAccountBtn: document.querySelector("#homeAddAccountBtn"),
  homePlayerSummary: document.querySelector("#homePlayerSummary"),
  homePersonalPlayerSelect: document.querySelector("#homePersonalPlayerSelect"),
  homePrimaryAccountSelect: document.querySelector("#homePrimaryAccountSelect"),
  accountSearch: document.querySelector("#accountSearch"),
  accountList: document.querySelector("#accountList"),
  accountSpeciesMatrix: document.querySelector("#accountSpeciesMatrix"),
  addAccountBtn: document.querySelector("#addAccountBtn"),
  accountDialog: document.querySelector("#accountDialog"),
  accountForm: document.querySelector("#accountForm"),
  accountDialogTitle: document.querySelector("#accountDialogTitle"),
  accountDetailDialog: document.querySelector("#accountDetailDialog"),
  accountDetailTitle: document.querySelector("#accountDetailTitle"),
  accountDetailContent: document.querySelector("#accountDetailContent"),
  playerAliasPlayerSelect: document.querySelector("#playerAliasPlayerSelect"),
  playerAliasesInput: document.querySelector("#playerAliasesInput"),
  playerAliasesSavedList: document.querySelector("#playerAliasesSavedList"),
  playerAliasStatus: document.querySelector("#playerAliasStatus"),
  playerAliasDescription: document.querySelector("#playerAliasDescription"),
  savePlayerAliasesBtn: document.querySelector("#savePlayerAliasesBtn"),
  dragonDialog: document.querySelector("#dragonDialog"),
  dragonForm: document.querySelector("#dragonForm"),
  dragonDialogTitle: document.querySelector("#dragonDialogTitle"),
  statEditor: document.querySelector("#statEditor"),
  parentOne: document.querySelector("#parentOne"),
  parentTwo: document.querySelector("#parentTwo"),
  nestTargetSkin: document.querySelector("#nestTargetSkin"),
  nestTargetGrade: document.querySelector("#nestTargetGrade"),
  createEggBtn: document.querySelector("#createEggBtn"),
  broodWatcherBrooding: document.querySelector("#broodWatcherBrooding"),
  addEggToBroodPouch: document.querySelector("#addEggToBroodPouch"),
  nestingOutput: document.querySelector("#nestingOutput"),
  broodPouchList: document.querySelector("#broodPouchList"),
  broodPouchDialog: document.querySelector("#broodPouchDialog"),
  broodPouchForm: document.querySelector("#broodPouchForm"),
  broodPouchDialogTitle: document.querySelector("#broodPouchDialogTitle"),
  broodPouchDueAt: document.querySelector("#broodPouchDueAt"),
  broodPouchOddsSummary: document.querySelector("#broodPouchOddsSummary"),
  broodPouchNotes: document.querySelector("#broodPouchNotes"),
  skinSearch: document.querySelector("#skinSearch"),
  skinSpeciesFilter: document.querySelector("#skinSpeciesFilter"),
  skinTypeFilter: document.querySelector("#skinTypeFilter"),
  mutatedSkinsOnly: document.querySelector("#mutatedSkinsOnly"),
  addSkinBtn: document.querySelector("#addSkinBtn"),
  skinDialog: document.querySelector("#skinDialog"),
  skinForm: document.querySelector("#skinForm"),
  skinDialogTitle: document.querySelector("#skinDialogTitle"),
  skinList: document.querySelector("#skinList"),
  upstatSearch: document.querySelector("#upstatSearch"),
  upstatSpeciesFilter: document.querySelector("#upstatSpeciesFilter"),
  upstatStatusFilter: document.querySelector("#upstatStatusFilter"),
  addUpstatBtn: document.querySelector("#addUpstatBtn"),
  upstatDialog: document.querySelector("#upstatDialog"),
  upstatForm: document.querySelector("#upstatForm"),
  upstatDialogTitle: document.querySelector("#upstatDialogTitle"),
  upstatList: document.querySelector("#upstatList"),
  clanShareDialog: document.querySelector("#clanShareDialog"),
  clanShareDialogTitle: document.querySelector("#clanShareDialogTitle"),
  clanShareDialogDescription: document.querySelector("#clanShareDialogDescription"),
  mapLayerLocations: document.querySelector("#mapLayerLocations"),
  mapLayerCrystals: document.querySelector("#mapLayerCrystals"),
  mapLayerFood: document.querySelector("#mapLayerFood"),
  mapPinsPersonal: document.querySelector("#mapPinsPersonal"),
  mapPinsClan: document.querySelector("#mapPinsClan"),
  addMapPinBtn: document.querySelector("#addMapPinBtn"),
  mapStage: document.querySelector("#mapStage"),
  mapPinDialog: document.querySelector("#mapPinDialog"),
  mapPinForm: document.querySelector("#mapPinForm"),
  mapImportDialog: document.querySelector("#mapImportDialog"),
  mapImportForm: document.querySelector("#mapImportForm"),
  mapAreaLayer: document.querySelector("#mapAreaLayer"),
  mapPinLayer: document.querySelector("#mapPinLayer"),
  mapPinList: document.querySelector("#mapPinList"),
  mapPinCount: document.querySelector("#mapPinCount"),
  mapAreaSelect: document.querySelector("#mapAreaSelect"),
  mapReferenceGallery: document.querySelector("#mapReferenceGallery"),
  mapReferenceCount: document.querySelector("#mapReferenceCount"),
  mapReferenceSummary: document.querySelector("#mapReferenceSummary"),
  toggleMapFavoriteBtn: document.querySelector("#toggleMapFavoriteBtn"),
  clanContent: document.querySelector("#clanContent"),
  syncConfigDialog: document.querySelector("#syncConfigDialog"),
  syncConfigForm: document.querySelector("#syncConfigForm"),
  syncSetupDialog: document.querySelector("#syncSetupDialog"),
  syncProjectUrl: document.querySelector("#syncProjectUrl"),
  syncAnonKey: document.querySelector("#syncAnonKey"),
  clearSyncConfigBtn: document.querySelector("#clearSyncConfigBtn"),
  openSyncSetupBtn: document.querySelector("#openSyncSetupBtn"),
  openSyncConfigBtn: document.querySelector("#openSyncConfigBtn"),
  syncSettingsState: document.querySelector("#syncSettingsState"),
  syncSettingsDescription: document.querySelector("#syncSettingsDescription"),
  elderTickState: document.querySelector("#elderTickState"),
  elderTickCountdown: document.querySelector("#elderTickCountdown"),
  elderTickDescription: document.querySelector("#elderTickDescription"),
  elderTickResetBtn: document.querySelector("#elderTickResetBtn"),
  elderTickForceResetBtn: document.querySelector("#elderTickForceResetBtn"),
  elderTickAccountList: document.querySelector("#elderTickAccountList"),
  backupStats: document.querySelector("#backupStats"),
  backupHealthStatus: document.querySelector("#backupHealthStatus"),
  personalPlayerSelect: document.querySelector("#personalPlayerSelect"),
  primaryAccountSelect: document.querySelector("#primaryAccountSelect"),
  personalPlayerDescription: document.querySelector("#personalPlayerDescription"),
  setupChecklist: document.querySelector("#setupChecklist"),
  dataQualityList: document.querySelector("#dataQualityList"),
  recentlyChangedList: document.querySelector("#recentlyChangedList"),
  undoChangeBtn: document.querySelector("#undoChangeBtn"),
  openChangelogBtn: document.querySelector("#openChangelogBtn"),
  appVersionLabel: document.querySelector("#appVersionLabel"),
  importFile: document.querySelector("#importFile"),
  importPreviewDialog: document.querySelector("#importPreviewDialog"),
  importPreviewContent: document.querySelector("#importPreviewContent"),
  geneticsImageFile: document.querySelector("#geneticsImageFile"),
  geneticsImportStatus: document.querySelector("#geneticsImportStatus"),
  skinTurntableDialog: document.querySelector("#skinTurntableDialog"),
  skinTurntableTitle: document.querySelector("#skinTurntableTitle"),
  skinTurntableVideo: document.querySelector("#skinTurntableVideo"),
  changelogDialog: document.querySelector("#changelogDialog"),
  changelogContent: document.querySelector("#changelogContent"),
  updateProgressDialog: document.querySelector("#updateProgressDialog"),
  updateProgressTitle: document.querySelector("#updateProgressTitle"),
  updateProgressPercent: document.querySelector("#updateProgressPercent"),
  updateProgressVersion: document.querySelector("#updateProgressVersion"),
  updateProgressBar: document.querySelector("#updateProgressBar"),
  updateProgressBytes: document.querySelector("#updateProgressBytes"),
  updateProgressSpeed: document.querySelector("#updateProgressSpeed"),
  updateProgressDescription: document.querySelector("#updateProgressDescription"),
  installDownloadedUpdateBtn: document.querySelector("#installDownloadedUpdateBtn"),
  speciesOptions: document.querySelector("#speciesOptions"),
  skinOptions: document.querySelector("#skinOptions"),
  accountOptions: document.querySelector("#accountOptions"),
  lineageNameOptions: document.querySelector("#lineageNameOptions"),
  clearDragonsBtn: document.querySelector("#clearDragonsBtn"),
  factoryResetBtn: document.querySelector("#factoryResetBtn"),
  toast: document.querySelector("#toast")
};

init();

function init() {
  const removedLegacyClanCopies = removeClanImportedLocalCopies();
  const derivedChanged = refreshAllDerivedRecords();
  if (removedLegacyClanCopies || derivedChanged) saveState({ skipHistory: true });
  lastKnownStateText = localStorage.getItem(STORAGE_KEY) || "";
  renderAppVersion();
  buildStaticSelects();
  bindEvents();
  bindDesktopUpdateStatus();
  startAutoSync();
  renderAll();
  startElderTickCountdown();
  setTab(startupTab(), { replaceHash: true, preserveView: true });
  bindDesktopAuthCallbacks();
  bindBrowserAuthCallback();
  void refreshClanSync({ quiet: true });
  maybeShowChangelog();
}

function buildStarterSkins() {
  const skins = [];

  ALL_SPECIES_SKINS.forEach(([name, type, source, recipeA = "", recipeB = "", notes = "", owned = false]) => {
    skins.push(starterSkin(name, type, "All", source, recipeA, recipeB, notes, owned));
  });

  SPECIES_SKIN_GROUPS.forEach((group) => {
    group.skins.forEach(([name, type, source, recipeA = "", recipeB = "", notes = ""]) => {
      if (ALL_SPECIES_SKIN_NAMES.has(name)) return;
      skins.push(starterSkin(name, type, group.species, source, recipeA, recipeB, notes));
    });
  });

  VISIBLE_FORUM_POST_SKINS.forEach(([species, name, type, source]) => {
    skins.push(starterSkin(name, type, species, source));
  });

  return dedupeSkins(skins);
}

function starterSkin(name, type, species, source, recipeA = "", recipeB = "", notes = "", owned = false) {
  return { name, type, species: canonicalSpeciesName(species), source, recipeA, recipeB, owned, notes };
}

function dedupeSkins(skins) {
  const byKey = new Map();
  skins.forEach((skin) => {
    const key = skinKey(skin);
    if (!byKey.has(key)) byKey.set(key, skin);
  });
  return [...byKey.values()];
}

function loadState() {
  const fallback = createDefaultState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return normalizeState(parsed);
  } catch (error) {
    console.warn("Could not load saved tracker data", error);
    return fallback;
  }
}

function createDefaultState() {
  const now = new Date().toISOString();
  return {
    version: 1,
    createdAt: now,
    updatedAt: now,
    dragons: [],
    accounts: [],
    upstats: [],
    lineageRecords: [],
    mapPins: [],
    broodPouch: [],
    skins: STARTER_SKINS.map((skin) => ({
      id: uid("skin"),
      createdAt: now,
      updatedAt: now,
      ...skin
    })),
    settings: {
      species: DEFAULT_SPECIES,
      statFields: STAT_FIELDS,
      skipClanShareConfirmation: false,
      autoImportOwnDiscordSubmissions: false,
      elderTickStartedAt: "",
      elderTickAccounts: {},
      favoriteMapAreas: [],
      personalPlayer: "",
      primaryAccountId: "",
      playerAliases: {},
      lastBackupAt: ""
    }
  };
}

function normalizeState(input = {}) {
  const base = createDefaultState();
  const dragons = Array.isArray(input.dragons) ? input.dragons.map(normalizeDragon) : [];
  const accounts = mergeAccounts(
    Array.isArray(input.accounts) ? input.accounts.map(normalizeAccount) : [],
    dragons
  );
  attachAccountsToDragons(dragons, accounts);
  const skins = Array.isArray(input.skins)
    ? mergeSkinCatalog(input.skins, base.skins)
    : base.skins;
  const upstats = Array.isArray(input.upstats) ? input.upstats.map(normalizeUpstat) : [];
  const lineageRecords = Array.isArray(input.lineageRecords) ? input.lineageRecords.map(normalizeLineageRecord) : [];
  const mapPins = Array.isArray(input.mapPins) ? input.mapPins.map(normalizeMapPin) : [];
  const dragonIds = new Set(dragons.map((dragon) => dragon.id));
  const broodPouch = Array.isArray(input.broodPouch)
    ? input.broodPouch.map(normalizeBroodPouchEntry).filter((entry) => dragonIds.has(entry.dragonId))
    : [];

  const personalPlayer = normalizePersonalPlayer(input.settings?.personalPlayer, accounts);
  return {
    version: 1,
    createdAt: input.createdAt || base.createdAt,
    updatedAt: input.updatedAt || new Date().toISOString(),
    dragons,
    accounts,
    upstats,
    lineageRecords,
    mapPins,
    broodPouch,
    skins,
    settings: {
      species: mergeSpecies(input.settings?.species || []),
      statFields: STAT_FIELDS,
      skipClanShareConfirmation: Boolean(input.settings?.skipClanShareConfirmation),
      autoImportOwnDiscordSubmissions: Boolean(input.settings?.autoImportOwnDiscordSubmissions),
      elderTickStartedAt: normalizeElderTickStartedAt(input.settings?.elderTickStartedAt),
      elderTickAccounts: normalizeElderTickAccounts(input.settings?.elderTickAccounts, accounts),
      favoriteMapAreas: normalizeFavoriteMapAreas(input.settings?.favoriteMapAreas),
      personalPlayer,
      primaryAccountId: normalizePrimaryAccountId(input.settings?.primaryAccountId, personalPlayer, accounts),
      playerAliases: normalizePlayerAliases(input.settings?.playerAliases, accounts),
      lastBackupAt: normalizeOptionalIso(input.settings?.lastBackupAt)
    }
  };
}

function normalizeElderTickStartedAt(value) {
  const timestamp = Date.parse(text(value));
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : "";
}

function normalizeOptionalIso(value) {
  const timestamp = Date.parse(text(value));
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : "";
}

function normalizePersonalPlayer(value, accounts = state?.accounts || []) {
  return findDirectPlayerName(value, accounts);
}

function playerNameKey(value) {
  return text(value).toLowerCase();
}

function findDirectPlayerName(value, accounts = state?.accounts || []) {
  const key = playerNameKey(value);
  if (!key) return "";
  return accounts.find((account) => playerNameKey(account.username) === key)?.username || "";
}

function resolvePlayerAlias(value, accounts = state?.accounts || [], aliases = state?.settings?.playerAliases || {}) {
  const key = playerNameKey(value);
  if (!key) return "";
  return findDirectPlayerName(aliases?.[key], accounts);
}

function resolvePlayerName(value, accounts = state?.accounts || [], aliases = state?.settings?.playerAliases || {}) {
  return resolvePlayerAlias(value, accounts, aliases) || findDirectPlayerName(value, accounts) || text(value);
}

function normalizePlayerAliases(value, accounts = []) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value)
    .map(([alias, player]) => {
      const aliasKey = playerNameKey(alias);
      const canonicalPlayer = findDirectPlayerName(player, accounts);
      return [aliasKey, canonicalPlayer];
    })
    .filter(([aliasKey, player]) => aliasKey && player && aliasKey !== playerNameKey(player)));
}

function normalizeElderTickAccounts(value, accounts = []) {
  if (!value || typeof value !== "object") return {};
  const accountIds = new Set(accounts.map((account) => account.id));
  return Object.fromEntries(Object.entries(value)
    .map(([accountId, startedAt]) => [text(accountId), normalizeOptionalIso(startedAt)])
    .filter(([accountId, startedAt]) => accountId && startedAt && (!accountIds.size || accountIds.has(accountId))));
}

function normalizeFavoriteMapAreas(value) {
  const validIds = new Set(MAP_REFERENCE_AREAS.map((area) => area.id));
  return mergeUniqueStrings([], Array.isArray(value) ? value : [])
    .filter((areaId) => validIds.has(areaId));
}

function normalizeAccount(account) {
  const now = new Date().toISOString();
  const username = text(account.username || account.userName || account.user || account.player);
  const accountName = text(account.accountName || account.account || account.name);
  return {
    id: text(account.id) || uid("account"),
    createdAt: account.createdAt || now,
    updatedAt: account.updatedAt || now,
    username: username || "Unknown Player",
    accountName: accountName || "Unnamed Account",
    discord: text(account.discord || account.discordName || account.discordId),
    steam: text(account.steam || account.steamId || account.steamProfile),
    dlc: normalizeDlc(account.dlc),
    clanImported: Boolean(account.clanImported)
  };
}

function normalizeDlc(value = {}) {
  const source = value && typeof value === "object" ? value : {};
  const normalized = Object.fromEntries(DLC_OPTIONS.map((option) => [option.key, Boolean(source[option.key])]));
  DLC_LEGACY_ALIASES.forEach((targets, legacyKey) => {
    if (!source[legacyKey]) return;
    targets.forEach((target) => {
      normalized[target] = true;
    });
  });
  return normalized;
}

function mergeAccounts(accounts, dragons) {
  const byId = new Map();
  const byIdentity = new Map();

  const addAccount = (rawAccount) => {
    const hasDlcData = Object.prototype.hasOwnProperty.call(rawAccount || {}, "dlc");
    const account = normalizeAccount(rawAccount);
    const identity = accountIdentityKey(account.username, account.accountName);
    const existing = byId.get(account.id) || byIdentity.get(identity);
    if (existing) {
      existing.username = account.username;
      existing.accountName = account.accountName;
      existing.discord = account.discord || existing.discord || "";
      existing.steam = account.steam || existing.steam || "";
      existing.dlc = hasDlcData ? normalizeDlc(account.dlc) : normalizeDlc(existing.dlc);
      existing.updatedAt = newerTimestamp(existing.updatedAt, account.updatedAt);
      byId.set(existing.id, existing);
      byIdentity.set(accountIdentityKey(existing.username, existing.accountName), existing);
      return existing;
    }

    byId.set(account.id, account);
    byIdentity.set(identity, account);
    return account;
  };

  accounts.forEach(addAccount);
  dragons.forEach((dragon) => {
    addAccount({
      id: dragon.accountId || "",
      username: dragon.username || "Unknown Player",
      accountName: dragon.accountName || dragon.name
    });
  });

  return [...byId.values()].sort((a, b) => sortText(a.username, b.username) || sortText(a.accountName, b.accountName));
}

function attachAccountsToDragons(dragons, accounts) {
  dragons.forEach((dragon) => {
    const account = accounts.find((item) => item.id === dragon.accountId)
      || accounts.find((item) => accountIdentityKey(item.username, item.accountName) === accountIdentityKey(dragon.username || "Unknown Player", dragon.accountName || dragon.name));
    if (!account) return;
    dragon.accountId = account.id;
    dragon.username = account.username;
    dragon.accountName = account.accountName;
    dragon.name = account.accountName;
  });
}

function mergeImportedState(currentInput, incomingInput) {
  const current = normalizeState(currentInput);
  const incoming = normalizeState(incomingInput);
  const accountIdMap = new Map(current.accounts.map((account) => [account.id, account.id]));
  const dragonIdMap = new Map(current.dragons.map((dragon) => [dragon.id, dragon.id]));
  const accounts = mergeAccountDatasets(current.accounts, incoming.accounts, accountIdMap);
  const dragons = mergeDragonDatasets(current.dragons, incoming.dragons, accounts, accountIdMap, dragonIdMap);
  const broodPouch = mergeBroodPouchDatasets(current.broodPouch, incoming.broodPouch, dragonIdMap, dragons);

  remapDragonParentIds(dragons, dragonIdMap);
  attachAccountsToDragons(dragons, accounts);
  const personalPlayer = normalizePersonalPlayer(current.settings?.personalPlayer || incoming.settings?.personalPlayer, accounts);
  const incomingPrimaryAccountId = accountIdMap.get(incoming.settings?.primaryAccountId) || incoming.settings?.primaryAccountId;
  const primaryAccountId = normalizePrimaryAccountId(
    current.settings?.primaryAccountId || incomingPrimaryAccountId,
    personalPlayer,
    accounts
  );

  return normalizeState({
    version: 1,
    createdAt: olderTimestamp(current.createdAt, incoming.createdAt),
    updatedAt: new Date().toISOString(),
    dragons,
    accounts,
    skins: mergeSkinImportCatalog(current.skins, incoming.skins),
    upstats: mergeUpstatDatasets(current.upstats, incoming.upstats, accountIdMap),
    lineageRecords: mergeRecordDatasets(current.lineageRecords, incoming.lineageRecords, lineageRecordIdentityKey, mergeLineageRecord, normalizeLineageRecord),
    mapPins: mergeRecordDatasets(current.mapPins, incoming.mapPins, mapPinIdentityKey, mergeMapPin, normalizeMapPin),
    broodPouch,
    settings: {
      species: mergeSpecies([...(current.settings?.species || []), ...(incoming.settings?.species || [])]),
      statFields: STAT_FIELDS,
      skipClanShareConfirmation: Boolean(current.settings?.skipClanShareConfirmation || incoming.settings?.skipClanShareConfirmation),
      autoImportOwnDiscordSubmissions: Boolean(current.settings?.autoImportOwnDiscordSubmissions),
      elderTickStartedAt: current.settings?.elderTickStartedAt || incoming.settings?.elderTickStartedAt || "",
      elderTickAccounts: mergeElderTickAccounts(current.settings?.elderTickAccounts, incoming.settings?.elderTickAccounts),
      favoriteMapAreas: mergeUniqueStrings(current.settings?.favoriteMapAreas, incoming.settings?.favoriteMapAreas)
        .filter((areaId) => MAP_REFERENCE_AREAS.some((area) => area.id === areaId)),
      personalPlayer,
      primaryAccountId,
      playerAliases: normalizePlayerAliases({
        ...(incoming.settings?.playerAliases || {}),
        ...(current.settings?.playerAliases || {})
      }, accounts),
      lastBackupAt: newerTimestamp(current.settings?.lastBackupAt, incoming.settings?.lastBackupAt) || ""
    }
  });
}

function mergeElderTickAccounts(current = {}, incoming = {}) {
  const keys = new Set([...Object.keys(current || {}), ...Object.keys(incoming || {})]);
  return Object.fromEntries([...keys].map((key) => {
    const next = newerTimestamp(current?.[key], incoming?.[key]) || current?.[key] || incoming?.[key] || "";
    return [key, next];
  }).filter(([, value]) => Boolean(value)));
}

function mergeAccountDatasets(currentAccounts, incomingAccounts, accountIdMap) {
  const byId = new Map();
  const byIdentity = new Map();

  const remember = (account) => {
    byId.set(account.id, account);
    byIdentity.set(accountIdentityKey(account.username, account.accountName), account);
  };

  currentAccounts.map(normalizeAccount).forEach((account) => {
    accountIdMap.set(account.id, account.id);
    remember(account);
  });

  incomingAccounts.map(normalizeAccount).forEach((incoming) => {
    const existing = byId.get(incoming.id)
      || byIdentity.get(accountIdentityKey(incoming.username, incoming.accountName));
    if (!existing) {
      accountIdMap.set(incoming.id, incoming.id);
      remember(incoming);
      return;
    }

    const merged = mergeAccountRecord(existing, incoming);
    Object.assign(existing, merged);
    accountIdMap.set(incoming.id, existing.id);
    remember(existing);
  });

  return [...byId.values()].sort((a, b) => sortText(a.username, b.username) || sortText(a.accountName, b.accountName));
}

function mergeAccountRecord(existing, incoming) {
  const preferIncoming = isNewerRecord(incoming, existing);
  return {
    ...existing,
    createdAt: olderTimestamp(existing.createdAt, incoming.createdAt),
    updatedAt: newerTimestamp(existing.updatedAt, incoming.updatedAt),
    username: chooseImportText(existing.username, incoming.username, preferIncoming, ["Unknown Player"]),
    accountName: chooseImportText(existing.accountName, incoming.accountName, preferIncoming, ["Unnamed Account"]),
    discord: chooseImportText(existing.discord, incoming.discord, preferIncoming),
    steam: chooseImportText(existing.steam, incoming.steam, preferIncoming),
    dlc: mergeDlcValues(existing.dlc, incoming.dlc),
    clanImported: Boolean(existing.clanImported && incoming.clanImported)
  };
}

function mergeDragonDatasets(currentDragons, incomingDragons, accounts, accountIdMap, dragonIdMap) {
  const byId = new Map();
  const byIdentity = new Map();

  const remember = (dragon) => {
    byId.set(dragon.id, dragon);
    byIdentity.set(dragonIdentityKey(dragon), dragon);
  };

  currentDragons.map(normalizeDragon).forEach((dragon) => {
    alignDragonToMergedAccount(dragon, accounts, accountIdMap);
    dragonIdMap.set(dragon.id, dragon.id);
    remember(dragon);
  });

  incomingDragons.map(normalizeDragon).forEach((incoming) => {
    alignDragonToMergedAccount(incoming, accounts, accountIdMap);
    const existing = byId.get(incoming.id) || byIdentity.get(dragonIdentityKey(incoming));
    if (!existing) {
      dragonIdMap.set(incoming.id, incoming.id);
      remember(incoming);
      return;
    }

    const merged = mergeDragonRecord(existing, incoming);
    Object.assign(existing, merged);
    dragonIdMap.set(incoming.id, existing.id);
    remember(existing);
  });

  return [...byId.values()].sort((a, b) => sortText(a.username, b.username) || sortText(a.accountName, b.accountName) || sortText(a.species, b.species));
}

function alignDragonToMergedAccount(dragon, accounts, accountIdMap) {
  if (dragon.accountId && accountIdMap.has(dragon.accountId)) {
    dragon.accountId = accountIdMap.get(dragon.accountId);
  }
  const account = accounts.find((item) => item.id === dragon.accountId)
    || accounts.find((item) => accountIdentityKey(item.username, item.accountName) === accountIdentityKey(dragon.username || "Unknown Player", dragon.accountName || dragon.name));
  if (!account) return;
  dragon.accountId = account.id;
  dragon.username = account.username;
  dragon.accountName = account.accountName;
  dragon.name = account.accountName;
}

function mergeDragonRecord(existing, incoming) {
  const preferIncoming = isNewerRecord(incoming, existing);
  const mergedStats = {};
  STAT_FIELDS.forEach((field) => {
    mergedStats[field.key] = chooseImportGrade(existing.stats?.[field.key], incoming.stats?.[field.key], preferIncoming);
  });

  return {
    ...existing,
    createdAt: olderTimestamp(existing.createdAt, incoming.createdAt),
    updatedAt: newerTimestamp(existing.updatedAt, incoming.updatedAt),
    accountId: chooseImportText(existing.accountId, incoming.accountId, preferIncoming),
    username: chooseImportText(existing.username, incoming.username, preferIncoming, ["Unknown Player"]),
    accountName: chooseImportText(existing.accountName, incoming.accountName, preferIncoming, ["Unnamed Account"]),
    name: chooseImportText(existing.name, incoming.name, preferIncoming, ["Unnamed Account"]),
    species: chooseImportText(existing.species, incoming.species, preferIncoming),
    sex: chooseImportText(existing.sex, incoming.sex, preferIncoming, ["Unknown"]),
    status: chooseImportText(existing.status, incoming.status, preferIncoming),
    nestRole: chooseImportText(existing.nestRole, incoming.nestRole, preferIncoming, ["Unknown"]),
    server: chooseImportText(existing.server, incoming.server, preferIncoming),
    skin: chooseImportText(existing.skin, incoming.skin, preferIncoming),
    skinType: chooseImportText(existing.skinType, incoming.skinType, preferIncoming, ["Unknown"]),
    recessiveSkin: chooseImportText(existing.recessiveSkin, incoming.recessiveSkin, preferIncoming),
    motherId: chooseImportText(existing.motherId, incoming.motherId, preferIncoming),
    fatherId: chooseImportText(existing.fatherId, incoming.fatherId, preferIncoming),
    motherName: chooseImportText(existing.motherName, incoming.motherName, preferIncoming),
    fatherName: chooseImportText(existing.fatherName, incoming.fatherName, preferIncoming),
    bloodline: chooseImportGrade(existing.bloodline, incoming.bloodline, preferIncoming),
    stats: mergedStats,
    dominantMutation: chooseImportBoolean(existing.dominantMutation, incoming.dominantMutation, preferIncoming),
    growth: chooseImportNumber(existing.growth, incoming.growth, preferIncoming),
    elderProgress: chooseImportNumber(existing.elderProgress, incoming.elderProgress, preferIncoming),
    mutationPoints: chooseImportNumber(existing.mutationPoints, incoming.mutationPoints, preferIncoming),
    socialPoints: chooseImportNumber(existing.socialPoints, incoming.socialPoints, preferIncoming),
    agilePoints: chooseImportNumber(existing.agilePoints, incoming.agilePoints, preferIncoming),
    fastMutation: chooseImportBoolean(existing.fastMutation, incoming.fastMutation, preferIncoming),
    scavengerPoints: chooseImportNumber(existing.scavengerPoints, incoming.scavengerPoints, preferIncoming),
    survivorMutation: chooseImportBoolean(existing.survivorMutation, incoming.survivorMutation, preferIncoming),
    remainingMutationPoints: chooseImportNumber(existing.remainingMutationPoints, incoming.remainingMutationPoints, preferIncoming),
    birthDate: chooseImportText(existing.birthDate, incoming.birthDate, preferIncoming),
    tags: mergeUniqueStrings(existing.tags, incoming.tags),
    notes: mergeTextBlocks(existing.notes, incoming.notes),
    clanImported: Boolean(existing.clanImported && incoming.clanImported),
    clanShareKey: existing.clanImported && incoming.clanImported
      ? chooseImportText(existing.clanShareKey, incoming.clanShareKey, preferIncoming)
      : "",
    clanShareKeys: existing.clanImported && incoming.clanImported
      ? mergeUniqueStrings(
        [...(Array.isArray(existing.clanShareKeys) ? existing.clanShareKeys : []), existing.clanShareKey],
        [...(Array.isArray(incoming.clanShareKeys) ? incoming.clanShareKeys : []), incoming.clanShareKey]
      )
      : [],
    clanShareClanId: existing.clanImported && incoming.clanImported
      ? chooseImportText(existing.clanShareClanId, incoming.clanShareClanId, preferIncoming)
      : "",
    clanShareUpdatedAt: existing.clanImported && incoming.clanImported
      ? chooseImportText(existing.clanShareUpdatedAt, incoming.clanShareUpdatedAt, preferIncoming)
      : ""
  };
}

function mergeBroodPouchDatasets(currentEntries, incomingEntries, dragonIdMap, dragons) {
  const remapEntry = (entry) => normalizeBroodPouchEntry({
    ...entry,
    dragonId: dragonIdMap.get(text(entry?.dragonId || entry?.eggId)) || text(entry?.dragonId || entry?.eggId)
  });
  const merged = mergeRecordDatasets(
    (currentEntries || []).map(remapEntry),
    (incomingEntries || []).map(remapEntry),
    broodPouchIdentityKey,
    mergeBroodPouchEntry,
    normalizeBroodPouchEntry
  );
  const dragonIds = new Set(dragons.map((dragon) => dragon.id));
  return merged.filter((entry) => dragonIds.has(entry.dragonId));
}

function mergeBroodPouchEntry(existing, incoming) {
  const preferIncoming = isNewerRecord(incoming, existing);
  return {
    ...existing,
    createdAt: olderTimestamp(existing.createdAt, incoming.createdAt),
    updatedAt: newerTimestamp(existing.updatedAt, incoming.updatedAt),
    dragonId: chooseImportText(existing.dragonId, incoming.dragonId, preferIncoming),
    brood: chooseImportText(existing.brood, incoming.brood, preferIncoming, ["Unassigned brood"]),
    dueAt: chooseImportText(existing.dueAt, incoming.dueAt, preferIncoming),
    oddsSummary: chooseImportText(existing.oddsSummary, incoming.oddsSummary, preferIncoming),
    notes: mergeTextBlocks(existing.notes, incoming.notes)
  };
}

function remapDragonParentIds(dragons, dragonIdMap) {
  dragons.forEach((dragon) => {
    if (dragon.motherId && dragonIdMap.has(dragon.motherId)) dragon.motherId = dragonIdMap.get(dragon.motherId);
    if (dragon.fatherId && dragonIdMap.has(dragon.fatherId)) dragon.fatherId = dragonIdMap.get(dragon.fatherId);
  });
}

function mergeSkinImportCatalog(currentSkins, incomingSkins) {
  const byKey = new Map();
  mergeSkinCatalog(currentSkins, STARTER_SKINS).forEach((skin) => byKey.set(skinKey(skin), skin));
  mergeSkinCatalog(incomingSkins, STARTER_SKINS).forEach((incoming) => {
    const key = skinKey(incoming);
    const existing = byKey.get(key);
    byKey.set(key, existing ? mergeSkinRecord(existing, incoming) : incoming);
  });
  return [...byKey.values()].sort((a, b) => sortText(a.species, b.species) || sortText(a.name, b.name));
}

function mergeSkinRecord(existing, incoming) {
  const preferIncoming = isNewerRecord(incoming, existing);
  return {
    ...existing,
    createdAt: olderTimestamp(existing.createdAt, incoming.createdAt),
    updatedAt: newerTimestamp(existing.updatedAt, incoming.updatedAt),
    name: chooseImportText(existing.name, incoming.name, preferIncoming, ["Unnamed Skin"]),
    type: chooseImportText(existing.type, incoming.type, preferIncoming, ["Unknown"]),
    species: chooseImportText(existing.species, incoming.species, preferIncoming),
    source: chooseImportText(existing.source, incoming.source, preferIncoming),
    recipeA: chooseImportText(existing.recipeA, incoming.recipeA, preferIncoming),
    recipeB: chooseImportText(existing.recipeB, incoming.recipeB, preferIncoming),
    owned: Boolean(existing.owned || incoming.owned),
    wishlist: Boolean(existing.wishlist || incoming.wishlist),
    notes: mergeTextBlocks(existing.notes, incoming.notes)
  };
}

function mergeUpstatDatasets(currentUpstats, incomingUpstats, accountIdMap) {
  const normalizedIncoming = incomingUpstats.map((record) => normalizeUpstat({
    ...record,
    accountId: accountIdMap.get(record.accountId) || record.accountId
  }));
  return mergeRecordDatasets(currentUpstats, normalizedIncoming, upstatIdentityKey, mergeUpstatRecord, normalizeUpstat);
}

function mergeRecordDatasets(currentRecords, incomingRecords, keyFn, mergeFn, normalizeFn) {
  const byId = new Map();
  const byIdentity = new Map();

  const remember = (record) => {
    byId.set(record.id, record);
    byIdentity.set(keyFn(record), record);
  };

  currentRecords.map(normalizeFn).forEach(remember);
  incomingRecords.map(normalizeFn).forEach((incoming) => {
    const existing = byId.get(incoming.id) || byIdentity.get(keyFn(incoming));
    if (!existing) {
      remember(incoming);
      return;
    }
    Object.assign(existing, mergeFn(existing, incoming));
    remember(existing);
  });

  return [...byId.values()];
}

function mergeUpstatRecord(existing, incoming) {
  const preferIncoming = isNewerRecord(incoming, existing);
  const complete = Boolean(existing.complete || incoming.complete);
  const aPlusCount = complete ? 18 : Math.max(clampInteger(existing.aPlusCount, 0, 18), clampInteger(incoming.aPlusCount, 0, 18));
  return {
    ...existing,
    createdAt: olderTimestamp(existing.createdAt, incoming.createdAt),
    updatedAt: newerTimestamp(existing.updatedAt, incoming.updatedAt),
    species: chooseImportText(existing.species, incoming.species, preferIncoming),
    skin: chooseImportText(existing.skin, incoming.skin, preferIncoming, ["Unknown Skin"]),
    status: complete ? "18A+ Complete" : chooseImportText(existing.status, incoming.status, preferIncoming),
    aPlusCount,
    accountId: chooseImportText(existing.accountId, incoming.accountId, preferIncoming),
    complete,
    notes: mergeTextBlocks(existing.notes, incoming.notes)
  };
}

function mergeLineageRecord(existing, incoming) {
  const preferIncoming = isNewerRecord(incoming, existing);
  return {
    ...existing,
    createdAt: olderTimestamp(existing.createdAt, incoming.createdAt),
    updatedAt: newerTimestamp(existing.updatedAt, incoming.updatedAt),
    name: chooseImportText(existing.name, incoming.name, preferIncoming, ["Unknown Parent"]),
    sex: chooseImportText(existing.sex, incoming.sex, preferIncoming, ["Unknown"]),
    species: chooseImportText(existing.species, incoming.species, preferIncoming),
    skin: chooseImportText(existing.skin, incoming.skin, preferIncoming),
    bloodline: chooseImportGrade(existing.bloodline, incoming.bloodline, preferIncoming),
    motherName: chooseImportText(existing.motherName, incoming.motherName, preferIncoming),
    fatherName: chooseImportText(existing.fatherName, incoming.fatherName, preferIncoming),
    notes: mergeTextBlocks(existing.notes, incoming.notes)
  };
}

function mergeMapPin(existing, incoming) {
  const preferIncoming = isNewerRecord(incoming, existing);
  return {
    ...existing,
    createdAt: olderTimestamp(existing.createdAt, incoming.createdAt),
    updatedAt: newerTimestamp(existing.updatedAt, incoming.updatedAt),
    label: chooseImportText(existing.label, incoming.label, preferIncoming, ["Shared location"]),
    type: chooseImportText(existing.type, incoming.type, preferIncoming),
    x: chooseImportNumber(existing.x, incoming.x, preferIncoming),
    y: chooseImportNumber(existing.y, incoming.y, preferIncoming),
    notes: mergeTextBlocks(existing.notes, incoming.notes),
    sharedBy: chooseImportText(existing.sharedBy, incoming.sharedBy, preferIncoming)
  };
}

function dragonIdentityKey(dragon) {
  return `${accountIdentityKey(dragon.username || "Unknown Player", dragon.accountName || dragon.name)}::${canonicalSpeciesName(dragon.species).toLowerCase()}`;
}

function upstatIdentityKey(record) {
  return `${canonicalSpeciesName(record.species).toLowerCase()}::${canonicalSkinName(record.skin)}::${text(record.accountId).toLowerCase()}`;
}

function lineageRecordIdentityKey(record) {
  return `${text(record.name).toLowerCase()}::${canonicalSpeciesName(record.species).toLowerCase()}::${text(record.sex).toLowerCase()}`;
}

function mapPinIdentityKey(pin) {
  return `${text(pin.label).toLowerCase()}::${text(pin.type).toLowerCase()}::${Number(pin.x).toFixed(3)}::${Number(pin.y).toFixed(3)}`;
}

function mergeDlcValues(existing = {}, incoming = {}) {
  const current = normalizeDlc(existing);
  const next = normalizeDlc(incoming);
  return Object.fromEntries(DLC_OPTIONS.map((option) => [option.key, Boolean(current[option.key] || next[option.key])]));
}

function chooseImportText(existing, incoming, preferIncoming, emptyValues = []) {
  const current = text(existing);
  const next = text(incoming);
  const isEmpty = (value) => !text(value) || emptyValues.includes(text(value));
  if (preferIncoming && !isEmpty(next)) return next;
  if (!isEmpty(current)) return current;
  return next;
}

function chooseImportGrade(existing, incoming, preferIncoming) {
  return chooseImportText(existing, incoming, preferIncoming, ["Unknown"]);
}

function chooseImportNumber(existing, incoming, preferIncoming) {
  const current = Number(existing);
  const next = Number(incoming);
  if (preferIncoming && Number.isFinite(next)) return next;
  if (Number.isFinite(current)) return current;
  return Number.isFinite(next) ? next : 0;
}

function chooseImportBoolean(existing, incoming, preferIncoming) {
  return preferIncoming ? Boolean(incoming) : Boolean(existing || incoming);
}

function mergeUniqueStrings(existing = [], incoming = []) {
  return [...new Set([...(Array.isArray(existing) ? existing : splitTags(existing)), ...(Array.isArray(incoming) ? incoming : splitTags(incoming))]
    .map(text)
    .filter(Boolean))];
}

function mergeTextBlocks(existing, incoming) {
  const blocks = [text(existing), text(incoming)].filter(Boolean);
  return [...new Set(blocks)].join("\n");
}

function isNewerRecord(incoming, existing) {
  return new Date(incoming?.updatedAt || 0).getTime() > new Date(existing?.updatedAt || 0).getTime();
}

function olderTimestamp(a, b) {
  const aTime = new Date(a || 0).getTime();
  const bTime = new Date(b || 0).getTime();
  if (!aTime) return b || a;
  if (!bTime) return a || b;
  return aTime <= bTime ? a : b;
}

function mergeSkinCatalog(savedSkins, starterSkins) {
  const byKey = new Map();
  const savedNormalized = savedSkins.map(normalizeSkin);
  const ownedByName = new Set(savedNormalized
    .filter((skin) => skin.owned && SHARED_STARTER_SKIN_NAMES.has(skin.name))
    .map((skin) => canonicalSkinName(skin.name)));

  starterSkins.map(normalizeSkin).forEach((skin) => {
    if (ownedByName.has(canonicalSkinName(skin.name))) skin.owned = true;
    byKey.set(skinKey(skin), skin);
  });

  savedNormalized.forEach((saved) => {
    if (isDeprecatedStarterSkin(saved)) return;

    const key = skinKey(saved);
    const starter = byKey.get(key);
    if (!starter) {
      byKey.set(key, saved);
      return;
    }

    const merged = {
      ...starter,
      ...saved,
      type: saved.type !== "Unknown" ? saved.type : starter.type,
      source: shouldUseStarterSkinSource(saved, starter) ? starter.source : saved.source,
      recipeA: saved.recipeA || starter.recipeA,
      recipeB: saved.recipeB || starter.recipeB,
      owned: saved.owned || starter.owned,
      wishlist: Boolean(saved.wishlist || starter.wishlist)
    };

    if (shouldUseStarterMutationDefinition(starter)) {
      merged.source = starter.source;
      merged.recipeA = starter.recipeA;
      merged.recipeB = starter.recipeB;
    }

    byKey.set(key, merged);
  });

  return [...byKey.values()].sort((a, b) => sortText(a.species, b.species) || sortText(a.name, b.name));
}

function isDeprecatedStarterSkin(skin) {
  const species = canonicalSpeciesName(skin.species);
  const key = skinKey(skin);
  if (DEPRECATED_PLACEHOLDER_SKIN_KEYS.has(key)) return true;
  return species !== "All" && SHARED_STARTER_SKIN_NAMES.has(skin.name);
}

function shouldUseStarterSkinSource(saved, starter) {
  if (!saved.source) return true;
  if (!starter.source) return false;
  return saved.source.includes(DISCORD_SKIN_SOURCE)
    || saved.source.includes("Visible forum card in Discord")
    || isOldGeneratedSkinSource(saved.source, starter.source);
}

function isOldGeneratedSkinSource(savedSource, starterSource) {
  const oldSources = new Set([
    "DLC spawnable",
    "DLC Emote Pack spawnable"
  ]);
  return oldSources.has(savedSource) && savedSource !== starterSource;
}

function shouldUseStarterMutationDefinition(starter) {
  return starter.species === "All" && ["albino", "piebald"].includes(canonicalSkinName(starter.name));
}

function skinKey(skin) {
  return `${canonicalSpeciesName(skin.species).toLowerCase()}::${text(skin.name).toLowerCase()}`;
}

function normalizeDragon(dragon) {
  const now = new Date().toISOString();
  const legacyName = text(dragon.name);
  const accountName = text(dragon.accountName || dragon.account || legacyName);
  const username = text(dragon.username || dragon.userName || dragon.user || dragon.player);
  const inputStatus = normalizeDragonStatus(dragon);
  const dominantMutation = Boolean(dragon.dominantMutation);
  const status = normalizeDominantMutationStatus(normalizeStatusForProgress(inputStatus, dragon.elderProgress), dominantMutation);
  const nestRole = normalizeNestRole(dragon.nestRole);
  const growth = normalizeGrowthValue(status, dragon.growth);
  const elderProgress = normalizeElderProgress(status, dragon.elderProgress);
  const mutationPoints = estimateMutationPoints(status, growth, elderProgress);
  const allocation = normalizeMutationAllocation({
    status,
    nestRole,
    mutationPoints,
    socialPoints: dragon.socialPoints,
    dominantMutation,
    agilePoints: dragon.agilePoints,
    fastMutation: dragon.fastMutation,
    scavengerPoints: dragon.scavengerPoints,
    survivorMutation: dragon.survivorMutation
  });
  const stats = {};
  const clanShareKeys = [...new Set([
    ...(Array.isArray(dragon.clanShareKeys) ? dragon.clanShareKeys : []),
    text(dragon.clanShareKey)
  ].map(text).filter(Boolean))];
  STAT_FIELDS.forEach((field) => {
    stats[field.key] = normalizeGrade(dragon.stats?.[field.key]);
  });

  return {
    id: dragon.id || uid("dragon"),
    createdAt: dragon.createdAt || now,
    updatedAt: dragon.updatedAt || now,
    accountId: text(dragon.accountId),
    username,
    accountName: accountName || legacyName || "Unnamed Account",
    name: accountName || legacyName || "Unnamed Account",
    species: canonicalSpeciesName(dragon.species),
    sex: validOption(dragon.sex, SEXES, "Unknown"),
    status,
    nestRole,
    server: text(dragon.server),
    skin: text(dragon.skin),
    skinType: validOption(dragon.skinType, SKIN_TYPES, "Unknown"),
    recessiveSkin: text(dragon.recessiveSkin),
    motherId: text(dragon.motherId),
    fatherId: text(dragon.fatherId),
    motherName: text(dragon.motherName || dragon.manualMother || dragon.mother),
    fatherName: text(dragon.fatherName || dragon.manualFather || dragon.father),
    bloodline: normalizeBloodlineGrade(dragon.bloodline),
    stats,
    dominantMutation: allocation.dominantMutation,
    growth,
    elderProgress,
    mutationPoints,
    socialPoints: allocation.socialPoints,
    agilePoints: allocation.agilePoints,
    fastMutation: allocation.fastMutation,
    scavengerPoints: allocation.scavengerPoints,
    survivorMutation: allocation.survivorMutation,
    remainingMutationPoints: allocation.remainingMutationPoints,
    birthDate: text(dragon.birthDate),
    tags: Array.isArray(dragon.tags) ? dragon.tags.map(text).filter(Boolean) : splitTags(dragon.tags),
    notes: text(dragon.notes),
    clanImported: Boolean(dragon.clanImported),
    clanShareKey: clanShareKeys[0] || "",
    clanShareKeys,
    clanShareClanId: text(dragon.clanShareClanId),
    clanShareUpdatedAt: text(dragon.clanShareUpdatedAt)
  };
}

function normalizeSkin(skin) {
  const now = new Date().toISOString();
  return {
    id: skin.id || uid("skin"),
    createdAt: skin.createdAt || now,
    updatedAt: skin.updatedAt || now,
    name: text(skin.name) || "Unnamed Skin",
    type: validOption(skin.type, SKIN_TYPES, "Unknown"),
    species: canonicalSpeciesName(skin.species) || "All",
    source: text(skin.source),
    recipeA: text(skin.recipeA),
    recipeB: text(skin.recipeB),
    owned: Boolean(skin.owned),
    wishlist: Boolean(skin.wishlist),
    notes: text(skin.notes)
  };
}

function normalizeUpstat(upstat) {
  const now = new Date().toISOString();
  const complete = Boolean(upstat.complete) || normalizeUpstatStatus(upstat.status) === "18A+ Complete" || clampInteger(upstat.aPlusCount ?? upstat.currentAPlusCount, 0, 18) >= 18;
  return {
    id: upstat.id || uid("upstat"),
    createdAt: upstat.createdAt || now,
    updatedAt: upstat.updatedAt || now,
    species: canonicalSpeciesName(upstat.species),
    skin: text(upstat.skin) || "Unknown Skin",
    status: complete ? "18A+ Complete" : normalizeUpstatStatus(upstat.status),
    aPlusCount: complete ? 18 : clampInteger(upstat.aPlusCount ?? upstat.currentAPlusCount, 0, 18),
    accountId: text(upstat.accountId),
    complete,
    notes: text(upstat.notes)
  };
}

function normalizeLineageRecord(record) {
  const now = new Date().toISOString();
  return {
    id: record.id || uid("lineage"),
    createdAt: record.createdAt || now,
    updatedAt: record.updatedAt || now,
    name: text(record.name) || "Unknown Parent",
    sex: validOption(record.sex, SEXES, "Unknown"),
    species: canonicalSpeciesName(record.species),
    skin: text(record.skin),
    bloodline: normalizeBloodlineGrade(record.bloodline),
    motherName: text(record.motherName || record.mother),
    fatherName: text(record.fatherName || record.father),
    notes: text(record.notes)
  };
}

function normalizeMapPin(pin) {
  const now = new Date().toISOString();
  return {
    id: pin.id || uid("pin"),
    createdAt: pin.createdAt || now,
    updatedAt: pin.updatedAt || now,
    label: text(pin.label || pin.name) || "Shared location",
    type: text(pin.type) || "Dragon",
    x: clampPercent(pin.x),
    y: clampPercent(pin.y),
    notes: text(pin.notes),
    sharedBy: text(pin.sharedBy || pin.player)
  };
}

function mergeSpecies(savedSpecies) {
  const byName = new Map();
  [...DEFAULT_SPECIES, ...savedSpecies].forEach((item) => {
    if (!item || !item.name) return;
    const name = canonicalSpeciesName(item.name);
    byName.set(name, {
      name,
      className: item.className || "",
      element: item.element || "",
      diet: item.diet || ""
    });
  });
  return [...byName.values()];
}

function saveState(options = {}) {
  if (!options.skipHistory) pushUndoSnapshot(options.reason || "Tracker change");
  state.updatedAt = new Date().toISOString();
  lastKnownStateText = JSON.stringify(state);
  localStorage.setItem(STORAGE_KEY, lastKnownStateText);
}

function pushUndoSnapshot(reason) {
  const current = localStorage.getItem(STORAGE_KEY);
  if (!current || current === lastKnownStateText && !state.updatedAt) return;
  const history = loadUndoHistory();
  if (history[0]?.data === current) return;
  history.unshift({
    id: uid("undo"),
    reason: text(reason) || "Tracker change",
    createdAt: new Date().toISOString(),
    data: current
  });
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, MAX_UNDO_HISTORY)));
}

function loadUndoHistory() {
  try {
    const parsed = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    return Array.isArray(parsed)
      ? parsed.filter((item) => item?.data && item?.createdAt).slice(0, MAX_UNDO_HISTORY)
      : [];
  } catch (_) {
    return [];
  }
}

function saveUndoHistory(history) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify((history || []).slice(0, MAX_UNDO_HISTORY)));
}

function startAutoSync() {
  if (autoSyncTimer) clearInterval(autoSyncTimer);
  autoSyncTimer = setInterval(() => {
    syncStateFromStorage();
    void refreshClanSync({ quiet: true });
  }, AUTO_SYNC_INTERVAL_MS);
  window.addEventListener("storage", (event) => {
    if (event.key === STORAGE_KEY) syncStateFromStorage();
  });
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      syncStateFromStorage();
      renderElderTick();
    }
  });
}

function startElderTickCountdown() {
  if (elderTickTimer) clearInterval(elderTickTimer);
  elderTickTimer = setInterval(() => {
    renderElderTick();
    renderElderTickAccountList();
    if (currentTab === "breeding" && currentBreedingView === "brood-pouch") renderBroodPouch();
  }, 1000);
}

function syncStateFromStorage() {
  if (document.hidden) return;
  if (document.querySelector("dialog[open]")) return;
  const raw = localStorage.getItem(STORAGE_KEY) || "";
  if (!raw || raw === lastKnownStateText) return;

  try {
    state = normalizeState(JSON.parse(raw));
    const derivedChanged = refreshAllDerivedRecords();
    if (derivedChanged) {
      saveState();
    } else {
      lastKnownStateText = raw;
    }
    renderAll();
  } catch (error) {
    console.warn("Could not sync tracker data", error);
  }
}

function bindEvents() {
  els.tabs.forEach((tab) => tab.addEventListener("click", () => {
    const tabName = tab.dataset.tab;
    if (tabName === "dragons") return setDragonView("collection", { updateHash: true });
    if (tabName === "breeding") return setBreedingView("planner", { updateHash: true });
    if (tabName === "settings") return setSettingsView("general", { updateHash: true });
    setTab(tabName, { updateHash: true });
  }));
  window.addEventListener("hashchange", () => setTab(startupTab(), { replaceHash: false, preserveView: true }));
  document.querySelectorAll("[data-dragon-view]").forEach((button) => button.addEventListener("click", () => setDragonView(button.dataset.dragonView, { updateHash: true })));
  document.querySelectorAll("[data-breeding-view]").forEach((button) => button.addEventListener("click", () => setBreedingView(button.dataset.breedingView, { updateHash: true })));
  document.querySelectorAll("[data-settings-view]").forEach((button) => button.addEventListener("click", () => setSettingsView(button.dataset.settingsView, { updateHash: true })));
  els.globalSearch?.addEventListener("input", renderGlobalSearch);
  els.globalSearchResults?.addEventListener("click", handleGlobalSearchAction);
  document.addEventListener("click", handleDocumentSearchClose);
  els.addDragonBtn.addEventListener("click", () => openDragonDialog());
  els.homeAddAccountBtn?.addEventListener("click", () => openAccountDialog("", { username: normalizePersonalPlayer(state.settings?.personalPlayer, state.accounts) }));
  els.addAccountBtn.addEventListener("click", () => openAccountDialog());
  els.addSkinBtn.addEventListener("click", () => openSkinDialog());
  els.addUpstatBtn?.addEventListener("click", () => openUpstatDialog());

  [els.dragonSearch, els.speciesFilter, els.statusFilter, els.sortBy, els.hideInactive].forEach((control) => {
    control.addEventListener("input", renderDragons);
    control.addEventListener("change", renderDragons);
  });

  els.accountSearch.addEventListener("input", renderAccounts);
  els.accountSearch.addEventListener("change", renderAccounts);

  ["dragonSpecies", "dragonSkin", "dragonRecessiveSkin"].forEach((id) => {
    const control = document.querySelector(`#${id}`);
    control?.addEventListener("change", handleDragonSkinControlChange);
  });

  document.querySelector("#dragonPlayerSelect")?.addEventListener("change", handleDragonPlayerSelectChange);
  document.querySelector("#dragonSet18APlusBtn")?.addEventListener("click", setDragonStatsTo18APlus);

  ["dragonUsername", "dragonAccountName"].forEach((id) => {
    const control = document.querySelector(`#${id}`);
    control?.addEventListener("input", handleDragonAccountFieldChange);
    control?.addEventListener("change", handleDragonAccountFieldChange);
  });

  document.querySelector("#dragonStatus")?.addEventListener("change", handleDragonStatusChange);

  ["dragonNestRole", "dragonElderProgress", "dragonSocialPoints", "dragonDominantMutation", "dragonAgilePoints", "dragonFastMutation", "dragonScavengerPoints", "dragonSurvivorMutation"].forEach((id) => {
    const control = document.querySelector(`#${id}`);
    const syncRoleAndPoints = () => {
      if (id === "dragonNestRole") syncDragonPureSkinFields("dragonSkin");
      syncDragonComputedFields();
    };
    control?.addEventListener("input", syncRoleAndPoints);
    control?.addEventListener("change", syncRoleAndPoints);
  });

  STAT_FIELDS.forEach((field) => {
    const control = document.querySelector(`#stat-${field.key}`);
    control?.addEventListener("change", syncAllAPlusIndicator);
  });

  els.parentOne.addEventListener("change", () => {
    renderNestingOptions();
    renderNesting();
  });
  [els.parentTwo, els.broodWatcherBrooding].forEach((control) => {
    control.addEventListener("change", renderNesting);
  });
  [els.nestTargetSkin, els.nestTargetGrade].forEach((control) => {
    control?.addEventListener("change", renderNesting);
  });

  els.createEggBtn.addEventListener("click", createEggFromPlanner);
  els.nestingOutput?.addEventListener("click", handleNestingOutputAction);

  [els.skinSearch, els.skinSpeciesFilter, els.skinTypeFilter, els.mutatedSkinsOnly].forEach((control) => {
    control.addEventListener("input", renderSkins);
    control.addEventListener("change", renderSkins);
  });

  [els.upstatSearch, els.upstatSpeciesFilter, els.upstatStatusFilter].forEach((control) => {
    control?.addEventListener("input", renderUpstats);
    control?.addEventListener("change", renderUpstats);
  });

  document.querySelector("#upstatSpecies")?.addEventListener("change", () => renderUpstatSkinSelect(document.querySelector("#upstatSpecies")?.value || "", ""));
  document.querySelector("#upstatComplete")?.addEventListener("change", syncUpstatCompleteControls);
  document.querySelector("#upstatAPlusCount")?.addEventListener("input", syncUpstatCompleteControls);

  [
    [els.mapLayerLocations, "locations"],
    [els.mapLayerCrystals, "crystals"],
    [els.mapLayerFood, "food"]
  ].forEach(([control, layer]) => {
    control?.addEventListener("change", () => setActiveMapLayer(layer));
  });
  els.mapAreaSelect?.addEventListener("change", renderMapReferences);
  els.mapReferenceGallery?.addEventListener("click", handleMapReferenceCarouselClick);
  els.mapReferenceGallery?.addEventListener("scroll", handleMapReferenceCarouselScroll, true);
  els.mapPinsPersonal?.addEventListener("change", renderMapPins);
  els.mapPinsClan?.addEventListener("change", renderMapPins);
  els.toggleMapFavoriteBtn?.addEventListener("click", toggleCurrentMapFavorite);
  els.addMapPinBtn?.addEventListener("click", startMapPinPlacement);
  els.mapStage?.addEventListener("click", handleMapStageClick);
  document.querySelectorAll("[data-map-action='import-code']").forEach((button) => {
    button.addEventListener("click", openMapImportDialog);
  });

  els.dragonForm.addEventListener("submit", handleDragonSubmit);
  els.accountForm.addEventListener("submit", handleAccountSubmit);
  els.skinForm.addEventListener("submit", handleSkinSubmit);
  els.upstatForm?.addEventListener("submit", handleUpstatSubmit);
  els.mapPinForm?.addEventListener("submit", handleMapPinSubmit);
  els.mapImportForm?.addEventListener("submit", handleMapImportSubmit);
  els.broodPouchForm?.addEventListener("submit", handleBroodPouchSubmit);

  document.querySelectorAll("[data-close-modal]").forEach((button) => {
    button.addEventListener("click", () => closeModal(button.dataset.closeModal));
  });
  els.clanShareDialog?.addEventListener("click", handleClanShareConfirmation);
  els.clanShareDialog?.addEventListener("cancel", (event) => {
    event.preventDefault();
    settleClanShareConfirmation(false);
  });
  els.clanShareDialog?.addEventListener("close", () => {
    if (clanShareConfirmationResolve) settleClanShareConfirmation(false, false, false);
  });

  document.querySelectorAll("[data-action='export-json']").forEach((button) => {
    button.addEventListener("click", exportJson);
  });
  document.querySelectorAll("[data-action='export-safe-json']").forEach((button) => {
    button.addEventListener("click", exportSafeJson);
  });
  document.querySelectorAll("[data-action='export-csv']").forEach((button) => {
    button.addEventListener("click", exportCsv);
  });
  document.querySelectorAll("[data-action='export-share-chart']").forEach((button) => {
    button.addEventListener("click", exportShareChart);
  });
  document.querySelectorAll("[data-action='import-json']").forEach((button) => {
    button.addEventListener("click", () => els.importFile.click());
  });
  document.querySelectorAll("[data-action='import-genetics-png']").forEach((button) => {
    button.addEventListener("click", () => els.geneticsImageFile?.click());
  });

  els.importFile.addEventListener("change", importJson);
  els.importPreviewDialog?.addEventListener("click", handleImportPreviewAction);
  els.geneticsImageFile?.addEventListener("change", importGeneticsPng);
  els.clearDragonsBtn.addEventListener("click", clearDragons);
  els.factoryResetBtn.addEventListener("click", factoryReset);
  els.undoChangeBtn?.addEventListener("click", undoLastChange);
  els.openChangelogBtn?.addEventListener("click", () => openChangelog({ manual: true }));
  els.updateProgressDialog?.addEventListener("click", handleUpdateProgressAction);
  els.elderTickResetBtn?.addEventListener("click", handleElderTickReset);
  els.elderTickForceResetBtn?.addEventListener("click", handleElderTickForceReset);
  els.elderTickAccountList?.addEventListener("click", handleElderTickAccountAction);
  els.homePersonalPlayerSelect?.addEventListener("change", handlePersonalPlayerChange);
  els.homePrimaryAccountSelect?.addEventListener("change", handlePrimaryAccountChange);
  els.personalPlayerSelect?.addEventListener("change", handlePersonalPlayerChange);
  els.primaryAccountSelect?.addEventListener("change", handlePrimaryAccountChange);
  els.playerAliasPlayerSelect?.addEventListener("change", () => {
    setPlayerAliasStatus("");
    renderPlayerAliasSettings();
  });
  els.playerAliasesInput?.addEventListener("keydown", handlePlayerAliasInputKeydown);
  els.savePlayerAliasesBtn?.addEventListener("click", savePlayerAliases);

  els.dragonList.addEventListener("click", handleDragonAction);
  els.homeAccountList?.addEventListener("click", handleAccountAction);
  els.homeAccountList?.addEventListener("click", handleDragonAction);
  els.homeAccountList?.addEventListener("click", handleAccountCardOpen);
  els.homeAccountList?.addEventListener("keydown", handleAccountCardKeydown);
  els.homeAccountSpeciesMatrix?.addEventListener("click", handleAccountAction);
  els.homeAccountSpeciesMatrix?.addEventListener("click", handleDragonAction);
  els.accountDetailContent?.addEventListener("click", handleAccountAction);
  els.accountDetailContent?.addEventListener("click", handleDragonAction);
  els.accountList.addEventListener("click", handleAccountAction);
  els.accountList.addEventListener("click", handleDragonAction);
  els.accountList.addEventListener("click", handleAccountCardOpen);
  els.accountList.addEventListener("keydown", handleAccountCardKeydown);
  els.accountSpeciesMatrix?.addEventListener("click", handleAccountAction);
  els.accountSpeciesMatrix?.addEventListener("click", handleDragonAction);
  els.broodPouchList?.addEventListener("click", handleBroodPouchAction);
  els.skinList.addEventListener("click", handleSkinAction);
  els.skinList.addEventListener("pointerover", handleSkinTurntableStart);
  els.skinList.addEventListener("pointerout", handleSkinTurntableStop);
  els.skinList.addEventListener("focusin", handleSkinTurntableStart);
  els.skinList.addEventListener("focusout", handleSkinTurntableStop);
  els.skinList.addEventListener("change", handleSkinTurntableVariantChange);
  els.upstatList?.addEventListener("click", handleUpstatAction);
  els.mapPinList?.addEventListener("click", handleMapPinAction);
  els.clanContent?.addEventListener("click", handleClanAction);
  els.clanContent?.addEventListener("change", handleClanChange);
  els.clanContent?.addEventListener("submit", handleClanSubmit);
  els.syncConfigForm?.addEventListener("submit", handleSyncConfigSubmit);
  els.clearSyncConfigBtn?.addEventListener("click", clearSyncConfiguration);
  els.openSyncSetupBtn?.addEventListener("click", openSyncSetupDialog);
  els.openSyncConfigBtn?.addEventListener("click", openSyncConfigDialog);
  document.querySelectorAll("[data-sync-dialog-action]").forEach((button) => {
    button.addEventListener("click", handleSyncDialogAction);
  });
}

function buildStaticSelects() {
  const dragonSpeciesSelect = document.querySelector("#dragonSpecies");
  fillSelect(document.querySelector("#dragonSex"), SEXES);
  renderDragonSpeciesSelect({ select: dragonSpeciesSelect });
  fillSelect(document.querySelector("#dragonStatus"), STATUSES);
  fillSelect(document.querySelector("#dragonNestRole"), NEST_ROLES);
  fillSelect(document.querySelector("#dragonBloodline"), BLOODLINE_GRADES);
  fillSelect(document.querySelector("#skinType"), SKIN_TYPES);
  fillSelect(document.querySelector("#skinSpecies"), ["All", ...collectSpeciesNames()]);
  fillSelect(els.statusFilter, ["All statuses", ...STATUSES]);
  fillSelect(els.skinTypeFilter, ["All rarities", ...SKIN_TYPES]);
  fillSelect(els.upstatStatusFilter, ["All processes", ...UPSTAT_STATUSES]);
  fillSelect(document.querySelector("#upstatStatus"), UPSTAT_STATUSES);
  renderUpstatSpeciesSelect();
  fillSelect(els.nestTargetGrade, ["Any stat target", "A", "A+", "A++"]);
  renderMapAreaSelect();

  const dlcGrid = document.querySelector("#accountDlcGrid");
  if (dlcGrid) {
    dlcGrid.innerHTML = DLC_OPTIONS.map((option) => `
      <label class="check-field">
        <input id="accountDlc-${escapeAttr(option.key)}" name="dlc-${escapeAttr(option.key)}" type="checkbox">
        ${escapeHtml(option.label)}
      </label>
    `).join("");
  }

  els.statEditor.innerHTML = STAT_FIELDS.map((field) => `
    <div class="field genetics-stat-row">
      <label for="stat-${field.key}">${escapeHtml(field.label)}</label>
      <select id="stat-${field.key}" name="stat-${field.key}">
        ${GRADES.map((grade) => `<option value="${grade}">${grade}</option>`).join("")}
      </select>
    </div>
  `).join("");
}

function renderAll() {
  renderDatalists();
  renderDragonSkinSelects(document.querySelector("#dragonSpecies")?.value || "");
  renderFilters();
  renderCurrentTab();
  renderGlobalSearch();
  renderSyncStatusBadge();
  renderBackup();
}

function renderCurrentTab() {
  if (currentTab === "home") renderHome();
  if (currentTab === "dragons") {
    renderDragons();
    renderUpstats();
  }
  if (currentTab === "players") renderAccounts();
  if (currentTab === "breeding") {
    renderNestingOptions();
    renderNesting();
    renderBroodPouch();
  }
  if (currentTab === "skins") renderSkins();
  if (currentTab === "map") renderMap();
  if (currentTab === "clans") renderClans();
  if (currentTab === "settings") renderBackup();
}

function renderDatalists() {
  const speciesNames = collectSpeciesNames();
  els.speciesOptions.innerHTML = speciesNames.map((name) => `<option value="${escapeAttr(name)}"></option>`).join("");

  const skinNames = collectSkinNames();
  els.skinOptions.innerHTML = skinNames.map((name) => `<option value="${escapeAttr(name)}"></option>`).join("");

  const lineageNames = [...new Set([
    ...state.lineageRecords.map((record) => record.name),
    ...state.dragons.flatMap((dragon) => [dragon.name, dragon.accountName, dragon.motherName, dragon.fatherName])
  ].filter(Boolean))].sort(sortText);
  if (els.lineageNameOptions) {
    els.lineageNameOptions.innerHTML = lineageNames.map((name) => `<option value="${escapeAttr(name)}"></option>`).join("");
  }

  renderAccountNameDatalist(activeDragonPlayerName());
}

function renderFilters() {
  const currentSpecies = els.speciesFilter.value || "All species";
  const currentSkinSpecies = els.skinSpeciesFilter.value || "All species";
  const currentNestSkin = els.nestTargetSkin?.value || "";
  fillSelect(els.speciesFilter, ["All species", ...collectSpeciesNames()]);
  els.speciesFilter.value = [...els.speciesFilter.options].some((option) => option.value === currentSpecies)
    ? currentSpecies
    : "All species";

  fillSelect(els.skinSpeciesFilter, ["All species", ...collectSpeciesNames()]);
  els.skinSpeciesFilter.value = [...els.skinSpeciesFilter.options].some((option) => option.value === currentSkinSpecies)
    ? currentSkinSpecies
    : "All species";

  const currentUpstatSpecies = els.upstatSpeciesFilter?.value || "All species";
  fillSelect(els.upstatSpeciesFilter, ["All species", ...collectSpeciesNames()]);
  if (els.upstatSpeciesFilter) {
    els.upstatSpeciesFilter.value = [...els.upstatSpeciesFilter.options].some((option) => option.value === currentUpstatSpecies)
      ? currentUpstatSpecies
      : "All species";
  }

  if (els.nestTargetSkin) {
    fillSelect(els.nestTargetSkin, ["Any target skin", ...collectSkinNames()]);
    els.nestTargetSkin.value = [...els.nestTargetSkin.options].some((option) => option.value === currentNestSkin)
      ? currentNestSkin
      : "Any target skin";
  }
}

function collectSpeciesNames() {
  return DEFAULT_SPECIES.map((species) => species.name);
}

function collectPlayerNames() {
  return [...new Set(state.accounts.map((account) => account.username).filter(Boolean))].sort(sortText);
}

function collectSkinNames() {
  return [...new Set([
    ...state.skins.map((skin) => skin.name),
    ...state.dragons.flatMap((dragon) => [dragon.skin, dragon.recessiveSkin])
  ].filter(Boolean))].sort(sortText);
}

function renderGlobalSearch() {
  if (!els.globalSearch || !els.globalSearchResults) return;
  const query = text(els.globalSearch.value).toLowerCase();
  if (!query) {
    els.globalSearchResults.hidden = true;
    els.globalSearchResults.innerHTML = "";
    return;
  }

  const results = globalSearchResults(query).slice(0, 10);
  els.globalSearchResults.hidden = !results.length;
  els.globalSearchResults.innerHTML = results.length
    ? results.map((result) => `
      <button class="global-search-result" type="button" data-global-tab="${escapeAttr(result.tab)}" data-global-kind="${escapeAttr(result.kind)}" data-global-id="${escapeAttr(result.id || "")}" data-global-query="${escapeAttr(result.query || result.label)}">
        <strong>${escapeHtml(result.label)}</strong>
        <span>${escapeHtml(result.detail)}</span>
      </button>
    `).join("")
    : "";
}

function globalSearchResults(query) {
  const matches = [];
  const includes = (...values) => values.join(" ").toLowerCase().includes(query);

  state.dragons.forEach((dragon) => {
    if (!includes(dragon.username, dragon.accountName, dragon.species, dragon.sex, dragon.status, dragon.skin, dragon.recessiveSkin, dragon.nestRole, dragon.bloodline, dragon.notes, ...dragon.tags)) return;
    matches.push({ tab: "dragons", kind: "dragon", id: dragon.id, label: dragonAccountLabel(dragon), detail: compactJoin([dragon.species, dragon.sex, dragon.skin, dragon.status]), query: dragon.accountName });
  });

  state.accounts.forEach((account) => {
    if (!includes(account.username, account.accountName, account.discord, account.steam)) return;
    matches.push({ tab: "home", kind: "account", id: account.id, label: compactJoin([account.username, account.accountName]), detail: `${dragonsForAccount(account.id).length}/${collectSpeciesNames().length} dragons`, query: account.accountName });
  });

  state.skins.forEach((skin) => {
    if (!includes(skin.name, skin.species, skin.type, skin.source, skin.recipeA, skin.recipeB)) return;
    matches.push({ tab: "skins", kind: "skin", id: skin.id, label: skin.name, detail: compactJoin([skin.species, skin.type, skin.wishlist ? "Wishlist" : ""]), query: skin.name });
  });

  state.upstats.forEach((upstat) => {
    if (!includes(upstat.species, upstat.skin, upstat.status, upstat.notes)) return;
    matches.push({ tab: "dragons", kind: "upstat", id: upstat.id, label: `${upstat.species} ${upstat.skin}`, detail: compactJoin([upstat.status, `${upstat.aPlusCount}/18 A+`]), query: upstat.skin });
  });

  MAP_REFERENCE_AREAS.forEach((area) => {
    if (!includes(area.name, area.region, area.id)) return;
    matches.push({ tab: "map", kind: "map-area", id: area.id, label: area.name, detail: compactJoin([area.region, `${area.files.length} references`]), query: area.name });
  });

  clanUi.sharedDragons.forEach((record) => {
    const summary = record.summary || {};
    if (!includes(summary.displayName, summary.playerName, summary.accountName, summary.species, summary.sex, summary.skin, summary.recessiveSkin)) return;
    matches.push({ tab: "clans", kind: "clan-dragon", id: record.id, label: summary.displayName || "Shared Dragon", detail: compactJoin([summary.species, summary.skin, `Shared by ${clanMemberName(record.source_user_id)}`]), query: summary.displayName || summary.skin });
  });

  return matches;
}

function handleGlobalSearchAction(event) {
  const button = event.target.closest(".global-search-result");
  if (!button) return;
  const tab = button.dataset.globalTab;
  const kind = button.dataset.globalKind;
  const query = button.dataset.globalQuery || "";
  const id = button.dataset.globalId || "";
  els.globalSearch.value = "";
  els.globalSearchResults.hidden = true;
  els.globalSearchResults.innerHTML = "";
  if (kind === "upstat") setDragonView("upstats", { updateHash: true });
  else setTab(tab, { updateHash: true });

  if (tab === "dragons" && els.dragonSearch) {
    els.dragonSearch.value = query;
    renderDragons();
  }
  if ((tab === "players" || tab === "home") && els.accountSearch) {
    els.accountSearch.value = query;
    if (tab === "players") renderAccounts();
    if (tab === "home") renderHome();
    if (kind === "account") openAccountDetailDialog(id);
  }
  if (tab === "skins" && els.skinSearch) {
    els.skinSearch.value = query;
    renderSkins();
  }
  if (kind === "upstat" && els.upstatSearch) {
    els.upstatSearch.value = query;
    renderUpstats();
  }
  if (tab === "map" && kind === "map-area") selectMapReferenceArea(id);
  if (tab === "clans") {
    clanUi.libraryFilters = { ...clanUi.libraryFilters, dragon: query };
    renderClans();
  }
}

function handleDocumentSearchClose(event) {
  if (!els.globalSearchResults || els.globalSearchResults.hidden) return;
  if (event.target === els.globalSearch || els.globalSearchResults.contains(event.target)) return;
  els.globalSearchResults.hidden = true;
}

function findExistingPlayerName(value) {
  return resolvePlayerName(value);
}

function renderDragonPlayerSelect(selectedPlayer = "") {
  const select = document.querySelector("#dragonPlayerSelect");
  if (!select) return;

  const players = collectPlayerNames();
  const selected = resolvePlayerName(selectedPlayer);
  fillSelect(select, ["", ...players]);
  if (select.options[0]) select.options[0].textContent = players.length ? "New player or select existing" : "New player";
  select.value = players.includes(selected) ? selected : "";
  syncDragonPlayerControls();
}

function activeDragonPlayerName() {
  return resolvePlayerName(
    text(document.querySelector("#dragonPlayerSelect")?.value) || text(document.querySelector("#dragonUsername")?.value)
  );
}

function renderAccountNameDatalist(username = "") {
  if (!els.accountOptions) return;
  const playerName = resolvePlayerName(username);
  const accountNames = [...new Set(state.accounts
    .filter((account) => !playerName || account.username === playerName)
    .map((account) => account.accountName)
    .filter(Boolean))]
    .sort(sortText);
  els.accountOptions.innerHTML = accountNames.map((name) => `<option value="${escapeAttr(name)}"></option>`).join("");
}

function renderDragons() {
  const dragons = getFilteredDragons();
  renderStats(dragons);

  if (!state.dragons.length) {
    els.dragonList.innerHTML = `
      <div class="empty-state">
        <h2>No dragons logged yet</h2>
        <p>Add your first record when you are ready.</p>
      </div>
    `;
    renderBackup();
    return;
  }

  if (!dragons.length) {
    els.dragonList.innerHTML = `
      <div class="empty-state">
        <h2>No matching dragons</h2>
        <p>Adjust the filters or add a new record.</p>
      </div>
    `;
    renderBackup();
    return;
  }

  els.dragonList.innerHTML = dragons.map(renderDragonCard).join("");
  renderBackup();
}

function getFilteredDragons() {
  const query = els.dragonSearch.value.trim().toLowerCase();
  const species = els.speciesFilter.value;
  const status = els.statusFilter.value;
  const hideInactive = els.hideInactive.checked;

  const filtered = state.dragons.filter((dragon) => {
    if (species && species !== "All species" && dragon.species !== species) return false;
    if (status && status !== "All statuses" && dragon.status !== status) return false;
    if (hideInactive && !ADULT_OR_HIGHER_STATUSES.has(dragon.status)) return false;
    if (!query) return true;
    const parentNames = [dragon.motherId, dragon.fatherId].map((id) => dragonName(id)).concat([dragon.motherName, dragon.fatherName]).join(" ");
    const haystack = [
      dragon.username,
      dragon.accountName,
      dragon.name,
      dragon.species,
      dragon.sex,
      dragon.status,
      dragon.nestRole,
      dragon.server,
      dragon.skin,
      dragon.recessiveSkin,
      dragon.skinType,
      dragon.bloodline,
      dragon.notes,
      parentNames,
      ...dragon.tags
    ].join(" ").toLowerCase();
    return haystack.includes(query);
  });

  const sortBy = els.sortBy.value;
  filtered.sort((a, b) => {
    if (sortBy === "name") return sortText(dragonAccountLabel(a), dragonAccountLabel(b));
    if (sortBy === "species") return sortText(a.species || "zz", b.species || "zz") || sortText(dragonAccountLabel(a), dragonAccountLabel(b));
    if (sortBy === "bloodline") return bloodlineScore(b.bloodline) - bloodlineScore(a.bloodline) || sortText(dragonAccountLabel(a), dragonAccountLabel(b));
    if (sortBy === "elder") return numericValue(b.elderProgress) - numericValue(a.elderProgress) || sortText(dragonAccountLabel(a), dragonAccountLabel(b));
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  return filtered;
}

function renderStats(dragons) {
  const hatchieCount = state.dragons.filter((dragon) => dragon.status === "Hatchie").length;
  const juviCount = state.dragons.filter((dragon) => dragon.status === "Juvi").length;
  const grownCount = state.dragons.filter((dragon) => dragon.status === "Grown").length;
  const fourthPointedCount = state.dragons.filter((dragon) => dragon.status === "4th Pointed").length;
  const elderCount = state.dragons.filter((dragon) => dragon.status === "Elder").length;
  const visibleSkinCount = new Set(state.dragons.map((dragon) => dragon.skin).filter(Boolean)).size;
  const bestBloodline = state.dragons
    .map((dragon) => dragon.bloodline)
    .filter((grade) => grade && grade !== "Unknown")
    .sort((a, b) => bloodlineScore(b) - bloodlineScore(a))[0] || "Unknown";
  const shownCount = dragons.length;

  const metrics = [
    ["Total", state.dragons.length],
    ["Shown", shownCount],
    ["Hatchie", hatchieCount],
    ["Juvi", juviCount],
    ["Grown", grownCount],
    ["4th pointed", fourthPointedCount],
    ["Elder", elderCount],
    ["Skins", visibleSkinCount],
    ["Best line", bestBloodline]
  ];

  els.statsBar.innerHTML = metrics.map(([label, value]) => `
    <div class="metric">
      <strong>${escapeHtml(String(value))}</strong>
      <span>${escapeHtml(label)}</span>
    </div>
  `).join("");
}

function renderAccounts() {
  const accounts = getFilteredAccounts();
  renderAccountSpeciesMatrix(accounts);

  if (!state.accounts.length) {
    if (els.accountSpeciesMatrix) els.accountSpeciesMatrix.innerHTML = "";
    els.accountList.innerHTML = `
      <div class="empty-state">
        <h2>No players yet</h2>
        <p>Add a player, then add accounts and dragons under them.</p>
      </div>
    `;
    return;
  }

  if (!accounts.length) {
    if (els.accountSpeciesMatrix) els.accountSpeciesMatrix.innerHTML = "";
    els.accountList.innerHTML = `
      <div class="empty-state">
        <h2>No matching players</h2>
        <p>Adjust the search or add a new player.</p>
      </div>
    `;
    return;
  }

  els.accountList.innerHTML = renderAccountSections(accounts);
}

function renderHome() {
  if (!els.homeAccountList) return;
  renderPersonalPlayerSelect(els.homePersonalPlayerSelect);
  renderPrimaryAccountSelect(els.homePrimaryAccountSelect);
  renderElderTick();
  renderElderTickAccountList();
  if (!state.accounts.length) {
    renderAccountSpeciesMatrix([], els.homeAccountSpeciesMatrix);
    if (els.homePlayerSummary) els.homePlayerSummary.textContent = "Add a player to choose a personal home view.";
    els.homeAccountList.innerHTML = `
      <div class="empty-state">
        <h2>No accounts yet</h2>
        <p>Add a player, then add accounts and dragons under them.</p>
      </div>
    `;
    return;
  }

  const personalPlayer = normalizePersonalPlayer(state.settings?.personalPlayer, state.accounts);
  const primaryAccountId = normalizePrimaryAccountId(state.settings?.primaryAccountId, personalPlayer, state.accounts);
  if (personalPlayer !== (state.settings?.personalPlayer || "") || primaryAccountId !== (state.settings?.primaryAccountId || "")) {
    state.settings.personalPlayer = personalPlayer;
    state.settings.primaryAccountId = primaryAccountId;
    saveState({ skipHistory: true });
  }

  const personalPlayerKey = playerNameKey(personalPlayer);
  const accounts = sortAccountsPrimaryFirst(
    state.accounts.filter((account) => !personalPlayer || playerNameKey(account.username) === personalPlayerKey),
    primaryAccountId
  );
  const primaryAccount = accounts.find((account) => text(account.id) === primaryAccountId);

  if (els.homePlayerSummary) {
    els.homePlayerSummary.textContent = personalPlayer
      ? `Showing ${personalPlayer}'s accounts${primaryAccount ? `. Primary: ${primaryAccount.accountName}` : ""}`
      : "Showing all players. Set a personal player in Settings.";
  }
  renderPersonalPlayerSelect(els.homePersonalPlayerSelect, personalPlayer);
  renderPrimaryAccountSelect(els.homePrimaryAccountSelect, primaryAccountId, personalPlayer);

  if (!accounts.length) {
    renderAccountSpeciesMatrix([], els.homeAccountSpeciesMatrix);
    els.homeAccountList.innerHTML = `
      <div class="empty-state">
        <h2>No accounts for ${escapeHtml(personalPlayer)}</h2>
        <p>Change the personal player in Settings or add an account for this player.</p>
      </div>
    `;
    return;
  }

  renderAccountSpeciesMatrix(accounts, els.homeAccountSpeciesMatrix);
  els.homeAccountList.innerHTML = renderAccountSections(accounts);
}

function renderAccountSections(accounts) {
  const byUser = new Map();
  sortAccountsPrimaryFirst(accounts).forEach((account) => {
    if (!byUser.has(account.username)) byUser.set(account.username, []);
    byUser.get(account.username).push(account);
  });

  return [...byUser.entries()].map(([username, userAccounts]) => {
    const dragonCount = userAccounts.reduce((sum, account) => sum + dragonsForAccount(account.id).length, 0);
    const clanOnlyPlayer = userAccounts.every((account) => account.clanImported);
    const savedAliases = aliasesForPlayer(username);
    return `
      <section class="account-user-section">
        <div class="account-user-head">
          <div class="account-user-identity">
            <h2>${escapeHtml(username)}</h2>
            ${savedAliases.length ? `<p>Also recognized as: ${savedAliases.map((alias) => `<span>${escapeHtml(alias)}</span>`).join("")}</p>` : ""}
          </div>
          <div class="account-user-actions">
            <span class="pill">${userAccounts.length} account${userAccounts.length === 1 ? "" : "s"} / ${dragonCount} dragon${dragonCount === 1 ? "" : "s"}</span>
            ${clanOnlyPlayer ? `<span class="small-pill">Clan shared</span>` : `
              <button class="tool-button" type="button" data-account-action="add-account" data-username="${escapeAttr(username)}">Add Account</button>
              <button class="danger-button" type="button" data-account-action="delete-player" data-username="${escapeAttr(username)}">Delete Player</button>
            `}
          </div>
        </div>
        <div class="account-grid">
          ${userAccounts.map(renderAccountCard).join("")}
        </div>
      </section>
    `;
  }).join("");
}

function renderAccountSpeciesMatrix(accounts, target = els.accountSpeciesMatrix) {
  if (!target) return;
  if (!accounts.length) {
    target.innerHTML = "";
    return;
  }

  const speciesNames = collectSpeciesNames();
  target.style.setProperty("--species-columns", String(speciesNames.length));
  target.innerHTML = `
    <div class="matrix-head">
      <span>Account</span>
      ${speciesNames.map((species) => `<span>${escapeHtml(species)}</span>`).join("")}
    </div>
    ${accounts.map((account) => {
      const accountDragons = dragonsForAccount(account.id);
      return `
        <div class="matrix-row">
          <button class="matrix-account" type="button" data-account-action="open-detail" data-id="${escapeAttr(account.id)}">${escapeHtml(compactJoin([account.username, account.accountName]))}</button>
          ${speciesNames.map((species) => renderAccountSpeciesMatrixCell(account, species, accountDragons)).join("")}
        </div>
      `;
    }).join("")}
  `;
}

function renderAccountSpeciesMatrixCell(account, species, accountDragons) {
  const dragon = accountDragons.find((item) => item.species === species);
  if (dragon) {
    return `
      <button class="matrix-cell is-filled${isElderDragon(dragon) ? " is-elder" : ""}${elderCrystalClassNames(dragon)}" type="button" data-dragon-action="edit" data-id="${escapeAttr(dragon.id)}" title="${escapeAttr(compactJoin([dragon.status, dragon.sex, dragon.skin, elderCrystalTitle(dragon)]))}">
        <strong class="matrix-cell-head">
          <span>${escapeHtml(statusShortLabel(dragon.status))}</span>
          <span class="matrix-sex ${sexClass(dragon.sex)}">${escapeHtml(sexShortLabel(dragon.sex))}</span>
        </strong>
        <span>${escapeHtml(dragon.skin || "Skin?")}</span>
      </button>
    `;
  }

  const missingDlc = missingDlcForSpecies(account, species);
  return `
    <button class="matrix-cell is-open${missingDlc ? " is-dlc-warning" : ""}" type="button" data-account-action="add-dragon" data-id="${escapeAttr(account.id)}" data-species="${escapeAttr(species)}" title="${missingDlc ? `Missing DLC: ${missingDlc}` : `Add ${species}`}">
      <strong>Open</strong>
      <span>${escapeHtml(missingDlc || "Add")}</span>
    </button>
  `;
}

function statusShortLabel(status) {
  return {
    Hatchie: "H",
    Juvi: "J",
    Grown: "G",
    "4th Pointed": "4",
    Elder: "E"
  }[status] || "?";
}

function sexShortLabel(sex) {
  return {
    Female: "F",
    Male: "M"
  }[sex] || "?";
}

function sexClass(sex) {
  return {
    Female: "is-female",
    Male: "is-male"
  }[sex] || "is-unknown";
}

function missingDlcForSpecies(account, species) {
  const dlc = normalizeDlc(account?.dlc);
  if (species === "Acid Spitter" && !dlc.acidSpitterSpecies) return "Acid DLC";
  if (species === "Blitz Striker" && !dlc.blitzStrikerSpecies) return "Blitz DLC";
  if (species === "Bio" && !dlc.kickstarter) return "Kickstarter";
  return "";
}

function getFilteredAccounts() {
  const query = els.accountSearch.value.trim().toLowerCase();
  const accounts = sortAccountsPrimaryFirst(state.accounts);
  if (!query) return accounts;

  return accounts.filter((account) => {
    const accountDragons = dragonsForAccount(account.id);
    const haystack = [
      account.username,
      account.accountName,
      ...accountDragons.flatMap((dragon) => [
        dragon.name,
        dragon.species,
        dragon.status,
        dragon.skin,
        dragon.recessiveSkin,
        ...dragon.tags
      ])
    ].join(" ").toLowerCase();
    return haystack.includes(query);
  });
}

function renderAccountCard(account) {
  const accountDragons = dragonsForAccount(account.id).sort((a, b) => sortText(a.species || "zz", b.species || "zz"));
  const unsharedDragons = accountDragons.filter((dragon) => !dragon.clanImported && !isDragonSharedWithActiveClan(dragon));
  const ownedSpecies = new Set(accountDragons.map((dragon) => dragon.species).filter(Boolean));
  const openSpecies = collectSpeciesNames().filter((species) => !ownedSpecies.has(species));
  const dragonRows = accountDragons.length
    ? accountDragons.map((dragon) => `
      <div class="account-dragon-row${dragon.clanImported ? " is-clan-shared" : ""}${isElderDragon(dragon) ? " is-elder" : ""}${elderCrystalClassNames(dragon)}">
        <span>${escapeHtml(dragon.species || "Unknown species")}</span>
        <strong class="account-dragon-status">${escapeHtml(dragon.status || "Unknown")}</strong>
        ${renderElderCrystalBadge(dragon)}
        ${dragon.clanImported
          ? `<span class="small-pill">Clan shared</span>`
          : `<div class="account-dragon-actions">
              <button class="tool-button" type="button" data-dragon-action="edit" data-id="${escapeAttr(dragon.id)}">Edit</button>
              <button class="danger-button" type="button" data-dragon-action="delete" data-id="${escapeAttr(dragon.id)}">Delete</button>
            </div>`}
      </div>
    `).join("")
    : `<p class="account-empty">No dragons on this account yet.</p>`;

  return `
    <article class="account-card${isPrimaryAccount(account) ? " is-primary-account" : ""}" data-id="${escapeAttr(account.id)}" tabindex="0" aria-label="Open details for ${escapeAttr(account.accountName)}">
      <div class="card-head">
        <div class="card-title">
          <h3>${escapeHtml(account.accountName)}</h3>
        </div>
        <div class="account-card-badges">${isPrimaryAccount(account) ? `<span class="small-pill">Primary account</span>` : ""}<span class="pill">${accountDragons.length}/${collectSpeciesNames().length}</span>${account.clanImported ? `<span class="small-pill">Clan shared</span>` : ""}</div>
      </div>
      <dl class="line-list">
        <div><dt>Open slots</dt><dd>${escapeHtml(openSpecies.length ? openSpecies.join(", ") : "Full roster")}</dd></div>
        <div><dt>DLC</dt><dd>${escapeHtml(formatDlcList(account.dlc))}</dd></div>
        ${account.discord ? `<div><dt>Discord</dt><dd>${escapeHtml(account.discord)}</dd></div>` : ""}
        ${account.steam ? `<div><dt>Steam</dt><dd>${escapeHtml(account.steam)}</dd></div>` : ""}
      </dl>
      <div class="account-dragon-list">
        ${dragonRows}
      </div>
      ${account.clanImported ? "" : `
        <div class="card-actions">
          <button class="primary-button" type="button" data-account-action="add-dragon" data-id="${escapeAttr(account.id)}">Add Dragon</button>
          ${canShareWithActiveClan() && unsharedDragons.length ? `<button class="tool-button" type="button" data-account-action="share-account" data-id="${escapeAttr(account.id)}">Share Account</button>` : ""}
          <button class="tool-button" type="button" data-account-action="edit" data-id="${escapeAttr(account.id)}">Edit Account</button>
          <button class="danger-button" type="button" data-account-action="delete-account" data-id="${escapeAttr(account.id)}">Delete Account</button>
        </div>
      `}
    </article>
  `;
}

function handleAccountCardOpen(event) {
  if (event.target.closest("button, input, select, textarea, a, label")) return;
  const card = event.target.closest(".account-card[data-id]");
  if (card) openAccountDetailDialog(card.dataset.id);
}

function handleAccountCardKeydown(event) {
  if (!['Enter', ' '].includes(event.key) || event.target.closest("button, input, select, textarea, a, label")) return;
  const card = event.target.closest(".account-card[data-id]");
  if (!card) return;
  event.preventDefault();
  openAccountDetailDialog(card.dataset.id);
}

function openAccountDetailDialog(id) {
  const account = accountById(id);
  if (!account || !els.accountDetailDialog || !els.accountDetailContent) return;
  const dragons = dragonsForAccount(account.id).sort((a, b) => sortText(a.species, b.species));
  const openSpecies = collectSpeciesNames().filter((species) => !dragons.some((dragon) => dragon.species === species));

  els.accountDetailTitle.textContent = account.accountName;
  els.accountDetailContent.innerHTML = `
    <div class="account-detail-overview">
      <section class="account-detail-section">
        <h3>Account</h3>
        <dl class="account-detail-list">
          <div><dt>Player</dt><dd>${escapeHtml(account.username)}</dd></div>
          <div><dt>Account</dt><dd>${escapeHtml(account.accountName)}</dd></div>
          <div><dt>DLC</dt><dd>${escapeHtml(formatDlcList(account.dlc))}</dd></div>
          <div><dt>Discord</dt><dd>${escapeHtml(account.discord || "Not recorded")}</dd></div>
          <div><dt>Steam</dt><dd>${escapeHtml(account.steam || "Not recorded")}</dd></div>
          <div><dt>Source</dt><dd>${account.clanImported ? "Clan shared" : "Local record"}</dd></div>
        </dl>
        ${account.clanImported ? "" : `
          <div class="card-actions">
            <button class="tool-button" type="button" data-account-action="edit" data-id="${escapeAttr(account.id)}">Edit Account</button>
            <button class="primary-button" type="button" data-account-action="add-dragon" data-id="${escapeAttr(account.id)}">Add Dragon</button>
            <button class="danger-button" type="button" data-account-action="delete-account" data-id="${escapeAttr(account.id)}">Delete Account</button>
          </div>
        `}
      </section>
      <section class="account-detail-section">
        <h3>Roster</h3>
        <dl class="account-detail-list">
          <div><dt>Dragons</dt><dd>${dragons.length}/${collectSpeciesNames().length}</dd></div>
          <div><dt>Open species</dt><dd>${escapeHtml(openSpecies.length ? openSpecies.join(", ") : "Full roster")}</dd></div>
          <div><dt>Created</dt><dd>${escapeHtml(formatDateTime(account.createdAt))}</dd></div>
          <div><dt>Updated</dt><dd>${escapeHtml(formatDateTime(account.updatedAt))}</dd></div>
        </dl>
      </section>
    </div>
    <section class="account-detail-roster">
      <div class="account-detail-roster-head"><h3>Dragon Details</h3><span class="pill">${dragons.length} recorded</span></div>
      ${dragons.length ? dragons.map(renderAccountDetailDragon).join("") : `<p class="account-empty">No dragons are recorded for this account.</p>`}
    </section>
  `;
  showModal(els.accountDetailDialog);
}

function renderAccountDetailDragon(dragon) {
  const statRows = STAT_FIELDS.map((field) => `
    <div><dt>${escapeHtml(field.label)}</dt><dd>${escapeHtml(dragon.stats[field.key] || "Unknown")}</dd></div>
  `).join("");
  const parentLabel = dragonParentLabel(dragon);
  return `
    <article class="account-detail-dragon${isElderDragon(dragon) ? " is-elder" : ""}${elderCrystalClassNames(dragon)}">
      <div class="account-detail-dragon-head">
        <div>
          <h4>${escapeHtml(dragon.species || "Unknown species")}</h4>
          <p>${escapeHtml(compactJoin([dragon.sex, dragon.status, dragon.clanImported ? "Clan shared" : "Local record"]))}</p>
        </div>
        <div class="account-detail-dragon-actions">
          ${renderElderCrystalBadge(dragon)}
          <span class="pill ${statusClass(dragon.status)}">${escapeHtml(dragon.status)}</span>
          ${dragon.clanImported ? "" : `
            <button class="tool-button" type="button" data-dragon-action="edit" data-id="${escapeAttr(dragon.id)}">Edit</button>
            <button class="danger-button" type="button" data-dragon-action="delete" data-id="${escapeAttr(dragon.id)}">Delete</button>
          `}
        </div>
      </div>
      <dl class="account-detail-list account-detail-dragon-fields">
        <div><dt>Skin</dt><dd>${escapeHtml(dragon.skin || "Unknown")}</dd></div>
        <div><dt>Recessive</dt><dd>${escapeHtml(dragon.recessiveSkin || "Unknown")}</dd></div>
        <div><dt>Nest role</dt><dd>${escapeHtml(dragon.nestRole || "Unknown")}</dd></div>
        <div><dt>Bloodline</dt><dd>${escapeHtml(dragon.bloodline || "Unknown")}</dd></div>
        <div><dt>Parents</dt><dd>${escapeHtml(parentLabel)}</dd></div>
        ${ADULT_OR_HIGHER_STATUSES.has(dragon.status) ? `<div><dt>Elder progress</dt><dd>${escapeHtml(formatPercent(elderProgressValue(dragon)))}</dd></div>` : ""}
        <div><dt>Mutation points</dt><dd>${escapeHtml(String(dragon.mutationPoints ?? 0))}</dd></div>
        <div><dt>Social</dt><dd>${escapeHtml(formatSocialPoints(dragon.socialPoints))}</dd></div>
        <div><dt>Agile</dt><dd>${escapeHtml(formatTrackPoints(dragon.agilePoints, "Fast", dragon.fastMutation))}</dd></div>
        <div><dt>Scavenger</dt><dd>${escapeHtml(formatTrackPoints(dragon.scavengerPoints, "Survivor", dragon.survivorMutation))}</dd></div>
        <div><dt>Free points</dt><dd>${escapeHtml(String(dragon.remainingMutationPoints ?? 0))}</dd></div>
      </dl>
      <dl class="account-detail-stats">${statRows}</dl>
    </article>
  `;
}

function renderDragonCard(dragon) {
  const parents = dragonParentLabel(dragon);
  const shareAction = !dragon.clanImported && canShareWithActiveClan() && !isDragonSharedWithActiveClan(dragon)
    ? `<button class="tool-button" type="button" data-dragon-action="share" data-id="${escapeAttr(dragon.id)}">Share to Clan</button>`
    : "";

  const tags = [
    dragon.clanImported ? `<span class="small-pill">Clan shared</span>` : "",
    ...dragon.tags.map((tag) => `<span class="small-pill">${escapeHtml(tag)}</span>`)
  ].filter(Boolean);
  const tagMarkup = tags.length ? `<div class="skin-meta">${tags.join("")}</div>` : "";

  return `
    <article class="dragon-card${isElderDragon(dragon) ? " is-elder" : ""}${elderCrystalClassNames(dragon)}" data-id="${escapeAttr(dragon.id)}">
      <div class="card-head">
        <div class="card-title">
          <h3>${escapeHtml(dragon.accountName || dragon.name)}</h3>
          <p class="card-subtitle">${escapeHtml(compactJoin([dragon.username, dragon.species, dragon.sex]))}</p>
        </div>
        <div class="dragon-card-status">
          ${renderElderCrystalBadge(dragon)}
          <span class="pill ${statusClass(dragon.status)}">${escapeHtml(dragon.status)}</span>
        </div>
      </div>

      <dl class="line-list">
        <div><dt>Player</dt><dd>${escapeHtml(dragon.username || "Unknown Player")}</dd></div>
        <div><dt>Skin</dt><dd>${escapeHtml(dragon.skin || "Unknown")}</dd></div>
        <div><dt>Recessive</dt><dd>${escapeHtml(dragon.recessiveSkin || "Unknown")}</dd></div>
        <div><dt>Nest role</dt><dd>${escapeHtml(dragon.nestRole || "Unknown")}</dd></div>
        <div><dt>Social pts</dt><dd>${escapeHtml(formatSocialPoints(dragon.socialPoints))}</dd></div>
        <div><dt>Agile</dt><dd>${escapeHtml(formatTrackPoints(dragon.agilePoints, "Fast", dragon.fastMutation))}</dd></div>
        <div><dt>Scavenger</dt><dd>${escapeHtml(formatTrackPoints(dragon.scavengerPoints, "Survivor", dragon.survivorMutation))}</dd></div>
        <div><dt>Free pts</dt><dd>${escapeHtml(String(dragon.remainingMutationPoints ?? 0))}</dd></div>
        <div><dt>Bloodline</dt><dd>${escapeHtml(dragon.bloodline || "Unknown")}</dd></div>
        <div><dt>Parents</dt><dd>${escapeHtml(parents)}</dd></div>
      </dl>

      <div class="stat-list">
        ${STAT_FIELDS.slice(0, 8).map((field) => `
          <div class="stat-chip">
            <span>${escapeHtml(field.label)}</span>
            <strong>${escapeHtml(dragon.stats[field.key] || "Unknown")}</strong>
          </div>
        `).join("")}
      </div>

      ${tagMarkup}

      ${dragon.clanImported ? "" : `
        <div class="card-actions">
          <button class="tool-button" type="button" data-dragon-action="edit" data-id="${escapeAttr(dragon.id)}">Edit</button>
          <button class="tool-button" type="button" data-dragon-action="clone" data-id="${escapeAttr(dragon.id)}">Clone</button>
          <button class="tool-button" type="button" data-dragon-action="toggleStatus" data-id="${escapeAttr(dragon.id)}">Advance</button>
          ${shareAction}
          <button class="danger-button" type="button" data-dragon-action="delete" data-id="${escapeAttr(dragon.id)}">Delete</button>
        </div>
      `}
    </article>
  `;
}

function renderNestingOptions() {
  const selectedOne = els.parentOne.value;
  const selectedTwo = els.parentTwo.value;
  const parentA = dragonById(selectedOne);
  const parentBOptions = parentA ? state.dragons.filter((dragon) => canSelectAsSecondParent(parentA, dragon)) : state.dragons;
  const parentTwoPlaceholder = parentA && isKnownSex(parentA.sex) ? "Select opposite-sex dragon" : "Select dragon";
  const parentOneOptions = ["<option value=''>Select dragon</option>", ...state.dragons.map((dragon) => (
    `<option value="${escapeAttr(dragon.id)}">${escapeHtml(dragonOptionLabel(dragon))}</option>`
  ))].join("");
  const parentTwoOptions = [`<option value=''>${escapeHtml(parentTwoPlaceholder)}</option>`, ...parentBOptions.map((dragon) => (
    `<option value="${escapeAttr(dragon.id)}">${escapeHtml(dragonOptionLabel(dragon))}</option>`
  ))].join("");
  els.parentOne.innerHTML = parentOneOptions;
  els.parentTwo.innerHTML = parentTwoOptions;
  if (dragonById(selectedOne)) els.parentOne.value = selectedOne;
  if (parentBOptions.some((dragon) => dragon.id === selectedTwo)) els.parentTwo.value = selectedTwo;
}

function canSelectAsSecondParent(parentA, dragon) {
  if (!parentA || !dragon || parentA.id === dragon.id) return false;
  if (!isKnownSex(parentA.sex)) return true;
  return isKnownSex(dragon.sex) && dragon.sex !== parentA.sex;
}

function renderNesting() {
  const parentA = dragonById(els.parentOne.value);
  const parentB = dragonById(els.parentTwo.value);
  els.createEggBtn.disabled = false;

  if (!state.dragons.length) {
    els.createEggBtn.disabled = true;
    els.nestingOutput.innerHTML = `
      <div class="empty-state">
        <h2>No parent records</h2>
        <p>Add dragons before planning nests.</p>
      </div>
      <div class="plan-panel full">
        <h2>Pairing Helper</h2>
        ${renderNestPairingHelper()}
      </div>
    `;
    return;
  }

  if (!parentA || !parentB) {
    els.createEggBtn.disabled = true;
    els.nestingOutput.innerHTML = `
      <div class="empty-state">
        <h2>Select two dragons</h2>
        <p>The plan will update from their saved records.</p>
      </div>
      <div class="plan-panel full">
        <h2>Pairing Helper</h2>
        ${renderNestPairingHelper()}
      </div>
    `;
    return;
  }

  const warnings = nestingWarnings(parentA, parentB);
  const skinPool = inheritancePool(parentA, parentB);
  const skinOdds = calculateSkinOdds(parentA, parentB);
  const bloodline = estimateBloodline(parentA.bloodline, parentB.bloodline);
  const sameSpecies = canNestTogether(parentA, parentB);
  const sameDragon = parentA.id === parentB.id;
  const validSexPair = hasValidNestSexPair(parentA, parentB);
  const inbredNest = isInbredNest(parentA, parentB);
  const broodWatcherBrooding = Boolean(els.broodWatcherBrooding?.checked);
  els.createEggBtn.disabled = !sameSpecies || sameDragon || !validSexPair;

  els.nestingOutput.innerHTML = `
    <div class="plan-panel full odds-panel">
      <h2>Skin Odds</h2>
      ${renderSkinOddsPanel(skinOdds, skinPool)}
    </div>
    <div class="plan-panel full lineage-tree-panel">
      <h2>Family Tree</h2>
      ${renderNestingFamilyTree(parentA, parentB, bloodline, inbredNest)}
    </div>
    <div class="plan-panel full">
      <h2>Pairing Helper</h2>
      ${renderNestPairingHelper(parentA, parentB)}
    </div>
    <div class="plan-panel">
      <h2>${escapeHtml(dragonAccountLabel(parentA))}</h2>
      ${renderParentSummary(parentA)}
    </div>
    <div class="plan-panel">
      <h2>${escapeHtml(dragonAccountLabel(parentB))}</h2>
      ${renderParentSummary(parentB)}
    </div>
    <div class="plan-panel full">
      <h2>Warnings</h2>
      ${warnings.length ? `<ul class="warning-list">${warnings.map((warning) => `<li>${escapeHtml(warning)}</li>`).join("")}</ul>` : `<span class="pill status-grown">No obvious conflict</span>`}
    </div>
    <div class="plan-panel">
      <h2>Mutation Rules</h2>
      ${renderMutationGuide(skinOdds)}
    </div>
    <div class="plan-panel">
      <h2>Bloodline</h2>
      <dl class="line-list">
        <div><dt>Parent A</dt><dd>${escapeHtml(parentA.bloodline)}</dd></div>
        <div><dt>Parent B</dt><dd>${escapeHtml(parentB.bloodline)}</dd></div>
        <div><dt>Estimate</dt><dd>${escapeHtml(bloodline)}</dd></div>
      </dl>
    </div>
    <div class="plan-panel full">
      <h2>Stat Projection</h2>
      <table class="projection-table">
        <thead><tr><th>Stat</th><th>${escapeHtml(dragonAccountLabel(parentA))}</th><th>${escapeHtml(dragonAccountLabel(parentB))}</th><th>Projection</th><th>Social rule</th></tr></thead>
        <tbody>
          ${STAT_FIELDS.map((field) => {
            const projection = projectStatInheritance(field, parentA, parentB, bloodline, broodWatcherBrooding, { inbred: inbredNest });
            return `<tr><td>${escapeHtml(field.label)}</td><td>${escapeHtml(projection.parentA)}</td><td>${escapeHtml(projection.parentB)}</td><td>${escapeHtml(projection.display)}</td><td>${escapeHtml(projection.rule)}</td></tr>`;
          }).join("")}
        </tbody>
      </table>
      <p class="planner-note">Social points: partial Social points do not change stat odds. A parent with 3/3 Social shifts the dominant stat letter to 75/25 in that parent's favor when the mate does not have 3/3. If both parents have 3/3 Social, the higher saved letter is treated as guaranteed. Matching passed letters at or below the egg's Bloodline Quality upstat automatically. Supercrits are separate: matching-letter stats can upcrit by two stages, and A++ requires that supercrit path. Supercrits require both parents at 3/3 Social for the 5% per-stat roll, or a Brood Watcher brooding the egg; BW brood chance changes per attempt, so check the in-game brooding tooltip.</p>
    </div>
  `;
}

function renderNestPairingHelper(currentA = null, currentB = null) {
  const targetSkin = text(els.nestTargetSkin?.value);
  const targetGrade = text(els.nestTargetGrade?.value);
  const requestedSkin = targetSkin && targetSkin !== "Any target skin" ? targetSkin : "";
  const requestedGrade = targetGrade && targetGrade !== "Any stat target" ? targetGrade : "";
  const candidates = nestPairCandidates(requestedSkin, requestedGrade).slice(0, 5);

  if (!state.dragons.length) {
    return `<p class="planner-note">Add dragons first, then choose a target skin or stat grade to see suggested nest pairs.</p>`;
  }

  if (!requestedSkin && !requestedGrade) {
    return `<p class="planner-note">Choose a target skin or stat grade above to rank possible pairings. The helper only suggests same-species, male/female pairs that are not known inbred.</p>`;
  }

  if (!candidates.length) {
    return `<p class="planner-note">No valid saved pair currently matches that target. Add more parent records or broaden the target.</p>`;
  }

  return `
    <div class="pairing-list">
      ${candidates.map((candidate) => {
        const selected = (currentA?.id === candidate.a.id && currentB?.id === candidate.b.id)
          || (currentA?.id === candidate.b.id && currentB?.id === candidate.a.id);
        return `
          <article class="pairing-score${selected ? " is-selected" : ""}">
            <div>
              <strong>${escapeHtml(candidate.a.species)}</strong>
              <span>${escapeHtml(`${dragonAccountLabel(candidate.a)} x ${dragonAccountLabel(candidate.b)}`)}</span>
              <small>${escapeHtml(candidate.reasons.join(" / "))}</small>
            </div>
            <button class="tool-button" type="button" data-nest-pair-a="${escapeAttr(candidate.a.id)}" data-nest-pair-b="${escapeAttr(candidate.b.id)}">Use Pair</button>
          </article>
        `;
      }).join("")}
    </div>
  `;
}

function nestPairCandidates(targetSkin, targetGrade) {
  const candidates = [];
  for (let i = 0; i < state.dragons.length; i += 1) {
    for (let j = i + 1; j < state.dragons.length; j += 1) {
      const a = state.dragons[i];
      const b = state.dragons[j];
      if (!canNestTogether(a, b) || !hasValidNestSexPair(a, b) || isInbredNest(a, b)) continue;
      const score = scoreNestPair(a, b, targetSkin, targetGrade);
      if (score.value <= 0) continue;
      candidates.push({ a, b, score: score.value, reasons: score.reasons });
    }
  }
  return candidates.sort((left, right) => right.score - left.score || sortText(dragonAccountLabel(left.a), dragonAccountLabel(right.a)));
}

function scoreNestPair(a, b, targetSkin, targetGrade) {
  let value = 0;
  const reasons = [];
  if (targetSkin) {
    const target = canonicalSkinName(targetSkin);
    const carriers = [a.skin, a.recessiveSkin, b.skin, b.recessiveSkin].filter((skin) => canonicalSkinName(skin) === target).length;
    if (carriers) {
      value += carriers * 35;
      reasons.push(`${carriers} target skin slot${carriers === 1 ? "" : "s"}`);
    }
  }
  if (targetGrade) {
    const targetScore = gradeScore(targetGrade);
    const strongStats = STAT_FIELDS.reduce((sum, field) => (
      sum + (gradeScore(a.stats?.[field.key]) >= targetScore ? 1 : 0) + (gradeScore(b.stats?.[field.key]) >= targetScore ? 1 : 0)
    ), 0);
    if (strongStats) {
      value += strongStats;
      reasons.push(`${strongStats} stat slot${strongStats === 1 ? "" : "s"} at ${targetGrade}+`);
    }
  }
  if (hasFullSocial(a) || hasFullSocial(b)) {
    value += 8;
    reasons.push("Social advantage");
  }
  if (a.status === "Elder" || b.status === "Elder") {
    value += 4;
    reasons.push("Elder parent");
  }
  return { value, reasons };
}

function handleNestingOutputAction(event) {
  const button = event.target.closest("[data-nest-pair-a][data-nest-pair-b]");
  if (!button) return;
  els.parentOne.value = button.dataset.nestPairA;
  renderNestingOptions();
  els.parentTwo.value = button.dataset.nestPairB;
  renderNesting();
}

function renderBroodPouch() {
  if (!els.broodPouchList) return;
  const entries = [...(state.broodPouch || [])]
    .map((entry) => ({ entry, dragon: dragonById(entry.dragonId) }))
    .filter(({ dragon }) => Boolean(dragon))
    .sort((a, b) => sortText(a.entry.brood, b.entry.brood) || new Date(b.entry.updatedAt).getTime() - new Date(a.entry.updatedAt).getTime());

  if (!entries.length) {
    els.broodPouchList.innerHTML = `
      <div class="empty-state">
        <h2>No eggs in the brood pouch</h2>
        <p>In the Nesting Planner, check Add egg to brood pouch before creating an egg.</p>
      </div>
    `;
    return;
  }

  els.broodPouchList.innerHTML = entries.map(({ entry, dragon }) => `
    <article class="brood-pouch-card" data-id="${escapeAttr(entry.id)}">
      <div class="card-head">
        <div class="card-title">
          <h3>${escapeHtml(entry.brood)}</h3>
          <p class="card-subtitle">${escapeHtml(compactJoin([dragon.username, dragon.accountName]))}</p>
        </div>
        <span class="pill ${statusClass(dragon.status)}">${escapeHtml(dragon.status)}</span>
      </div>
      <dl class="line-list">
        <div><dt>Egg</dt><dd>${escapeHtml(dragon.species || "Unknown species")}</dd></div>
        <div><dt>Skin</dt><dd>${escapeHtml(dragon.skin || "Unknown")}</dd></div>
        <div><dt>Recessive</dt><dd>${escapeHtml(dragon.recessiveSkin || "Unknown")}</dd></div>
        <div><dt>Line</dt><dd>${escapeHtml(dragon.bloodline || "Unknown")}</dd></div>
        <div><dt>Added</dt><dd>${escapeHtml(formatDateTime(entry.createdAt))}</dd></div>
        ${entry.dueAt ? `<div><dt>Reminder</dt><dd>${escapeHtml(formatCountdownUntil(entry.dueAt))}</dd></div>` : ""}
        ${entry.oddsSummary ? `<div><dt>Odds</dt><dd>${escapeHtml(entry.oddsSummary)}</dd></div>` : ""}
      </dl>
      ${entry.notes ? `<p class="planner-note">${escapeHtml(entry.notes)}</p>` : ""}
      <div class="card-actions">
        <button class="tool-button" type="button" data-brood-pouch-action="edit" data-id="${escapeAttr(entry.id)}">Edit Brood</button>
        <button class="tool-button" type="button" data-brood-pouch-action="edit-dragon" data-dragon-id="${escapeAttr(dragon.id)}">Edit Egg</button>
        <button class="danger-button" type="button" data-brood-pouch-action="remove" data-id="${escapeAttr(entry.id)}">Remove</button>
      </div>
    </article>
  `).join("");
}

function openBroodPouchDialog(dragonId, entryId = "") {
  const dragon = dragonById(dragonId);
  if (!dragon || !els.broodPouchDialog || !els.broodPouchForm) return;
  const entry = entryId ? broodPouchEntryById(entryId) : (state.broodPouch || []).find((item) => item.dragonId === dragonId);
  els.broodPouchForm.reset();
  els.broodPouchDialogTitle.textContent = entry ? "Edit Brood Pouch" : "Add Egg to Brood Pouch";
  setFormValue("broodPouchId", entry?.id || "");
  setFormValue("broodPouchDragonId", dragon.id);
  setFormValue("broodPouchBrood", entry?.brood === "Unassigned brood" ? "" : entry?.brood || "");
  setFormValue("broodPouchDueAt", entry?.dueAt ? toLocalDateTimeInputValue(entry.dueAt) : "");
  setFormValue("broodPouchOddsSummary", entry?.oddsSummary || "");
  setFormValue("broodPouchNotes", entry?.notes || "");
  showModal(els.broodPouchDialog);
}

function handleBroodPouchSubmit(event) {
  event.preventDefault();
  const values = new FormData(els.broodPouchForm);
  const entryId = text(values.get("id"));
  const dragonId = text(values.get("dragonId"));
  const dragon = dragonById(dragonId);
  const brood = text(values.get("brood"));
  if (!dragon || !brood) {
    showToast("Choose an egg and enter its current brood.");
    return;
  }

  const existing = entryId ? broodPouchEntryById(entryId) : (state.broodPouch || []).find((item) => item.dragonId === dragonId);
  const entry = normalizeBroodPouchEntry({
    id: existing?.id || uid("brood-pouch"),
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    dragonId,
    brood,
    dueAt: dateTimeLocalToIso(values.get("dueAt")),
    oddsSummary: text(values.get("oddsSummary")),
    notes: text(values.get("notes"))
  });
  const index = (state.broodPouch || []).findIndex((item) => item.id === entry.id);
  if (index >= 0) state.broodPouch[index] = entry;
  else state.broodPouch.push(entry);
  saveState();
  closeModal("broodPouchDialog");
  renderAll();
  showToast(`${dragonAccountLabel(dragon)} is on ${entry.brood}`);
}

function handleBroodPouchAction(event) {
  const button = event.target.closest("[data-brood-pouch-action]");
  if (!button) return;
  const action = button.dataset.broodPouchAction;
  const entry = broodPouchEntryById(button.dataset.id);
  if (action === "edit" && entry) openBroodPouchDialog(entry.dragonId, entry.id);
  if (action === "edit-dragon") openDragonDialog(button.dataset.dragonId);
  if (action === "remove" && entry) {
    if (!confirm(`Remove ${entry.brood} from the brood pouch? The egg record will remain in Dragons.`)) return;
    state.broodPouch = state.broodPouch.filter((item) => item.id !== entry.id);
    saveState();
    renderAll();
    showToast("Removed from brood pouch");
  }
}

function broodPouchEntryById(id) {
  return (state.broodPouch || []).find((entry) => entry.id === id) || null;
}

function calculateSkinOdds(parentA, parentB) {
  const slots = parentSkinSlots(parentA, parentB);
  const speciesContext = parentA.species && parentA.species === parentB.species ? parentA.species : "";
  const piebald = piebaldReadiness(parentA, parentB);
  const albinoPossible = Boolean(parentA && parentB);
  const reservedChance = (albinoPossible ? MUTATION_RULES.albinoChance : 0)
    + (piebald.eligible ? MUTATION_RULES.piebaldChance : 0);
  const baseChance = Math.max(0, 100 - reservedChance);
  const bySkin = new Map();

  if (slots.length) {
    const chancePerSlot = baseChance / slots.length;
    slots.forEach((slot) => addOddsEntry(bySkin, slot.skin, chancePerSlot, slot.source, speciesContext));
  }

  if (albinoPossible && slots.length) {
    addOddsEntry(bySkin, "Albino", MUTATION_RULES.albinoChance, "Mutation roll", speciesContext);
  }

  if (piebald.eligible && slots.length) {
    addOddsEntry(bySkin, "Piebald", MUTATION_RULES.piebaldChance, "Piebald mutation roll", speciesContext);
  }

  const entries = [...bySkin.values()]
    .filter((entry) => entry.chance > 0)
    .sort((a, b) => b.chance - a.chance || sortText(a.skin, b.skin))
    .map((entry, index) => ({
      ...entry,
      color: ODDS_COLORS[index % ODDS_COLORS.length]
    }));

  return {
    entries,
    slots,
    albinoPossible,
    piebald,
    reservedChance,
    baseChance
  };
}

function parentSkinSlots(parentA, parentB) {
  return [
    ...skinSlotsForParent(parentA),
    ...skinSlotsForParent(parentB)
  ];
}

function skinSlotsForParent(parent) {
  if (!parent) return [];
  return [
    { skin: parent.skin, source: `${dragonAccountLabel(parent)} visible` },
    { skin: parent.recessiveSkin, source: `${dragonAccountLabel(parent)} recessive` }
  ].filter((slot) => slot.skin);
}

function addOddsEntry(bySkin, skin, chance, source, speciesContext) {
  const key = canonicalSkinName(skin);
  const existing = bySkin.get(key);
  if (existing) {
    existing.chance += chance;
    if (!existing.sources.includes(source)) existing.sources.push(source);
    return;
  }

  bySkin.set(key, {
    skin,
    chance,
    type: skinTypeForName(skin, speciesContext),
    sources: [source]
  });
}

function piebaldReadiness(parentA, parentB) {
  const aHasPrimary = Boolean(parentA?.skin);
  const bHasPrimary = Boolean(parentB?.skin);
  const aExotic = isExoticPrimarySkin(parentA);
  const bExotic = isExoticPrimarySkin(parentB);
  const aNonExotic = isKnownNonExoticPrimarySkin(parentA);
  const bNonExotic = isKnownNonExoticPrimarySkin(parentB);
  const eligible = (aExotic && bNonExotic) || (bExotic && aNonExotic);

  let status = "Ready";
  if (!aHasPrimary || !bHasPrimary) {
    status = "Needs both parent primary skins recorded.";
  } else if (!aExotic && !bExotic) {
    status = "Needs one parent primary skin classified Exotic.";
  } else if (!aNonExotic && !bNonExotic) {
    status = "Needs the other parent primary skin classified non-Exotic.";
  } else if (!eligible) {
    status = "Needs one Exotic primary paired with one non-Exotic primary.";
  }

  return { eligible, status };
}

function isExoticPrimarySkin(parent) {
  return primarySkinTypeForParent(parent) === "Exotic";
}

function isKnownNonExoticPrimarySkin(parent) {
  const type = primarySkinTypeForParent(parent);
  return Boolean(parent?.skin) && type !== "Unknown" && type !== "Exotic";
}

function primarySkinTypeForParent(parent) {
  if (!parent?.skin) return "Unknown";
  return skinTypeForName(parent.skin, parent.species);
}

function skinTypeForName(name, speciesContext = "") {
  const key = canonicalSkinName(name);
  const matches = state.skins.filter((skin) => canonicalSkinName(skin.name) === key);
  const exact = matches.find((skin) => speciesContext && skin.species === speciesContext);
  const allSpecies = matches.find((skin) => skin.species === "All");
  return (exact || allSpecies || matches[0])?.type || "Unknown";
}

function renderSkinOddsPanel(odds, skinPool = []) {
  if (!odds.entries.length) {
    return `
      <p class="planner-note">Record each parent's visible skin and recessive skin to chart odds between the parents. The mutation rules still need saved parent skin data before the planner can show a useful split.</p>
    `;
  }

  const gradient = oddsGradient(odds.entries);
  return `
    <div class="odds-layout">
      <div class="odds-chart-stage">
        <div class="odds-donut" style="background:${escapeAttr(gradient)}" role="img" aria-label="Estimated skin odds chart">
          ${renderOddsSliceLabels(odds.entries)}
          <div class="odds-center">
            <strong>100%</strong>
            <span>estimated</span>
          </div>
        </div>
      </div>
      <div class="odds-secondary">
        <div class="odds-secondary-head">
          <span>Skin list</span>
          <strong>${odds.entries.length}</strong>
        </div>
        <ol class="odds-legend">
          ${odds.entries.map((entry) => `
            <li>
              <span class="odds-swatch" style="background:${escapeAttr(entry.color)}"></span>
              <span class="odds-label">
                <strong>${escapeHtml(entry.skin)}</strong>
                <span>${escapeHtml(entry.type)} / ${escapeHtml(entry.sources.join(", "))}</span>
              </span>
              <span class="odds-value">${formatChance(entry.chance)}</span>
            </li>
          `).join("")}
        </ol>
        <div class="skin-pool secondary-skin-pool" aria-label="Parent skin slots">
          ${skinPool.length ? skinPool.map((item) => `<span class="pill">${escapeHtml(item.skin)} (${escapeHtml(item.source)})</span>`).join("") : `<span class="pill">Unknown</span>`}
        </div>
      </div>
    </div>
    <p class="planner-note">Tracker estimate: filled visible and recessive skin slots are weighted equally, duplicate skins are combined, then the confirmed mutation chances are added as ${formatChance(MUTATION_RULES.albinoChance)} Albino and ${formatChance(MUTATION_RULES.piebaldChance)} Piebald when eligible. No public skin-inheritance buff formula has been stated, so breeder/social points are not applied to skin odds here. Hidden game RNG may differ.</p>
  `;
}

function renderMutationGuide(odds) {
  const albinoStatus = odds.slots.length ? "Possible" : "Needs parent skins recorded.";
  const piebaldStatus = odds.piebald.eligible ? "Ready" : odds.piebald.status;
  return `
    <table class="projection-table mutation-table">
      <thead><tr><th>Skin</th><th>Chance</th><th>Needed</th><th>Status</th></tr></thead>
      <tbody>
        <tr>
          <td>Albino</td>
          <td>${formatChance(MUTATION_RULES.albinoChance)}</td>
          <td>Any two nesting parents; confirmed as a mutation from breeding any skins together.</td>
          <td>${escapeHtml(albinoStatus)}</td>
        </tr>
        <tr>
          <td>Piebald</td>
          <td>${formatChance(MUTATION_RULES.piebaldChance)}</td>
          <td>One parent primary skin classified Exotic, with the other parent primary skin classified non-Exotic.</td>
          <td>${escapeHtml(piebaldStatus)}</td>
        </tr>
      </tbody>
    </table>
  `;
}

function oddsGradient(entries) {
  let cursor = 0;
  const segments = entries.map((entry, index) => {
    const start = cursor;
    const end = index === entries.length - 1 ? 100 : Math.min(100, cursor + entry.chance);
    cursor = end;
    return `${entry.color} ${formatCssPercent(start)} ${formatCssPercent(end)}`;
  });
  return `conic-gradient(${segments.join(", ")})`;
}

function renderOddsSliceLabels(entries) {
  let cursor = 0;
  return entries.map((entry, index) => {
    const start = cursor;
    const end = index === entries.length - 1 ? 100 : Math.min(100, cursor + entry.chance);
    cursor = end;
    const midpoint = (start + end) / 2;
    const angle = (midpoint / 100) * Math.PI * 2 - Math.PI / 2;
    const radius = entry.chance < 4 ? 47 : 35;
    const x = 50 + Math.cos(angle) * radius;
    const y = 50 + Math.sin(angle) * radius;
    return `<span class="odds-slice-label" style="--x:${x.toFixed(2)}%; --y:${y.toFixed(2)}%; --label-color:${escapeAttr(entry.color)}">${escapeHtml(entry.skin)}</span>`;
  }).join("");
}

function renderParentSummary(dragon) {
  return `
    <dl class="line-list">
      <div><dt>Player</dt><dd>${escapeHtml(dragon.username || "Unknown Player")}</dd></div>
      <div><dt>Account</dt><dd>${escapeHtml(dragon.accountName || dragon.name)}</dd></div>
      <div><dt>Species</dt><dd>${escapeHtml(dragon.species || "Unknown")}</dd></div>
      <div><dt>Sex</dt><dd>${escapeHtml(dragon.sex)}</dd></div>
      <div><dt>Status</dt><dd>${escapeHtml(dragon.status)}</dd></div>
      <div><dt>Skin</dt><dd>${escapeHtml(dragon.skin || "Unknown")}</dd></div>
      <div><dt>Recessive</dt><dd>${escapeHtml(dragon.recessiveSkin || "Unknown")}</dd></div>
      <div><dt>Nest role</dt><dd>${escapeHtml(dragon.nestRole || "Unknown")}</dd></div>
      <div><dt>Social pts</dt><dd>${escapeHtml(formatSocialPoints(dragon.socialPoints))}</dd></div>
      <div><dt>Agile</dt><dd>${escapeHtml(formatTrackPoints(dragon.agilePoints, "Fast", dragon.fastMutation))}</dd></div>
      <div><dt>Scavenger</dt><dd>${escapeHtml(formatTrackPoints(dragon.scavengerPoints, "Survivor", dragon.survivorMutation))}</dd></div>
      <div><dt>Free pts</dt><dd>${escapeHtml(String(dragon.remainingMutationPoints ?? 0))}</dd></div>
      <div><dt>Dominant</dt><dd>${dragon.dominantMutation ? "Yes" : "No"}</dd></div>
    </dl>
  `;
}

function renderNestingFamilyTree(parentA, parentB, bloodline, inbredNest) {
  const mother = parentA.sex === "Female" ? parentA : parentB.sex === "Female" ? parentB : parentB;
  const father = parentA.sex === "Male" ? parentA : parentB.sex === "Male" ? parentB : parentA;
  const nodes = [
    lineageNodeHtml("Father GF", parentLineageDescriptor(father, "father")),
    lineageNodeHtml("Father GM", parentLineageDescriptor(father, "mother")),
    lineageNodeHtml("Mother GF", parentLineageDescriptor(mother, "father")),
    lineageNodeHtml("Mother GM", parentLineageDescriptor(mother, "mother"))
  ];

  return `
    <div class="family-tree">
      <div class="family-generation grandparents">
        ${nodes.join("")}
      </div>
      <div class="family-generation parents">
        ${lineageNodeHtml("Father", dragonLineageDescriptor(father))}
        ${lineageNodeHtml("Mother", dragonLineageDescriptor(mother))}
      </div>
      <div class="family-generation egg">
        ${lineageNodeHtml("Egg", {
          name: "Projected egg",
          species: father.species || mother.species,
          sex: "Unknown",
          skin: "See odds",
          bloodline,
          warning: inbredNest ? "F stats" : ""
        })}
      </div>
    </div>
  `;
}

function parentLineageDescriptor(dragon, role) {
  const id = role === "mother" ? dragon?.motherId : dragon?.fatherId;
  const manualName = role === "mother" ? dragon?.motherName : dragon?.fatherName;
  const linked = id ? dragonById(id) : null;
  if (linked) return dragonLineageDescriptor(linked);
  const record = lineageRecordByName(manualName);
  if (record) {
    return {
      name: record.name,
      species: record.species,
      sex: record.sex,
      skin: record.skin,
      bloodline: record.bloodline
    };
  }
  return {
    name: text(manualName) || "Unknown",
    sex: role === "mother" ? "Female" : "Male",
    species: dragon?.species || "",
    skin: "",
    bloodline: "Unknown"
  };
}

function dragonLineageDescriptor(dragon) {
  return {
    name: dragon?.accountName || dragon?.name || "Unknown",
    species: dragon?.species || "",
    sex: dragon?.sex || "Unknown",
    skin: dragon?.skin || "",
    bloodline: dragon?.bloodline || "Unknown"
  };
}

function lineageNodeHtml(role, node) {
  return `
    <div class="family-node ${node?.warning ? "is-warning" : ""}">
      <span>${escapeHtml(role)}</span>
      <strong>${escapeHtml(node?.name || "Unknown")}</strong>
      <em>${escapeHtml(compactJoin([node?.sex, node?.skin || "No skin", node?.bloodline ? `${node.bloodline} line` : ""]))}</em>
      ${node?.warning ? `<b>${escapeHtml(node.warning)}</b>` : ""}
    </div>
  `;
}

function refreshAllDerivedRecords() {
  const roleChanged = refreshNestRoles();
  const derivedChanged = refreshDragonDerivedFields();
  const broodPouchChanged = pruneBroodPouch();
  return roleChanged || derivedChanged || broodPouchChanged;
}

function pruneBroodPouch() {
  const existing = Array.isArray(state.broodPouch) ? state.broodPouch : [];
  const dragonIds = new Set(state.dragons.map((dragon) => dragon.id));
  const next = existing
    .map(normalizeBroodPouchEntry)
    .filter((entry) => dragonIds.has(entry.dragonId));
  if (JSON.stringify(existing) === JSON.stringify(next)) return false;
  state.broodPouch = next;
  return true;
}

function refreshNestRoles() {
  let changed = false;
  state.dragons.forEach((dragon) => {
    const nextRole = inferNestRole(dragon);
    if (dragon.nestRole !== nextRole) {
      dragon.nestRole = nextRole;
      changed = true;
    }
  });
  return changed;
}

function refreshDragonDerivedFields() {
  let changed = false;
  state.dragons.forEach((dragon) => {
    const nextSkinType = skinTypeForName(dragon.skin, dragon.species);
    const nextStatus = normalizeDominantMutationStatus(normalizeStatusForProgress(dragon.status, dragon.elderProgress), dragon.dominantMutation);
    const nextGrowth = normalizeGrowthValue(nextStatus, dragon.growth);
    const nextElderProgress = normalizeElderProgress(nextStatus, dragon.elderProgress);
    const nextMutationPoints = estimateMutationPoints(nextStatus, nextGrowth, nextElderProgress);
    const nextAllocation = normalizeMutationAllocation({
      status: nextStatus,
      nestRole: dragon.nestRole,
      mutationPoints: nextMutationPoints,
      socialPoints: dragon.socialPoints,
      dominantMutation: dragon.dominantMutation,
      agilePoints: dragon.agilePoints,
      fastMutation: dragon.fastMutation,
      scavengerPoints: dragon.scavengerPoints,
      survivorMutation: dragon.survivorMutation
    });

    if (dragon.skinType !== nextSkinType) {
      dragon.skinType = nextSkinType;
      changed = true;
    }
    if (dragon.status !== nextStatus) {
      dragon.status = nextStatus;
      changed = true;
    }
    if (dragon.growth !== nextGrowth) {
      dragon.growth = nextGrowth;
      changed = true;
    }
    if (dragon.elderProgress !== nextElderProgress) {
      dragon.elderProgress = nextElderProgress;
      changed = true;
    }
    if (dragon.mutationPoints !== nextMutationPoints) {
      dragon.mutationPoints = nextMutationPoints;
      changed = true;
    }
    ["dominantMutation", "socialPoints", "agilePoints", "fastMutation", "scavengerPoints", "survivorMutation", "remainingMutationPoints"].forEach((key) => {
      if (dragon[key] !== nextAllocation[key]) {
        dragon[key] = nextAllocation[key];
        changed = true;
      }
    });
  });
  return changed;
}

function inferNestRole(dragon) {
  if (pureSkinForDragon(dragon)) return "Pure";
  if (["Breeder", "Fighter"].includes(dragon.nestRole)) return dragon.nestRole;
  return "Unknown";
}

function pureSkinForDragon(dragon) {
  return matchingDominantRecessiveSkin(dragon);
}

function hasPureSkin(dragon, skinKey) {
  return canonicalSkinName(pureSkinForDragon(dragon)) === skinKey;
}

function matchingDominantRecessiveSkin(dragon) {
  if (!dragon) return "";
  const primary = canonicalSkinName(dragon.skin);
  const recessive = canonicalSkinName(dragon.recessiveSkin);
  if (!primary || primary === "unknown" || !recessive || recessive === "unknown" || primary !== recessive) return "";
  return text(dragon.skin);
}

function renderSkins() {
  const query = els.skinSearch.value.trim().toLowerCase();
  const species = els.skinSpeciesFilter.value;
  const type = els.skinTypeFilter.value;
  const mutationsOnly = els.mutatedSkinsOnly.checked;
  const skins = state.skins
    .filter((skin) => {
      if (species && species !== "All species" && skin.species !== species) return false;
      if (type && !["All types", "All rarities"].includes(type) && skin.type !== type) return false;
      if (mutationsOnly && skin.type !== "Mutation") return false;
      if (!query) return true;
      return [skin.name, skin.type, skin.species, skin.source, skin.recipeA, skin.recipeB]
        .join(" ")
        .toLowerCase()
        .includes(query);
    })
    .sort((a, b) => sortText(a.species, b.species) || sortText(a.type, b.type) || sortText(a.name, b.name));
  const showPendingSpecies = !query
    && ["All types", "All rarities"].includes(type)
    && !mutationsOnly;
  const pendingSpecies = showPendingSpecies
    ? [...UPCOMING_SPECIES].filter((name) => !species || species === "All species" || species === name)
    : [];

  if (!skins.length && !pendingSpecies.length) {
    els.skinList.innerHTML = `
      <div class="empty-state">
        <h2>No matching skins</h2>
        <p>Add a skin or adjust the filters.</p>
      </div>
    `;
    return;
  }

  const grouped = groupBySpecies(skins);
  pendingSpecies.forEach((name) => {
    if (!grouped.some(([speciesName]) => speciesName === name)) grouped.push([name, []]);
  });
  grouped.sort(([a], [b]) => sortText(a === "All" ? "" : a, b === "All" ? "" : b));
  els.skinList.innerHTML = grouped.map(([speciesName, speciesSkins]) => `
    <section class="skin-species-section" aria-label="${escapeAttr(speciesName)} skins">
      ${speciesName === "All" ? "" : `
        <div class="skin-species-head">
          <h2>${escapeHtml(speciesName)}</h2>
          <span class="pill skin-count-pill">${UPCOMING_SPECIES.has(speciesName) && !speciesSkins.length ? "Upcoming" : `${speciesSkins.length} ${speciesSkins.length === 1 ? "skin" : "skins"}`}</span>
        </div>
      `}
      ${speciesSkins.length
        ? `<div class="skin-species-grid">${speciesSkins.map(renderSkinCard).join("")}</div>`
        : `<p class="skin-species-pending">Official skin list pending the game update.</p>`}
    </section>
  `).join("");
}

function renderSkinCard(skin) {
  const turntable = turntableForSkin(skin);
  return `
    <article class="skin-card${turntable ? " has-turntable" : ""}${skin.wishlist ? " is-wishlist" : ""}" data-id="${escapeAttr(skin.id)}">
      ${renderSkinTurntable(turntable, skin)}
      <div class="card-head">
        <div class="card-title">
          <h3>${escapeHtml(skin.name)}</h3>
          <p class="card-subtitle">${escapeHtml(compactJoin([skin.species, skin.source]))}</p>
        </div>
        <span class="pill skin-rarity-pill">${escapeHtml(skin.type)}</span>
      </div>
      <div class="skin-meta">
        ${skin.owned ? `<span class="small-pill">Owned</span>` : `<span class="small-pill">Not owned</span>`}
        ${skin.wishlist ? `<span class="small-pill">Wishlist</span>` : ""}
        ${skin.recipeA ? `<span class="small-pill">A: ${escapeHtml(skin.recipeA)}</span>` : ""}
        ${skin.recipeB ? `<span class="small-pill">B: ${escapeHtml(skin.recipeB)}</span>` : ""}
      </div>
      <div class="card-actions">
        <button class="tool-button" type="button" data-skin-action="wishlist" data-id="${escapeAttr(skin.id)}">${skin.wishlist ? "Unwishlist" : "Wishlist"}</button>
        <button class="tool-button" type="button" data-skin-action="edit" data-id="${escapeAttr(skin.id)}">Edit</button>
        <button class="danger-button" type="button" data-skin-action="delete" data-id="${escapeAttr(skin.id)}">Delete</button>
      </div>
    </article>
  `;
}

function turntableForSkin(skin) {
  const skinName = canonicalSkinName(skin.name);
  const requestedSpecies = canonicalSpeciesName(skin.species);
  const speciesNames = requestedSpecies === "All"
    ? DEFAULT_SPECIES.map((species) => species.name)
    : [requestedSpecies];
  const variants = speciesNames.map((species) => {
    const file = SKIN_TURNTABLES.get(`${species}::${skinName}`);
    return file ? { species, src: `./assets/skins/${file}` } : null;
  }).filter(Boolean);

  if (!variants.length) return null;
  return { ...variants[0], variants };
}

function renderSkinTurntable(turntable, skin) {
  if (!turntable) return "";
  const label = `${skin.name} ${turntable.species} turntable`;
  const picker = turntable.variants.length > 1 ? `
    <label class="skin-turntable-variant">
      <span class="visually-hidden">Preview species</span>
      <select class="skin-turntable-picker" aria-label="Preview species for ${escapeAttr(skin.name)}">
        ${turntable.variants.map((variant) => `<option value="${escapeAttr(variant.src)}"${variant.src === turntable.src ? " selected" : ""}>${escapeHtml(variant.species)}</option>`).join("")}
      </select>
    </label>
  ` : "";
  return `
    <div class="skin-turntable-group">
      ${picker}
      <button class="skin-turntable" type="button" aria-label="${escapeAttr(label)}" title="${escapeAttr(label)}" tabindex="0">
        <video src="${escapeAttr(turntable.src)}" muted loop playsinline preload="metadata"></video>
      </button>
    </div>
  `;
}

function handleSkinTurntableStart(event) {
  const turntable = event.target.closest?.(".skin-turntable");
  if (!turntable || !els.skinList.contains(turntable)) return;
  document.querySelectorAll(".skin-turntable video").forEach((otherVideo) => {
    if (otherVideo !== turntable.querySelector("video")) {
      otherVideo.pause();
      otherVideo.currentTime = 0;
    }
  });
  const video = turntable.querySelector("video");
  video?.play().catch(() => {});
}

function handleSkinTurntableStop(event) {
  const turntable = event.target.closest?.(".skin-turntable");
  if (!turntable || !els.skinList.contains(turntable)) return;
  const related = event.relatedTarget;
  if (related instanceof Node && turntable.contains(related)) return;
  const video = turntable.querySelector("video");
  if (!video) return;
  video.pause();
  video.currentTime = 0;
}

function handleSkinTurntableVariantChange(event) {
  const picker = event.target.closest?.(".skin-turntable-picker");
  if (!picker || !els.skinList.contains(picker)) return;
  const group = picker.closest(".skin-turntable-group");
  const video = group?.querySelector("video");
  const button = group?.querySelector(".skin-turntable");
  if (!video || !button || video.getAttribute("src") === picker.value) return;
  const species = picker.options[picker.selectedIndex]?.text || "skin";
  const skinName = group.closest(".skin-card")?.querySelector(".card-title h3")?.textContent || "Skin";
  const label = `${skinName} ${species} turntable`;
  video.pause();
  video.currentTime = 0;
  video.setAttribute("src", picker.value);
  button.setAttribute("aria-label", label);
  button.setAttribute("title", label);
}

function groupBySpecies(skins) {
  const bySpecies = new Map();
  skins.forEach((skin) => {
    const species = skin.species || "Unknown";
    if (!bySpecies.has(species)) bySpecies.set(species, []);
    bySpecies.get(species).push(skin);
  });
  return [...bySpecies.entries()].sort(([a], [b]) => sortText(a === "All" ? "" : a, b === "All" ? "" : b));
}

function renderUpstats() {
  if (!els.upstatList) return;
  const query = text(els.upstatSearch?.value).toLowerCase();
  const species = els.upstatSpeciesFilter?.value || "All species";
  const status = els.upstatStatusFilter?.value || "All processes";
  const records = [...state.upstats]
    .filter((record) => {
      if (species !== "All species" && record.species !== species) return false;
      if (status !== "All processes" && record.status !== status) return false;
      if (!query) return true;
      const account = accountById(record.accountId);
      return [
        record.species,
        record.skin,
        record.status,
        record.notes,
        account?.username,
        account?.accountName
      ].join(" ").toLowerCase().includes(query);
    })
    .sort((a, b) => Number(b.complete) - Number(a.complete) || sortText(a.species, b.species) || sortText(a.skin, b.skin));

  if (!state.upstats.length) {
    els.upstatList.innerHTML = `
      <div class="empty-state">
        <h2>No upstats tracked yet</h2>
        <p>Add a skin when you want to track whether it has reached 18A+.</p>
      </div>
    `;
    return;
  }

  if (!records.length) {
    els.upstatList.innerHTML = `
      <div class="empty-state">
        <h2>No matching upstats</h2>
        <p>Adjust the search or filters.</p>
      </div>
    `;
    return;
  }

  els.upstatList.innerHTML = records.map(renderUpstatCard).join("");
}

function renderUpstatCard(record) {
  const account = accountById(record.accountId);
  const percent = Math.round((record.aPlusCount / 18) * 100);
  return `
    <article class="upstat-card" data-id="${escapeAttr(record.id)}">
      <div class="card-head">
        <div class="card-title">
          <h3>${escapeHtml(record.skin)}</h3>
          <p class="card-subtitle">${escapeHtml(compactJoin([record.species, account ? dragonAccountLabel({ username: account.username, accountName: account.accountName }) : "No account"]))}</p>
        </div>
        <span class="pill ${record.complete ? "status-grown" : ""}">${escapeHtml(record.status)}</span>
      </div>
      <div class="progress-row">
        <div class="progress-label"><span>A+ stats</span><strong>${record.aPlusCount}/18</strong></div>
        <div class="progress-track"><div class="progress-fill" style="width:${percent}%"></div></div>
      </div>
      ${record.notes ? `<p class="planner-note">${escapeHtml(record.notes)}</p>` : ""}
      <div class="card-actions">
        <button class="tool-button" type="button" data-upstat-action="toggle" data-id="${escapeAttr(record.id)}">${record.complete ? "Reopen" : "18A+"}</button>
        <button class="tool-button" type="button" data-upstat-action="edit" data-id="${escapeAttr(record.id)}">Edit</button>
        <button class="danger-button" type="button" data-upstat-action="delete" data-id="${escapeAttr(record.id)}">Delete</button>
      </div>
    </article>
  `;
}

function openUpstatDialog(id = "") {
  const record = id ? upstatById(id) : null;
  els.upstatForm.reset();
  els.upstatDialogTitle.textContent = record ? "Edit Upstat" : "Add Upstat";
  setFormValue("upstatId", record?.id || "");
  renderUpstatSpeciesSelect();
  setFormValue("upstatSpecies", record?.species || collectSpeciesNames()[0] || "");
  renderUpstatSkinSelect(document.querySelector("#upstatSpecies")?.value || "", record?.skin || "");
  fillSelect(document.querySelector("#upstatStatus"), UPSTAT_STATUSES);
  setFormValue("upstatStatus", record?.status || "Not Started");
  setFormValue("upstatAPlusCount", record?.aPlusCount ?? 0);
  setChecked("upstatComplete", record?.complete);
  renderUpstatAccountSelect(record?.accountId || "");
  setFormValue("upstatNotes", record?.notes || "");
  syncUpstatCompleteControls();
  showModal(els.upstatDialog);
}

function renderUpstatSpeciesSelect() {
  const select = document.querySelector("#upstatSpecies");
  if (!select) return;
  fillSelect(select, ["", ...collectSpeciesNames(), "All"]);
  if (select.options[0]) select.options[0].textContent = "Select species";
}

function renderUpstatSkinSelect(species, selectedSkin = document.querySelector("#upstatSkin")?.value || "") {
  fillBoundSkinSelect(document.querySelector("#upstatSkin"), skinOptionsForSpecies(species), selectedSkin, "Select skin");
}

function renderUpstatAccountSelect(selectedAccountId = "") {
  const select = document.querySelector("#upstatAccount");
  if (!select) return;
  select.innerHTML = [
    "<option value=''>No account</option>",
    ...state.accounts.map((account) => `<option value="${escapeAttr(account.id)}">${escapeHtml(`${account.username} / ${account.accountName}`)}</option>`)
  ].join("");
  select.value = accountById(selectedAccountId) ? selectedAccountId : "";
}

function syncUpstatCompleteControls() {
  const completeInput = document.querySelector("#upstatComplete");
  const countInput = document.querySelector("#upstatAPlusCount");
  const statusInput = document.querySelector("#upstatStatus");
  const count = clampInteger(countInput?.value, 0, 18);
  if (countInput) countInput.value = count;
  if (count >= 18 && completeInput) completeInput.checked = true;
  if (completeInput?.checked) {
    if (countInput) countInput.value = 18;
    if (statusInput) statusInput.value = "18A+ Complete";
  } else if (statusInput?.value === "18A+ Complete") {
    statusInput.value = count >= 14 ? "Near 18A+" : count > 0 ? "Partial A+" : "Not Started";
  }
}

function handleUpstatSubmit(event) {
  event.preventDefault();
  const form = new FormData(els.upstatForm);
  const id = form.get("id") || uid("upstat");
  const existing = upstatById(id);
  const record = normalizeUpstat({
    id,
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    species: form.get("species"),
    skin: form.get("skin"),
    status: form.get("status"),
    aPlusCount: form.get("aPlusCount"),
    accountId: form.get("accountId"),
    complete: form.has("complete"),
    notes: form.get("notes")
  });

  const index = state.upstats.findIndex((item) => item.id === id);
  if (index >= 0) state.upstats[index] = record;
  else state.upstats.push(record);
  saveState();
  closeModal("upstatDialog");
  renderAll();
  showToast(`${record.skin} upstat saved`);
}

function handleUpstatAction(event) {
  const button = event.target.closest("[data-upstat-action]");
  if (!button) return;
  const record = upstatById(button.dataset.id);
  if (!record) return;

  if (button.dataset.upstatAction === "edit") openUpstatDialog(record.id);
  if (button.dataset.upstatAction === "toggle") {
    record.complete = !record.complete;
    record.aPlusCount = record.complete ? 18 : Math.min(record.aPlusCount, 17);
    record.status = record.complete ? "18A+ Complete" : "Near 18A+";
    record.updatedAt = new Date().toISOString();
    saveState();
    renderAll();
  }
  if (button.dataset.upstatAction === "delete") {
    if (!confirm(`Delete ${record.skin} upstat progress?`)) return;
    state.upstats = state.upstats.filter((item) => item.id !== record.id);
    saveState();
    renderAll();
    showToast(`${record.skin} upstat deleted`);
  }
}

function upstatById(id) {
  return state.upstats.find((record) => record.id === id);
}

function renderMap() {
  if (!els.mapStage) return;
  renderMapLayers();
  renderMapAreaButtons();
  renderMapReferences();
  renderMapPins();
}

function clanMembershipClan(membership) {
  const relation = membership?.clans;
  return Array.isArray(relation) ? relation[0] : relation;
}

function activeClanMembership() {
  const memberships = Array.isArray(clanUi.memberships) ? clanUi.memberships : [];
  return memberships.find((membership) => membership?.clan_id === clanUi.activeClanId) || null;
}

function activeClan() {
  return clanMembershipClan(activeClanMembership());
}

function canShareWithActiveClan() {
  return Boolean(clanSync?.isConfigured() && clanUi.user && activeClanMembership());
}

function clanMemberName(userId) {
  const members = Array.isArray(clanUi.members) ? clanUi.members : [];
  const member = members.find((item) => item?.user_id === userId);
  return member?.display_name || "Clan member";
}

function normalizePrimaryAccountId(value, personalPlayer, accounts = state?.accounts || []) {
  const accountId = text(value);
  const player = normalizePersonalPlayer(personalPlayer, accounts);
  if (!accountId || !player) return "";
  const playerKey = playerNameKey(player);
  return accounts.some((account) => text(account.id) === accountId && playerNameKey(account.username) === playerKey)
    ? accountId
    : "";
}

function sortAccountsPrimaryFirst(accounts, primaryAccountId = state?.settings?.primaryAccountId || "") {
  const primaryId = text(primaryAccountId);
  return [...accounts].sort((a, b) => (
    Number(text(b.id) === primaryId) - Number(text(a.id) === primaryId)
    || sortText(a.username, b.username)
    || sortText(a.accountName, b.accountName)
  ));
}

function reconcilePrimaryHomeSettings() {
  if (!state?.settings) return;
  const personalPlayer = normalizePersonalPlayer(state.settings.personalPlayer, state.accounts);
  state.settings.personalPlayer = personalPlayer;
  state.settings.primaryAccountId = normalizePrimaryAccountId(
    state.settings.primaryAccountId,
    personalPlayer,
    state.accounts
  );
}

function clanDisplayName(user) {
  return text(user?.user_metadata?.global_name || user?.user_metadata?.full_name || user?.user_metadata?.name || user?.user_metadata?.preferred_username || "Tracker Member") || "Tracker Member";
}

function clanRoleOptions(selectedRole) {
  return ["admin", "member", "viewer"].map((role) => (
    `<option value="${role}"${role === selectedRole ? " selected" : ""}>${role}</option>`
  )).join("");
}

function clanFriendlyError(error) {
  const message = text(error?.message || error, 240);
  if (/authentication|required|token|jwt|sign-in/i.test(message)) return "Your sign-in has expired. Connect Discord again.";
  if (/permission|row-level|policy|not an active member/i.test(message)) return "You do not have permission for that clan action.";
  if (/network|fetch|offline|failed to fetch/i.test(message)) return "Dragon Tracker could not reach clan sync. Check your connection and sync address.";
  return message || "That clan action could not be completed.";
}

function reconcileActiveClan() {
  const memberships = Array.isArray(clanUi.memberships) ? clanUi.memberships : [];
  const hasActive = memberships.some((membership) => membership?.clan_id === clanUi.activeClanId);
  if (!hasActive) clanUi.activeClanId = memberships[0]?.clan_id || "";
  if (clanUi.activeClanId) localStorage.setItem(ACTIVE_CLAN_STORAGE_KEY, clanUi.activeClanId);
  else localStorage.removeItem(ACTIVE_CLAN_STORAGE_KEY);
}

function connectedDiscordUserId(user = clanUi.user) {
  const identities = Array.isArray(user?.identities) ? user.identities : [];
  const discordIdentity = identities.find((identity) => text(identity?.provider).toLowerCase() === "discord");
  const candidates = [
    discordIdentity?.identity_data?.provider_id,
    discordIdentity?.identity_data?.sub,
    discordIdentity?.identity_data?.id,
    user?.user_metadata?.provider_id,
    user?.user_metadata?.sub,
    user?.user_metadata?.id
  ];
  return candidates.map(text).find((value) => /^\d{10,24}$/.test(value)) || "";
}

function discordSubmissionSourceId(record) {
  return `discord-submission:${text(record?.id || record)}`;
}

function discordSubmissionTag(record) {
  return `discord:${text(record?.id || record)}`;
}

function importedDragonForDiscordSubmission(record) {
  const marker = discordSubmissionTag(record);
  return state.dragons.find((dragon) => Array.isArray(dragon.tags) && dragon.tags.includes(marker)) || null;
}

function isOwnDiscordSubmission(record, discordUserId = connectedDiscordUserId()) {
  return Boolean(discordUserId && text(record?.discord_user_id) === discordUserId);
}

function isAutomatedDiscordTestSubmission(record) {
  const payload = record?.payload && typeof record.payload === "object" ? record.payload : {};
  const values = [payload.name, payload.accountName, payload.notes].map(text).join(" ").toLowerCase();
  return values.includes("[test]") || values.includes("automated test-bank");
}

async function syncImportedDiscordDragon(clanId, record, dragon) {
  if (!clanId || !dragon || !CLAN_SYNCED_DISCORD_DRAGON_TYPES.has(text(record?.submission_type))) return;
  await clanSync.shareDragon(clanId, discordSubmissionSourceId(record), clanDragonSummary(dragon));
}

async function autoImportOwnDiscordSubmissions(clanId, records) {
  if (!clanId) return new Set();
  const discordUserId = connectedDiscordUserId();
  if (!discordUserId) return new Set();

  const importedIds = new Set();
  const ownSubmissions = Array.isArray(records)
    ? records.filter((record) => (
      AUTO_IMPORTABLE_DISCORD_SUBMISSION_TYPES.has(text(record?.submission_type))
      && isOwnDiscordSubmission(record, discordUserId)
      && !isAutomatedDiscordTestSubmission(record)
    ))
    : [];

  for (const record of ownSubmissions) {
    try {
      const imported = importDiscordSubmission(record);
      await syncImportedDiscordDragon(clanId, record, imported);
      await clanSync.resolveDiscordSubmission(record.id, "imported");
      importedIds.add(record.id);
    } catch (error) {
      console.warn("Could not automatically import a Discord submission.", error);
    }
  }

  return importedIds;
}

async function refreshClanSync(options = {}) {
  clanUi.loading = true;
  clanUi.lastRefreshError = "";
  if (!clanSync || !clanSync.isConfigured()) {
    clanUi.user = null;
    clanUi.identityLinks = [];
    clanUi.memberships = [];
    clanUi.members = [];
    clanUi.sharedDragons = [];
    clanUi.sharedPins = [];
    clanUi.discordSubmissions = [];
    clanUi.activeClanId = "";
    clanUi.loading = false;
    renderSyncStatusBadge();
    if (currentTab === "clans") renderClans();
    return;
  }

  try {
    const user = await clanSync.getCurrentUser();
    clanUi.user = user;
    clanUi.error = "";

    if (!user) {
      clanUi.identityLinks = [];
      clanUi.memberships = [];
      clanUi.members = [];
      clanUi.sharedDragons = [];
      clanUi.sharedPins = [];
      clanUi.discordSubmissions = [];
      clanUi.activeClanId = "";
      clanUi.loading = false;
      renderSyncStatusBadge();
      if (currentTab === "clans") renderClans();
      return;
    }

    if (clanUi.profileUserId !== user.id) {
      await clanSync.upsertProfile(clanDisplayName(user));
      clanUi.profileUserId = user.id;
    }

    const [identityLinks, memberships] = await Promise.all([
      clanSync.getIdentityLinks(),
      clanSync.getMemberships()
    ]);
    clanUi.identityLinks = Array.isArray(identityLinks) ? identityLinks : [];
    clanUi.memberships = Array.isArray(memberships) ? memberships : [];
    reconcileActiveClan();

    if (clanUi.activeClanId) {
      const [membersResult, sharedDragonsResult, sharedPinsResult, discordSubmissionsResult] = await Promise.allSettled([
        clanSync.getClanMembers(clanUi.activeClanId),
        clanSync.getSharedDragons(clanUi.activeClanId),
        clanSync.getClanMapPins(clanUi.activeClanId),
        clanSync.getDiscordSubmissions?.(clanUi.activeClanId) || []
      ]);

      clanUi.members = membersResult.status === "fulfilled" && Array.isArray(membersResult.value)
        ? membersResult.value
        : [];
      clanUi.sharedDragons = sharedDragonsResult.status === "fulfilled" && Array.isArray(sharedDragonsResult.value)
        ? sharedDragonsResult.value
        : [];
      clanUi.sharedPins = sharedPinsResult.status === "fulfilled" && Array.isArray(sharedPinsResult.value)
        ? sharedPinsResult.value
        : [];
      clanUi.discordSubmissions = discordSubmissionsResult.status === "fulfilled" && Array.isArray(discordSubmissionsResult.value)
        ? discordSubmissionsResult.value
        : [];

      const readFailure = [sharedDragonsResult, membersResult, sharedPinsResult, discordSubmissionsResult]
        .find((result) => result.status === "rejected");
      if (readFailure) {
        const detail = clanFriendlyError(readFailure.reason);
        clanUi.lastRefreshError = detail;
        clanUi.error = sharedDragonsResult.status === "rejected"
          ? `The clan library could not load: ${detail}`
          : `The clan library loaded, but one section could not refresh: ${detail}`;
      }

      if (discordSubmissionsResult.status === "fulfilled") {
        const autoImportedIds = await autoImportOwnDiscordSubmissions(clanUi.activeClanId, clanUi.discordSubmissions);
        if (autoImportedIds.size) {
          clanUi.discordSubmissions = clanUi.discordSubmissions.filter((record) => !autoImportedIds.has(record.id));
          const refreshedSharedDragons = await clanSync.getSharedDragons(clanUi.activeClanId);
          clanUi.sharedDragons = Array.isArray(refreshedSharedDragons) ? refreshedSharedDragons : clanUi.sharedDragons;
        }
      }
    } else {
      clanUi.members = [];
      clanUi.sharedDragons = [];
      clanUi.sharedPins = [];
      clanUi.discordSubmissions = [];
    }

    const removedLegacyClanCopies = removeClanImportedLocalCopies();
    if (removedLegacyClanCopies) {
      refreshAllDerivedRecords();
      saveState({ skipHistory: true });
      if (!document.querySelector("dialog[open]")) renderAll();
    }

    const signature = JSON.stringify({
      activeClanId: clanUi.activeClanId,
      identityLinks: clanUi.identityLinks,
      memberships: clanUi.memberships,
      members: clanUi.members,
      sharedDragons: clanUi.sharedDragons,
      sharedPins: clanUi.sharedPins,
      discordSubmissions: clanUi.discordSubmissions
    });
    const changed = signature !== clanUi.lastSignature;
    clanUi.lastSignature = signature;
    clanUi.loading = false;
    clanUi.lastLoadedAt = new Date().toISOString();
    if (currentTab === "clans" || (!options.quiet && changed)) renderClans();
    if (changed && currentTab === "map") renderMapPins();
    if (changed && currentTab === "dragons") renderDragons();
    if (changed && currentTab === "players") renderAccounts();
    renderSyncStatusBadge();
    if (currentTab === "settings") renderBackup();
  } catch (error) {
    clanUi.error = clanFriendlyError(error);
    clanUi.lastRefreshError = clanUi.error;
    clanUi.loading = false;
    renderSyncStatusBadge();
    if (currentTab === "clans" || !options.quiet) renderClans();
  }
}

function clanSharedDragonKey(clanId, record) {
  return `${text(clanId)}::${text(record?.source_user_id)}::${text(record?.source_local_id)}`;
}

function clanShareKeysForDragon(dragon) {
  return [...new Set([
    ...(Array.isArray(dragon?.clanShareKeys) ? dragon.clanShareKeys : []),
    text(dragon?.clanShareKey)
  ].map(text).filter(Boolean))];
}

function removeClanImportedLocalCopies() {
  const importedDragonIds = new Set(state.dragons
    .filter((dragon) => dragon.clanImported)
    .map((dragon) => dragon.id));
  const importedAccountIds = new Set(state.accounts
    .filter((account) => account.clanImported)
    .map((account) => account.id));
  if (!importedDragonIds.size && !importedAccountIds.size) return false;

  state.dragons = state.dragons.filter((dragon) => !importedDragonIds.has(dragon.id));
  state.broodPouch = (state.broodPouch || []).filter((entry) => !importedDragonIds.has(entry.dragonId));
  clearDragonParentReferences(importedDragonIds);

  const accountIdsInUse = new Set(state.dragons.map((dragon) => dragon.accountId));
  state.accounts = state.accounts.filter((account) => (
    !importedAccountIds.has(account.id) || accountIdsInUse.has(account.id)
  ));
  state.accounts.forEach((account) => {
    if (account.clanImported && accountIdsInUse.has(account.id)) account.clanImported = false;
  });
  if (state.settings?.elderTickAccounts) {
    importedAccountIds.forEach((accountId) => {
      if (!accountIdsInUse.has(accountId)) delete state.settings.elderTickAccounts[accountId];
    });
  }
  reconcilePrimaryHomeSettings();
  return true;
}

function renderClans() {
  if (!els.clanContent) return;
  if (!els.clanContent.childElementCount) {
    els.clanContent.innerHTML = `
      <section class="clan-panel clan-sync-health">
        <div class="card-head"><div class="card-title"><h2>Clan Library</h2><p class="card-subtitle">Loading the shared clan workspace</p></div><span class="pill">Loading</span></div>
      </section>
    `;
  }
  try {
    normalizeClanUiForRender();
    renderClansContent();
  } catch (error) {
    console.error("Clan view render failed", error);
    const detail = clanFriendlyError(error);
    clanUi.error = detail;
    clanUi.lastRefreshError = detail;
    els.clanContent.innerHTML = `
      <section class="clan-panel clan-identity-panel clan-sync-health">
        <div class="card-head"><div class="card-title"><h2>Clan Library</h2><p class="card-subtitle">The shared data is still safe in your clan.</p></div><span class="pill">Refresh needed</span></div>
        <p class="clan-error">${escapeHtml(detail)}</p>
        <div class="card-actions"><button class="primary-button" type="button" data-clan-action="refresh">Refresh Clan Library</button></div>
      </section>
    `;
  }
  if (!els.clanContent.childElementCount) {
    els.clanContent.innerHTML = `
      <section class="clan-panel clan-sync-health">
        <h2>Clan Library</h2>
        <p class="clan-error">The clan view returned no content. Refresh the library to recover it.</p>
        <div class="card-actions"><button class="primary-button" type="button" data-clan-action="refresh">Refresh Clan Library</button></div>
      </section>
    `;
  }
}

function normalizeClanUiForRender() {
  clanUi.identityLinks = Array.isArray(clanUi.identityLinks) ? clanUi.identityLinks.filter(Boolean) : [];
  clanUi.memberships = Array.isArray(clanUi.memberships) ? clanUi.memberships.filter(Boolean) : [];
  clanUi.members = Array.isArray(clanUi.members) ? clanUi.members.filter(Boolean) : [];
  clanUi.sharedDragons = Array.isArray(clanUi.sharedDragons) ? clanUi.sharedDragons.filter(Boolean) : [];
  clanUi.sharedPins = Array.isArray(clanUi.sharedPins) ? clanUi.sharedPins.filter(Boolean) : [];
  clanUi.discordSubmissions = Array.isArray(clanUi.discordSubmissions) ? clanUi.discordSubmissions.filter(Boolean) : [];
  clanUi.libraryFilters = {
    dragon: "",
    skin: "",
    recessive: "",
    sex: "",
    pure: "",
    source: "",
    ...(clanUi.libraryFilters && typeof clanUi.libraryFilters === "object" ? clanUi.libraryFilters : {})
  };
}

function renderClansContent() {
  if (!els.clanContent) return;
  if (!clanSync) {
    els.clanContent.innerHTML = `<section class="clan-panel empty-state"><h2>Secure sync is unavailable</h2><p>This build is missing the clan sync client.</p></section>`;
    return;
  }

  if (!clanSync.isConfigured()) {
    els.clanContent.innerHTML = `
      <section class="clan-panel clan-identity-panel">
        <div class="card-head">
          <div class="card-title"><h2>Clan Sync</h2><p class="card-subtitle">Private by default</p></div>
          <span class="pill">Local Only</span>
        </div>
        <p class="clan-copy">Your dragons, accounts, backups, and map pins remain only on this device until you explicitly share an item with a clan.</p>
        <div class="card-actions"><button class="primary-button" type="button" data-clan-action="configure">Connect Sync</button></div>
      </section>
      <section class="clan-panel">
        <h2>What connects</h2>
        <dl class="line-list">
          <div><dt>Discord</dt><dd>Identity only, using the identify scope.</dd></div>
          <div><dt>Sharing</dt><dd>Only dragons and map pins you choose to share.</dd></div>
        </dl>
      </section>
    `;
    return;
  }

  if (!clanUi.user) {
    els.clanContent.innerHTML = `
      <section class="clan-panel clan-identity-panel">
        <div class="card-head">
          <div class="card-title"><h2>Clan Sync</h2><p class="card-subtitle">Secure sync configured</p></div>
          <span class="pill">Sign-in Required</span>
        </div>
        <p class="clan-copy">Discord verifies the tracker identity used for clan permissions. Dragon Tracker requests no email, guild list, messages, or Discord password.</p>
        ${clanUi.error ? `<p class="clan-error">${escapeHtml(clanUi.error)}</p>` : ""}
        <div class="card-actions">
          <button class="primary-button" type="button" data-clan-action="connect-discord">Connect Discord</button>
          <button class="tool-button" type="button" data-clan-action="configure">Sync Connection</button>
        </div>
      </section>
    `;
    return;
  }

  const currentClan = activeClan();
  const membership = activeClanMembership();
  const loadStatus = clanUi.loading ? "Refreshing" : clanUi.lastRefreshError ? "Needs attention" : "Ready";
  const loadSummary = clanUi.loading
    ? "Reading clan membership and shared records."
    : clanUi.lastRefreshError
      ? clanUi.lastRefreshError
      : clanUi.lastLoadedAt
        ? `Last refreshed ${formatDateTime(clanUi.lastLoadedAt)}.`
        : "Connected. Refresh to load the latest shared records.";
  const clanOptions = clanUi.memberships.map((item) => {
    const clan = clanMembershipClan(item);
    if (!clan) return "";
    return `<option value="${escapeAttr(item.clan_id)}"${item.clan_id === clanUi.activeClanId ? " selected" : ""}>${escapeHtml(clan.name)} (${escapeHtml(item.role)})</option>`;
  }).join("");
  const memberRows = clanUi.members.length
    ? clanUi.members.map((member) => {
      const ownerControls = membership?.role === "owner" && member.role !== "owner"
        ? `
          <div class="clan-member-controls">
            <select aria-label="Role for ${escapeAttr(member.display_name || "Tracker Member")}" data-clan-role-for="${escapeAttr(member.user_id)}">${clanRoleOptions(member.role)}</select>
            <button class="tool-button" type="button" data-clan-action="save-member-role" data-user-id="${escapeAttr(member.user_id)}">Save</button>
            <button class="danger-button" type="button" data-clan-action="transfer-owner" data-user-id="${escapeAttr(member.user_id)}">Make Owner</button>
          </div>
        `
        : `<span class="small-pill">${escapeHtml(member.role)}</span>`;
      return `
      <div class="clan-member-row">
        <strong>${escapeHtml(member.display_name || "Tracker Member")}</strong>
        ${ownerControls}
      </div>
    `;
    }).join("")
    : `<p class="account-empty">Choose or join a clan to see its roster.</p>`;
  const filteredSharedDragons = getFilteredClanSharedDragons();
  const filters = clanUi.libraryFilters;
  const dragonOptions = clanLibraryFilterOptions("displayName", filters.dragon, "All dragons");
  const skinOptions = clanLibraryFilterOptions("skin", filters.skin, "All skins");
  const recessiveOptions = clanLibraryFilterOptions("recessiveSkin", filters.recessive, "All recessives");
  const sexOptions = clanLibraryFilterOptions("sex", filters.sex, "Any sex");
  const pureOptions = [
    `<option value="">Any skin pair</option>`,
    `<option value="pure"${filters.pure === "pure" ? " selected" : ""}>Pure only</option>`,
    `<option value="not-pure"${filters.pure === "not-pure" ? " selected" : ""}>Not pure</option>`
  ].join("");
  const sourceOptions = CLAN_LIBRARY_SOURCE_FILTERS.map((option) => (
    `<option value="${escapeAttr(option.value)}"${option.value === filters.source ? " selected" : ""}>${escapeHtml(option.label)}</option>`
  )).join("");
  const sharedRows = filteredSharedDragons.length
    ? filteredSharedDragons.map((record) => {
      const summary = record.summary && typeof record.summary === "object" ? record.summary : {};
      return `
        <article class="clan-share-row">
          <strong>${escapeHtml(summary.displayName || "Shared Dragon")}</strong>
          <span>${escapeHtml(compactJoin([summary.species, summary.sex, summary.skin, summary.recessiveSkin ? `Res: ${summary.recessiveSkin}` : "", isPureSkinPair(summary) ? "Pure" : "", summary.status]))}</span>
          <small>Shared by ${escapeHtml(clanMemberName(record.source_user_id))}</small>
        </article>
      `;
    }).join("")
    : `<p class="account-empty">${clanUi.sharedDragons.length ? "No shared dragons match these filters." : "No dragons have been shared with this clan yet."}</p>`;
  const discordSubmissionRows = clanUi.discordSubmissions.length
    ? clanUi.discordSubmissions.map(renderDiscordSubmissionRow).join("")
    : `<p class="account-empty">No pending Discord bot submissions for this clan.</p>`;

  els.clanContent.innerHTML = `
    <section class="clan-panel clan-sync-health">
      <div class="card-head">
        <div class="card-title"><h2>Clan Library Status</h2><p class="card-subtitle">${escapeHtml(loadSummary)}</p></div>
        <span class="pill">${escapeHtml(loadStatus)}</span>
      </div>
      <dl class="line-list">
        <div><dt>Clan</dt><dd>${escapeHtml(currentClan?.name || "No active clan")}</dd></div>
        <div><dt>Shared records</dt><dd>${clanUi.sharedDragons.length} dragons / ${clanUi.sharedPins.length} pins</dd></div>
        <div><dt>Discord inbox</dt><dd>${clanUi.discordSubmissions.length} pending</dd></div>
      </dl>
      <div class="card-actions"><button class="primary-button" type="button" data-clan-action="refresh"${clanUi.loading ? " disabled" : ""}>${clanUi.loading ? "Refreshing..." : "Refresh Clan Library"}</button></div>
    </section>

    <section class="clan-panel clan-identity-panel">
      <div class="card-head">
        <div class="card-title"><h2>${escapeHtml(clanDisplayName(clanUi.user))}</h2><p class="card-subtitle">Discord identity connected</p></div>
        <span class="pill">Connected</span>
      </div>
      <dl class="line-list">
        <div><dt>Identity</dt><dd>Discord verified</dd></div>
        <div><dt>Data default</dt><dd>Local only</dd></div>
        <div><dt>Discord submissions</dt><dd>Your submissions import locally; other members' submissions stay in the Clan Library.</dd></div>
      </dl>
      ${clanUi.error ? `<p class="clan-error">${escapeHtml(clanUi.error)}</p>` : ""}
      <div class="card-actions">
        <button class="tool-button" type="button" data-clan-action="refresh">Refresh</button>
        <button class="tool-button" type="button" data-clan-action="configure">Sync Settings</button>
        ${state.settings.skipClanShareConfirmation ? `<button class="tool-button" type="button" data-clan-action="enable-share-prompts">Ask Before Sharing</button>` : ""}
        <button class="danger-button" type="button" data-clan-action="sign-out">Sign Out</button>
      </div>
    </section>

    <section class="clan-panel">
      <div class="card-head"><div class="card-title"><h2>Clan</h2><p class="card-subtitle">Membership and invitations</p></div>${currentClan ? `<span class="pill">${escapeHtml(membership?.role || "member")}</span>` : ""}</div>
      ${clanOptions ? `<div class="field"><label for="activeClanSelect">Active clan</label><select id="activeClanSelect">${clanOptions}</select></div>` : ""}
      ${currentClan ? `
        <div class="clan-member-list">${memberRows}</div>
        <div class="card-actions">
          ${["owner", "admin"].includes(membership?.role) ? `<button class="primary-button" type="button" data-clan-action="create-invite">Create One-use Invite</button>` : ""}
          <button class="danger-button" type="button" data-clan-action="leave">Leave Clan</button>
        </div>
        ${membership?.role === "owner" ? `<p class="form-note">Owners must transfer ownership to another active member before leaving. Use Make Owner beside that member, then choose Leave Clan.</p>` : ""}
        ${clanUi.inviteCode ? `<p class="clan-invite-code"><span>Invite code</span><strong>${escapeHtml(clanUi.inviteCode)}</strong><button class="tool-button" type="button" data-clan-action="copy-invite">Copy</button></p>` : ""}
      ` : `
        <div class="clan-form-grid">
          <form class="clan-inline-form" data-clan-form="create">
            <label for="newClanName">Create clan</label>
            <div><input id="newClanName" name="name" maxlength="60" placeholder="Clan name" required><button class="primary-button" type="submit">Create</button></div>
          </form>
          <form class="clan-inline-form" data-clan-form="join">
            <label for="clanInviteCode">Join with invite</label>
            <div><input id="clanInviteCode" name="inviteCode" maxlength="100" placeholder="Invite code" required><button class="tool-button" type="submit">Join</button></div>
          </form>
        </div>
      `}
    </section>

    <section class="clan-panel clan-shared-panel">
      <div class="card-head"><div class="card-title"><h2>Shared Library</h2><p class="card-subtitle">Only items chosen by members - kept separate from local Players and Dragons</p></div><span class="pill">${filteredSharedDragons.length} of ${clanUi.sharedDragons.length} dragons / ${clanUi.sharedPins.length} pins</span></div>
      <form class="clan-library-search" data-clan-form="library-search">
        <div class="field"><label for="clanLibraryDragon">Dragon</label><select id="clanLibraryDragon" name="dragon">${dragonOptions}</select></div>
        <div class="field"><label for="clanLibrarySkin">Skin</label><select id="clanLibrarySkin" name="skin">${skinOptions}</select></div>
        <div class="field"><label for="clanLibraryRecessive">Recessive</label><select id="clanLibraryRecessive" name="recessive">${recessiveOptions}</select></div>
        <div class="field"><label for="clanLibrarySex">Sex</label><select id="clanLibrarySex" name="sex">${sexOptions}</select></div>
        <div class="field"><label for="clanLibraryPure">Pure</label><select id="clanLibraryPure" name="pure">${pureOptions}</select></div>
        <div class="field"><label for="clanLibrarySource">Source</label><select id="clanLibrarySource" name="source">${sourceOptions}</select></div>
        <div class="clan-library-search-actions"><button class="primary-button" type="submit">Apply</button><button class="tool-button" type="button" data-clan-action="clear-library-search">Clear</button></div>
      </form>
      <div class="clan-share-list">${sharedRows}</div>
    </section>

    <section class="clan-panel clan-shared-panel">
      <div class="card-head">
        <div class="card-title"><h2>Discord Inbox</h2><p class="card-subtitle">Slash command submissions waiting for review</p></div>
        <span class="pill">${clanUi.discordSubmissions.length} pending</span>
      </div>
      <p class="clan-copy">The Discord bot can collect dragon and location details from clan channels. Imported dragons and brood-pouch eggs are synced to the clan library so they carry to your other tracker installs.</p>
      <div class="clan-share-list">${discordSubmissionRows}</div>
    </section>
  `;
}

function renderDiscordSubmissionRow(record) {
  record = record && typeof record === "object" ? record : {};
  const payload = record.payload && typeof record.payload === "object" ? record.payload : {};
  const type = text(record.submission_type);
  const title = type === "dragon"
    ? text(payload.name || payload.accountName, 80) || "Dragon submission"
    : type === "map_pin"
      ? text(payload.label, 80) || "Map pin submission"
      : type === "egg_request"
        ? text(payload.requester || payload.species, 100) || "Egg request"
        : type === "upstat"
          ? text(compactJoin([payload.species, payload.skin]), 120) || "Upstat submission"
          : type === "brood_pouch"
            ? text(payload.name || payload.accountName, 80) || "Brood pouch egg"
            : type === "current_nest"
              ? text(compactJoin([payload.father, payload.mother]), 140) || "Current nest"
              : text(payload.title, 120) || "Discord note";
  const detail = type === "dragon"
    ? compactJoin([payload.species, payload.sex, payload.skin, payload.recessiveSkin ? `Res: ${payload.recessiveSkin}` : "", payload.status])
    : type === "map_pin"
      ? compactJoin([payload.type || "Location", `${Number(payload.x).toFixed(1)}%, ${Number(payload.y).toFixed(1)}%`])
      : type === "egg_request"
        ? compactJoin([payload.species, payload.sex, payload.skin, payload.recessiveSkin ? `Res: ${payload.recessiveSkin}` : "", payload.goal])
        : type === "upstat"
          ? compactJoin([payload.status, `${Number(payload.aPlusCount) || 0}/18 A+`, payload.accountName])
          : type === "brood_pouch"
            ? compactJoin([payload.species, payload.skin, payload.recessiveSkin ? `Res: ${payload.recessiveSkin}` : "", payload.brood, payload.dueAt])
            : type === "current_nest"
              ? compactJoin([payload.species, payload.expectedSkin, payload.broodWatcherBrooding ? "BW brooding" : "", payload.breeder, payload.requester])
              : text(payload.notes, 160);
  const belongsToConnectedUser = isOwnDiscordSubmission(record);
  const canImport = belongsToConnectedUser && ["dragon", "map_pin", "upstat", "brood_pouch"].includes(type);
  return `
    <article class="clan-share-row discord-submission-row">
      <strong>${escapeHtml(title)}</strong>
      <span>${escapeHtml(detail || "No extra details")}</span>
      <small>${escapeHtml(discordSubmissionTypeLabel(type))} from ${escapeHtml(record.discord_username || "Discord user")} - ${escapeHtml(formatDateTime(record.created_at))}</small>
      <div class="clan-share-row-actions">
        ${canImport ? `<button class="primary-button" type="button" data-clan-action="import-discord-submission" data-id="${escapeAttr(record.id)}">Import</button>` : ""}
        ${belongsToConnectedUser
          ? `<button class="tool-button" type="button" data-clan-action="ignore-discord-submission" data-id="${escapeAttr(record.id)}">Ignore</button>`
          : `<span class="small-pill">Clan only</span>`}
      </div>
    </article>
  `;
}

function discordSubmissionTypeLabel(type) {
  if (type === "dragon") return "Dragon";
  if (type === "map_pin") return "Map pin";
  if (type === "egg_request") return "Egg request";
  if (type === "upstat") return "Upstat";
  if (type === "brood_pouch") return "Brood pouch";
  if (type === "current_nest") return "Current nest";
  return "Note";
}

function clanLibraryFilterOptions(summaryKey, selectedValue, emptyLabel) {
  const sharedDragons = Array.isArray(clanUi.sharedDragons) ? clanUi.sharedDragons : [];
  const values = [...new Set(sharedDragons
    .map((record) => text(record.summary?.[summaryKey], 100))
    .filter(Boolean))]
    .sort(sortText);
  return [`<option value="">${escapeHtml(emptyLabel)}</option>`, ...values.map((value) => (
    `<option value="${escapeAttr(value)}"${value === selectedValue ? " selected" : ""}>${escapeHtml(value)}</option>`
  ))].join("");
}

function getFilteredClanSharedDragons() {
  const filters = clanUi.libraryFilters && typeof clanUi.libraryFilters === "object"
    ? clanUi.libraryFilters
    : {};
  const sharedDragons = Array.isArray(clanUi.sharedDragons) ? clanUi.sharedDragons : [];
  const includes = (value, query) => !query || text(value).toLowerCase().includes(query.toLowerCase());
  return sharedDragons.filter((record) => {
    const summary = record.summary && typeof record.summary === "object" ? record.summary : {};
    if (!matchesClanSourceFilter(record, summary, filters.source)) return false;
    if (filters.pure === "pure" && !isPureSkinPair(summary)) return false;
    if (filters.pure === "not-pure" && isPureSkinPair(summary)) return false;
    return includes(summary.displayName, filters.dragon)
      && includes(summary.skin, filters.skin)
      && includes(summary.recessiveSkin, filters.recessive)
      && (!filters.sex || text(summary.sex).toLowerCase() === filters.sex.toLowerCase());
  });
}

function isPureSkinPair(summary = {}) {
  const skin = text(summary.skin).toLowerCase();
  const recessive = text(summary.recessiveSkin).toLowerCase();
  return Boolean(skin && recessive && skin === recessive);
}

function matchesClanSourceFilter(record, summary, filter) {
  if (!filter) return true;
  if (filter === "mine") return record.source_user_id === clanUi.user?.id;
  if (filter === "others") return record.source_user_id && record.source_user_id !== clanUi.user?.id;
  if (filter === "missing-local") return !hasLocalDragonMatchingClanSummary(summary);
  if (filter === "breeders") return ["Breeder", "Pure"].includes(normalizeNestRole(summary.nestRole)) || Number(summary.socialPoints) >= SOCIAL_POINTS_MAX;
  if (filter === "fourth") return text(summary.status) === "4th Pointed" || text(summary.status) === "Elder" || Boolean(summary.dominantMutation);
  if (filter === "elder") return text(summary.status) === "Elder";
  return true;
}

function hasLocalDragonMatchingClanSummary(summary = {}) {
  const player = text(summary.playerName || summary.username || "Unknown Player");
  const account = text(summary.accountName || summary.displayName || "Dragon");
  const species = canonicalSpeciesName(summary.species);
  return state.dragons.some((dragon) =>
    accountIdentityKey(dragon.username || "Unknown Player", dragon.accountName || dragon.name) === accountIdentityKey(player, account)
    && dragon.species === species
  );
}

function discordSubmissionById(id) {
  return clanUi.discordSubmissions.find((record) => record.id === id) || null;
}

function importDiscordSubmission(record) {
  if (CLAN_SYNCED_DISCORD_DRAGON_TYPES.has(text(record?.submission_type))) {
    const existing = importedDragonForDiscordSubmission(record);
    if (existing) return existing;
  }
  if (record.submission_type === "dragon") return importDiscordDragonSubmission(record);
  if (record.submission_type === "map_pin") return importDiscordMapPinSubmission(record);
  if (record.submission_type === "upstat") return importDiscordUpstatSubmission(record);
  if (record.submission_type === "brood_pouch") return importDiscordBroodPouchSubmission(record);
  throw new Error("Only dragon, map pin, upstat, and brood pouch submissions can be imported.");
}

function importDiscordDragonSubmission(record) {
  const payload = record.payload && typeof record.payload === "object" ? record.payload : {};
  const species = canonicalSpeciesName(payload.species);
  if (!species) throw new Error("The Discord dragon submission needs a species.");
  const playerName = text(payload.playerName || record.discord_username || "Discord Player", 80) || "Discord Player";
  const accountName = text(payload.accountName || payload.name || `${species} from Discord`, 80) || `${species} from Discord`;
  const account = upsertAccountRecord({ username: playerName, accountName });
  const duplicate = duplicateDragonForAccount(account.id, species);
  if (duplicate) throw new Error(`${account.accountName} already has a ${species}. Edit the existing dragon instead.`);

  const dragon = normalizeDragon({
    id: uid("dragon"),
    createdAt: record.created_at || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    accountId: account.id,
    username: account.username,
    accountName: account.accountName,
    name: account.accountName,
    species,
    sex: text(payload.sex, 20) || "Unknown",
    status: text(payload.status, 40) || "Hatchie",
    skin: text(payload.skin, 100),
    recessiveSkin: text(payload.recessiveSkin, 100),
    bloodline: text(payload.bloodline, 10),
    nestRole: normalizeNestRole(payload.nestRole),
    tags: ["discord", discordSubmissionTag(record)],
    notes: [
      text(payload.notes, 600),
      `Discord bot: ${record.discord_username || record.discord_user_id || "unknown"}`
    ].filter(Boolean).join(" | ")
  });
  dragon.skinType = skinTypeForName(dragon.skin, dragon.species);
  state.dragons.push(dragon);
  refreshAllDerivedRecords();
  saveState();
  return dragon;
}

function importDiscordMapPinSubmission(record) {
  const payload = record.payload && typeof record.payload === "object" ? record.payload : {};
  const pin = normalizeMapPin({
    id: uid("pin"),
    createdAt: record.created_at || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    label: text(payload.label, 80) || "Discord location",
    type: text(payload.type, 40) || "Location",
    x: payload.x,
    y: payload.y,
    notes: [
      text(payload.notes, 500),
      `Discord bot: ${record.discord_username || record.discord_user_id || "unknown"}`
    ].filter(Boolean).join(" | "),
    sharedBy: record.discord_username || "Discord"
  });
  state.mapPins.push(pin);
  saveState();
  return pin;
}

function importDiscordUpstatSubmission(record) {
  const payload = record.payload && typeof record.payload === "object" ? record.payload : {};
  const species = canonicalSpeciesName(payload.species);
  if (!species) throw new Error("The Discord upstat submission needs a species.");
  const accountName = text(payload.accountName, 80);
  const account = accountName
    ? state.accounts.find((item) => text(item.accountName).toLowerCase() === accountName.toLowerCase()) || null
    : null;
  const upstat = normalizeUpstat({
    id: uid("upstat"),
    createdAt: record.created_at || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    species,
    skin: text(payload.skin, 100) || "Unknown Skin",
    status: text(payload.status, 40) || "In Progress",
    aPlusCount: payload.aPlusCount,
    accountId: account?.id || "",
    notes: [
      text(payload.notes, 1000),
      accountName && !account ? `Discord account note: ${accountName}` : "",
      `Discord bot: ${record.discord_username || record.discord_user_id || "unknown"}`
    ].filter(Boolean).join(" | ")
  });
  state.upstats.push(upstat);
  saveState();
  return upstat;
}

function importDiscordBroodPouchSubmission(record) {
  const payload = record.payload && typeof record.payload === "object" ? record.payload : {};
  const species = canonicalSpeciesName(payload.species);
  if (!species) throw new Error("The Discord brood pouch submission needs a species.");
  const playerName = text(payload.playerName || record.discord_username || "Discord Player", 80) || "Discord Player";
  const accountName = text(payload.accountName || payload.name || `${species} egg`, 80) || `${species} egg`;
  const account = upsertAccountRecord({ username: playerName, accountName });
  const duplicate = duplicateDragonForAccount(account.id, species);
  if (duplicate) throw new Error(`${account.accountName} already has a ${species}. Edit the existing dragon instead.`);

  const dragon = normalizeDragon({
    id: uid("dragon"),
    createdAt: record.created_at || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    accountId: account.id,
    username: account.username,
    accountName: account.accountName,
    name: account.accountName,
    species,
    sex: text(payload.sex, 20) || "Unknown",
    status: "Hatchie",
    skin: text(payload.skin, 100),
    recessiveSkin: text(payload.recessiveSkin, 100),
    tags: ["discord", "egg", discordSubmissionTag(record)],
    notes: [
      text(payload.notes, 1000),
      `Discord bot: ${record.discord_username || record.discord_user_id || "unknown"}`
    ].filter(Boolean).join(" | ")
  });
  dragon.skinType = skinTypeForName(dragon.skin, dragon.species);
  state.dragons.push(dragon);
  state.broodPouch.push(normalizeBroodPouchEntry({
    id: uid("brood-pouch"),
    createdAt: record.created_at || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    dragonId: dragon.id,
    brood: text(payload.brood, 80) || "Unassigned brood",
    dueAt: normalizeOptionalIso(payload.dueAt),
    oddsSummary: text(payload.oddsSummary, 180),
    notes: [
      text(payload.notes, 1000),
      `Discord bot: ${record.discord_username || record.discord_user_id || "unknown"}`
    ].filter(Boolean).join(" | ")
  }));
  refreshAllDerivedRecords();
  saveState();
  return dragon;
}

function openSyncConfigDialog() {
  if (!els.syncConfigDialog || !clanSync) return;
  const config = clanSync.getConfig();
  if (els.syncProjectUrl) els.syncProjectUrl.value = config.url;
  if (els.syncAnonKey) els.syncAnonKey.value = config.anonKey;
  showModal(els.syncConfigDialog);
}

function openSyncSetupDialog() {
  if (!els.syncSetupDialog) return;
  showModal(els.syncSetupDialog);
}

function handleSyncDialogAction(event) {
  const action = event.currentTarget.dataset.syncDialogAction;
  if (action === "instructions") {
    closeModal("syncConfigDialog");
    openSyncSetupDialog();
  }
  if (action === "configure") {
    closeModal("syncSetupDialog");
    openSyncConfigDialog();
  }
}

async function handleSyncConfigSubmit(event) {
  event.preventDefault();
  if (!clanSync || !els.syncConfigForm) return;
  const form = new FormData(els.syncConfigForm);
  const previous = clanSync.getConfig();
  try {
    const next = { url: form.get("projectUrl"), anonKey: form.get("anonKey") };
    if (previous.url && previous.url !== text(next.url).replace(/\/$/, "")) await clanSync.signOut();
    clanSync.saveConfig(next);
    clanUi.error = "";
    clanUi.lastSignature = "";
    clanUi.user = null;
    clanUi.profileUserId = "";
    closeModal("syncConfigDialog");
    await refreshClanSync();
    renderBackup();
    showToast("Secure sync configured");
  } catch (error) {
    showToast(clanFriendlyError(error));
  }
}

async function clearSyncConfiguration() {
  if (!clanSync || !confirm("Clear this device's secure sync configuration and sign out? Local tracker data will stay here.")) return;
  try {
    await clanSync.signOut();
  } catch (_) {
    // Local sign-out should continue even when the old project is offline.
  }
  clanSync.clearConfig();
  Object.assign(clanUi, { activeClanId: "", discordSubmissions: [], error: "", identityLinks: [], inviteCode: "", members: [], memberships: [], profileUserId: "", sharedDragons: [], sharedPins: [], user: null, lastSignature: "" });
  localStorage.removeItem(ACTIVE_CLAN_STORAGE_KEY);
  closeModal("syncConfigDialog");
  renderClans();
  renderBackup();
  renderDragons();
  renderMapPins();
  showToast("Secure sync cleared from this device");
}

async function handleClanAction(event) {
  const button = event.target.closest("[data-clan-action]");
  if (!button || clanUi.busy) return;
  const action = button.dataset.clanAction;
  try {
    clanUi.busy = true;
    if (action === "configure") openSyncConfigDialog();
    if (action === "connect-discord") await clanSync.startDiscordSignIn();
    if (action === "link-steam") await clanSync.startSteamLink();
    if (action === "refresh") await refreshClanSync();
    if (action === "clear-library-search") {
      clanUi.libraryFilters = { dragon: "", skin: "", recessive: "", sex: "", pure: "", source: "" };
      renderClans();
      return;
    }
    if (action === "enable-share-prompts") {
      state.settings.skipClanShareConfirmation = false;
      saveState();
      renderClans();
      showToast("Share confirmations restored");
      return;
    }
    if (action === "import-discord-submission") {
      const record = discordSubmissionById(button.dataset.id);
      if (!record) throw new Error("That Discord submission is no longer available.");
      if (!isOwnDiscordSubmission(record)) throw new Error("Only submissions from your connected Discord account can enter your local tracker.");
      const imported = importDiscordSubmission(record);
      await syncImportedDiscordDragon(clanUi.activeClanId, record, imported);
      await clanSync.resolveDiscordSubmission(record.id, "imported");
      await refreshClanSync({ quiet: true });
      renderAll();
      showToast(CLAN_SYNCED_DISCORD_DRAGON_TYPES.has(text(record.submission_type))
        ? "Discord dragon imported and synced to your clan library"
        : "Discord submission imported");
      return;
    }
    if (action === "ignore-discord-submission") {
      const record = discordSubmissionById(button.dataset.id);
      if (!record) throw new Error("That Discord submission is no longer available.");
      if (!isOwnDiscordSubmission(record)) throw new Error("Other members' submissions stay available in the Clan Library.");
      await clanSync.resolveDiscordSubmission(record.id, "ignored");
      await refreshClanSync({ quiet: true });
      renderClans();
      showToast("Discord submission ignored");
      return;
    }
    if (action === "sign-out") {
      if (!confirm("Sign out of clan sync on this device? Your local tracker data will stay here.")) return;
      await clanSync.signOut();
      Object.assign(clanUi, { activeClanId: "", discordSubmissions: [], identityLinks: [], inviteCode: "", members: [], memberships: [], profileUserId: "", sharedDragons: [], sharedPins: [], user: null, lastSignature: "" });
      localStorage.removeItem(ACTIVE_CLAN_STORAGE_KEY);
      renderAll();
      showToast("Signed out of clan sync");
    }
    if (action === "create-invite") {
      const clan = activeClan();
      if (!clan) throw new Error("Choose a clan before creating an invite.");
      clanUi.inviteCode = await clanSync.createInvite(clan.id, 1);
      renderClans();
      showToast("One-use invite created");
    }
    if (action === "copy-invite") {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(clanUi.inviteCode);
      else prompt("Invite code:", clanUi.inviteCode);
      showToast("Invite code copied");
    }
    if (action === "leave") {
      const clan = activeClan();
      if (!clan) throw new Error("Choose a clan before leaving.");
      const membership = activeClanMembership();
      if (membership?.role === "owner") {
        const otherMembers = clanUi.members.filter((member) => member.user_id !== clanUi.user?.id);
        showToast(otherMembers.length
          ? "Choose Make Owner beside a member before leaving this clan."
          : "Invite a member and transfer ownership before leaving this clan.");
        return;
      }
      if (!confirm(`Leave ${clan.name}?`)) return;
      await clanSync.leaveClan(clan.id);
      if (removeClanImportedLocalCopies()) {
        refreshAllDerivedRecords();
        saveState({ skipHistory: true });
        renderAll();
      }
      clanUi.inviteCode = "";
      await refreshClanSync();
      showToast("Left clan");
    }
    if (action === "save-member-role") {
      const clan = activeClan();
      const userId = button.dataset.userId;
      const roleSelect = [...els.clanContent.querySelectorAll("[data-clan-role-for]")]
        .find((control) => control.dataset.clanRoleFor === userId);
      if (!clan || !userId || !roleSelect) throw new Error("Choose a valid member role.");
      await clanSync.setClanMemberRole(clan.id, userId, roleSelect.value);
      await refreshClanSync();
      showToast("Member role updated");
    }
    if (action === "transfer-owner") {
      const clan = activeClan();
      const member = clanUi.members.find((item) => item.user_id === button.dataset.userId);
      if (!clan || !member || !confirm(`Transfer ownership of ${clan.name} to ${member.display_name}? You will become an admin.`)) return;
      await clanSync.transferClanOwnership(clan.id, member.user_id);
      await refreshClanSync();
      showToast("Clan ownership transferred");
    }
  } catch (error) {
    clanUi.error = clanFriendlyError(error);
    renderClans();
    showToast(clanUi.error);
  } finally {
    clanUi.busy = false;
  }
}

async function handleClanChange(event) {
  if (event.target?.id !== "activeClanSelect") return;
  clanUi.activeClanId = event.target.value;
  clanUi.inviteCode = "";
  reconcileActiveClan();
  await refreshClanSync();
  renderDragons();
  renderAccounts();
  renderMapPins();
}

async function handleClanSubmit(event) {
  const form = event.target.closest("[data-clan-form]");
  if (!form || clanUi.busy) return;
  event.preventDefault();
  const values = new FormData(form);
  if (form.dataset.clanForm === "library-search") {
    clanUi.libraryFilters = {
      dragon: text(values.get("dragon"), 100),
      skin: text(values.get("skin"), 100),
      recessive: text(values.get("recessive"), 100),
      sex: text(values.get("sex"), 20),
      pure: text(values.get("pure"), 20),
      source: text(values.get("source"), 40)
    };
    renderClans();
    return;
  }
  try {
    clanUi.busy = true;
    if (form.dataset.clanForm === "create") {
      const clan = await clanSync.createClan(values.get("name"));
      clanUi.activeClanId = Array.isArray(clan) ? clan[0]?.id : clan?.id;
      clanUi.inviteCode = "";
      await refreshClanSync();
      showToast("Clan created");
    }
    if (form.dataset.clanForm === "join") {
      const clan = await clanSync.joinClan(values.get("inviteCode"));
      clanUi.activeClanId = Array.isArray(clan) ? clan[0]?.id : clan?.id;
      clanUi.inviteCode = "";
      await refreshClanSync();
      showToast("Joined clan");
    }
  } catch (error) {
    clanUi.error = clanFriendlyError(error);
    renderClans();
    showToast(clanUi.error);
  } finally {
    clanUi.busy = false;
  }
}

function bindDesktopAuthCallbacks() {
  if (!window.dragonTrackerDesktop?.onAuthCallback) return;
  window.dragonTrackerDesktop.onAuthCallback((callbackUrl) => {
    void handleAuthCallback(callbackUrl);
  });
}

function bindBrowserAuthCallback() {
  if (window.dragonTrackerDesktop?.isDesktop) return;
  const callback = new URL(window.location.href);
  const isSteamCallback = callback.searchParams.get("provider") === "steam" && callback.searchParams.has("status");
  if (!callback.searchParams.has("code") && !callback.searchParams.has("error") && !isSteamCallback) return;

  const callbackUrl = callback.toString();
  history.replaceState(null, "", `${callback.pathname}${callback.hash || "#clans"}`);
  void handleAuthCallback(callbackUrl);
}

async function handleAuthCallback(callbackUrl) {
  try {
    const url = new URL(callbackUrl);
    const provider = url.searchParams.get("provider") || ((url.searchParams.has("code") || url.searchParams.has("error")) ? "discord" : "");
    if (provider === "discord") {
      await clanSync.finishDiscordSignIn(callbackUrl);
      const user = await clanSync.getCurrentUser();
      if (user) await clanSync.upsertProfile(clanDisplayName(user));
      clanUi.profileUserId = user?.id || "";
      showToast("Discord connected for clan sync");
    }
    if (provider === "steam") {
      const status = url.searchParams.get("status");
      if (status !== "linked") throw new Error(url.searchParams.get("message") || "Steam linking was not completed.");
      showToast("Steam identity linked");
    }
    setTab("clans", { updateHash: true });
    await refreshClanSync();
  } catch (error) {
    clanUi.error = clanFriendlyError(error);
    setTab("clans", { updateHash: true });
    renderClans();
    showToast(clanUi.error);
  }
}

async function shareDragonWithClan(dragon) {
  const clan = activeClan();
  if (!clan || !canShareWithActiveClan()) {
    showToast("Connect Discord and choose a clan before sharing.");
    setTab("clans", { updateHash: true });
    return;
  }
  if (isDragonSharedWithActiveClan(dragon)) {
    showToast("This dragon is already shared with the active clan.");
    return;
  }
  const displayName = dragon.accountName || dragon.name || "Dragon";
  const approved = await confirmClanShare({
    title: "Share Dragon",
    description: `Share ${displayName} with ${clan.name}? Clan members will see this dragon's selected tracker details.`
  });
  if (!approved) return;
  try {
    await clanSync.shareDragon(clan.id, dragon.id, clanDragonSummary(dragon));
    await refreshClanSync({ quiet: true });
    renderDragons();
    renderAccounts();
    showToast(`${displayName} shared with ${clan.name}`);
  } catch (error) {
    showToast(clanFriendlyError(error));
  }
}

function isDragonSharedWithActiveClan(dragon) {
  if (!dragon || !canShareWithActiveClan()) return false;
  const shareKeys = clanShareKeysForDragon(dragon);
  return clanUi.sharedDragons.some((record) => (
    record.source_user_id === clanUi.user?.id
    && (record.source_local_id === dragon.id || shareKeys.includes(clanSharedDragonKey(clanUi.activeClanId, record)))
  ));
}

async function shareAccountWithClan(account) {
  const clan = activeClan();
  if (!clan || !canShareWithActiveClan()) {
    showToast("Connect Discord and choose a clan before sharing.");
    setTab("clans", { updateHash: true });
    return;
  }
  const dragons = dragonsForAccount(account.id).filter((dragon) => !isDragonSharedWithActiveClan(dragon));
  if (!dragons.length) {
    showToast("Every dragon on this account is already shared with the active clan.");
    return;
  }
  const approved = await confirmClanShare({
    title: "Share Account",
    description: `Share ${dragons.length} unshared dragon${dragons.length === 1 ? "" : "s"} from ${account.accountName} with ${clan.name}?`
  });
  if (!approved) return;

  try {
    const results = await Promise.allSettled(dragons.map((dragon) => clanSync.shareDragon(clan.id, dragon.id, clanDragonSummary(dragon))));
    const sharedCount = results.filter((result) => result.status === "fulfilled").length;
    await refreshClanSync({ quiet: true });
    renderDragons();
    renderAccounts();
    if (!sharedCount) {
      const failed = results.find((result) => result.status === "rejected");
      throw failed?.reason || new Error("The account could not be shared.");
    }
    showToast(`${sharedCount} dragon${sharedCount === 1 ? "" : "s"} shared from ${account.accountName}${sharedCount === dragons.length ? "" : "; some could not be shared"}`);
  } catch (error) {
    showToast(clanFriendlyError(error));
  }
}

function clanDragonSummary(dragon) {
  return {
    displayName: text(dragon.accountName || dragon.name || "Dragon", 80),
    playerName: text(dragon.username, 80),
    accountName: text(dragon.accountName || dragon.name || "Dragon", 80),
    species: text(dragon.species, 80),
    sex: text(dragon.sex, 20),
    status: text(dragon.status, 30),
    server: text(dragon.server, 80),
    skin: text(dragon.skin, 100),
    skinType: text(dragon.skinType, 30),
    recessiveSkin: text(dragon.recessiveSkin, 100),
    nestRole: text(dragon.nestRole, 30),
    bloodline: text(dragon.bloodline, 20),
    motherName: text(dragon.motherName, 80),
    fatherName: text(dragon.fatherName, 80),
    stats: Object.fromEntries(STAT_FIELDS.map((field) => [field.key, text(dragon.stats?.[field.key], 10)])),
    dominantMutation: Boolean(dragon.dominantMutation),
    elderProgress: Number(dragon.elderProgress) || 0,
    socialPoints: Number(dragon.socialPoints) || 0,
    agilePoints: Number(dragon.agilePoints) || 0,
    fastMutation: Boolean(dragon.fastMutation),
    scavengerPoints: Number(dragon.scavengerPoints) || 0,
    survivorMutation: Boolean(dragon.survivorMutation),
    birthDate: text(dragon.birthDate, 30),
    tags: Array.isArray(dragon.tags) ? dragon.tags.map((tag) => text(tag, 60)).filter(Boolean).slice(0, 24) : [],
    updatedAt: new Date().toISOString()
  };
}

function normalizeBroodPouchEntry(entry) {
  const now = new Date().toISOString();
  return {
    id: text(entry?.id) || uid("brood-pouch"),
    createdAt: text(entry?.createdAt) || now,
    updatedAt: text(entry?.updatedAt) || now,
    dragonId: text(entry?.dragonId || entry?.eggId),
    brood: text(entry?.brood || entry?.broodName) || "Unassigned brood",
    dueAt: normalizeOptionalIso(entry?.dueAt || entry?.reminderAt),
    oddsSummary: text(entry?.oddsSummary, 240),
    notes: text(entry?.notes, 1000)
  };
}

function broodPouchIdentityKey(entry) {
  return text(entry?.dragonId);
}

function renderMapAreaSelect() {
  if (!els.mapAreaSelect) return;
  const current = els.mapAreaSelect.value || MAP_REFERENCE_AREAS[0]?.id || "";
  const favorites = normalizeFavoriteMapAreas(state.settings?.favoriteMapAreas || []);
  const favoriteAreas = favorites
    .map((id) => MAP_REFERENCE_AREAS.find((area) => area.id === id))
    .filter(Boolean);
  const byRegion = new Map();
  MAP_REFERENCE_AREAS.forEach((area) => {
    const region = area.region || "Other";
    if (!byRegion.has(region)) byRegion.set(region, []);
    byRegion.get(region).push(area);
  });
  els.mapAreaSelect.innerHTML = [
    favoriteAreas.length ? `
      <optgroup label="Favorites">
        ${favoriteAreas.map((area) => `<option value="${escapeAttr(area.id)}">[Fav] ${escapeHtml(area.name)}</option>`).join("")}
      </optgroup>
    ` : "",
    ...[...byRegion.entries()].map(([region, areas]) => `
    <optgroup label="${escapeAttr(region)}">
      ${areas.map((area) => `<option value="${escapeAttr(area.id)}">${escapeHtml(area.name)}</option>`).join("")}
    </optgroup>
  `)].join("");
  els.mapAreaSelect.value = MAP_REFERENCE_AREAS.some((area) => area.id === current)
    ? current
    : MAP_REFERENCE_AREAS[0]?.id || "";
}

function renderMapAreaButtons() {
  if (!els.mapAreaLayer) return;
  const areasWithButtons = MAP_REFERENCE_AREAS.filter((area) => Array.isArray(area.button));
  els.mapAreaLayer.innerHTML = areasWithButtons.map((area) => {
    const [x, y, w = 10, h = 5] = area.button;
    return `
      <button
        class="map-area-button"
        type="button"
        data-map-area-id="${escapeAttr(area.id)}"
        style="--map-x:${x}%; --map-y:${y}%; --map-w:${w}%; --map-h:${h}%;"
        aria-pressed="false"
        title="Show ${escapeAttr(area.name)} references"
      >
        <span>${escapeHtml(area.name)}</span>
      </button>
    `;
  }).join("");
}

function selectMapReferenceArea(areaId) {
  const area = MAP_REFERENCE_AREAS.find((item) => item.id === areaId);
  if (!area || !els.mapAreaSelect) return;
  if (!els.mapAreaSelect.options.length) renderMapAreaSelect();
  els.mapAreaSelect.value = area.id;
  renderMapReferences();
}

function toggleCurrentMapFavorite() {
  const areaId = els.mapAreaSelect?.value || "";
  if (!areaId) return;
  const favorites = new Set(normalizeFavoriteMapAreas(state.settings?.favoriteMapAreas || []));
  if (favorites.has(areaId)) favorites.delete(areaId);
  else favorites.add(areaId);
  state.settings.favoriteMapAreas = [...favorites];
  saveState();
  renderMapAreaSelect();
  els.mapAreaSelect.value = areaId;
  renderMapReferences();
  showToast(favorites.has(areaId) ? "Map area favorited" : "Map area removed from favorites");
}

function renderMapReferences() {
  if (!els.mapAreaSelect || !els.mapReferenceGallery) return;
  if (!els.mapAreaSelect.options.length) renderMapAreaSelect();
  const area = MAP_REFERENCE_AREAS.find((item) => item.id === els.mapAreaSelect.value) || MAP_REFERENCE_AREAS[0];
  if (!area) return;

  if (els.mapReferenceCount) {
    els.mapReferenceCount.textContent = `${area.files.length} image${area.files.length === 1 ? "" : "s"}`;
  }
  if (els.mapReferenceSummary) {
    els.mapReferenceSummary.textContent = area.note || `${compactJoin([area.region, area.name])} in-game reference screenshots.`;
  }
  if (els.toggleMapFavoriteBtn) {
    const isFavorite = normalizeFavoriteMapAreas(state.settings?.favoriteMapAreas || []).includes(area.id);
    els.toggleMapFavoriteBtn.textContent = isFavorite ? "Unfavorite Area" : "Favorite Area";
    els.toggleMapFavoriteBtn.setAttribute("aria-pressed", String(isFavorite));
  }

  const slides = area.files.map((file, index) => {
    const src = mapReferenceSrc(file);
    const label = area.files.length === 1 ? area.name : `${area.name} ${index + 1}`;
    return `
      <a class="map-reference-card map-reference-slide" href="${escapeAttr(src)}" target="_blank" rel="noopener" title="Open ${escapeAttr(label)} reference">
        <img src="${escapeAttr(src)}" alt="${escapeAttr(label)} reference" loading="lazy">
        <span>${escapeHtml(label)}</span>
      </a>
    `;
  }).join("");
  const arrows = area.files.length > 1
    ? `
      <button class="map-reference-arrow map-reference-arrow-prev" type="button" data-map-reference-step="-1" aria-label="Previous ${escapeAttr(area.name)} reference">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>
      </button>
      <button class="map-reference-arrow map-reference-arrow-next" type="button" data-map-reference-step="1" aria-label="Next ${escapeAttr(area.name)} reference">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>
      </button>
    `
    : "";
  els.mapReferenceGallery.innerHTML = `
    <div class="map-reference-carousel" data-area-id="${escapeAttr(area.id)}">
      <div class="map-reference-track" tabindex="0" aria-label="${escapeAttr(area.name)} reference images">
        ${slides}
      </div>
      ${arrows}
    </div>
  `;

  document.querySelectorAll(".map-area-button").forEach((button) => {
    const isActive = button.dataset.mapAreaId === area.id;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
  requestAnimationFrame(() => updateMapReferenceArrows(els.mapReferenceGallery?.querySelector(".map-reference-track")));
}

function handleMapReferenceCarouselClick(event) {
  const button = event.target.closest("[data-map-reference-step]");
  if (!button) return;
  const track = button.closest(".map-reference-carousel")?.querySelector(".map-reference-track");
  if (!track) return;
  const step = Number(button.dataset.mapReferenceStep) || 0;
  track.scrollBy({ left: step * track.clientWidth, behavior: "smooth" });
  window.setTimeout(() => updateMapReferenceArrows(track), 360);
}

function handleMapReferenceCarouselScroll(event) {
  if (!event.target?.classList?.contains("map-reference-track")) return;
  updateMapReferenceArrows(event.target);
}

function updateMapReferenceArrows(track) {
  if (!track) return;
  const carousel = track.closest(".map-reference-carousel");
  if (!carousel) return;
  const prev = carousel.querySelector("[data-map-reference-step='-1']");
  const next = carousel.querySelector("[data-map-reference-step='1']");
  const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
  const atStart = track.scrollLeft <= 2;
  const atEnd = track.scrollLeft >= maxScroll - 2;
  if (prev) prev.hidden = atStart;
  if (next) next.hidden = atEnd;
}

function mapReferenceSrc(file) {
  return `${MAP_REFERENCE_BASE}${String(file).split("/").map(encodeURIComponent).join("/")}`;
}

function activeMapLayer() {
  if (els.mapLayerCrystals?.checked) return "crystals";
  if (els.mapLayerFood?.checked) return "food";
  return "locations";
}

function syncMapLayerControls(layer) {
  const selectedLayer = MAP_LAYERS.includes(layer) ? layer : "locations";
  [
    [els.mapLayerLocations, "locations"],
    [els.mapLayerCrystals, "crystals"],
    [els.mapLayerFood, "food"]
  ].forEach(([control, controlLayer]) => {
    if (control) control.checked = controlLayer === selectedLayer;
  });
  return selectedLayer;
}

function setActiveMapLayer(layer) {
  syncMapLayerControls(layer);
  renderMapLayers();
}

function renderMapLayers() {
  const visibleLayer = activeMapLayer();
  syncMapLayerControls(visibleLayer);
  if (els.mapAreaLayer) els.mapAreaLayer.hidden = visibleLayer !== "locations";
  MAP_LAYERS.forEach((layer) => {
    document.querySelectorAll(`[data-map-layer="${layer}"]`).forEach((image) => {
      image.classList.toggle("is-visible", layer === visibleLayer);
    });
  });
}

function renderMapPins() {
  if (!els.mapPinLayer || !els.mapPinList) return;
  const showPersonal = els.mapPinsPersonal?.checked !== false;
  const showClan = els.mapPinsClan?.checked !== false;
  const localPins = showPersonal ? [...state.mapPins].map((pin) => ({ ...pin, remote: false })) : [];
  const remotePins = showClan ? visibleClanMapPins().map((pin) => ({
    id: pin.id,
    label: pin.label,
    type: pin.pin_type,
    x: Number(pin.x),
    y: Number(pin.y),
    notes: pin.notes,
    sharedBy: clanMemberName(pin.source_user_id),
    remote: true,
    sourceUserId: pin.source_user_id,
    updatedAt: pin.updated_at || pin.updatedAt || pin.created_at
  })) : [];
  const pins = [...localPins, ...remotePins].sort((a, b) => sortText(a.label, b.label));
  els.mapPinCount.textContent = `${pins.length} pin${pins.length === 1 ? "" : "s"}`;
  els.mapPinLayer.innerHTML = pins.map((pin) => `
    <button class="map-pin${pin.remote ? " is-clan-pin" : ""}" type="button" ${pin.remote ? `data-clan-map-pin-id="${escapeAttr(pin.id)}"` : `data-map-pin-id="${escapeAttr(pin.id)}"`} style="left:${pin.x}%; top:${pin.y}%;" title="${escapeAttr(compactJoin([pin.label, pin.type, pin.remote ? "Clan" : "Local"]))}">
      <span>${escapeHtml(pin.label.slice(0, 2).toUpperCase())}</span>
    </button>
  `).join("");

  els.mapPinList.innerHTML = pins.length
    ? pins.map((pin) => `
      <article class="map-pin-card${pin.remote ? " is-clan-pin" : ""}" ${pin.remote ? `data-clan-map-pin-id="${escapeAttr(pin.id)}"` : `data-id="${escapeAttr(pin.id)}"`}>
        <div>
          <strong>${escapeHtml(pin.label)}</strong>
          <span>${escapeHtml(compactJoin([pin.type, pin.remote ? `Clan: ${pin.sharedBy}` : pin.sharedBy, pin.updatedAt ? `Updated ${formatDateTime(pin.updatedAt)}` : ""]))}</span>
        </div>
        ${pin.notes ? `<p>${escapeHtml(pin.notes)}</p>` : ""}
        <div class="card-actions">
          <button class="tool-button" type="button" data-map-pin-action="copy" ${pin.remote ? `data-clan-map-pin-id="${escapeAttr(pin.id)}"` : `data-id="${escapeAttr(pin.id)}"`}>Copy Code</button>
          ${pin.remote
            ? (pin.sourceUserId === clanUi.user?.id ? `<button class="danger-button" type="button" data-map-pin-action="unshare" data-clan-map-pin-id="${escapeAttr(pin.id)}">Unshare</button>` : "")
            : `${canShareWithActiveClan() && !isMapPinSharedWithActiveClan(pin) ? `<button class="tool-button" type="button" data-map-pin-action="share" data-id="${escapeAttr(pin.id)}">Share to Clan</button>` : ""}<button class="danger-button" type="button" data-map-pin-action="delete" data-id="${escapeAttr(pin.id)}">Delete</button>`}
        </div>
      </article>
    `).join("")
    : `<div class="empty-state map-empty"><h2>No shared pins</h2><p>Add a pin or import a location code.</p></div>`;
}

function visibleClanMapPins() {
  if (!canShareWithActiveClan()) return [];
  const localIds = new Set(state.mapPins.map((pin) => pin.id));
  return clanUi.sharedPins.filter((pin) => !(pin.source_user_id === clanUi.user?.id && localIds.has(pin.source_local_id)));
}

function clanMapPinById(id) {
  return clanUi.sharedPins.find((pin) => pin.id === id) || null;
}

function startMapPinPlacement() {
  if (mapPinPlacementActive) {
    cancelMapPinPlacement();
    showToast("Map pin placement cancelled");
    return;
  }
  mapPinPlacementActive = true;
  els.addMapPinBtn?.classList.add("is-placing");
  els.addMapPinBtn?.setAttribute("aria-pressed", "true");
  els.mapStage?.classList.add("is-placing");
  showToast("Click the map to place a location pin");
}

function cancelMapPinPlacement() {
  mapPinPlacementActive = false;
  els.addMapPinBtn?.classList.remove("is-placing");
  els.addMapPinBtn?.setAttribute("aria-pressed", "false");
  els.mapStage?.classList.remove("is-placing");
}

function handleMapStageClick(event) {
  const pinButton = event.target.closest(".map-pin");
  if (pinButton && !mapPinPlacementActive) {
    const clanPin = clanMapPinById(pinButton.dataset.clanMapPinId);
    if (clanPin) {
      copyMapLocationCode({
        label: clanPin.label,
        type: clanPin.pin_type,
        x: clanPin.x,
        y: clanPin.y,
        notes: clanPin.notes,
        sharedBy: clanMemberName(clanPin.source_user_id)
      });
      return;
    }
    const pin = mapPinById(pinButton.dataset.mapPinId);
    if (pin) copyMapLocationCode(pin);
    return;
  }

  const areaButton = event.target.closest(".map-area-button");
  if (areaButton && !mapPinPlacementActive) {
    selectMapReferenceArea(areaButton.dataset.mapAreaId);
    return;
  }

  if (!mapPinPlacementActive || !els.mapStage) return;
  const visibleLayer = els.mapStage.querySelector(".map-layer.is-visible");
  const rect = (visibleLayer || els.mapStage).getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  const x = clampPercent(((event.clientX - rect.left) / rect.width) * 100);
  const y = clampPercent(((event.clientY - rect.top) / rect.height) * 100);
  openMapPinDialog(x, y);
}

function openMapPinDialog(x, y) {
  if (!els.mapPinDialog || !els.mapPinForm) return;
  cancelMapPinPlacement();
  els.mapPinForm.reset();
  setFormValue("mapPinX", String(x));
  setFormValue("mapPinY", String(y));
  setFormValue("mapPinType", "Dragon");
  showModal(els.mapPinDialog);
}

function handleMapPinSubmit(event) {
  event.preventDefault();
  const values = new FormData(els.mapPinForm);
  const label = text(values.get("label"));
  if (!label) {
    showToast("Enter a location name before adding the pin.");
    return;
  }
  const pin = normalizeMapPin({
    id: uid("pin"),
    label,
    type: text(values.get("type")) || "Dragon",
    x: values.get("x"),
    y: values.get("y"),
    notes: text(values.get("notes")),
    sharedBy: collectPlayerNames()[0] || ""
  });
  state.mapPins.push(pin);
  saveState();
  closeModal("mapPinDialog");
  renderAll();
  showToast(`${pin.label} pinned`);
}

function handleMapPinAction(event) {
  const button = event.target.closest("[data-map-pin-action]");
  if (!button) return;
  const clanPin = clanMapPinById(button.dataset.clanMapPinId);
  if (clanPin) {
    if (button.dataset.mapPinAction === "copy") {
      copyMapLocationCode({
        label: clanPin.label,
        type: clanPin.pin_type,
        x: clanPin.x,
        y: clanPin.y,
        notes: clanPin.notes,
        sharedBy: clanMemberName(clanPin.source_user_id)
      });
    }
    if (button.dataset.mapPinAction === "unshare") void unshareClanMapPin(clanPin);
    return;
  }
  const pin = mapPinById(button.dataset.id);
  if (!pin) return;

  if (button.dataset.mapPinAction === "copy") {
    copyMapLocationCode(pin);
  }

  if (button.dataset.mapPinAction === "share") void shareMapPinWithClan(pin);

  if (button.dataset.mapPinAction === "delete") {
    if (!confirm(`Delete ${pin.label}?`)) return;
    state.mapPins = state.mapPins.filter((item) => item.id !== pin.id);
    saveState();
    renderAll();
    showToast(`${pin.label} deleted`);
  }
}

function copyMapLocationCode(pin) {
  const code = encodeLocationCode(pin);
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(code)
      .then(() => showToast("Location code copied"))
      .catch(() => prompt("Location code:", code));
  } else {
    prompt("Location code:", code);
  }
}

function openMapImportDialog() {
  if (!els.mapImportDialog || !els.mapImportForm) return;
  cancelMapPinPlacement();
  els.mapImportForm.reset();
  showModal(els.mapImportDialog);
}

function handleMapImportSubmit(event) {
  event.preventDefault();
  const code = new FormData(els.mapImportForm).get("code");
  try {
    const pin = normalizeMapPin({
      ...decodeLocationCode(code),
      id: uid("pin"),
      updatedAt: new Date().toISOString()
    });
    state.mapPins.push(pin);
    saveState();
    closeModal("mapImportDialog");
    renderAll();
    showToast(`${pin.label} imported`);
  } catch (error) {
    showToast(`Could not import location code: ${error.message}`);
  }
}

function encodeLocationCode(pin) {
  const payload = {
    label: pin.label,
    type: pin.type,
    x: Number(pin.x.toFixed(3)),
    y: Number(pin.y.toFixed(3)),
    notes: pin.notes,
    sharedBy: pin.sharedBy
  };
  return `DTLOC:${btoa(unescape(encodeURIComponent(JSON.stringify(payload))))}`;
}

function decodeLocationCode(code) {
  const clean = text(code).replace(/^DTLOC:/i, "");
  if (!clean) throw new Error("The code is empty.");
  return JSON.parse(decodeURIComponent(escape(atob(clean))));
}

function mapPinById(id) {
  return state.mapPins.find((pin) => pin.id === id);
}

function renderBackup() {
  const bytes = new Blob([JSON.stringify(state)]).size;
  els.backupStats.innerHTML = `
    <dt>Dragons</dt><dd>${state.dragons.length}</dd>
    <dt>Accounts</dt><dd>${state.accounts.length}</dd>
    <dt>Skins</dt><dd>${state.skins.length}</dd>
    <dt>Upstats</dt><dd>${state.upstats.length}</dd>
    <dt>Lineage names</dt><dd>${state.lineageRecords.length}</dd>
    <dt>Map pins</dt><dd>${state.mapPins.length}</dd>
    <dt>Brood pouch eggs</dt><dd>${state.broodPouch.length}</dd>
    <dt>Species</dt><dd>${collectSpeciesNames().length}</dd>
    <dt>Saved</dt><dd>${formatDateTime(state.updatedAt)}</dd>
    <dt>Backup size</dt><dd>${formatBytes(bytes)}</dd>
  `;
  renderSyncSettings();
  renderPersonalPlayerSetting();
  renderPlayerAliasSettings();
  renderElderTick();
  renderElderTickAccountList();
  renderBackupHealth();
  renderSetupChecklist();
  renderDataQualityList();
  renderRecentlyChangedList();
  renderUndoButton();
  renderAppVersion();
}

function renderBackupHealth() {
  if (!els.backupHealthStatus) return;
  const lastBackup = normalizeOptionalIso(state.settings?.lastBackupAt);
  const ageDays = lastBackup ? Math.floor((Date.now() - Date.parse(lastBackup)) / 86_400_000) : null;
  if (!lastBackup) {
    els.backupHealthStatus.textContent = "No JSON backup has been exported from this device yet.";
    return;
  }
  els.backupHealthStatus.textContent = ageDays <= 1
    ? `Last backup was recent: ${formatDateTime(lastBackup)}.`
    : `Last backup was ${ageDays} day${ageDays === 1 ? "" : "s"} ago: ${formatDateTime(lastBackup)}.`;
}

function renderPersonalPlayerSetting() {
  const selected = normalizePersonalPlayer(state.settings?.personalPlayer, state.accounts);
  const primaryAccountId = normalizePrimaryAccountId(state.settings?.primaryAccountId, selected, state.accounts);
  renderPersonalPlayerSelect(els.personalPlayerSelect, selected);
  renderPersonalPlayerSelect(els.homePersonalPlayerSelect, selected);
  renderPrimaryAccountSelect(els.primaryAccountSelect, primaryAccountId, selected);
  renderPrimaryAccountSelect(els.homePrimaryAccountSelect, primaryAccountId, selected);
  if (els.personalPlayerDescription) {
    const primaryAccount = accountById(primaryAccountId);
    els.personalPlayerDescription.textContent = selected
      ? `Home is focused on ${selected}'s accounts${primaryAccount ? `, with ${primaryAccount.accountName} shown first` : ""}. Players still shows every player.`
      : "Choose which player owns this install. Home will show all players until one is selected.";
  }
}

function renderPersonalPlayerSelect(select, selected = normalizePersonalPlayer(state.settings?.personalPlayer, state.accounts)) {
  if (!select) return;
  const players = collectPlayerNames();
  fillSelect(select, ["", ...players]);
  if (select.options[0]) select.options[0].textContent = "Show all players";
  select.value = selected;
}

function renderPrimaryAccountSelect(
  select,
  selected = state.settings?.primaryAccountId || "",
  personalPlayer = normalizePersonalPlayer(state.settings?.personalPlayer, state.accounts)
) {
  if (!select) return;
  const personalPlayerKey = playerNameKey(personalPlayer);
  const accounts = state.accounts
    .filter((account) => playerNameKey(account.username) === personalPlayerKey)
    .sort((a, b) => sortText(a.accountName, b.accountName));
  const emptyLabel = personalPlayer
    ? (accounts.length ? "No primary account" : "No accounts for this player")
    : "Select a primary player first";
  select.innerHTML = [
    `<option value="">${emptyLabel}</option>`,
    ...accounts.map((account) => `<option value="${escapeAttr(text(account.id))}">${escapeHtml(account.accountName)}</option>`)
  ].join("");
  select.disabled = !personalPlayer || !accounts.length;
  select.value = normalizePrimaryAccountId(selected, personalPlayer, state.accounts);
}

function handlePersonalPlayerChange(event) {
  const source = event?.currentTarget || els.personalPlayerSelect || els.homePersonalPlayerSelect;
  const nextPlayer = normalizePersonalPlayer(source?.value, state.accounts);
  state.settings.personalPlayer = nextPlayer;
  state.settings.primaryAccountId = normalizePrimaryAccountId(state.settings?.primaryAccountId, nextPlayer, state.accounts);
  saveState({ reason: "Home player changed" });
  renderHome();
  renderPersonalPlayerSetting();
  showToast(nextPlayer ? `Home now shows ${nextPlayer}'s accounts` : "Home now shows all players");
}

function aliasesForPlayer(playerName) {
  const canonicalPlayer = findDirectPlayerName(playerName);
  if (!canonicalPlayer) return [];
  return Object.entries(state.settings?.playerAliases || {})
    .filter(([, target]) => playerNameKey(target) === playerNameKey(canonicalPlayer))
    .map(([alias]) => alias)
    .sort(sortText);
}

function renderPlayerAliasSettings(preferredPlayer = "") {
  const select = els.playerAliasPlayerSelect;
  const input = els.playerAliasesInput;
  const saveButton = els.savePlayerAliasesBtn;
  if (!select || !input || !saveButton) return;

  const players = collectPlayerNames();
  const selected = findDirectPlayerName(preferredPlayer)
    || findDirectPlayerName(select.value)
    || normalizePersonalPlayer(state.settings?.personalPlayer, state.accounts)
    || players[0]
    || "";
  fillSelect(select, ["", ...players]);
  if (select.options[0]) select.options[0].textContent = players.length ? "Choose player" : "Add a player first";
  select.value = selected;
  input.disabled = !selected;
  saveButton.disabled = !selected;
  const savedAliases = selected ? aliasesForPlayer(selected) : [];
  input.value = savedAliases.join(", ");

  if (els.playerAliasesSavedList) {
    els.playerAliasesSavedList.innerHTML = selected
      ? `
        <strong>Saved aliases for ${escapeHtml(selected)}</strong>
        ${savedAliases.length
          ? `<div>${savedAliases.map((alias) => `<span class="small-pill">${escapeHtml(alias)}</span>`).join("")}</div>`
          : `<p>No aliases saved for this player.</p>`}
      `
      : `<p>Choose a player to see their saved aliases.</p>`;
  }

  if (els.playerAliasDescription) {
    els.playerAliasDescription.textContent = selected
      ? `Future imports and entries using any alias below will be filed under ${selected}. Aliases ignore capitalization.`
      : "Add a player before creating aliases.";
  }
}

function handlePrimaryAccountChange(event) {
  const source = event?.currentTarget || els.primaryAccountSelect || els.homePrimaryAccountSelect;
  const personalPlayer = normalizePersonalPlayer(state.settings?.personalPlayer, state.accounts);
  const primaryAccountId = normalizePrimaryAccountId(source?.value, personalPlayer, state.accounts);
  state.settings.primaryAccountId = primaryAccountId;
  saveState({ reason: "Primary account changed" });
  renderHome();
  renderPersonalPlayerSetting();
  const account = accountById(primaryAccountId);
  showToast(account ? `${account.accountName} is now the primary account` : "Primary account cleared");
}

function isPrimaryAccount(account) {
  if (!account) return false;
  const personalPlayer = normalizePersonalPlayer(state.settings?.personalPlayer, state.accounts);
  return text(account.id) === normalizePrimaryAccountId(state.settings?.primaryAccountId, personalPlayer, state.accounts);
}

function parsePlayerAliasInput(value, player) {
  const primaryKey = playerNameKey(player);
  const seen = new Set();
  const aliases = [];
  let duplicateCount = 0;
  let primaryNameCount = 0;

  text(value).split(/[;,\n]/).forEach((rawAlias) => {
    const alias = playerNameKey(rawAlias);
    if (!alias) return;
    if (alias === primaryKey) {
      primaryNameCount += 1;
      return;
    }
    if (seen.has(alias)) {
      duplicateCount += 1;
      return;
    }
    seen.add(alias);
    aliases.push(alias);
  });

  return { aliases, duplicateCount, primaryNameCount };
}

function setPlayerAliasStatus(message, tone = "") {
  if (!els.playerAliasStatus) return;
  els.playerAliasStatus.textContent = text(message);
  els.playerAliasStatus.dataset.tone = tone;
  els.playerAliasStatus.hidden = !text(message);
}

function handlePlayerAliasInputKeydown(event) {
  if (event.key !== "Enter" || event.shiftKey || event.ctrlKey || event.metaKey || event.altKey) return;
  event.preventDefault();
  savePlayerAliases();
}

function savePlayerAliases() {
  const player = findDirectPlayerName(els.playerAliasPlayerSelect?.value);
  if (!player) {
    alert("Choose a player first.");
    return;
  }

  const previousAliases = aliasesForPlayer(player);
  const { aliases, duplicateCount, primaryNameCount } = parsePlayerAliasInput(
    els.playerAliasesInput?.value,
    player
  );
  const nextAliases = { ...(state.settings?.playerAliases || {}) };
  Object.entries(nextAliases).forEach(([alias, target]) => {
    if (playerNameKey(target) === playerNameKey(player)) delete nextAliases[alias];
  });
  aliases.forEach((alias) => {
    nextAliases[alias] = player;
  });

  state.settings.playerAliases = normalizePlayerAliases(nextAliases, state.accounts);
  saveState({ reason: "Player aliases updated" });
  renderAll();
  renderPlayerAliasSettings(player);

  const savedAliases = aliasesForPlayer(player);
  const addedCount = savedAliases.filter((alias) => !previousAliases.includes(alias)).length;
  const removedCount = previousAliases.filter((alias) => !savedAliases.includes(alias)).length;
  const notices = [];
  if (primaryNameCount) notices.push(`${player} is already the primary player name`);
  if (duplicateCount) notices.push("duplicate capitalization was combined");

  if (!addedCount && !removedCount) {
    const message = notices.length
      ? `No new aliases were needed: ${notices.join("; ")}.`
      : "No alias changes were found.";
    setPlayerAliasStatus(message, "info");
    showToast("Aliases already up to date");
    return;
  }

  const changes = [
    addedCount ? `${addedCount} added` : "",
    removedCount ? `${removedCount} removed` : ""
  ].filter(Boolean).join(", ");
  const message = `Saved ${savedAliases.length} alias${savedAliases.length === 1 ? "" : "es"} for ${player} (${changes})${notices.length ? `. ${notices.join("; ")}.` : "."}`;
  setPlayerAliasStatus(message, "success");
  showToast(`${player}'s aliases updated`);
}

function renderSetupChecklist() {
  if (!els.setupChecklist) return;
  const items = [
    { label: "Add at least one player/account", done: state.accounts.length > 0 },
    { label: "Add dragons to the tracker", done: state.dragons.length > 0 },
    { label: "Export a JSON backup", done: Boolean(state.settings?.lastBackupAt) },
    { label: "Configure clan sync only if you want shared dragons or pins", done: Boolean(clanSync?.isConfigured()) },
    { label: "Start an elder tick timer when needed", done: Boolean(elderTickStartTime() || Object.keys(state.settings?.elderTickAccounts || {}).length) }
  ];
  els.setupChecklist.innerHTML = renderQualityItems(items);
}

function renderDataQualityList() {
  if (!els.dataQualityList) return;
  const issues = dataQualityIssues();
  els.dataQualityList.innerHTML = renderQualityItems(issues.length ? issues : [{ label: "No obvious data issues found.", done: true }]);
}

function dataQualityIssues() {
  const issues = [];
  const accountSpecies = new Map();
  state.dragons.forEach((dragon) => {
    const key = `${dragon.accountId}::${dragon.species}`;
    if (accountSpecies.has(key)) issues.push({ label: `Duplicate ${dragon.species} on ${dragonAccountLabel(dragon)}.`, tone: "risk" });
    accountSpecies.set(key, true);
    if (!dragon.skin) issues.push({ label: `${dragonAccountLabel(dragon)} is missing a visible skin.`, tone: "warn" });
    if (!dragon.recessiveSkin) issues.push({ label: `${dragonAccountLabel(dragon)} is missing a recessive skin.`, tone: "warn" });
    if (dragon.sex === "Unknown") issues.push({ label: `${dragonAccountLabel(dragon)} has unknown sex.`, tone: "warn" });
    const knownStats = STAT_FIELDS.filter((field) => dragon.stats?.[field.key] && dragon.stats[field.key] !== "Unknown").length;
    if (knownStats < STAT_FIELDS.length) issues.push({ label: `${dragonAccountLabel(dragon)} has ${knownStats}/18 saved stats.`, tone: "warn" });
  });
  return issues.slice(0, 12);
}

function renderQualityItems(items) {
  return `
    <div class="quality-list">
      ${items.map((item) => {
        const tone = item.tone || (item.done ? "good" : "warn");
        return `
          <div class="quality-item">
            <span class="quality-dot ${tone}" aria-hidden="true"></span>
            <span>${escapeHtml(item.label)}</span>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function renderRecentlyChangedList() {
  if (!els.recentlyChangedList) return;
  const records = [
    ...state.dragons.map((item) => ({ label: dragonAccountLabel(item), detail: compactJoin([item.species, item.status]), updatedAt: item.updatedAt })),
    ...state.accounts.map((item) => ({ label: compactJoin([item.username, item.accountName]), detail: "Account", updatedAt: item.updatedAt })),
    ...state.skins.map((item) => ({ label: item.name, detail: compactJoin([item.species, item.type]), updatedAt: item.updatedAt })),
    ...state.upstats.map((item) => ({ label: `${item.species} ${item.skin}`, detail: item.status, updatedAt: item.updatedAt })),
    ...state.mapPins.map((item) => ({ label: item.label, detail: compactJoin([item.type, "Map pin"]), updatedAt: item.updatedAt })),
    ...(state.broodPouch || []).map((item) => ({ label: item.brood, detail: "Brood pouch", updatedAt: item.updatedAt }))
  ].filter((item) => item.updatedAt)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 8);

  els.recentlyChangedList.innerHTML = records.length
    ? `<div class="quality-list">${records.map((item) => `
        <div class="quality-item">
          <span class="quality-dot good" aria-hidden="true"></span>
          <span><strong>${escapeHtml(item.label)}</strong> ${escapeHtml(item.detail)} - ${escapeHtml(formatDateTime(item.updatedAt))}</span>
        </div>
      `).join("")}</div>`
    : `<p class="account-empty">No recent records yet.</p>`;
}

function renderUndoButton() {
  if (!els.undoChangeBtn) return;
  const history = loadUndoHistory();
  els.undoChangeBtn.disabled = !history.length;
  els.undoChangeBtn.textContent = history.length ? `Undo Last Change (${history.length})` : "Undo Last Change";
}

function elderTickStartTime() {
  const timestamp = Date.parse(state.settings?.elderTickStartedAt || "");
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function elderTickRemainingMs(now = Date.now()) {
  const startedAt = elderTickStartTime();
  if (!startedAt) return 0;
  return Math.max(0, startedAt + ELDER_TICK_INTERVAL_MS - now);
}

function formatElderTickCountdown(milliseconds) {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function handleElderTickReset() {
  if (elderTickRemainingMs() > 0) return;
  state.settings.elderTickStartedAt = new Date().toISOString();
  saveState();
  renderElderTick();
  showToast("Elder tick recorded. Your next reminder is in six hours.");
}

function handleElderTickForceReset() {
  state.settings.elderTickStartedAt = new Date().toISOString();
  saveState();
  renderElderTick();
  showToast("Elder tick timer reset. Your next reminder is in six hours.");
}

function renderElderTick() {
  if (!els.elderTickState || !els.elderTickCountdown || !els.elderTickDescription || !els.elderTickResetBtn || !els.elderTickForceResetBtn) return;
  const startedAt = elderTickStartTime();

  if (!startedAt) {
    els.elderTickState.textContent = "Local Timer";
    els.elderTickCountdown.textContent = "Ready to start";
    els.elderTickDescription.textContent = "Start this six-hour reminder when you log into the account in-game. No Steam link is required.";
    els.elderTickResetBtn.textContent = "Start 6-Hour Timer";
    els.elderTickResetBtn.disabled = false;
    els.elderTickForceResetBtn.disabled = true;
    return;
  }

  const remaining = elderTickRemainingMs();
  if (remaining > 0) {
    const dueAt = new Date(startedAt + ELDER_TICK_INTERVAL_MS);
    els.elderTickState.textContent = "Counting Down";
    els.elderTickCountdown.textContent = formatElderTickCountdown(remaining);
    els.elderTickDescription.textContent = `Next elder tick reminder: ${formatDateTime(dueAt.toISOString())}.`;
    els.elderTickResetBtn.textContent = "Mark Tick Taken";
    els.elderTickResetBtn.disabled = true;
    els.elderTickForceResetBtn.disabled = false;
    return;
  }

  els.elderTickState.textContent = "Tick Ready";
  els.elderTickCountdown.textContent = "Ready now";
  els.elderTickDescription.textContent = "Take the elder tick in-game, then mark it taken here to begin the next six-hour reminder.";
  els.elderTickResetBtn.textContent = "Mark Tick Taken";
  els.elderTickResetBtn.disabled = false;
  els.elderTickForceResetBtn.disabled = false;
}

function elderTickAccountStartTime(accountId) {
  const timestamp = Date.parse(state.settings?.elderTickAccounts?.[accountId] || "");
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function elderTickAccountRemainingMs(accountId, now = Date.now()) {
  const startedAt = elderTickAccountStartTime(accountId);
  if (!startedAt) return 0;
  return Math.max(0, startedAt + ELDER_TICK_INTERVAL_MS - now);
}

function renderElderTickAccountList() {
  if (!els.elderTickAccountList) return;
  const personalPlayer = normalizePersonalPlayer(state.settings?.personalPlayer, state.accounts);
  const accounts = [...state.accounts]
    .filter((account) => !personalPlayer || account.username === personalPlayer)
    .sort((a, b) => sortText(a.username, b.username) || sortText(a.accountName, b.accountName));
  if (!accounts.length) {
    els.elderTickAccountList.innerHTML = `<p class="account-empty">Add an account for your Home player to track its elder timer.</p>`;
    return;
  }

  els.elderTickAccountList.innerHTML = accounts.map((account) => {
    const startedAt = elderTickAccountStartTime(account.id);
    const remaining = elderTickAccountRemainingMs(account.id);
    const ready = startedAt && remaining <= 0;
    const stateLabel = !startedAt ? "Not started" : ready ? "Ready now" : formatElderTickCountdown(remaining);
    return `
      <div class="elder-account-row">
        <div>
          <strong>${escapeHtml(compactJoin([account.username, account.accountName]))}</strong>
          <span>${escapeHtml(startedAt ? `Started ${formatDateTime(new Date(startedAt).toISOString())}` : "Start this when you log into the account in-game.")}</span>
        </div>
        <span class="pill ${ready ? "status-elder" : ""}">${escapeHtml(stateLabel)}</span>
        <button class="tool-button" type="button" data-elder-account-action="reset" data-account-id="${escapeAttr(account.id)}">${startedAt ? "Reset" : "Start"}</button>
      </div>
    `;
  }).join("");
}

function handleElderTickAccountAction(event) {
  const button = event.target.closest("[data-elder-account-action]");
  if (!button) return;
  const account = accountById(button.dataset.accountId);
  if (!account) return;
  state.settings.elderTickAccounts = {
    ...(state.settings.elderTickAccounts || {}),
    [account.id]: new Date().toISOString()
  };
  saveState();
  renderElderTickAccountList();
  showToast(`${account.accountName} elder tick timer reset`);
}

function renderSyncSettings() {
  if (!els.syncSettingsState || !els.syncSettingsDescription) return;
  if (!clanSync) {
    els.syncSettingsState.textContent = "Unavailable";
    els.syncSettingsDescription.textContent = "This build does not include clan sync. Your tracker data remains on this device.";
    els.openSyncConfigBtn?.setAttribute("disabled", "");
    return;
  }

  els.openSyncConfigBtn?.removeAttribute("disabled");
  if (!clanSync.isConfigured()) {
    els.syncSettingsState.textContent = "Local Only";
    els.syncSettingsDescription.textContent = "Your tracker stays on this device. Set up or join a shared sync space only when you want to share selected dragons and pins.";
    return;
  }

  if (clanUi.user) {
    els.syncSettingsState.textContent = "Connected";
    els.syncSettingsDescription.textContent = `Connected as ${clanDisplayName(clanUi.user)}. Dragons and map pins stay local until you choose Share to Clan.`;
    return;
  }

  els.syncSettingsState.textContent = "Ready to Sign In";
  els.syncSettingsDescription.textContent = "This device knows the shared sync space. Open Clans to connect Discord and join or create a clan.";
}

function renderSyncStatusBadge() {
  if (!els.syncStatusBadge) return;
  let label = "Local Only";
  let tone = "local";
  if (!clanSync) {
    label = "Sync Unavailable";
    tone = "risk";
  } else if (clanSync.isConfigured() && clanUi.user && activeClan()) {
    label = `Clan: ${activeClan().name}`;
    tone = "online";
  } else if (clanSync.isConfigured() && clanUi.user) {
    label = "Signed In";
    tone = "ready";
  } else if (clanSync.isConfigured()) {
    label = "Sync Ready";
    tone = "ready";
  }
  els.syncStatusBadge.textContent = label;
  els.syncStatusBadge.dataset.syncTone = tone;
}

function renderAppVersion() {
  if (!els.appVersionLabel) return;
  els.appVersionLabel.textContent = `Version ${APP_VERSION}`;
}

function bindDesktopUpdateStatus() {
  const desktop = window.dragonTrackerDesktop;
  if (!desktop?.getUpdateStatus) return;
  desktop.onUpdateStatus?.(renderDesktopUpdateStatus);
  desktop.getUpdateStatus()
    .then(renderDesktopUpdateStatus)
    .catch(() => {});
}

function renderDesktopUpdateStatus(status) {
  if (!els.updateProgressDialog || !status || typeof status !== "object") return;
  const phase = text(status.phase);
  if (!phase || phase === "idle") return;

  const previousPhase = text(desktopUpdateStatus?.phase);
  if (phase === "downloading" && previousPhase !== "downloading") {
    updateProgressBackgrounded = false;
  }
  if ((phase === "downloaded" || phase === "error") && previousPhase !== phase) {
    updateProgressBackgrounded = false;
  }
  desktopUpdateStatus = status;
  const isDownloading = phase === "downloading";
  const isDownloaded = phase === "downloaded";
  const isError = phase === "error";
  const percent = isDownloaded ? 100 : Math.max(0, Math.min(100, Number(status.percent) || 0));
  const transferred = Math.max(0, Number(status.transferred) || 0);
  const total = Math.max(0, Number(status.total) || 0);
  const bytesPerSecond = Math.max(0, Number(status.bytesPerSecond) || 0);

  els.updateProgressTitle.textContent = isDownloaded
    ? "Update ready to install"
    : isError
      ? "Update download stopped"
      : "Downloading update";
  els.updateProgressPercent.textContent = `${Math.round(percent)}%`;
  els.updateProgressVersion.textContent = status.version ? `Dragon Tracker ${status.version}` : (status.message || "Preparing download");
  els.updateProgressBar.value = percent;
  els.updateProgressBytes.textContent = total
    ? `${formatBytes(transferred)} of ${formatBytes(total)}`
    : transferred
      ? `${formatBytes(transferred)} downloaded`
      : "Waiting for download size";
  els.updateProgressSpeed.textContent = isDownloaded
    ? "Ready to restart"
    : isError
      ? "Try checking for updates again later"
      : bytesPerSecond
        ? `${formatBytes(bytesPerSecond)}/s`
        : "Starting download";
  els.updateProgressDescription.textContent = isDownloaded
    ? "The update is downloaded. Restart when you are ready; your local tracker data stays on this machine."
    : isError
      ? (status.message || "The update could not be downloaded. Your current Dragon Tracker installation is unchanged.")
      : "Dragon Tracker will keep your local data while the update downloads.";
  els.installDownloadedUpdateBtn.hidden = !isDownloaded;
  els.installDownloadedUpdateBtn.disabled = false;
  els.installDownloadedUpdateBtn.textContent = "Restart and Install";

  const backgroundButton = els.updateProgressDialog.querySelector("[data-update-progress-action='hide']");
  if (backgroundButton) backgroundButton.textContent = isError ? "Close" : isDownloaded ? "Later" : "Continue in Background";
  if (!updateProgressBackgrounded && !els.updateProgressDialog.open) showModal(els.updateProgressDialog);
}

async function handleUpdateProgressAction(event) {
  const button = event.target.closest("[data-update-progress-action]");
  if (!button) return;
  const action = button.dataset.updateProgressAction;
  if (action === "hide") {
    updateProgressBackgrounded = true;
    closeModal("updateProgressDialog");
    if (desktopUpdateStatus?.phase === "downloading") {
      showToast("The update will keep downloading in the background.");
    }
    return;
  }
  if (action !== "install" || desktopUpdateStatus?.phase !== "downloaded") return;

  button.disabled = true;
  button.textContent = "Restarting...";
  try {
    await window.dragonTrackerDesktop?.installDownloadedUpdate?.();
  } catch (_) {
    button.disabled = false;
    button.textContent = "Restart and Install";
    showToast("The update is ready, but Dragon Tracker could not restart automatically.");
  }
}

function maybeShowChangelog() {
  if (!els.changelogDialog || !els.changelogContent) return;
  if (localStorage.getItem(LAST_SEEN_VERSION_KEY) === APP_VERSION) return;
  openChangelog({ manual: false });
  localStorage.setItem(LAST_SEEN_VERSION_KEY, APP_VERSION);
}

function openChangelog(options = {}) {
  if (!els.changelogDialog || !els.changelogContent) return;
  els.changelogContent.innerHTML = `
    <h3>Version ${escapeHtml(APP_VERSION)}</h3>
    <ul>
      ${CHANGELOG_ITEMS.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
    </ul>
    ${options.manual ? `<p class="planner-note">This is the local app changelog. The GitHub release page is still the source of downloadable update files.</p>` : ""}
  `;
  showModal(els.changelogDialog);
}

function handleDragonSkinControlChange(event) {
  if (event.target.id === "dragonSpecies") {
    renderDragonSkinSelects(event.target.value, "", "");
    syncDragonPureSkinFields("dragonSkin");
    return;
  }
  syncDragonPureSkinFields(event.target.id);
}

function syncDragonPureSkinFields(sourceId = "dragonSkin") {
  if (normalizeNestRole(document.querySelector("#dragonNestRole")?.value) !== "Pure") return false;

  const skinInput = document.querySelector("#dragonSkin");
  const recessiveInput = document.querySelector("#dragonRecessiveSkin");
  if (!skinInput || !recessiveInput) return false;

  const sourceInput = sourceId === "dragonRecessiveSkin" ? recessiveInput : skinInput;
  const fallbackInput = sourceInput === skinInput ? recessiveInput : skinInput;
  const matchedSkin = text(sourceInput.value || fallbackInput.value);
  if (!matchedSkin) return false;

  const changed = skinInput.value !== matchedSkin || recessiveInput.value !== matchedSkin;
  skinInput.value = matchedSkin;
  recessiveInput.value = matchedSkin;
  return changed;
}

function handleDragonPlayerSelectChange() {
  syncDragonPlayerControls();
  setFormValue("dragonAccountId", "");
  renderAccountNameDatalist(activeDragonPlayerName());
  handleDragonAccountFieldChange();
}

function syncDragonPlayerControls() {
  const playerSelect = document.querySelector("#dragonPlayerSelect");
  const newPlayerField = document.querySelector("#dragonNewPlayerField");
  const newPlayerInput = document.querySelector("#dragonUsername");
  const selectedPlayer = text(playerSelect?.value);
  const usingExistingPlayer = Boolean(selectedPlayer);

  if (newPlayerField) newPlayerField.hidden = usingExistingPlayer;
  if (newPlayerInput) {
    newPlayerInput.required = !usingExistingPlayer;
    newPlayerInput.disabled = usingExistingPlayer;
    if (usingExistingPlayer) newPlayerInput.value = "";
  }
}

function handleDragonAccountFieldChange() {
  const accountIdInput = document.querySelector("#dragonAccountId");
  const matchedAccount = resolveDragonFormAccount({ preferHiddenId: false });
  if (accountIdInput) accountIdInput.value = matchedAccount?.id || "";
  renderAccountNameDatalist(activeDragonPlayerName());
  renderDragonSpeciesSelect({
    selectedSpecies: document.querySelector("#dragonSpecies")?.value || "",
    editingId: document.querySelector("#dragonId")?.value || "",
    accountId: matchedAccount?.id || ""
  });
}

function renderDragonSpeciesSelect(options = {}) {
  const select = options.select || document.querySelector("#dragonSpecies");
  if (!select) return;

  const selectedSpecies = canonicalSpeciesName(options.selectedSpecies ?? select.value);
  const editingId = text(options.editingId ?? document.querySelector("#dragonId")?.value);
  const accountId = text(options.accountId ?? resolveDragonFormAccount()?.id);
  const usedSpecies = new Set(
    accountId
      ? dragonsForAccount(accountId)
        .filter((dragon) => dragon.id !== editingId)
        .map((dragon) => dragon.species)
        .filter(Boolean)
      : []
  );
  const availableSpecies = collectSpeciesNames().filter((species) => species === selectedSpecies || !usedSpecies.has(species));
  const placeholder = availableSpecies.length ? "Select species" : "No open species on this account";

  fillSelect(select, ["", ...availableSpecies]);
  if (select.options[0]) select.options[0].textContent = placeholder;
  select.value = availableSpecies.includes(selectedSpecies) ? selectedSpecies : "";
  renderDragonSkinSelects(select.value || "");
}

function populateDragonSkinInputs(species, selectedSkin = "", selectedRecessiveSkin = "") {
  renderDragonSkinSelects(species, selectedSkin, selectedRecessiveSkin);
}

function skinOptionsForSpecies(species) {
  const canonicalSpecies = canonicalSpeciesName(species);
  return [...new Set(state.skins
    .filter((skin) => skin.species === "All" || !canonicalSpecies || skin.species === canonicalSpecies)
    .map((skin) => skin.name)
    .filter(Boolean))]
    .sort(sortText);
}

function renderDragonSkinSelects(species, selectedSkin = document.querySelector("#dragonSkin")?.value || "", selectedRecessiveSkin = document.querySelector("#dragonRecessiveSkin")?.value || "") {
  const options = skinOptionsForSpecies(species);
  fillSkinSelect(document.querySelector("#dragonSkin"), options, selectedSkin, "Select skin");
  fillSkinSelect(document.querySelector("#dragonRecessiveSkin"), options, selectedRecessiveSkin, "Select recessive skin");
}

function fillSkinSelect(select, options, selectedValue, placeholder) {
  if (!select) return;
  const selected = text(selectedValue);
  const values = [...options];
  const matchedSelected = selected
    ? values.find((value) => canonicalSkinName(value) === canonicalSkinName(selected))
    : "";
  if (selected && !matchedSelected) {
    values.push(selected);
  }

  select.innerHTML = [
    `<option value="">${escapeHtml(placeholder)}</option>`,
    ...values.sort(sortText).map((name) => `<option value="${escapeAttr(name)}">${escapeHtml(name)}</option>`)
  ].join("");
  select.value = matchedSelected || selected;
}

function fillBoundSkinSelect(select, options, selectedValue, placeholder) {
  if (!select) return;
  const values = [...new Set(options.map(text).filter(Boolean))].sort(sortText);
  const selected = text(selectedValue);
  const matchedSelected = selected
    ? values.find((value) => canonicalSkinName(value) === canonicalSkinName(selected))
    : "";
  select.innerHTML = [
    `<option value="">${escapeHtml(placeholder)}</option>`,
    ...values.map((name) => `<option value="${escapeAttr(name)}">${escapeHtml(name)}</option>`)
  ].join("");
  select.value = matchedSelected || "";
}

function setDragonStatsTo18APlus() {
  STAT_FIELDS.forEach((field) => setFormValue(`stat-${field.key}`, "A+"));
  syncAllAPlusIndicator();
}

function syncAllAPlusIndicator() {
  const indicator = document.querySelector("#dragonAllAPlus");
  if (!indicator) return;
  indicator.checked = STAT_FIELDS.every((field) => gradeScore(document.querySelector(`#stat-${field.key}`)?.value) >= gradeScore("A+"));
}

function handleDragonStatusChange() {
  const status = document.querySelector("#dragonStatus")?.value || "Hatchie";
  const elderInput = document.querySelector("#dragonElderProgress");
  const dominantInput = document.querySelector("#dragonDominantMutation");
  const fastInput = document.querySelector("#dragonFastMutation");
  const survivorInput = document.querySelector("#dragonSurvivorMutation");

  if (status !== "4th Pointed" && status !== "Elder" && elderInput) {
    elderInput.value = "";
  }
  if (!canUseDominantMutation(status) && dominantInput) {
    dominantInput.checked = false;
  }
  if (["Hatchie", "Juvi", "Grown"].includes(status)) {
    if (fastInput) fastInput.checked = false;
    if (survivorInput) survivorInput.checked = false;
  }

  syncDragonComputedFields();
}

function syncDragonComputedFields() {
  const statusInput = document.querySelector("#dragonStatus");
  let status = statusInput?.value || "Hatchie";
  const nestRoleInput = document.querySelector("#dragonNestRole");
  const elderField = document.querySelector("#dragonElderProgressField");
  const elderInput = document.querySelector("#dragonElderProgress");
  const mutationInput = document.querySelector("#dragonMutationPoints");
  const remainingInput = document.querySelector("#dragonRemainingMutationPoints");
  const socialInput = document.querySelector("#dragonSocialPoints");
  const dominantInput = document.querySelector("#dragonDominantMutation");
  const agileInput = document.querySelector("#dragonAgilePoints");
  const fastInput = document.querySelector("#dragonFastMutation");
  const scavengerInput = document.querySelector("#dragonScavengerPoints");
  const survivorInput = document.querySelector("#dragonSurvivorMutation");

  let elderProgress = normalizeElderProgress(status, elderInput?.value);
  const nextStatus = normalizeDominantMutationStatus(normalizeStatusForProgress(status, elderProgress), dominantInput?.checked);
  if (nextStatus !== status) {
    status = nextStatus;
    if (statusInput) statusInput.value = status;
    elderProgress = normalizeElderProgress(status, elderProgress);
  }
  const growth = normalizeGrowthValue(status, "");

  if (elderField) elderField.hidden = !ADULT_OR_HIGHER_STATUSES.has(status);
  if (elderInput) elderInput.value = elderProgress;
  const mutationPoints = estimateMutationPoints(status, growth, elderProgress);
  const nestRole = normalizeNestRole(nestRoleInput?.value);
  const allocation = normalizeMutationAllocation({
    status,
    nestRole,
    mutationPoints,
    socialPoints: socialInput?.value,
    dominantMutation: dominantInput?.checked,
    agilePoints: agileInput?.value,
    fastMutation: fastInput?.checked,
    scavengerPoints: scavengerInput?.value,
    survivorMutation: survivorInput?.checked
  });

  if (mutationInput) mutationInput.value = mutationPoints;
  if (remainingInput) remainingInput.value = allocation.remainingMutationPoints;
  if (socialInput) {
    socialInput.max = SOCIAL_POINTS_MAX;
    const locked = shouldLockSocialPoints(status, nestRole);
    socialInput.readOnly = locked;
    socialInput.classList.toggle("is-locked", locked);
    socialInput.title = SOCIAL_ZERO_NEST_ROLES.has(nestRole)
      ? "Fighter keeps all mutation points out of Social."
      : locked ? "Locked to available Social points for this nest role." : "";
    socialInput.value = allocation.socialPoints;
  }
  syncPointCheckbox(dominantInput, allocation.dominantMutation, canUseDominantMutation(status), "Available once this dragon is 4th Pointed.");
  syncPointInput(agileInput, allocation.agilePoints, AGILE_POINTS_MAX);
  syncPointCheckbox(fastInput, allocation.fastMutation, canUseTrackFourthPoint(allocation.agilePoints, allocation.socialPoints + (allocation.dominantMutation ? 1 : 0), mutationPoints), "Requires 3 Agile pts and one free mutation point.");
  syncPointInput(scavengerInput, allocation.scavengerPoints, SCAVENGER_POINTS_MAX);
  syncPointCheckbox(survivorInput, allocation.survivorMutation, canUseTrackFourthPoint(allocation.scavengerPoints, allocation.socialPoints + (allocation.dominantMutation ? 1 : 0) + allocation.agilePoints + (allocation.fastMutation ? 1 : 0), mutationPoints), "Requires 3 Scavenger pts and one free mutation point.");
}

function openAccountDialog(id = "", options = {}) {
  const account = id ? accountById(id) : null;
  const lockedPlayer = text(options.username || account?.username);
  const usernameField = document.querySelector("#accountUsernameField");
  const usernameInput = document.querySelector("#accountUsername");
  els.accountForm.reset();
  els.accountDialogTitle.textContent = account ? "Edit Account" : lockedPlayer ? `Add Account for ${lockedPlayer}` : "Add Player";
  setFormValue("accountId", account?.id || "");
  setFormValue("accountUsername", lockedPlayer);
  setFormValue("accountName", account?.accountName || "");
  setFormValue("accountDiscord", account?.discord || "");
  setFormValue("accountSteam", account?.steam || "");
  DLC_OPTIONS.forEach((option) => setChecked(`accountDlc-${option.key}`, account?.dlc?.[option.key]));
  if (usernameField) usernameField.hidden = Boolean(lockedPlayer);
  if (usernameInput) usernameInput.required = !lockedPlayer;
  showModal(els.accountDialog);
}

function openDragonDialog(id = "", options = {}) {
  const dragon = id ? dragonById(id) : null;
  const account = options.accountId ? accountById(options.accountId) : null;
  els.dragonForm.reset();
  clearGeneticsImportStatus();
  els.dragonDialogTitle.textContent = dragon ? "Edit Dragon" : "Add Dragon";
  document.querySelector("#dragonId").value = dragon?.id || "";

  populateParentSelects(dragon?.id || "");

  const values = dragon || normalizeDragon({
    accountId: account?.id || "",
    username: account?.username || "",
    accountName: account?.accountName || "",
    species: options.species || "",
    status: "Hatchie",
    sex: "Unknown",
    skinType: "Unknown",
    bloodline: "Unknown",
    stats: {}
  });

  setFormValue("dragonAccountId", values.accountId || "");
  renderDragonPlayerSelect(values.username);
  if (!document.querySelector("#dragonPlayerSelect")?.value) {
    setFormValue("dragonUsername", ["Unknown User", "Unknown Player"].includes(values.username) && !dragon ? "" : values.username);
  }
  syncDragonPlayerControls();
  renderAccountNameDatalist(activeDragonPlayerName());
  setFormValue("dragonAccountName", values.accountName === "Unnamed Account" && !dragon ? "" : values.accountName);
  renderDragonSpeciesSelect({
    selectedSpecies: values.species,
    editingId: values.id || "",
    accountId: values.accountId || ""
  });
  setFormValue("dragonSex", values.sex);
  setFormValue("dragonStatus", values.status);
  setFormValue("dragonNestRole", values.nestRole);
  setFormValue("dragonServer", values.server);
  populateDragonSkinInputs(values.species, values.skin, values.recessiveSkin);
  setFormValue("dragonMother", values.motherId);
  setFormValue("dragonFather", values.fatherId);
  setFormValue("dragonMotherName", values.motherName);
  setFormValue("dragonFatherName", values.fatherName);
  setFormValue("dragonBloodline", values.bloodline);
  setChecked("dragonDominantMutation", values.dominantMutation);
  setFormValue("dragonElderProgress", values.elderProgress);
  setFormValue("dragonMutationPoints", values.mutationPoints);
  setFormValue("dragonRemainingMutationPoints", values.remainingMutationPoints);
  setFormValue("dragonSocialPoints", values.socialPoints);
  setFormValue("dragonAgilePoints", values.agilePoints);
  setChecked("dragonFastMutation", values.fastMutation);
  setFormValue("dragonScavengerPoints", values.scavengerPoints);
  setChecked("dragonSurvivorMutation", values.survivorMutation);
  setFormValue("dragonBirthDate", values.birthDate);
  setFormValue("dragonTags", values.tags.join(", "));
  setFormValue("dragonNotes", values.notes);

  STAT_FIELDS.forEach((field) => setFormValue(`stat-${field.key}`, values.stats[field.key] || "Unknown"));
  syncDragonComputedFields();
  syncAllAPlusIndicator();

  showModal(els.dragonDialog);
}

function populateParentSelects(editingId = "") {
  const options = ["<option value=''>Unknown</option>", ...state.dragons
    .filter((dragon) => dragon.id !== editingId)
    .map((dragon) => `<option value="${escapeAttr(dragon.id)}">${escapeHtml(dragonOptionLabel(dragon))}</option>`)]
    .join("");
  document.querySelector("#dragonMother").innerHTML = options;
  document.querySelector("#dragonFather").innerHTML = options;
}

function handleAccountSubmit(event) {
  event.preventDefault();
  const form = new FormData(els.accountForm);
  const id = text(form.get("id"));
  const rawUsername = text(form.get("username"));
  const username = id ? rawUsername : resolvePlayerName(rawUsername);
  const accountName = text(form.get("accountName"));
  const dlc = Object.fromEntries(DLC_OPTIONS.map((option) => [option.key, form.has(`dlc-${option.key}`)]));

  if (!username) {
    alert("Add a player name first.");
    return;
  }

  const duplicate = state.accounts.find((account) =>
    account.id !== id && accountIdentityKey(account.username, account.accountName) === accountIdentityKey(username, accountName)
  );
  if (duplicate) {
    alert(`${username} already has an account named ${accountName}.`);
    return;
  }

  const account = upsertAccountRecord({
    id,
    username,
    preserveUsername: Boolean(id),
    accountName,
    discord: form.get("discord"),
    steam: form.get("steam"),
    dlc
  });

  reconcilePrimaryHomeSettings();
  saveState();
  closeModal("accountDialog");
  renderAll();
  showToast(`${account.accountName} saved`);
}

function handleDragonSubmit(event) {
  event.preventDefault();
  syncDragonPureSkinFields("dragonSkin");
  const form = new FormData(els.dragonForm);
  const id = form.get("id") || uid("dragon");
  const existing = dragonById(id);
  const selectedPlayer = text(document.querySelector("#dragonPlayerSelect")?.value);
  const typedPlayer = text(document.querySelector("#dragonUsername")?.value);
  const aliasedPlayer = resolvePlayerAlias(typedPlayer);
  const existingTypedPlayer = findDirectPlayerName(typedPlayer);
  const username = selectedPlayer || aliasedPlayer || typedPlayer;

  if (!selectedPlayer && existingTypedPlayer && !aliasedPlayer) {
    alert(`${existingTypedPlayer} already exists. Select that player from the dropdown instead of typing it manually.`);
    return;
  }

  if (!username) {
    alert("Select an existing player or type a new player name.");
    return;
  }

  const stats = {};
  STAT_FIELDS.forEach((field) => {
    stats[field.key] = form.get(`stat-${field.key}`) || "Unknown";
  });

  const dragon = normalizeDragon({
    id,
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    accountId: form.get("accountId"),
    username,
    accountName: form.get("accountName"),
    name: form.get("accountName"),
    species: form.get("species"),
    sex: form.get("sex"),
    status: form.get("status"),
    nestRole: form.get("nestRole"),
    server: form.get("server"),
    skin: form.get("skin"),
    recessiveSkin: form.get("recessiveSkin"),
    motherId: form.get("motherId"),
    fatherId: form.get("fatherId"),
    motherName: form.get("motherName"),
    fatherName: form.get("fatherName"),
    bloodline: form.get("bloodline"),
    stats,
    dominantMutation: form.has("dominantMutation"),
    elderProgress: form.get("elderProgress"),
    socialPoints: form.get("socialPoints"),
    agilePoints: form.get("agilePoints"),
    fastMutation: form.has("fastMutation"),
    scavengerPoints: form.get("scavengerPoints"),
    survivorMutation: form.has("survivorMutation"),
    birthDate: form.get("birthDate"),
    tags: form.get("tags"),
    notes: form.get("notes")
  });
  dragon.skinType = skinTypeForName(dragon.skin, dragon.species);

  const matchingAccount = accountById(dragon.accountId)
    || state.accounts.find((account) => accountIdentityKey(account.username, account.accountName) === accountIdentityKey(dragon.username, dragon.accountName));
  const duplicate = duplicateDragonForAccount(matchingAccount?.id || dragon.accountId, dragon.species, dragon.id);
  if (duplicate) {
    alert(`${matchingAccount?.accountName || dragon.accountName} already has a ${dragon.species}. Each account can only have one of each dragon species.`);
    return;
  }

  const account = upsertAccountRecord({
    id: dragon.accountId,
    username: dragon.username,
    accountName: dragon.accountName
  });
  dragon.accountId = account.id;
  dragon.username = account.username;
  dragon.accountName = account.accountName;
  dragon.name = account.accountName;

  upsertSpecies(dragon.species);
  upsertManualLineageFromDragon(dragon);
  const index = state.dragons.findIndex((item) => item.id === id);
  if (index >= 0) state.dragons[index] = dragon;
  else state.dragons.push(dragon);

  refreshAllDerivedRecords();
  saveState();
  closeModal("dragonDialog");
  renderAll();
  showToast(`${dragon.name} saved`);
}

function openSkinDialog(id = "") {
  const skin = id ? skinById(id) : null;
  els.skinForm.reset();
  els.skinDialogTitle.textContent = skin ? "Edit Skin" : "Add Skin";
  document.querySelector("#skinId").value = skin?.id || "";

  const values = skin || normalizeSkin({ type: "Unknown", species: "All" });
  setFormValue("skinName", values.name === "Unnamed Skin" && !skin ? "" : values.name);
  setFormValue("skinType", values.type);
  setFormValue("skinSpecies", values.species);
  setFormValue("skinSource", values.source);
  setFormValue("skinRecipeA", values.recipeA);
  setFormValue("skinRecipeB", values.recipeB);
  setChecked("skinOwned", values.owned);

  showModal(els.skinDialog);
}

function handleSkinSubmit(event) {
  event.preventDefault();
  const form = new FormData(els.skinForm);
  const id = form.get("id") || uid("skin");
  const existing = skinById(id);
  const skin = normalizeSkin({
    id,
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    name: form.get("name"),
    type: form.get("type"),
    species: form.get("species"),
    source: form.get("source"),
    recipeA: form.get("recipeA"),
    recipeB: form.get("recipeB"),
    owned: form.has("owned"),
    wishlist: Boolean(existing?.wishlist)
  });

  upsertSpecies(skin.species === "All" ? "" : skin.species);
  const index = state.skins.findIndex((item) => item.id === id);
  if (index >= 0) state.skins[index] = skin;
  else state.skins.push(skin);

  refreshAllDerivedRecords();
  saveState();
  closeModal("skinDialog");
  renderAll();
  showToast(`${skin.name} saved`);
}

function handleDragonAction(event) {
  const button = event.target.closest("[data-dragon-action]");
  if (!button) return;
  const id = button.dataset.id;
  const action = button.dataset.dragonAction;
  const dragon = dragonById(id);
  if (!dragon) return;
  if (dragon.clanImported) {
    showToast("Clan-shared dragons are read-only on this device.");
    return;
  }

  const fromAccountDetail = Boolean(els.accountDetailContent?.contains(button));

  if (action === "edit") {
    if (fromAccountDetail) closeModal("accountDetailDialog");
    openDragonDialog(id);
  }
  if (action === "clone") cloneDragon(dragon);
  if (action === "toggleStatus") toggleDragonStatus(dragon);
  if (action === "share") void shareDragonWithClan(dragon);
  if (action === "delete") {
    deleteDragon(dragon);
    if (fromAccountDetail && !dragonById(id)) closeModal("accountDetailDialog");
  }
}

async function shareMapPinWithClan(pin) {
  const clan = activeClan();
  if (!clan || !canShareWithActiveClan()) {
    showToast("Connect Discord and choose a clan before sharing.");
    setTab("clans", { updateHash: true });
    return;
  }
  if (isMapPinSharedWithActiveClan(pin)) {
    showToast("This map pin is already shared with the active clan.");
    return;
  }
  const approved = await confirmClanShare({
    title: "Share Map Pin",
    description: `Share ${pin.label} with ${clan.name}? This pin becomes visible to active clan members.`
  });
  if (!approved) return;
  try {
    await clanSync.shareMapPin(clan.id, pin);
    await refreshClanSync({ quiet: true });
    renderMapPins();
    showToast(`${pin.label} shared with ${clan.name}`);
  } catch (error) {
    showToast(clanFriendlyError(error));
  }
}

function isMapPinSharedWithActiveClan(pin) {
  if (!pin || !canShareWithActiveClan()) return false;
  return clanUi.sharedPins.some((record) => record.source_user_id === clanUi.user?.id && record.source_local_id === pin.id);
}

async function unshareClanMapPin(pin) {
  if (!confirm(`Remove ${pin.label} from clan sharing? Your local pin will remain.`)) return;
  try {
    await clanSync.unshareMapPin(pin.id);
    await refreshClanSync({ quiet: true });
    renderMapPins();
    showToast(`${pin.label} removed from clan sharing`);
  } catch (error) {
    showToast(clanFriendlyError(error));
  }
}

function handleAccountAction(event) {
  const button = event.target.closest("[data-account-action]");
  if (!button) return;
  const action = button.dataset.accountAction;

  if (action === "add-account") {
    openAccountDialog("", { username: button.dataset.username || "" });
    return;
  }

  if (action === "delete-player") {
    deletePlayer(button.dataset.username || "");
    return;
  }

  const account = accountById(button.dataset.id);
  if (!account) return;
  const fromAccountDetail = Boolean(els.accountDetailContent?.contains(button));

  if (action === "open-detail") openAccountDetailDialog(account.id);
  if (action === "edit") {
    if (fromAccountDetail) closeModal("accountDetailDialog");
    openAccountDialog(account.id);
  }
  if (action === "add-dragon") {
    if (fromAccountDetail) closeModal("accountDetailDialog");
    openDragonDialog("", { accountId: account.id, species: button.dataset.species || "" });
  }
  if (action === "share-account") void shareAccountWithClan(account);
  if (action === "delete-account") {
    deleteAccount(account);
    if (fromAccountDetail && !accountById(account.id)) closeModal("accountDetailDialog");
  }
}

function handleSkinAction(event) {
  const turntableButton = event.target.closest(".skin-turntable");
  if (turntableButton) {
    openSkinTurntableDialog(turntableButton);
    return;
  }

  const button = event.target.closest("[data-skin-action]");
  if (!button) return;
  const id = button.dataset.id;
  const action = button.dataset.skinAction;
  const skin = skinById(id);
  if (!skin) return;

  if (action === "edit") openSkinDialog(id);
  if (action === "wishlist") toggleSkinWishlist(skin);
  if (action === "delete") deleteSkin(skin);
}

function toggleSkinWishlist(skin) {
  skin.wishlist = !skin.wishlist;
  skin.updatedAt = new Date().toISOString();
  saveState();
  renderAll();
  showToast(skin.wishlist ? `${skin.name} added to wishlist` : `${skin.name} removed from wishlist`);
}

function openSkinTurntableDialog(turntableButton) {
  if (!els.skinTurntableDialog || !els.skinTurntableVideo) return;
  const card = turntableButton.closest(".skin-card");
  const skin = skinById(card?.dataset.id);
  const source = turntableButton.querySelector("video")?.currentSrc || turntableButton.querySelector("video")?.getAttribute("src") || "";
  if (!source) return;
  if (els.skinTurntableTitle) els.skinTurntableTitle.textContent = `${skin?.name || "Skin"} Turntable`;
  els.skinTurntableVideo.pause();
  els.skinTurntableVideo.src = source;
  showModal(els.skinTurntableDialog);
  els.skinTurntableVideo.play().catch(() => {});
}

function cloneDragon(dragon) {
  const cloneAccount = upsertAccountRecord({
    username: dragon.username || "Unknown Player",
    accountName: `${dragon.accountName || dragon.name} copy`
  });
  const clone = normalizeDragon({
    ...dragon,
    id: uid("dragon"),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    accountId: cloneAccount.id,
    username: cloneAccount.username,
    accountName: cloneAccount.accountName,
    name: cloneAccount.accountName
  });
  state.dragons.push(clone);
  refreshAllDerivedRecords();
  saveState();
  renderAll();
  showToast(`${clone.name} added`);
}

function toggleDragonStatus(dragon) {
  const currentIndex = STATUSES.indexOf(dragon.status);
  dragon.status = normalizeDominantMutationStatus(STATUSES[Math.min(currentIndex + 1, STATUSES.length - 1)] || "Hatchie", dragon.dominantMutation);
  dragon.growth = normalizeGrowthValue(dragon.status, dragon.growth);
  dragon.elderProgress = normalizeElderProgress(dragon.status, dragon.elderProgress);
  dragon.mutationPoints = estimateMutationPoints(dragon.status, dragon.growth, dragon.elderProgress);
  const allocation = normalizeMutationAllocation({
    status: dragon.status,
    nestRole: dragon.nestRole,
    mutationPoints: dragon.mutationPoints,
    socialPoints: dragon.socialPoints,
    dominantMutation: dragon.dominantMutation,
    agilePoints: dragon.agilePoints,
    fastMutation: dragon.fastMutation,
    scavengerPoints: dragon.scavengerPoints,
    survivorMutation: dragon.survivorMutation
  });
  Object.assign(dragon, allocation);
  dragon.updatedAt = new Date().toISOString();
  saveState();
  renderAll();
  showToast(`${dragon.name} marked ${dragon.status}`);
}

function deleteDragon(dragon) {
  if (!confirm(`Delete ${dragon.name}?`)) return;
  state.dragons = state.dragons.filter((item) => item.id !== dragon.id);
  state.broodPouch = (state.broodPouch || []).filter((entry) => entry.dragonId !== dragon.id);
  clearDragonParentReferences(new Set([dragon.id]));
  refreshAllDerivedRecords();
  saveState();
  renderAll();
  showToast(`${dragon.name} deleted`);
}

function deleteAccount(account) {
  const accountDragons = dragonsForAccount(account.id);
  const dragonText = accountDragons.length === 1 ? "1 dragon" : `${accountDragons.length} dragons`;
  if (!confirm(`Delete account ${account.accountName} and ${dragonText}?`)) return;
  deleteAccountsByIds([account.id]);
  showToast(`${account.accountName} deleted`);
}

function deletePlayer(username) {
  const playerName = text(username);
  const playerAccounts = state.accounts.filter((account) => account.username === playerName);
  if (!playerAccounts.length) return;
  const accountIds = playerAccounts.map((account) => account.id);
  const dragonCount = state.dragons.filter((dragon) => accountIds.includes(dragon.accountId)).length;
  const accountText = playerAccounts.length === 1 ? "1 account" : `${playerAccounts.length} accounts`;
  const dragonText = dragonCount === 1 ? "1 dragon" : `${dragonCount} dragons`;
  if (!confirm(`Delete player ${playerName}, ${accountText}, and ${dragonText}?`)) return;
  deleteAccountsByIds(accountIds);
  showToast(`${playerName} deleted`);
}

function deleteAccountsByIds(accountIds) {
  const accountIdSet = new Set(accountIds);
  const removedDragonIds = new Set(state.dragons
    .filter((dragon) => accountIdSet.has(dragon.accountId))
    .map((dragon) => dragon.id));

  state.accounts = state.accounts.filter((account) => !accountIdSet.has(account.id));
  reconcilePrimaryHomeSettings();
  state.dragons = state.dragons.filter((dragon) => !removedDragonIds.has(dragon.id));
  state.broodPouch = (state.broodPouch || []).filter((entry) => !removedDragonIds.has(entry.dragonId));
  if (state.settings?.elderTickAccounts) {
    accountIdSet.forEach((accountId) => delete state.settings.elderTickAccounts[accountId]);
  }
  clearDragonParentReferences(removedDragonIds);
  refreshAllDerivedRecords();
  saveState();
  renderAll();
}

function clearDragonParentReferences(removedDragonIds) {
  state.dragons.forEach((dragon) => {
    if (removedDragonIds.has(dragon.motherId)) dragon.motherId = "";
    if (removedDragonIds.has(dragon.fatherId)) dragon.fatherId = "";
  });
}

function upsertManualLineageFromDragon(dragon) {
  [
    { name: dragon.fatherName, sex: "Male" },
    { name: dragon.motherName, sex: "Female" }
  ].forEach((entry) => {
    const name = text(entry.name);
    if (!name) return;
    const existing = lineageRecordByName(name);
    if (existing) {
      existing.sex = existing.sex === "Unknown" ? entry.sex : existing.sex;
      existing.species = existing.species || dragon.species;
      existing.updatedAt = new Date().toISOString();
      return;
    }
    state.lineageRecords.push(normalizeLineageRecord({
      name,
      sex: entry.sex,
      species: dragon.species,
      notes: `Typed as a parent for ${dragonAccountLabel(dragon)}.`
    }));
  });
}

function lineageRecordByName(name) {
  const key = canonicalLineageName(name);
  if (!key) return null;
  return state.lineageRecords.find((record) => canonicalLineageName(record.name) === key);
}

function deleteSkin(skin) {
  if (!confirm(`Delete ${skin.name}?`)) return;
  state.skins = state.skins.filter((item) => item.id !== skin.id);
  refreshAllDerivedRecords();
  saveState();
  renderAll();
  showToast(`${skin.name} deleted`);
}

function createEggFromPlanner() {
  const parentA = dragonById(els.parentOne.value);
  const parentB = dragonById(els.parentTwo.value);
  if (!parentA || !parentB) {
    showToast("Select two parent records first");
    return;
  }

  if (!canNestTogether(parentA, parentB)) {
    showToast("Parents must be the same species to nest");
    return;
  }

  if (parentA.id === parentB.id) {
    showToast("Choose two different dragons for father and mother");
    return;
  }

  if (!hasValidNestSexPair(parentA, parentB)) {
    showToast("Parents must be one male and one female to nest");
    return;
  }

  const motherId = parentA.sex === "Female" ? parentA.id : parentB.sex === "Female" ? parentB.id : parentA.id;
  const fatherId = parentA.sex === "Male" ? parentA.id : parentB.sex === "Male" ? parentB.id : parentB.id;
  const bloodline = estimateBloodline(parentA.bloodline, parentB.bloodline);
  const broodWatcherBrooding = Boolean(els.broodWatcherBrooding?.checked);
  const inbredNest = isInbredNest(parentA, parentB);
  const eggAccount = promptEggAccount(parentA, parentB);
  if (!eggAccount) return;

  const egg = normalizeDragon({
    id: uid("dragon"),
    accountId: eggAccount.id,
    username: eggAccount.username,
    accountName: eggAccount.accountName,
    name: eggAccount.accountName,
    species: parentA.species || parentB.species,
    sex: "Unknown",
    status: "Hatchie",
    nestRole: "Unknown",
    skinType: "Unknown",
    motherId,
    fatherId,
    bloodline,
    stats: Object.fromEntries(STAT_FIELDS.map((field) => [field.key, projectStatInheritance(field, parentA, parentB, bloodline, broodWatcherBrooding, { inbred: inbredNest }).eggGrade])),
    notes: `Created from the nesting planner from ${dragonAccountLabel(parentA)} x ${dragonAccountLabel(parentB)}. ${inbredNest ? "Inbred nest one selected parent is the child or sibling of the other. This nest will result in F stats." : `Stat values use the current Social point projection rules${broodWatcherBrooding ? " with BW brooding marked for possible supercrits." : "."}`}`
  });

  state.dragons.push(egg);
  refreshAllDerivedRecords();
  saveState();
  renderAll();
  if (els.addEggToBroodPouch?.checked) {
    openBroodPouchDialog(egg.id);
  }
  showToast(`${egg.name} created`);
}

function promptEggAccount(parentA, parentB) {
  const species = parentA.species || parentB.species;
  const defaultPlayer = findExistingPlayerName(parentA.username) || findExistingPlayerName(parentB.username) || parentA.username || parentB.username || "";
  const rawPlayer = prompt("Player that owns the egg account:", defaultPlayer);
  if (rawPlayer === null) return null;

  const username = findExistingPlayerName(rawPlayer) || text(rawPlayer);
  if (!username) {
    alert("Add a player name for the egg account.");
    return null;
  }

  const defaultAccount = `Egg ${dateStamp()} ${String(state.dragons.length + 1).padStart(3, "0")}`;
  const rawAccount = prompt(`Account taking this egg for ${username}:`, defaultAccount);
  if (rawAccount === null) return null;

  const accountName = text(rawAccount);
  if (!accountName) {
    alert("Add an account name for the egg.");
    return null;
  }

  const existingAccount = state.accounts.find((account) =>
    accountIdentityKey(account.username, account.accountName) === accountIdentityKey(username, accountName)
  );
  const duplicate = existingAccount ? duplicateDragonForAccount(existingAccount.id, species) : null;
  if (duplicate) {
    alert(`${existingAccount.accountName} already has a ${species}. Each account can only have one of each dragon species.`);
    return null;
  }

  return upsertAccountRecord({
    id: existingAccount?.id || "",
    username,
    accountName
  });
}

function canNestTogether(parentA, parentB) {
  if (!parentA || !parentB) return false;
  return Boolean(parentA.species && parentA.species === parentB.species);
}

function hasValidNestSexPair(parentA, parentB) {
  if (!parentA || !parentB) return false;
  return (parentA.sex === "Female" && parentB.sex === "Male") || (parentA.sex === "Male" && parentB.sex === "Female");
}

function isKnownSex(sex) {
  return sex === "Female" || sex === "Male";
}

function projectStatInheritance(field, parentA, parentB, eggBloodline, broodWatcherBrooding = false, options = {}) {
  const parentAGrade = normalizeGrade(parentA.stats?.[field.key]);
  const parentBGrade = normalizeGrade(parentB.stats?.[field.key]);
  if (options.inbred) {
    return {
      parentA: parentAGrade,
      parentB: parentBGrade,
      display: "F",
      eggGrade: "F",
      rule: "Inbred nest: sibling or parent-child pairing sets this egg stat to F."
    };
  }

  const fullSocialA = hasFullSocial(parentA);
  const fullSocialB = hasFullSocial(parentB);
  const upstatGrade = matchingUpstatGrade(parentAGrade, parentBGrade, eggBloodline);

  if (upstatGrade) {
    const supercrit = matchingSupercritProjection(parentAGrade, upstatGrade, fullSocialA && fullSocialB, broodWatcherBrooding);
    return {
      parentA: parentAGrade,
      parentB: parentBGrade,
      display: `${upstatGrade} guaranteed${supercrit.display ? `; ${supercrit.display}` : ""}`,
      eggGrade: upstatGrade,
      rule: `Matching ${parentAGrade} letters are at or below egg bloodline ${eggBloodline}; normal upstat is all-or-nothing, not RNG.${supercrit.rule ? ` ${supercrit.rule}` : ""}`
    };
  }

  if (parentAGrade === "Unknown" && parentBGrade === "Unknown") {
    return {
      parentA: parentAGrade,
      parentB: parentBGrade,
      display: "Unknown",
      eggGrade: "Unknown",
      rule: "Record both parent letters before projecting this stat."
    };
  }

  if (parentAGrade === "Unknown" || parentBGrade === "Unknown") {
    const known = parentAGrade === "Unknown" ? parentBGrade : parentAGrade;
    return {
      parentA: parentAGrade,
      parentB: parentBGrade,
      display: known,
      eggGrade: known,
      rule: "Only one parent has a saved letter."
    };
  }

  if (fullSocialA && fullSocialB) {
    const grade = bestGrade(parentAGrade, parentBGrade);
    return {
      parentA: parentAGrade,
      parentB: parentBGrade,
      display: `${grade} guaranteed`,
      eggGrade: grade,
      rule: "Both parents have 3/3 Social, so the higher saved letter is guaranteed."
    };
  }

  if (fullSocialA || fullSocialB) {
    const favoredParent = fullSocialA ? parentA : parentB;
    const favoredGrade = fullSocialA ? parentAGrade : parentBGrade;
    const otherGrade = fullSocialA ? parentBGrade : parentAGrade;
    return {
      parentA: parentAGrade,
      parentB: parentBGrade,
      display: `${favoredGrade} 75% / ${otherGrade} 25%`,
      eggGrade: favoredGrade,
      rule: `${dragonAccountLabel(favoredParent)} has 3/3 Social; partial Social on the mate does not change the odds.`
    };
  }

  if (parentAGrade === parentBGrade) {
    return {
      parentA: parentAGrade,
      parentB: parentBGrade,
      display: parentAGrade,
      eggGrade: parentAGrade,
      rule: "Matching letters pass evenly; upstat only applies when the egg bloodline can support it."
    };
  }

  return {
    parentA: parentAGrade,
    parentB: parentBGrade,
    display: `${parentAGrade} 50% / ${parentBGrade} 50%`,
    eggGrade: bestGrade(parentAGrade, parentBGrade),
    rule: "No parent has 3/3 Social, so the dominant letter is a 50/50."
  };
}

function matchingUpstatGrade(parentAGrade, parentBGrade, eggBloodline) {
  const grade = normalizeGrade(parentAGrade);
  const bloodline = normalizeBloodlineGrade(eggBloodline);
  if (grade === "Unknown" || grade !== normalizeGrade(parentBGrade) || bloodline === "Unknown") return "";
  if (gradeScore(grade) > bloodlineScore(bloodline)) return "";
  return normalUpstatGrade(grade);
}

function matchingSupercritProjection(parentGrade, upstatGrade, bothFullSocial, broodWatcherBrooding) {
  const supercritGrade = supercritGradeFor(parentGrade);
  if (gradeScore(supercritGrade) <= gradeScore(upstatGrade)) return { display: "", rule: "" };

  if (bothFullSocial) {
    return {
      display: `${supercritGrade} 5% supercrit`,
      rule: "Both parents have 3/3 Social, enabling a 5% per-stat supercrit roll."
    };
  }

  if (broodWatcherBrooding) {
    return {
      display: `${supercritGrade} BW supercrit possible`,
      rule: "BW brooding can enable supercrits; the chance changes per brood attempt, so check the in-game brooding tooltip."
    };
  }

  return {
    display: "",
    rule: `${supercritGrade} requires a supercrit; mark BW brooding or use two 3/3 Social parents to track that path.`
  };
}

function normalUpstatGrade(grade) {
  const next = nextGrade(grade);
  return next === "A++" ? "A+" : next;
}

function supercritGradeFor(grade) {
  return nextGrade(nextGrade(grade));
}

function nextGrade(grade) {
  const score = gradeScore(grade);
  if (score < 0) return "Unknown";
  return GRADES[Math.min(score + 1, GRADES.length - 1)] || "Unknown";
}

function hasFullSocial(dragon) {
  return socialPointsValue(dragon?.socialPoints) >= SOCIAL_POINTS_MAX;
}

function nestingWarnings(parentA, parentB) {
  const warnings = [];
  if (parentA.id === parentB.id) warnings.push("Both parent slots point to the same dragon; choose two different dragons for father and mother.");
  if (isInbredNest(parentA, parentB)) warnings.push("Inbred nest one selected parent is the child or sibling of the other. This nest will result in F stats.");
  if (parentA.species && parentB.species && parentA.species !== parentB.species) warnings.push("Species do not match; this pair cannot create an egg.");
  if (!hasValidNestSexPair(parentA, parentB)) warnings.push("Nest requires one male and one female parent.");
  if (!["Grown", "4th Pointed", "Elder"].includes(parentA.status)) warnings.push(`${dragonAccountLabel(parentA)} is marked ${parentA.status}; nesting projects usually need grown parents.`);
  if (!["Grown", "4th Pointed", "Elder"].includes(parentB.status)) warnings.push(`${dragonAccountLabel(parentB)} is marked ${parentB.status}; nesting projects usually need grown parents.`);

  const aAncestors = ancestorsOf(parentA.id);
  const bAncestors = ancestorsOf(parentB.id);
  if (aAncestors.has(parentB.id) || bAncestors.has(parentA.id)) warnings.push("One selected dragon appears in the other's ancestry.");
  const shared = [...aAncestors].filter((id) => bAncestors.has(id));
  if (shared.length) warnings.push(`Shared ancestor: ${shared.map(dragonName).join(", ")}.`);

  return warnings;
}

function isInbredNest(parentA, parentB) {
  return Boolean(inbredNestReason(parentA, parentB));
}

function inbredNestReason(parentA, parentB) {
  if (!parentA || !parentB || parentA.id === parentB.id) return "";
  if (isDirectParentChild(parentA, parentB)) return "one selected parent is the child of the other";
  if (areSiblings(parentA, parentB)) return "the selected parents are siblings";
  return "";
}

function isDirectParentChild(a, b) {
  const aParents = lineageParentKeys(a);
  const bParents = lineageParentKeys(b);
  return [...lineageIdentityKeys(b)].some((key) => aParents.has(key))
    || [...lineageIdentityKeys(a)].some((key) => bParents.has(key));
}

function areSiblings(a, b) {
  const aParents = lineageParentKeys(a);
  const bParents = lineageParentKeys(b);
  return [...aParents].some((key) => bParents.has(key));
}

function lineageIdentityKeys(dragon) {
  const keys = new Set();
  if (!dragon) return keys;
  if (dragon.id) keys.add(`id:${dragon.id}`);
  [dragon.name, dragon.accountName].forEach((name) => {
    const key = canonicalLineageName(name);
    if (key) keys.add(`name:${key}`);
  });
  return keys;
}

function lineageParentKeys(dragon) {
  const keys = new Set();
  if (!dragon) return keys;
  [dragon.motherId, dragon.fatherId].forEach((id) => {
    if (!id) return;
    keys.add(`id:${id}`);
    const name = canonicalLineageName(dragonName(id));
    if (name) keys.add(`name:${name}`);
  });
  [dragon.motherName, dragon.fatherName].forEach((name) => {
    const key = canonicalLineageName(name);
    if (key) keys.add(`name:${key}`);
  });
  return keys;
}

function canonicalLineageName(value) {
  return text(value).toLowerCase().replace(/\s+/g, " ");
}

function ancestorsOf(id, depth = 5, seen = new Set()) {
  if (!id || depth <= 0) return seen;
  const dragon = dragonById(id);
  if (!dragon) return seen;
  [dragon.motherId, dragon.fatherId].forEach((parentId) => {
    if (!parentId || seen.has(parentId)) return;
    seen.add(parentId);
    ancestorsOf(parentId, depth - 1, seen);
  });
  return seen;
}

function inheritancePool(parentA, parentB) {
  const entries = [];
  addInheritance(entries, parentA.skin, `${dragonAccountLabel(parentA)} visible`);
  addInheritance(entries, parentA.recessiveSkin, `${dragonAccountLabel(parentA)} rec`);
  addInheritance(entries, parentB.skin, `${dragonAccountLabel(parentB)} visible`);
  addInheritance(entries, parentB.recessiveSkin, `${dragonAccountLabel(parentB)} rec`);

  [parentA.motherId, parentA.fatherId, parentB.motherId, parentB.fatherId].forEach((id) => {
    const grandparent = dragonById(id);
    if (!grandparent) return;
    addInheritance(entries, grandparent.skin, `${dragonAccountLabel(grandparent)} visible`);
    addInheritance(entries, grandparent.recessiveSkin, `${dragonAccountLabel(grandparent)} rec`);
  });

  const seen = new Set();
  return entries.filter((entry) => {
    const key = `${entry.skin}::${entry.source}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function addInheritance(entries, skin, source) {
  if (!skin) return;
  entries.push({ skin, source });
}

function estimateBloodline(a, b) {
  const gradeA = normalizeBloodlineGrade(a);
  const gradeB = normalizeBloodlineGrade(b);
  if (gradeA === "Unknown" || gradeB === "Unknown") return "Unknown";
  const ai = BLOODLINE_GRADES.indexOf(gradeA);
  const bi = BLOODLINE_GRADES.indexOf(gradeB);
  if (ai < 0 || bi < 0) return "Unknown";
  if (ai === bi) return BLOODLINE_GRADES[Math.min(ai + 1, BLOODLINE_GRADES.length - 1)];
  return BLOODLINE_GRADES[Math.round((ai + bi) / 2)] || "Unknown";
}

function bestGrade(a, b) {
  const gradeA = normalizeGrade(a);
  const gradeB = normalizeGrade(b);
  const ai = gradeScore(gradeA);
  const bi = gradeScore(gradeB);
  if (ai < 0 && bi < 0) return "Unknown";
  return ai >= bi ? gradeA : gradeB;
}

function gradeScore(grade) {
  return GRADES.indexOf(normalizeGrade(grade));
}

function bloodlineScore(grade) {
  return gradeScore(normalizeBloodlineGrade(grade));
}

function exportJson() {
  state.settings.lastBackupAt = new Date().toISOString();
  saveState({ skipHistory: true });
  downloadBlob(`day-of-dragons-tracker-${dateStamp()}.json`, JSON.stringify(state, null, 2), "application/json");
  renderBackup();
  showToast("JSON backup exported");
}

function exportSafeJson() {
  state.settings.lastBackupAt = new Date().toISOString();
  saveState({ skipHistory: true });
  downloadBlob(`dragon-tracker-safe-${dateStamp()}.json`, JSON.stringify(safeExportState(), null, 2), "application/json");
  renderBackup();
  showToast("Safe JSON backup exported");
}

function safeExportState() {
  return normalizeState({
    ...state,
    accounts: state.accounts.map((account) => ({
      ...account,
      discord: "",
      steam: ""
    })),
    dragons: state.dragons.map((dragon) => ({
      ...dragon,
      server: "",
      notes: "",
      birthDate: "",
      tags: []
    })),
    mapPins: state.mapPins.map((pin) => ({
      ...pin,
      sharedBy: "",
      notes: ""
    })),
    broodPouch: (state.broodPouch || []).map((entry) => ({
      ...entry,
      notes: ""
    })),
    settings: {
      ...state.settings,
      elderTickStartedAt: "",
      elderTickAccounts: {}
    }
  });
}

function exportCsv() {
  const headers = [
    "player", "account", "species", "sex", "status", "nestRole", "mutationPoints", "remainingMutationPoints", "socialPoints", "dominantMutation",
    "agilePoints", "fastMutation", "scavengerPoints", "survivorMutation", "server", "skin", "skinType", "recessiveSkin",
    "bloodline", ...STAT_FIELDS.map((field) => field.key), "mother", "father", "elderProgress", "tags", "notes"
  ];

  const rows = state.dragons.map((dragon) => {
    const values = [
      dragon.username,
      dragon.name,
      dragon.species,
      dragon.sex,
      dragon.status,
      dragon.nestRole,
      dragon.mutationPoints,
      dragon.remainingMutationPoints,
      socialPointsValue(dragon.socialPoints),
      dragon.dominantMutation ? "yes" : "no",
      dragon.agilePoints,
      dragon.fastMutation ? "yes" : "no",
      dragon.scavengerPoints,
      dragon.survivorMutation ? "yes" : "no",
      dragon.server,
      dragon.skin,
      dragon.skinType,
      dragon.recessiveSkin,
      dragon.bloodline,
      ...STAT_FIELDS.map((field) => dragon.stats[field.key] || ""),
      dragon.motherId ? dragonName(dragon.motherId) : dragon.motherName,
      dragon.fatherId ? dragonName(dragon.fatherId) : dragon.fatherName,
      dragon.elderProgress,
      dragon.tags.join("; "),
      dragon.notes
    ];
    return values.map(csvCell).join(",");
  });

  downloadBlob(`day-of-dragons-dragons-${dateStamp()}.csv`, [headers.join(","), ...rows].join("\n"), "text/csv");
  showToast("CSV exported");
}

function exportShareChart() {
  if (!state.dragons.length) {
    alert("Add at least one dragon before exporting a share chart.");
    return;
  }
  downloadBlob(
    `dragon-tracker-roster-${dateStamp()}.html`,
    buildShareChartHtml(),
    "text/html;charset=utf-8"
  );
  showToast("Share chart exported");
}

function buildShareChartHtml() {
  const dragons = [...state.dragons].sort((a, b) => (
    sortText(a.username, b.username)
    || sortText(a.accountName || a.name, b.accountName || b.name)
    || sortText(a.species, b.species)
  ));
  const grouped = new Map();
  dragons.forEach((dragon) => {
    const player = text(dragon.username) || "Unknown Player";
    if (!grouped.has(player)) grouped.set(player, []);
    grouped.get(player).push(dragon);
  });

  const accountCount = new Set(dragons.map((dragon) => accountIdentityKey(
    dragon.username || "Unknown Player",
    dragon.accountName || dragon.name || "Unnamed Account"
  ))).size;
  const elderCount = dragons.filter(isElderDragon).length;
  const pureCount = dragons.filter((dragon) => sameShareChartSkin(dragon.skin, dragon.recessiveSkin)).length;
  const completeCount = dragons.filter((dragon) => shareChartStatSummary(dragon).complete).length;
  const generatedAt = new Date().toLocaleString();

  const playerSections = [...grouped.entries()].map(([player, playerDragons]) => {
    const playerAccounts = new Set(playerDragons.map((dragon) => text(dragon.accountName || dragon.name) || "Unnamed Account")).size;
    const rows = playerDragons.map((dragon) => {
      const statSummary = shareChartStatSummary(dragon);
      const elderClass = isElderDragon(dragon) ? " elder-row" : "";
      const pureBadge = sameShareChartSkin(dragon.skin, dragon.recessiveSkin) ? `<span class="badge pure">Pure</span>` : "";
      const statusBadge = isElderDragon(dragon) ? `<span class="badge elder">Elder</span>` : escapeHtml(dragon.status || "Unknown");
      return `
        <tr class="${elderClass.trim()}">
          <td data-label="Account"><strong>${escapeHtml(dragon.accountName || dragon.name || "Unnamed Account")}</strong></td>
          <td data-label="Species">${escapeHtml(dragon.species || "Unknown")}</td>
          <td data-label="Sex">${escapeHtml(dragon.sex || "Unknown")}</td>
          <td data-label="Stage">${statusBadge}</td>
          <td data-label="Skin">${escapeHtml(dragon.skin || "Unknown")} ${pureBadge}</td>
          <td data-label="Recessive">${escapeHtml(dragon.recessiveSkin || "Unknown")}</td>
          <td data-label="Nest role">${escapeHtml(dragon.nestRole || "Unknown")}</td>
          <td data-label="Mutation points">${shareChartMutationHtml(dragon)}</td>
          <td data-label="Bloodline">${escapeHtml(normalizeBloodlineGrade(dragon.bloodline))}</td>
          <td data-label="Stats">${shareChartStatsHtml(dragon, statSummary)}</td>
        </tr>`;
    }).join("");
    return `
      <section class="player-section">
        <div class="section-heading">
          <h2>${escapeHtml(player)}</h2>
          <span>${playerAccounts} account${playerAccounts === 1 ? "" : "s"} &middot; ${playerDragons.length} dragon${playerDragons.length === 1 ? "" : "s"}</span>
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Account</th><th>Species</th><th>Sex</th><th>Stage</th><th>Skin</th><th>Recessive</th><th>Nest role</th><th>Mutation points</th><th>Bloodline</th><th>Stats</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </section>`;
  }).join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Dragon Tracker Roster</title>
  <style>
    :root { color-scheme: dark; --ink:#f8f3e8; --muted:#bdb3a3; --line:#4b4138; --panel:#161412; --orange:#ff6b24; --gold:#f3cf58; --green:#79e7a5; }
    * { box-sizing:border-box; }
    body { margin:0; background:#0b0a09; color:var(--ink); font:15px/1.45 system-ui,-apple-system,"Segoe UI",sans-serif; }
    main { width:min(1500px,calc(100% - 32px)); margin:0 auto; padding:40px 0 64px; }
    .report-head { display:flex; align-items:flex-end; justify-content:space-between; gap:24px; border-bottom:1px solid var(--line); padding-bottom:22px; }
    h1,h2,p { margin:0; }
    h1 { color:var(--orange); font-size:clamp(2rem,5vw,4rem); line-height:.95; }
    .report-head p,.section-heading span,.privacy { color:var(--muted); }
    .summary { display:grid; grid-template-columns:repeat(6,minmax(120px,1fr)); gap:10px; margin:20px 0 30px; }
    .summary div { min-height:86px; padding:14px; background:var(--panel); border:1px solid var(--line); border-radius:6px; }
    .summary strong { display:block; color:var(--gold); font-size:1.65rem; }
    .summary span { color:var(--muted); font-size:.83rem; text-transform:uppercase; }
    .player-section { margin-top:28px; }
    .section-heading { display:flex; align-items:baseline; justify-content:space-between; gap:16px; margin-bottom:9px; }
    .section-heading h2 { color:var(--orange); }
    .table-wrap { overflow-x:auto; border:1px solid var(--line); border-radius:6px; background:var(--panel); }
    table { width:100%; border-collapse:collapse; min-width:1160px; }
    th,td { padding:11px 10px; border-bottom:1px solid #302a25; text-align:left; vertical-align:top; }
    th { color:var(--gold); background:#211b17; font-size:.75rem; text-transform:uppercase; white-space:nowrap; }
    tbody tr:last-child td { border-bottom:0; }
    tbody tr:hover { background:#1e1915; }
    .elder-row { background:linear-gradient(90deg,rgba(243,207,88,.19),rgba(255,248,184,.07),rgba(243,207,88,.15)); }
    .badge { display:inline-block; margin-left:5px; padding:1px 6px; border:1px solid currentColor; border-radius:999px; font-size:.7rem; font-weight:700; white-space:nowrap; }
    .badge.elder { color:var(--gold); }
    .badge.pure { color:var(--green); }
    .mutations { color:var(--muted); font-size:.82rem; }
    details { min-width:130px; }
    summary { color:var(--gold); cursor:pointer; font-weight:700; }
    .stat-grid { display:grid; grid-template-columns:1fr auto; gap:3px 12px; min-width:260px; margin-top:8px; color:var(--muted); font-size:.8rem; }
    .stat-grid b { color:var(--ink); }
    .privacy { margin-top:32px; padding-top:18px; border-top:1px solid var(--line); font-size:.82rem; }
    @media (max-width:900px) { .summary { grid-template-columns:repeat(3,1fr); } .report-head { align-items:flex-start; flex-direction:column; } }
    @media (max-width:620px) {
      main { width:min(100% - 20px,1500px); padding-top:24px; }
      .summary { grid-template-columns:repeat(2,1fr); }
      .section-heading { align-items:flex-start; flex-direction:column; }
      .table-wrap { border:0; background:transparent; overflow:visible; }
      table,tbody,tr,td { display:block; min-width:0; width:100%; }
      thead { display:none; }
      tr { margin-bottom:10px; border:1px solid var(--line); border-radius:6px; background:var(--panel); overflow:hidden; }
      td { display:grid; grid-template-columns:112px 1fr; gap:10px; border-bottom:1px solid #302a25; }
      td::before { content:attr(data-label); color:var(--gold); font-size:.72rem; font-weight:700; text-transform:uppercase; }
    }
    @media print { :root { color-scheme:light; } body { background:#fff; color:#111; } main { width:100%; padding:0; } .report-head p,.section-heading span,.privacy,.mutations { color:#555; } .summary div,.table-wrap { background:#fff; border-color:#999; } th { background:#eee; color:#111; } th,td { border-color:#bbb; } .elder-row { background:#fff6cc; } details[open] summary { margin-bottom:5px; } }
  </style>
</head>
<body>
  <main>
    <header class="report-head">
      <div><h1>Dragon Tracker Roster</h1><p>Generated ${escapeHtml(generatedAt)}</p></div>
      <p>Offline browser chart &middot; Version ${escapeHtml(APP_VERSION)}</p>
    </header>
    <section class="summary" aria-label="Roster summary">
      <div><strong>${grouped.size}</strong><span>Players</span></div>
      <div><strong>${accountCount}</strong><span>Accounts</span></div>
      <div><strong>${dragons.length}</strong><span>Dragons</span></div>
      <div><strong>${elderCount}</strong><span>Elders</span></div>
      <div><strong>${pureCount}</strong><span>Pure skin pairs</span></div>
      <div><strong>${completeCount}</strong><span>18A+ dragons</span></div>
    </section>
    ${playerSections}
    <p class="privacy">Share-safe roster: notes, tags, server details, locations, Discord and Steam identifiers, DLC ownership, and sync settings are not included.</p>
  </main>
</body>
</html>`;
}

function sameShareChartSkin(skin, recessiveSkin) {
  const first = text(skin).trim().toLowerCase();
  const second = text(recessiveSkin).trim().toLowerCase();
  return Boolean(first && second && first !== "unknown" && first === second);
}

function shareChartStatSummary(dragon) {
  const grades = STAT_FIELDS.map((field) => normalizeGrade(dragon.stats?.[field.key]));
  const known = grades.filter((grade) => grade !== "Unknown").length;
  const aPlus = grades.filter((grade) => gradeScore(grade) >= gradeScore("A+")).length;
  return { known, aPlus, complete: aPlus === STAT_FIELDS.length };
}

function shareChartStatsHtml(dragon, summary = shareChartStatSummary(dragon)) {
  const label = summary.complete ? "18A+ Complete" : `${summary.aPlus}/18 A+`;
  const rows = STAT_FIELDS.map((field) => `
    <span>${escapeHtml(field.label)}</span><b>${escapeHtml(normalizeGrade(dragon.stats?.[field.key]))}</b>
  `).join("");
  return `<details><summary>${escapeHtml(label)}</summary><div class="stat-grid">${rows}</div></details>`;
}

function shareChartMutationHtml(dragon) {
  const total = Math.max(1, Number(dragon.mutationPoints) || estimateMutationPoints(dragon.status, "", dragon.elderProgress));
  const allocation = normalizeMutationAllocation({ ...dragon, mutationPoints: total });
  const parts = [];
  if (allocation.socialPoints) parts.push(`${allocation.socialPoints} Social`);
  if (allocation.dominantMutation) parts.push("Dominant");
  if (allocation.agilePoints) parts.push(`${allocation.agilePoints} Agile`);
  if (allocation.fastMutation) parts.push("Fast");
  if (allocation.scavengerPoints) parts.push(`${allocation.scavengerPoints} Scavenger`);
  if (allocation.survivorMutation) parts.push("Survivor");
  if (allocation.remainingMutationPoints) parts.push(`${allocation.remainingMutationPoints} unspent`);
  return `<strong>${total}</strong><div class="mutations">${escapeHtml(parts.join(" / ") || "Unallocated")}</div>`;
}

function importJson() {
  const file = els.importFile.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result || "{}"));
      if (!hasImportableBackupData(parsed)) {
        throw new Error("Backup must contain tracker records.");
      }
      const merged = mergeImportedState(state, parsed);
      pendingImportState = {
        parsed,
        merged,
        summary: compareImportPreview(state, parsed, merged)
      };
      renderImportPreview(pendingImportState.summary);
      showModal(els.importPreviewDialog);
    } catch (error) {
      alert(`Could not import backup: ${error.message}`);
    } finally {
      els.importFile.value = "";
    }
  };
  reader.readAsText(file);
}

function hasImportableBackupData(parsed) {
  return ["accounts", "dragons", "skins", "upstats", "lineageRecords", "mapPins", "broodPouch"].some((key) => Array.isArray(parsed?.[key]));
}

function compareImportPreview(current, incomingRaw, merged) {
  const incoming = normalizeState(incomingRaw);
  return [
    ["accounts", "Accounts"],
    ["dragons", "Dragons"],
    ["skins", "Skins"],
    ["upstats", "Upstats"],
    ["lineageRecords", "Lineage names"],
    ["mapPins", "Map pins"],
    ["broodPouch", "Brood pouch"]
  ].map(([key, label]) => ({
    key,
    label,
    current: current[key]?.length || 0,
    incoming: incoming[key]?.length || 0,
    merged: merged[key]?.length || 0,
    added: Math.max(0, (merged[key]?.length || 0) - (current[key]?.length || 0))
  }));
}

function renderImportPreview(summary) {
  if (!els.importPreviewContent) return;
  els.importPreviewContent.innerHTML = `
    <div class="import-preview-grid">
      ${summary.map((item) => `
        <div class="import-preview-metric">
          <strong>${escapeHtml(item.label)}</strong>
          <span>Current ${item.current}</span>
          <span>Incoming ${item.incoming}</span>
          <span>Merged ${item.merged}</span>
          <em>+${item.added} new</em>
        </div>
      `).join("")}
    </div>
    <p class="planner-note">Import merges matching accounts and dragons instead of replacing your tracker. Undo Last Change can restore the previous local data after import.</p>
  `;
}

function handleImportPreviewAction(event) {
  const button = event.target.closest("[data-import-preview-action]");
  if (!button) return;
  const action = button.dataset.importPreviewAction;
  if (action === "cancel") {
    pendingImportState = null;
    closeModal("importPreviewDialog");
    return;
  }
  if (action !== "confirm" || !pendingImportState) return;
  const beforeCounts = { accounts: state.accounts.length, dragons: state.dragons.length };
  state = pendingImportState.merged;
  pendingImportState = null;
  refreshAllDerivedRecords();
  saveState({ reason: "Import backup" });
  closeModal("importPreviewDialog");
  renderAll();
  showToast(`Backup merged: +${Math.max(0, state.accounts.length - beforeCounts.accounts)} accounts, +${Math.max(0, state.dragons.length - beforeCounts.dragons)} dragons`);
}

function undoLastChange() {
  const history = loadUndoHistory();
  const snapshot = history.shift();
  if (!snapshot) {
    showToast("No undo snapshot available");
    return;
  }
  try {
    state = normalizeState(JSON.parse(snapshot.data));
    saveUndoHistory(history);
    saveState({ skipHistory: true });
    renderAll();
    showToast(`Undid: ${snapshot.reason}`);
  } catch (error) {
    showToast(`Could not undo: ${error.message}`);
  }
}

async function importGeneticsPng() {
  const file = els.geneticsImageFile?.files?.[0];
  if (!file) return;

  try {
    const result = await parseGeneticsPngFile(file);
    applyGeneticsPngImport(result, file);
  } catch (error) {
    alert(`Could not read genetics PNG: ${error.message}`);
  } finally {
    els.geneticsImageFile.value = "";
  }
}

async function parseGeneticsPngFile(file) {
  const image = await loadImageFromFile(file);
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth || image.width;
  canvas.height = image.naturalHeight || image.height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("This browser could not open a canvas for image reading.");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return readGeneticsScreenshot(canvas);
}

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("The selected file could not be loaded as an image."));
    };
    image.src = url;
  });
}

function readGeneticsScreenshot(canvas) {
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("This browser could not read the image pixels.");
  const width = canvas.width;
  const height = canvas.height;
  const stats = Object.fromEntries(STAT_FIELDS.map((field) => [field.key, "Unknown"]));

  GENETICS_IMPORT_COLUMNS.forEach((column) => {
    GENETICS_IMPORT_ROW_RATIOS.slice(0, column.count).forEach((center, rowIndex) => {
      const field = STAT_FIELDS[column.start + rowIndex];
      if (!field) return;
      const grade = readGeneticsGradeWindow(context, width, height, {
        x0: column.x0,
        x1: column.x1,
        y0: center - GENETICS_IMPORT_ROW_HALF_HEIGHT,
        y1: center + GENETICS_IMPORT_ROW_HALF_HEIGHT
      });
      stats[field.key] = grade;
    });
  });

  const bloodline = readGeneticsBloodlineGrade(context, width, height);
  const recognized = Object.values(stats).filter((grade) => grade !== "Unknown").length;

  return {
    stats,
    bloodline,
    recognized,
    confidence: (recognized + (bloodline === "Unknown" ? 0 : 1)) / (STAT_FIELDS.length + 1)
  };
}

function readGeneticsBloodlineGrade(context, width, height) {
  const region = ratioRegionToPixels(width, height, GENETICS_IMPORT_BLOODLINE_REGION);
  const components = yellowComponentsInRegion(context, region).filter((component) => component.area >= 10);
  if (!components.length) return "Unknown";

  const groups = groupComponentsByLine(components, height);
  const bloodlineGroup = groups
    .filter((group) => group.cy > height * 0.88)
    .sort((a, b) => b.area - a.area)[0] || groups.sort((a, b) => b.cy - a.cy)[0];

  return readGeneticsGradeFromComponents(context, bloodlineGroup?.components || components);
}

function readGeneticsGradeWindow(context, width, height, ratioRegion) {
  const region = ratioRegionToPixels(width, height, ratioRegion);
  const components = yellowComponentsInRegion(context, region).filter((component) => component.area >= 6);
  if (!components.length) return "Unknown";
  return readGeneticsGradeFromComponents(context, components);
}

function readGeneticsGradeFromComponents(context, components) {
  const usable = components
    .filter((component) => component.area >= 6 && component.width >= 2 && component.height >= 2)
    .sort((a, b) => b.area - a.area);
  if (!usable.length) return "Unknown";

  const main = usable.find((component) => component.height >= 12 && component.width >= 7) || usable[0];
  const letterMask = normalizedYellowMask(context, main);
  const letter = recognizeGeneticsLetterFromShape(main) || recognizeGeneticsLetter(letterMask);
  if (!letter) return "Unknown";

  const modifier = readGeneticsGradeModifier(main, usable);
  return normalizeGrade(`${letter}${modifier}`);
}

function recognizeGeneticsLetterFromShape(component) {
  const fill = component.area / Math.max(1, component.width * component.height);
  const widthRatio = component.width / Math.max(1, component.height);

  if (component.height < 12 || component.width < 7) return "";
  if (widthRatio >= 0.86 && fill <= 0.56) return "A";
  if (fill >= 0.64) return "B";
  if (fill <= 0.53) return "C";
  if (widthRatio <= 0.68) return "E";
  return "D";
}

function readGeneticsGradeModifier(main, components) {
  const gapAllowance = Math.max(2, Math.round(main.width * 0.08));
  const modifierComponents = components
    .filter((component) => component !== main && component.minX >= main.maxX - gapAllowance)
    .sort((a, b) => a.minX - b.minX);

  if (!modifierComponents.length) return "";

  const bbox = mergeComponentBounds(modifierComponents);
  const modifierHeight = bbox.maxY - bbox.minY + 1;
  const modifierWidth = bbox.maxX - bbox.minX + 1;
  const mainHeight = main.maxY - main.minY + 1;
  const plusLike = modifierComponents.filter((component) => {
    const height = component.maxY - component.minY + 1;
    const width = component.maxX - component.minX + 1;
    return height >= mainHeight * 0.34 && width >= mainHeight * 0.18;
  }).length;

  if (modifierHeight <= Math.max(5, mainHeight * 0.32)) return "-";
  if (plusLike >= 2 || modifierWidth >= mainHeight * 0.88) return "++";
  return "+";
}

function yellowComponentsInRegion(context, region) {
  const image = context.getImageData(region.x, region.y, region.width, region.height);
  const data = image.data;
  const visited = new Uint8Array(region.width * region.height);
  const components = [];

  for (let y = 0; y < region.height; y += 1) {
    for (let x = 0; x < region.width; x += 1) {
      const start = y * region.width + x;
      if (visited[start] || !isGeneticsGradeYellow(data, start)) continue;

      let minX = x;
      let maxX = x;
      let minY = y;
      let maxY = y;
      let area = 0;
      const stack = [start];
      visited[start] = 1;

      while (stack.length) {
        const index = stack.pop();
        const cx = index % region.width;
        const cy = Math.floor(index / region.width);
        area += 1;
        if (cx < minX) minX = cx;
        if (cx > maxX) maxX = cx;
        if (cy < minY) minY = cy;
        if (cy > maxY) maxY = cy;

        const neighbors = [
          cx > 0 ? index - 1 : -1,
          cx < region.width - 1 ? index + 1 : -1,
          cy > 0 ? index - region.width : -1,
          cy < region.height - 1 ? index + region.width : -1
        ];

        neighbors.forEach((neighbor) => {
          if (neighbor < 0 || visited[neighbor] || !isGeneticsGradeYellow(data, neighbor)) return;
          visited[neighbor] = 1;
          stack.push(neighbor);
        });
      }

      if (area >= 4) {
        components.push({
          minX: region.x + minX,
          maxX: region.x + maxX,
          minY: region.y + minY,
          maxY: region.y + maxY,
          width: maxX - minX + 1,
          height: maxY - minY + 1,
          area,
          cx: region.x + (minX + maxX) / 2,
          cy: region.y + (minY + maxY) / 2
        });
      }
    }
  }

  return components;
}

function groupComponentsByLine(components, imageHeight) {
  const groups = [];
  const rowTolerance = Math.max(16, imageHeight * 0.018);
  components
    .slice()
    .sort((a, b) => a.cy - b.cy)
    .forEach((component) => {
      const group = groups.find((candidate) => Math.abs(candidate.cy - component.cy) <= rowTolerance);
      if (!group) {
        groups.push({ components: [component], ...component });
        return;
      }

      group.components.push(component);
      const merged = mergeComponentBounds(group.components);
      Object.assign(group, merged);
    });
  return groups;
}

function mergeComponentBounds(components) {
  const minX = Math.min(...components.map((component) => component.minX));
  const maxX = Math.max(...components.map((component) => component.maxX));
  const minY = Math.min(...components.map((component) => component.minY));
  const maxY = Math.max(...components.map((component) => component.maxY));
  const area = components.reduce((sum, component) => sum + component.area, 0);
  return {
    minX,
    maxX,
    minY,
    maxY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
    area,
    cx: (minX + maxX) / 2,
    cy: (minY + maxY) / 2
  };
}

function normalizedYellowMask(context, component) {
  const pad = 1;
  const x = Math.max(0, component.minX - pad);
  const y = Math.max(0, component.minY - pad);
  const width = Math.max(1, Math.min(context.canvas.width - x, component.maxX - x + 1 + pad));
  const height = Math.max(1, Math.min(context.canvas.height - y, component.maxY - y + 1 + pad));
  const image = context.getImageData(x, y, width, height);
  return normalizeMask(image.data, width, height, { x: 0, y: 0, width, height }, (data, index) => isGeneticsGradeYellow(data, index));
}

function recognizeGeneticsLetter(sourceMask) {
  const templates = getGeneticsLetterTemplates();
  let best = { letter: "", score: -1 };

  templates.forEach((template) => {
    const score = maskSimilarity(sourceMask, template.mask);
    if (score > best.score) best = { letter: template.letter, score };
  });

  return best.score >= 0.08 ? best.letter : "";
}

function getGeneticsLetterTemplates() {
  if (geneticsLetterTemplates) return geneticsLetterTemplates;

  const fonts = [
    "900 86px Arial Black",
    "900 90px Arial",
    "900 92px Impact",
    "900 88px Trebuchet MS",
    "900 86px Segoe UI"
  ];
  const letters = ["A", "B", "C", "D", "E"];
  geneticsLetterTemplates = [];

  fonts.forEach((font) => {
    letters.forEach((letter) => {
      const canvas = document.createElement("canvas");
      canvas.width = 120;
      canvas.height = 120;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = "#ffffff";
      context.font = font;
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(letter, canvas.width / 2, canvas.height / 2 + 5);
      const image = context.getImageData(0, 0, canvas.width, canvas.height);
      const bounds = findMaskBounds(image.data, canvas.width, canvas.height, (data, index) => data[index * 4 + 3] > 24);
      if (!bounds) return;
      geneticsLetterTemplates.push({
        letter,
        mask: normalizeMask(image.data, canvas.width, canvas.height, bounds, (data, index) => data[index * 4 + 3] > 24)
      });
    });
  });

  return geneticsLetterTemplates;
}

function normalizeMask(data, sourceWidth, sourceHeight, bounds, predicate) {
  const mask = new Uint8Array(GENETICS_TEMPLATE_WIDTH * GENETICS_TEMPLATE_HEIGHT);
  for (let y = 0; y < GENETICS_TEMPLATE_HEIGHT; y += 1) {
    for (let x = 0; x < GENETICS_TEMPLATE_WIDTH; x += 1) {
      const sx = Math.min(bounds.x + bounds.width - 1, bounds.x + Math.floor((x + 0.5) * bounds.width / GENETICS_TEMPLATE_WIDTH));
      const sy = Math.min(bounds.y + bounds.height - 1, bounds.y + Math.floor((y + 0.5) * bounds.height / GENETICS_TEMPLATE_HEIGHT));
      if (sx < 0 || sx >= sourceWidth || sy < 0 || sy >= sourceHeight) continue;
      const sourceIndex = sy * sourceWidth + sx;
      mask[y * GENETICS_TEMPLATE_WIDTH + x] = predicate(data, sourceIndex) ? 1 : 0;
    }
  }
  return mask;
}

function findMaskBounds(data, width, height, predicate) {
  let minX = width;
  let maxX = -1;
  let minY = height;
  let maxY = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x;
      if (!predicate(data, index)) continue;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }

  if (maxX < minX || maxY < minY) return null;
  return { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

function maskSimilarity(a, b) {
  let intersection = 0;
  let union = 0;
  for (let index = 0; index < a.length; index += 1) {
    const av = a[index] > 0;
    const bv = b[index] > 0;
    if (av && bv) intersection += 1;
    if (av || bv) union += 1;
  }
  return union ? intersection / union : 0;
}

function isGeneticsGradeYellow(data, index) {
  const offset = index * 4;
  const red = data[offset];
  const green = data[offset + 1];
  const blue = data[offset + 2];
  const alpha = data[offset + 3];
  return alpha > 60
    && red > 135
    && green > 90
    && blue < 175
    && red >= green * 0.82
    && red + green > blue * 2.35;
}

function ratioRegionToPixels(width, height, region) {
  const x = Math.max(0, Math.floor(width * region.x0));
  const y = Math.max(0, Math.floor(height * region.y0));
  const x2 = Math.min(width, Math.ceil(width * region.x1));
  const y2 = Math.min(height, Math.ceil(height * region.y1));
  return {
    x,
    y,
    width: Math.max(1, x2 - x),
    height: Math.max(1, y2 - y)
  };
}

function applyGeneticsPngImport(result, file) {
  openDragonDialog();

  setFormValue("dragonAccountId", "");
  setFormValue("dragonUsername", "PNG Import");
  setFormValue("dragonAccountName", filenameAccountName(file.name));
  setFormValue("dragonStatus", "Grown");
  setFormValue("dragonBloodline", result.bloodline);
  setFormValue("dragonElderProgress", "");
  setFormValue("dragonTags", "png-import");
  setFormValue("dragonNotes", `Imported from ${file.name}. PNG import reads stat letters and bloodline quality from the Genetics screen; review species, sex, skin, recessive skin, lineage, and Social points before saving.`);

  STAT_FIELDS.forEach((field) => {
    setFormValue(`stat-${field.key}`, result.stats[field.key] || "Unknown");
  });

  syncDragonComputedFields();
  syncAllAPlusIndicator();
  const recognized = Object.values(result.stats).filter((grade) => grade !== "Unknown").length;
  const bloodlineText = result.bloodline === "Unknown" ? "bloodline not found" : `bloodline ${result.bloodline}`;
  setGeneticsImportStatus(`PNG import filled ${recognized}/${STAT_FIELDS.length} stats and ${bloodlineText}. Review the dragon details before saving.`);
  showToast("Genetics PNG imported");
}

function filenameAccountName(filename) {
  return String(filename || "Imported genetics")
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80) || "Imported genetics";
}

function setGeneticsImportStatus(message) {
  if (!els.geneticsImportStatus) return;
  els.geneticsImportStatus.textContent = message;
  els.geneticsImportStatus.hidden = false;
}

function clearGeneticsImportStatus() {
  if (!els.geneticsImportStatus) return;
  els.geneticsImportStatus.textContent = "";
  els.geneticsImportStatus.hidden = true;
}

function clearDragons() {
  if (!confirm("Clear all dragon records? Skin records will stay.")) return;
  state.dragons = [];
  state.broodPouch = [];
  saveState();
  renderAll();
  showToast("Dragon records cleared");
}

function factoryReset() {
  if (!confirm("Factory reset the tracker? This clears dragons, skins, and custom species.")) return;
  state = createDefaultState();
  saveState();
  renderAll();
  showToast("Tracker reset");
}

function downloadBlob(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function startupTab() {
  const hash = window.location.hash.replace("#", "").trim();
  if (hash === "accounts") return "players";
  if (hash === "nesting") {
    currentBreedingView = "planner";
    return "breeding";
  }
  if (hash === "brood-pouch") {
    currentBreedingView = "brood-pouch";
    return "breeding";
  }
  if (hash === "upstats") {
    currentDragonView = "upstats";
    return "dragons";
  }
  if (hash === "dragons") {
    currentDragonView = "collection";
    return "dragons";
  }
  if (hash === "backup") {
    currentSettingsView = "backup";
    return "settings";
  }
  if (hash === "sync") {
    currentSettingsView = "sync";
    return "settings";
  }
  if (hash === "diagnostics") {
    currentSettingsView = "diagnostics";
    return "settings";
  }
  if (hash === "settings") {
    currentSettingsView = "general";
    return "settings";
  }
  return TAB_NAMES.includes(hash) ? hash : DEFAULT_TAB;
}

function tabHash(tabName) {
  if (tabName === "dragons") return currentDragonView === "upstats" ? "upstats" : "dragons";
  if (tabName === "breeding") return currentBreedingView === "brood-pouch" ? "brood-pouch" : "nesting";
  if (tabName === "settings") {
    if (currentSettingsView === "backup") return "backup";
    if (currentSettingsView === "sync") return "sync";
    if (currentSettingsView === "diagnostics") return "diagnostics";
  }
  return tabName;
}

function syncWorkspaceView(kind, value) {
  const viewKey = `${kind}View`;
  const panelKey = `${kind}ViewPanel`;
  document.querySelectorAll(`[data-${kind}-view]`).forEach((button) => {
    const active = button.dataset[viewKey] === value;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-selected", active ? "true" : "false");
  });
  document.querySelectorAll(`[data-${kind}-view-panel]`).forEach((panel) => {
    const active = panel.dataset[panelKey] === value;
    panel.classList.toggle("is-active", active);
    panel.hidden = !active;
  });
}

function setDragonView(view, options = {}) {
  currentDragonView = view === "upstats" ? "upstats" : "collection";
  syncWorkspaceView("dragon", currentDragonView);
  if (currentTab !== "dragons") {
    setTab("dragons", { ...options, preserveView: true });
    return;
  }
  if (options.updateHash && window.location.hash !== `#${tabHash("dragons")}`) window.location.hash = tabHash("dragons");
  renderDragons();
  renderUpstats();
}

function setBreedingView(view, options = {}) {
  currentBreedingView = view === "brood-pouch" ? "brood-pouch" : "planner";
  syncWorkspaceView("breeding", currentBreedingView);
  if (currentTab !== "breeding") {
    setTab("breeding", { ...options, preserveView: true });
    return;
  }
  if (options.updateHash && window.location.hash !== `#${tabHash("breeding")}`) window.location.hash = tabHash("breeding");
  renderNestingOptions();
  renderNesting();
  renderBroodPouch();
}

function setSettingsView(view, options = {}) {
  currentSettingsView = ["backup", "sync", "diagnostics"].includes(view) ? view : "general";
  syncWorkspaceView("settings", currentSettingsView);
  if (currentTab !== "settings") {
    setTab("settings", { ...options, preserveView: true });
    return;
  }
  if (options.updateHash && window.location.hash !== `#${tabHash("settings")}`) window.location.hash = tabHash("settings");
  renderBackup();
}

function setTab(tabName, options = {}) {
  const nextTab = TAB_NAMES.includes(tabName) ? tabName : DEFAULT_TAB;
  if (currentTab === "map" && nextTab !== "map") cancelMapPinPlacement();
  if (!options.preserveView) {
    if (nextTab === "dragons") currentDragonView = "collection";
    if (nextTab === "breeding") currentBreedingView = "planner";
    if (nextTab === "settings") currentSettingsView = "general";
  }
  currentTab = nextTab;
  const nextHash = tabHash(nextTab);
  if (options.updateHash && window.location.hash !== `#${nextHash}`) {
    window.location.hash = nextHash;
  } else if (options.replaceHash && window.location.hash && window.location.hash !== `#${nextHash}`) {
    history.replaceState(null, "", `#${nextHash}`);
  }
  els.tabs.forEach((tab) => tab.classList.toggle("is-active", tab.dataset.tab === nextTab));
  els.panels.forEach((panel) => panel.classList.toggle("is-active", panel.dataset.panel === nextTab));
  syncWorkspaceView("dragon", currentDragonView);
  syncWorkspaceView("breeding", currentBreedingView);
  syncWorkspaceView("settings", currentSettingsView);
  renderCurrentTab();
  if (nextTab === "clans") void refreshClanSync({ quiet: true });
  if (nextTab === "settings") renderBackup();
}

function fillSelect(select, values) {
  if (!select) return;
  select.innerHTML = values.map((value) => `<option value="${escapeAttr(value)}">${escapeHtml(value)}</option>`).join("");
}

function upsertSpecies(name) {
  const clean = canonicalSpeciesName(name);
  if (!clean || clean === "All") return;
  if (!state.settings.species.some((species) => species.name === clean)) {
    state.settings.species.push({ name: clean, className: "", element: "", diet: "" });
  }
}

function upsertAccountRecord(values) {
  if (!state.accounts) state.accounts = [];
  const now = new Date().toISOString();
  const hasDlcData = Object.prototype.hasOwnProperty.call(values || {}, "dlc");
  const incoming = normalizeAccount({
    ...values,
    username: values?.preserveUsername ? values?.username : resolvePlayerName(values?.username),
    updatedAt: now
  });
  const existing = accountById(incoming.id)
    || state.accounts.find((account) => accountIdentityKey(account.username, account.accountName) === accountIdentityKey(incoming.username, incoming.accountName));

  if (existing) {
    const previous = { ...existing };
    existing.username = incoming.username;
    existing.accountName = incoming.accountName;
    existing.discord = incoming.discord || existing.discord || "";
    existing.steam = incoming.steam || existing.steam || "";
    existing.dlc = hasDlcData ? normalizeDlc(incoming.dlc) : normalizeDlc(existing.dlc);
    existing.clanImported = Boolean(existing.clanImported && incoming.clanImported);
    existing.updatedAt = now;
    updateDragonsForAccount(existing, previous);
    return existing;
  }

  state.accounts.push(incoming);
  state.accounts.sort((a, b) => sortText(a.username, b.username) || sortText(a.accountName, b.accountName));
  return incoming;
}

function updateDragonsForAccount(account, previous = account) {
  state.dragons.forEach((dragon) => {
    const matchesId = dragon.accountId && dragon.accountId === account.id;
    const matchesPreviousIdentity = accountIdentityKey(dragon.username || "Unknown Player", dragon.accountName || dragon.name)
      === accountIdentityKey(previous.username, previous.accountName);
    if (!matchesId && !matchesPreviousIdentity) return;
    dragon.accountId = account.id;
    dragon.username = account.username;
    dragon.accountName = account.accountName;
    dragon.name = account.accountName;
    dragon.updatedAt = new Date().toISOString();
  });
}

function accountById(id) {
  const accountId = text(id);
  return state.accounts.find((account) => text(account.id) === accountId);
}

function dragonsForAccount(accountId) {
  const id = text(accountId);
  return state.dragons.filter((dragon) => text(dragon.accountId) === id);
}

function resolveDragonFormAccount(options = {}) {
  const preferHiddenId = options.preferHiddenId !== false;
  const accountId = text(document.querySelector("#dragonAccountId")?.value);
  const hiddenAccount = accountId ? accountById(accountId) : null;
  if (preferHiddenId && hiddenAccount) return hiddenAccount;

  const username = activeDragonPlayerName();
  const accountName = text(document.querySelector("#dragonAccountName")?.value);
  const typedAccount = username && accountName
    ? state.accounts.find((account) => accountIdentityKey(account.username, account.accountName) === accountIdentityKey(username, accountName))
    : null;

  return typedAccount || (preferHiddenId ? hiddenAccount : null);
}

function duplicateDragonForAccount(accountId, species, excludingDragonId = "") {
  const canonicalSpecies = canonicalSpeciesName(species);
  if (!accountId || !canonicalSpecies) return null;
  return state.dragons.find((dragon) =>
    dragon.id !== excludingDragonId
    && dragon.accountId === accountId
    && dragon.species === canonicalSpecies
  ) || null;
}

function accountIdentityKey(username, accountName) {
  return `${text(username).toLowerCase()}::${text(accountName).toLowerCase()}`;
}

function dragonAccountLabel(dragon) {
  if (!dragon) return "Unknown";
  return compactJoin([dragon.username || "Unknown Player", dragon.accountName || dragon.name]);
}

function dragonOptionLabel(dragon) {
  return `${dragonAccountLabel(dragon)} - ${dragon.species || "Unknown species"} - ${dragon.sex || "Unknown sex"}`;
}

function newerTimestamp(a, b) {
  const aTime = new Date(a || 0).getTime();
  const bTime = new Date(b || 0).getTime();
  return bTime > aTime ? b : a;
}

function dragonById(id) {
  return state.dragons.find((dragon) => dragon.id === id);
}

function skinById(id) {
  return state.skins.find((skin) => skin.id === id);
}

function dragonName(id) {
  return dragonById(id)?.name || "";
}

function dragonParentLabel(dragon) {
  if (!dragon) return "Unknown";
  const mother = dragon.motherId ? dragonName(dragon.motherId) : dragon.motherName;
  const father = dragon.fatherId ? dragonName(dragon.fatherId) : dragon.fatherName;
  return [mother, father].filter(Boolean).join(" / ") || "Unknown";
}

function statusClass(status) {
  return `status-${String(status || "unknown").toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

function isElderDragon(dragon) {
  return dragon?.status === "Elder";
}

function elderProgressValue(dragon) {
  if (!dragon || !ADULT_OR_HIGHER_STATUSES.has(dragon.status)) return "";
  if (dragon.status === "Elder") return 100;
  const number = Number(dragon.elderProgress);
  return Number.isFinite(number) ? clampPercent(number) : 0;
}

function elderCrystalForDragon(dragon) {
  const progress = elderProgressValue(dragon);
  if (progress === "") return null;
  return ELDER_CRYSTAL_STAGES.find((stage) => progress <= stage.max) || ELDER_CRYSTAL_STAGES.at(-1);
}

function elderCrystalClassNames(dragon) {
  const crystal = elderCrystalForDragon(dragon);
  return crystal ? ` has-elder-crystal crystal-${crystal.key}` : "";
}

function elderCrystalTitle(dragon) {
  const crystal = elderCrystalForDragon(dragon);
  return crystal ? `${crystal.label} daytime elder crystal` : "";
}

function renderElderCrystalBadge(dragon) {
  const crystal = elderCrystalForDragon(dragon);
  if (!crystal) return "";
  const title = `${crystal.label} daytime elder crystal. White crystals work at every elder percentage.`;
  return `<span class="elder-crystal-badge crystal-${crystal.key}" title="${escapeAttr(title)}"><span class="elder-crystal-gem" aria-hidden="true"></span><span>${escapeHtml(crystal.label)}</span></span>`;
}

function compactJoin(values) {
  return values.filter(Boolean).join(" / ") || "Unknown";
}

function formatPercent(value) {
  if (value === "" || value === null || value === undefined) return "Unknown";
  return `${Number(value).toFixed(Number(value) % 1 === 0 ? 0 : 1)}%`;
}

function formatChance(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "Unknown";
  if (number > 0 && number < 0.1) return `${number.toFixed(2)}%`;
  return `${number.toFixed(number % 1 === 0 ? 0 : 1)}%`;
}

function formatSocialPoints(value) {
  const points = socialPointsValue(value);
  return points >= SOCIAL_POINTS_MAX ? `${points} (full Social)` : String(points);
}

function formatTrackPoints(points, fourthName, hasFourthPoint) {
  const base = clampInteger(points, 0, 3);
  return hasFourthPoint ? `${base} + ${fourthName}` : String(base);
}

function formatDlcList(dlc = {}) {
  const normalized = normalizeDlc(dlc);
  const owned = DLC_OPTIONS
    .filter((option) => normalized[option.key])
    .map((option) => option.label);
  return owned.length ? owned.join(", ") : "None";
}

function formatCssPercent(value) {
  return `${Number(value).toFixed(3)}%`;
}

function clampPercent(value) {
  if (value === "" || value === null || value === undefined || Number.isNaN(Number(value))) return 0;
  return Math.max(0, Math.min(100, Number(value)));
}

function normalizeGrowthValue(status, value) {
  if (ADULT_OR_HIGHER_STATUSES.has(status)) return 100;
  if (value === "" || value === null || value === undefined) return "";
  const number = Number(value);
  if (!Number.isFinite(number)) return "";
  return Math.max(0, Math.min(100, number));
}

function normalizeElderProgress(status, value) {
  if (status === "Elder") return 100;
  if (!ADULT_OR_HIGHER_STATUSES.has(status)) return "";
  if (status === "4th Pointed" && (value === "" || value === null || value === undefined)) return FOURTH_POINT_ELDER_THRESHOLD;
  if (value === "" || value === null || value === undefined) return "";
  const number = Number(value);
  if (!Number.isFinite(number)) return "";
  if (status === "4th Pointed") return Math.max(FOURTH_POINT_ELDER_THRESHOLD, Math.min(99.9, number));
  return Math.max(0, Math.min(99.9, number));
}

function estimateMutationPoints(status, growth, elderProgress) {
  return MUTATION_POINTS_BY_STATUS[normalizeStatusForProgress(status, elderProgress)] || 1;
}

function numericValue(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : -1;
}

function numberOrBlank(value) {
  if (value === "" || value === null || value === undefined) return "";
  const number = Number(value);
  return Number.isFinite(number) ? number : "";
}

function shouldLockSocialPoints(status, nestRole) {
  const role = normalizeNestRole(nestRole);
  return SOCIAL_LOCK_NEST_ROLES.has(role) || SOCIAL_ZERO_NEST_ROLES.has(role);
}

function normalizeMutationAllocation(values) {
  const status = values.status || "Hatchie";
  const nestRole = normalizeNestRole(values.nestRole);
  const total = Math.max(1, Number(values.mutationPoints) || estimateMutationPoints(status, "", values.elderProgress));
  let used = 0;

  const socialMax = Math.min(SOCIAL_POINTS_MAX, total);
  const socialPoints = SOCIAL_ZERO_NEST_ROLES.has(nestRole)
    ? 0
    : SOCIAL_LOCK_NEST_ROLES.has(nestRole)
      ? socialMax
      : clampInteger(values.socialPoints, 0, Math.min(socialMax, total - used));
  used += socialPoints;

  const dominantMutation = Boolean(values.dominantMutation) && canUseDominantMutation(status) && used < total;
  if (dominantMutation) used += 1;

  const agilePoints = clampInteger(values.agilePoints, 0, Math.min(AGILE_POINTS_MAX, total - used));
  used += agilePoints;

  const fastMutation = Boolean(values.fastMutation) && agilePoints >= AGILE_POINTS_MAX && used < total;
  if (fastMutation) used += 1;

  const scavengerPoints = clampInteger(values.scavengerPoints, 0, Math.min(SCAVENGER_POINTS_MAX, total - used));
  used += scavengerPoints;

  const survivorMutation = Boolean(values.survivorMutation) && scavengerPoints >= SCAVENGER_POINTS_MAX && used < total;
  if (survivorMutation) used += 1;

  return {
    socialPoints,
    dominantMutation,
    agilePoints,
    fastMutation,
    scavengerPoints,
    survivorMutation,
    remainingMutationPoints: Math.max(0, total - used)
  };
}

function socialPointsValue(value, max = SOCIAL_POINTS_MAX) {
  if (value === "" || value === null || value === undefined) return 0;
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(max, Math.round(number)));
}

function clampInteger(value, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return min;
  return Math.max(min, Math.min(max, Math.round(number)));
}

function canUseTrackFourthPoint(trackPoints, usedBefore, total) {
  return Number(trackPoints) >= 3 && Number(usedBefore) + Number(trackPoints) < Number(total);
}

function syncPointInput(input, value, max) {
  if (!input) return;
  input.max = max;
  input.value = value;
}

function syncPointCheckbox(input, checked, enabled, disabledTitle) {
  if (!input) return;
  input.checked = Boolean(checked);
  input.disabled = !enabled;
  input.title = enabled ? "" : disabledTitle;
}

function text(value) {
  return String(value ?? "").trim();
}

function canonicalSpeciesName(value) {
  const clean = text(value);
  if (!clean || clean === "All") return clean;
  return SPECIES_ALIASES.get(clean.toLowerCase()) || clean;
}

function canonicalSkinName(value) {
  return text(value).toLowerCase().replace(/\s+/g, " ");
}

function splitTags(value) {
  return String(value ?? "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function validOption(value, options, fallback) {
  const clean = text(value);
  return options.includes(clean) ? clean : fallback;
}

function normalizeNestRole(value) {
  const clean = text(value);
  if (!clean) return "Unknown";
  if (NEST_ROLES.includes(clean)) return clean;
  return NEST_ROLE_ALIASES.get(clean.toLowerCase()) || "Unknown";
}

function normalizeUpstatStatus(value) {
  const clean = text(value);
  if (UPSTAT_STATUSES.includes(clean)) return clean;
  const lower = clean.toLowerCase();
  if (lower.includes("18") || lower.includes("complete")) return "18A+ Complete";
  if (lower.includes("near")) return "Near 18A+";
  if (lower.includes("partial")) return "Partial A+";
  if (lower.includes("progress") || lower.includes("started")) return "In Progress";
  return "Not Started";
}

function normalizeGrade(value) {
  const clean = text(value);
  if (!clean) return "Unknown";
  if (GRADES.includes(clean)) return clean;
  return GRADE_ALIASES.get(clean.toLowerCase()) || "Unknown";
}

function normalizeBloodlineGrade(value) {
  const clean = normalizeGrade(value);
  if (clean === "Unknown") return "Unknown";
  if (gradeScore(clean) > gradeScore("A")) return "A";
  const flat = clean.replace(/[+-]+/g, "");
  if (BLOODLINE_GRADES.includes(flat)) return flat;
  return "Unknown";
}

function normalizeDragonStatus(dragon) {
  const status = text(dragon.status);
  if (STATUSES.includes(status)) return status;

  const statusAlias = STATUS_ALIASES.get(status.toLowerCase());
  if (statusAlias) return statusAlias;

  const stageAlias = STATUS_ALIASES.get(text(dragon.stage).toLowerCase());
  return stageAlias || "Hatchie";
}

function normalizeStatusForProgress(status, elderProgress) {
  const normalizedStatus = STATUSES.includes(status) ? status : "Hatchie";
  if (normalizedStatus === "Elder" || normalizedStatus === "4th Pointed") return normalizedStatus;
  if (normalizedStatus !== "Grown") return normalizedStatus;

  const number = Number(elderProgress);
  return Number.isFinite(number) && number >= FOURTH_POINT_ELDER_THRESHOLD ? "4th Pointed" : "Grown";
}

function canUseDominantMutation(status) {
  return status === "4th Pointed" || status === "Elder";
}

function normalizeDominantMutationStatus(status, dominantMutation) {
  if (!dominantMutation || canUseDominantMutation(status)) return status;
  return "4th Pointed";
}

function setFormValue(id, value) {
  const input = document.querySelector(`#${id}`);
  if (input) input.value = value ?? "";
}

function setChecked(id, value) {
  const input = document.querySelector(`#${id}`);
  if (input) input.checked = Boolean(value);
}

function showModal(dialog) {
  if (dialog.showModal) dialog.showModal();
  else dialog.setAttribute("open", "");
}

function closeModal(id) {
  const dialog = document.querySelector(`#${id}`);
  if (!dialog) return;
  if (id === "mapPinDialog" || id === "mapImportDialog") cancelMapPinPlacement();
  if (id === "skinTurntableDialog" && els.skinTurntableVideo) {
    els.skinTurntableVideo.pause();
    els.skinTurntableVideo.removeAttribute("src");
    els.skinTurntableVideo.load();
  }
  if (dialog.close) dialog.close();
  else dialog.removeAttribute("open");
}

function confirmClanShare({ title, description }) {
  if (state.settings.skipClanShareConfirmation) return Promise.resolve(true);
  if (!els.clanShareDialog) return Promise.resolve(confirm(description));
  els.clanShareDialogTitle.textContent = title;
  els.clanShareDialogDescription.textContent = description;
  return new Promise((resolve) => {
    clanShareConfirmationResolve = resolve;
    showModal(els.clanShareDialog);
  });
}

function handleClanShareConfirmation(event) {
  const button = event.target.closest("[data-clan-share-confirm]");
  if (!button) return;
  const action = button.dataset.clanShareConfirm;
  settleClanShareConfirmation(action !== "cancel", action === "share-skip");
}

function settleClanShareConfirmation(approved, skipFuture = false, closeDialog = true) {
  const resolve = clanShareConfirmationResolve;
  clanShareConfirmationResolve = null;
  if (skipFuture) {
    state.settings.skipClanShareConfirmation = true;
    saveState();
  }
  if (closeDialog) closeModal("clanShareDialog");
  resolve?.(approved);
}

function showToast(message) {
  clearTimeout(toastTimer);
  els.toast.textContent = message;
  els.toast.classList.add("is-visible");
  toastTimer = setTimeout(() => els.toast.classList.remove("is-visible"), 2600);
}

function csvCell(value) {
  const cell = String(value ?? "");
  return `"${cell.replace(/"/g, '""')}"`;
}

function dateStamp() {
  return new Date().toISOString().slice(0, 10);
}

function formatDateTime(value) {
  if (!value) return "Never";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleString();
}

function toLocalDateTimeInputValue(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function dateTimeLocalToIso(value) {
  const raw = text(value);
  if (!raw) return "";
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

function formatCountdownUntil(value) {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return "Unknown";
  const remaining = timestamp - Date.now();
  if (remaining <= 0) return `Due now (${formatDateTime(value)})`;
  return `${formatElderTickCountdown(remaining)} (${formatDateTime(value)})`;
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function sortText(a, b) {
  return String(a || "").localeCompare(String(b || ""), undefined, { sensitivity: "base" });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, "&#096;");
}

function uid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
