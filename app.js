const STORAGE_KEY = "day-of-dragons-tracker.v1";
const AUTO_SYNC_INTERVAL_MS = 30_000;
const APP_VERSION = new URLSearchParams(window.location.search).get("appVersion") || "1.0.9";

const DEFAULT_SPECIES = [
  { name: "Flame Stalker", className: "5", element: "Fire", diet: "Carnivore" },
  { name: "Shadow Scale", className: "4", element: "Plasma", diet: "Carnivore" },
  { name: "Acid Spitter", className: "", element: "Acid", diet: "Carnivore" },
  { name: "Inferno Ravager", className: "", element: "Fire", diet: "Carnivore" },
  { name: "Bio", className: "2", element: "Bioluminescence", diet: "Nectarivore" },
  { name: "Blitz Striker", className: "", element: "Lightning", diet: "Carnivore" },
  { name: "Brood Watcher", className: "6", element: "None", diet: "Herbivore" }
];

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
const SOCIAL_LOCK_NEST_ROLES = new Set(["Breeder", "Pure", "Ultra Pure"]);
const SOCIAL_POINTS_MAX = 3;
const AGILE_POINTS_MAX = 3;
const SCAVENGER_POINTS_MAX = 3;
const NEST_ROLES = ["Unknown", "Breeder", "Pure", "Ultra Pure"];
const NEST_ROLE_ALIASES = new Map([
  ["ultra", "Ultra Pure"],
  ["ultra pure", "Ultra Pure"]
]);
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
const DEFAULT_TAB = "skins";
const TAB_NAMES = ["dragons", "players", "nesting", "skins", "upstats", "map", "clans", "settings"];
const ACTIVE_CLAN_STORAGE_KEY = "dragon-tracker.active-clan.v1";
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
  albinoChance: 0.05,
  piebaldChance: 0.05
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
  ["Shadow Scale::twilight", "shadow-scale/twilight.mp4"],
  ["Brood Watcher::bone breaker", "brood-watcher/bone-breaker.mp4"],
  ["Brood Watcher::brindle", "brood-watcher/brindle.mp4"],
  ["Brood Watcher::broken", "brood-watcher/broken.mp4"],
  ["Brood Watcher::fractured", "brood-watcher/fractured.mp4"],
  ["Brood Watcher::leucistic", "brood-watcher/leucistic.mp4"],
  ["Brood Watcher::melanistic", "brood-watcher/melanistic.mp4"],
  ["Brood Watcher::severed", "brood-watcher/severed.mp4"]
]);
const SPECIES_ALIASES = new Map([
  ["shadow scale", "Shadow Scale"],
  ["shadow stalker", "Shadow Scale"],
  ["bioluminescent dragon", "Bio"],
  ["biolumen", "Bio"],
  ["biolumin", "Bio"],
  ["bio", "Bio"]
]);

const SHARED_DISCORD_SKINS = [
  ["Crimson", "Exotic", "Patreon LT15 spawnable"],
  ["Golden", "Exotic", "Patreon LT200 spawnable"],
  ["Melanistic", "Exotic", "Unlocked after growing a nested dragon"],
  ["Leumelan", "Exotic", "Kickstarter spawnable"],
  ["Leucistic", "Exotic", "Kickstarter spawnable"],
  ["Albino", "Mutation", "A 0.05% mutation chance from breeding any two skins together", "", "", "Discord lists a 0.05% mutation chance."],
  ["Piebald", "Mutation", "A 0.05% mutation chance when one parent's primary skin is Exotic and the other parent's primary skin is non-Exotic", "Exotic primary", "Non-Exotic primary", "Discord lists a 0.05% mutation chance."],
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
let toastTimer = null;
let autoSyncTimer = null;
let lastKnownStateText = "";
let mapPinPlacementActive = false;
let clanShareConfirmationResolve = null;
const clanSync = window.DragonTrackerSyncClient ? new window.DragonTrackerSyncClient() : null;
const clanUi = {
  activeClanId: localStorage.getItem(ACTIVE_CLAN_STORAGE_KEY) || "",
  busy: false,
  error: "",
  inviteCode: "",
  identityLinks: [],
  lastSignature: "",
  libraryFilters: { dragon: "", skin: "", recessive: "", sex: "" },
  members: [],
  memberships: [],
  sharedDragons: [],
  sharedPins: [],
  user: null
};

const els = {
  tabs: document.querySelectorAll(".tab"),
  panels: document.querySelectorAll(".tab-panel"),
  dragonSearch: document.querySelector("#dragonSearch"),
  speciesFilter: document.querySelector("#speciesFilter"),
  statusFilter: document.querySelector("#statusFilter"),
  sortBy: document.querySelector("#sortBy"),
  hideInactive: document.querySelector("#hideInactive"),
  statsBar: document.querySelector("#statsBar"),
  dragonList: document.querySelector("#dragonList"),
  addDragonBtn: document.querySelector("#addDragonBtn"),
  accountSearch: document.querySelector("#accountSearch"),
  accountList: document.querySelector("#accountList"),
  addAccountBtn: document.querySelector("#addAccountBtn"),
  accountDialog: document.querySelector("#accountDialog"),
  accountForm: document.querySelector("#accountForm"),
  accountDialogTitle: document.querySelector("#accountDialogTitle"),
  accountDetailDialog: document.querySelector("#accountDetailDialog"),
  accountDetailTitle: document.querySelector("#accountDetailTitle"),
  accountDetailContent: document.querySelector("#accountDetailContent"),
  dragonDialog: document.querySelector("#dragonDialog"),
  dragonForm: document.querySelector("#dragonForm"),
  dragonDialogTitle: document.querySelector("#dragonDialogTitle"),
  statEditor: document.querySelector("#statEditor"),
  parentOne: document.querySelector("#parentOne"),
  parentTwo: document.querySelector("#parentTwo"),
  createEggBtn: document.querySelector("#createEggBtn"),
  broodWatcherBrooding: document.querySelector("#broodWatcherBrooding"),
  nestingOutput: document.querySelector("#nestingOutput"),
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
  addMapPinBtn: document.querySelector("#addMapPinBtn"),
  mapStage: document.querySelector("#mapStage"),
  mapAreaLayer: document.querySelector("#mapAreaLayer"),
  mapPinLayer: document.querySelector("#mapPinLayer"),
  mapPinList: document.querySelector("#mapPinList"),
  mapPinCount: document.querySelector("#mapPinCount"),
  mapAreaSelect: document.querySelector("#mapAreaSelect"),
  mapReferenceGallery: document.querySelector("#mapReferenceGallery"),
  mapReferenceCount: document.querySelector("#mapReferenceCount"),
  mapReferenceSummary: document.querySelector("#mapReferenceSummary"),
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
  backupStats: document.querySelector("#backupStats"),
  appVersionLabel: document.querySelector("#appVersionLabel"),
  importFile: document.querySelector("#importFile"),
  geneticsImageFile: document.querySelector("#geneticsImageFile"),
  geneticsImportStatus: document.querySelector("#geneticsImportStatus"),
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
  if (refreshAllDerivedRecords()) saveState();
  lastKnownStateText = localStorage.getItem(STORAGE_KEY) || "";
  renderAppVersion();
  buildStaticSelects();
  bindEvents();
  startAutoSync();
  renderAll();
  setTab(startupTab(), { replaceHash: true });
  bindDesktopAuthCallbacks();
  bindBrowserAuthCallback();
  void refreshClanSync({ quiet: true });
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
    skins: STARTER_SKINS.map((skin) => ({
      id: uid("skin"),
      createdAt: now,
      updatedAt: now,
      ...skin
    })),
    settings: {
      species: DEFAULT_SPECIES,
      statFields: STAT_FIELDS,
      skipClanShareConfirmation: false
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

  return {
    version: 1,
    createdAt: input.createdAt || base.createdAt,
    updatedAt: input.updatedAt || new Date().toISOString(),
    dragons,
    accounts,
    upstats,
    lineageRecords,
    mapPins,
    skins,
    settings: {
      species: mergeSpecies(input.settings?.species || []),
      statFields: STAT_FIELDS,
      skipClanShareConfirmation: Boolean(input.settings?.skipClanShareConfirmation)
    }
  };
}

function normalizeAccount(account) {
  const now = new Date().toISOString();
  const username = text(account.username || account.userName || account.user || account.player);
  const accountName = text(account.accountName || account.account || account.name);
  return {
    id: account.id || uid("account"),
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

  remapDragonParentIds(dragons, dragonIdMap);
  attachAccountsToDragons(dragons, accounts);

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
    settings: {
      species: mergeSpecies([...(current.settings?.species || []), ...(incoming.settings?.species || [])]),
      statFields: STAT_FIELDS
    }
  });
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
      owned: saved.owned || starter.owned
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

function saveState() {
  state.updatedAt = new Date().toISOString();
  lastKnownStateText = JSON.stringify(state);
  localStorage.setItem(STORAGE_KEY, lastKnownStateText);
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
    if (!document.hidden) syncStateFromStorage();
  });
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
  els.tabs.forEach((tab) => tab.addEventListener("click", () => setTab(tab.dataset.tab, { updateHash: true })));
  window.addEventListener("hashchange", () => setTab(startupTab(), { replaceHash: false }));
  els.addDragonBtn.addEventListener("click", () => openDragonDialog());
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

  ["dragonStatus", "dragonNestRole", "dragonElderProgress", "dragonSocialPoints", "dragonDominantMutation", "dragonAgilePoints", "dragonFastMutation", "dragonScavengerPoints", "dragonSurvivorMutation"].forEach((id) => {
    const control = document.querySelector(`#${id}`);
    control?.addEventListener("input", syncDragonComputedFields);
    control?.addEventListener("change", syncDragonComputedFields);
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

  els.createEggBtn.addEventListener("click", createEggFromPlanner);

  [els.skinSearch, els.skinSpeciesFilter, els.skinTypeFilter, els.mutatedSkinsOnly].forEach((control) => {
    control.addEventListener("input", renderSkins);
    control.addEventListener("change", renderSkins);
  });

  [els.upstatSearch, els.upstatSpeciesFilter, els.upstatStatusFilter].forEach((control) => {
    control?.addEventListener("input", renderUpstats);
    control?.addEventListener("change", renderUpstats);
  });

  document.querySelector("#upstatSpecies")?.addEventListener("change", () => renderUpstatSkinSelect(document.querySelector("#upstatSpecies")?.value || ""));
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
  els.addMapPinBtn?.addEventListener("click", startMapPinPlacement);
  els.mapStage?.addEventListener("click", handleMapStageClick);
  document.querySelectorAll("[data-map-action='import-code']").forEach((button) => {
    button.addEventListener("click", importMapLocationCode);
  });

  els.dragonForm.addEventListener("submit", handleDragonSubmit);
  els.accountForm.addEventListener("submit", handleAccountSubmit);
  els.skinForm.addEventListener("submit", handleSkinSubmit);
  els.upstatForm?.addEventListener("submit", handleUpstatSubmit);

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
  document.querySelectorAll("[data-action='export-csv']").forEach((button) => {
    button.addEventListener("click", exportCsv);
  });
  document.querySelectorAll("[data-action='add-random-dragon']").forEach((button) => {
    button.addEventListener("click", addRandomDragon);
  });
  document.querySelectorAll("[data-action='import-json']").forEach((button) => {
    button.addEventListener("click", () => els.importFile.click());
  });
  document.querySelectorAll("[data-action='import-genetics-png']").forEach((button) => {
    button.addEventListener("click", () => els.geneticsImageFile?.click());
  });

  els.importFile.addEventListener("change", importJson);
  els.geneticsImageFile?.addEventListener("change", importGeneticsPng);
  els.clearDragonsBtn.addEventListener("click", clearDragons);
  els.factoryResetBtn.addEventListener("click", factoryReset);

  els.dragonList.addEventListener("click", handleDragonAction);
  els.accountList.addEventListener("click", handleAccountAction);
  els.accountList.addEventListener("click", handleDragonAction);
  els.accountList.addEventListener("click", handleAccountCardOpen);
  els.accountList.addEventListener("keydown", handleAccountCardKeydown);
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
  fillSelect(document.querySelector("#upstatSpecies"), collectSpeciesNames());
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
  renderBackup();
}

function renderCurrentTab() {
  if (currentTab === "dragons") renderDragons();
  if (currentTab === "players") renderAccounts();
  if (currentTab === "nesting") {
    renderNestingOptions();
    renderNesting();
  }
  if (currentTab === "skins") renderSkins();
  if (currentTab === "upstats") renderUpstats();
  if (currentTab === "map") renderMap();
  if (currentTab === "clans") renderClans();
  if (currentTab === "settings") renderBackup();
}

function renderDatalists() {
  const speciesNames = collectSpeciesNames();
  els.speciesOptions.innerHTML = speciesNames.map((name) => `<option value="${escapeAttr(name)}"></option>`).join("");

  const skinNames = [...new Set([
    ...state.skins.map((skin) => skin.name),
    ...state.dragons.flatMap((dragon) => [dragon.skin, dragon.recessiveSkin])
  ].filter(Boolean))].sort(sortText);
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
}

function collectSpeciesNames() {
  return DEFAULT_SPECIES.map((species) => species.name);
}

function collectPlayerNames() {
  return [...new Set(state.accounts.map((account) => account.username).filter(Boolean))].sort(sortText);
}

function findExistingPlayerName(value) {
  const key = text(value).toLowerCase();
  if (!key) return "";
  return collectPlayerNames().find((name) => name.toLowerCase() === key) || "";
}

function renderDragonPlayerSelect(selectedPlayer = "") {
  const select = document.querySelector("#dragonPlayerSelect");
  if (!select) return;

  const players = collectPlayerNames();
  const selected = text(selectedPlayer);
  fillSelect(select, ["", ...players]);
  if (select.options[0]) select.options[0].textContent = players.length ? "New player or select existing" : "New player";
  select.value = players.includes(selected) ? selected : "";
  syncDragonPlayerControls();
}

function activeDragonPlayerName() {
  return text(document.querySelector("#dragonPlayerSelect")?.value) || text(document.querySelector("#dragonUsername")?.value);
}

function renderAccountNameDatalist(username = "") {
  if (!els.accountOptions) return;
  const playerName = text(username);
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

  if (!state.accounts.length) {
    els.accountList.innerHTML = `
      <div class="empty-state">
        <h2>No players yet</h2>
        <p>Add a player, then add accounts and dragons under them.</p>
      </div>
    `;
    return;
  }

  if (!accounts.length) {
    els.accountList.innerHTML = `
      <div class="empty-state">
        <h2>No matching players</h2>
        <p>Adjust the search or add a new player.</p>
      </div>
    `;
    return;
  }

  const byUser = new Map();
  accounts.forEach((account) => {
    if (!byUser.has(account.username)) byUser.set(account.username, []);
    byUser.get(account.username).push(account);
  });

  els.accountList.innerHTML = [...byUser.entries()].map(([username, userAccounts]) => {
    const dragonCount = userAccounts.reduce((sum, account) => sum + dragonsForAccount(account.id).length, 0);
    const clanOnlyPlayer = userAccounts.every((account) => account.clanImported);
    return `
      <section class="account-user-section">
        <div class="account-user-head">
          <h2>${escapeHtml(username)}</h2>
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

function getFilteredAccounts() {
  const query = els.accountSearch.value.trim().toLowerCase();
  const accounts = [...state.accounts].sort((a, b) => sortText(a.username, b.username) || sortText(a.accountName, b.accountName));
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
      <div class="account-dragon-row">
        <span>${escapeHtml(dragon.species || "Unknown species")}</span>
        <strong>${escapeHtml(compactJoin([dragon.status, dragon.skin || "Unknown skin"]))}</strong>
        ${dragon.clanImported
          ? `<span class="small-pill">Clan shared</span>`
          : `<button class="tool-button" type="button" data-dragon-action="edit" data-id="${escapeAttr(dragon.id)}">Edit</button>`}
      </div>
    `).join("")
    : `<p class="account-empty">No dragons on this account yet.</p>`;

  return `
    <article class="account-card" data-id="${escapeAttr(account.id)}" tabindex="0" aria-label="Open details for ${escapeAttr(account.accountName)}">
      <div class="card-head">
        <div class="card-title">
          <h3>${escapeHtml(account.accountName)}</h3>
        </div>
        <div class="account-card-badges"><span class="pill">${accountDragons.length}/7</span>${account.clanImported ? `<span class="small-pill">Clan shared</span>` : ""}</div>
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
      </section>
      <section class="account-detail-section">
        <h3>Roster</h3>
        <dl class="account-detail-list">
          <div><dt>Dragons</dt><dd>${dragons.length}/7</dd></div>
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
    <article class="account-detail-dragon">
      <div class="account-detail-dragon-head">
        <div>
          <h4>${escapeHtml(dragon.species || "Unknown species")}</h4>
          <p>${escapeHtml(compactJoin([dragon.sex, dragon.status, dragon.clanImported ? "Clan shared" : "Local record"]))}</p>
        </div>
        <span class="pill ${statusClass(dragon.status)}">${escapeHtml(dragon.status)}</span>
      </div>
      <dl class="account-detail-list account-detail-dragon-fields">
        <div><dt>Skin</dt><dd>${escapeHtml(dragon.skin || "Unknown")}</dd></div>
        <div><dt>Recessive</dt><dd>${escapeHtml(dragon.recessiveSkin || "Unknown")}</dd></div>
        <div><dt>Nest role</dt><dd>${escapeHtml(dragon.nestRole || "Unknown")}</dd></div>
        <div><dt>Bloodline</dt><dd>${escapeHtml(dragon.bloodline || "Unknown")}</dd></div>
        <div><dt>Parents</dt><dd>${escapeHtml(parentLabel)}</dd></div>
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
    <article class="dragon-card" data-id="${escapeAttr(dragon.id)}">
      <div class="card-head">
        <div class="card-title">
          <h3>${escapeHtml(dragon.accountName || dragon.name)}</h3>
          <p class="card-subtitle">${escapeHtml(compactJoin([dragon.username, dragon.species, dragon.sex]))}</p>
        </div>
        <span class="pill ${statusClass(dragon.status)}">${escapeHtml(dragon.status)}</span>
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
    <p class="planner-note">Tracker estimate: filled visible and recessive skin slots are weighted equally, duplicate skins are combined, then Discord-listed mutation chances are added as ${formatChance(MUTATION_RULES.albinoChance)} Albino and ${formatChance(MUTATION_RULES.piebaldChance)} Piebald when eligible. No public skin-inheritance buff formula has been stated, so breeder/social points are not applied to skin odds here. Hidden game RNG may differ.</p>
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
          <td>Any two nesting parents; Discord lists this as a mutation from breeding any skins together.</td>
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
  return roleChanged || derivedChanged;
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
  if (ultraSkinForDragon(dragon)) return "Ultra Pure";
  if (pureSkinForDragon(dragon)) return "Pure";
  if (dragon.nestRole === "Breeder") return "Breeder";
  return "Unknown";
}

function pureSkinForDragon(dragon) {
  const pureSkin = matchingDominantRecessiveSkin(dragon);
  const pureKey = canonicalSkinName(pureSkin);
  if (!pureKey) return "";

  const mother = dragonById(dragon.motherId);
  const father = dragonById(dragon.fatherId);
  if (!mother || !father) return "";
  if (!dragonVisibleSkinMatches(mother, pureKey) || !dragonVisibleSkinMatches(father, pureKey)) return "";

  return pureSkin;
}

function ultraSkinForDragon(dragon) {
  const pureSkin = matchingDominantRecessiveSkin(dragon);
  const pureKey = canonicalSkinName(pureSkin);
  if (!pureKey) return "";

  const tree = visibleNestingTree(dragon);
  if (tree.length < 3) return "";
  if (!tree.every((treeDragon) => hasMatchingDominantRecessiveSkin(treeDragon, pureKey))) return "";

  return pureSkin;
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

function hasMatchingDominantRecessiveSkin(dragon, skinKey) {
  return canonicalSkinName(matchingDominantRecessiveSkin(dragon)) === skinKey;
}

function dragonVisibleSkinMatches(dragon, skinKey) {
  if (!dragon || !skinKey) return false;
  return canonicalSkinName(dragon.skin) === skinKey;
}

function visibleNestingTree(dragon) {
  if (!dragon) return [];
  const mother = dragonById(dragon.motherId);
  const father = dragonById(dragon.fatherId);
  const grandparents = [mother?.motherId, mother?.fatherId, father?.motherId, father?.fatherId]
    .filter(Boolean)
    .map((id) => dragonById(id))
    .filter(Boolean);
  return [dragon, mother, father, ...grandparents].filter(Boolean);
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

  if (!skins.length) {
    els.skinList.innerHTML = `
      <div class="empty-state">
        <h2>No matching skins</h2>
        <p>Add a skin or adjust the filters.</p>
      </div>
    `;
    return;
  }

  const grouped = groupBySpecies(skins);
  els.skinList.innerHTML = grouped.map(([speciesName, speciesSkins]) => `
    <section class="skin-species-section" aria-label="${escapeAttr(speciesName)} skins">
      ${speciesName === "All" ? "" : `
        <div class="skin-species-head">
          <h2>${escapeHtml(speciesName)}</h2>
          <span class="pill skin-count-pill">${speciesSkins.length} ${speciesSkins.length === 1 ? "skin" : "skins"}</span>
        </div>
      `}
      <div class="skin-species-grid">
        ${speciesSkins.map(renderSkinCard).join("")}
      </div>
    </section>
  `).join("");
}

function renderSkinCard(skin) {
  const turntable = turntableForSkin(skin);
  return `
    <article class="skin-card${turntable ? " has-turntable" : ""}" data-id="${escapeAttr(skin.id)}">
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
        ${skin.recipeA ? `<span class="small-pill">A: ${escapeHtml(skin.recipeA)}</span>` : ""}
        ${skin.recipeB ? `<span class="small-pill">B: ${escapeHtml(skin.recipeB)}</span>` : ""}
      </div>
      <div class="card-actions">
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
  fillSelect(document.querySelector("#upstatSpecies"), collectSpeciesNames());
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

function renderUpstatSkinSelect(species, selectedSkin = document.querySelector("#upstatSkin")?.value || "") {
  fillSkinSelect(document.querySelector("#upstatSkin"), skinOptionsForSpecies(species), selectedSkin, "Select skin");
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
  return clanUi.memberships.find((membership) => membership.clan_id === clanUi.activeClanId) || null;
}

function activeClan() {
  return clanMembershipClan(activeClanMembership());
}

function canShareWithActiveClan() {
  return Boolean(clanSync?.isConfigured() && clanUi.user && activeClanMembership());
}

function clanMemberName(userId) {
  const member = clanUi.members.find((item) => item.user_id === userId);
  return member?.display_name || "Clan member";
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
  const hasActive = clanUi.memberships.some((membership) => membership.clan_id === clanUi.activeClanId);
  if (!hasActive) clanUi.activeClanId = clanUi.memberships[0]?.clan_id || "";
  if (clanUi.activeClanId) localStorage.setItem(ACTIVE_CLAN_STORAGE_KEY, clanUi.activeClanId);
  else localStorage.removeItem(ACTIVE_CLAN_STORAGE_KEY);
}

async function refreshClanSync(options = {}) {
  if (!clanSync || !clanSync.isConfigured()) {
    clanUi.user = null;
    clanUi.identityLinks = [];
    clanUi.memberships = [];
    clanUi.members = [];
    clanUi.sharedDragons = [];
    clanUi.sharedPins = [];
    clanUi.activeClanId = "";
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
      clanUi.activeClanId = "";
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
      const [members, sharedDragons, sharedPins] = await Promise.all([
        clanSync.getClanMembers(clanUi.activeClanId),
        clanSync.getSharedDragons(clanUi.activeClanId),
        clanSync.getClanMapPins(clanUi.activeClanId)
      ]);
      clanUi.members = Array.isArray(members) ? members : [];
      clanUi.sharedDragons = Array.isArray(sharedDragons) ? sharedDragons : [];
      clanUi.sharedPins = Array.isArray(sharedPins) ? sharedPins : [];
      const localClanChanges = materializeClanSharedDragons(clanUi.activeClanId, clanUi.sharedDragons);
      if (localClanChanges && !document.querySelector("dialog[open]")) renderAll();
    } else {
      clanUi.members = [];
      clanUi.sharedDragons = [];
      clanUi.sharedPins = [];
    }

    const signature = JSON.stringify({
      activeClanId: clanUi.activeClanId,
      identityLinks: clanUi.identityLinks,
      memberships: clanUi.memberships,
      members: clanUi.members,
      sharedDragons: clanUi.sharedDragons,
      sharedPins: clanUi.sharedPins
    });
    const changed = signature !== clanUi.lastSignature;
    clanUi.lastSignature = signature;
    if (currentTab === "clans" || (!options.quiet && changed)) renderClans();
    if (changed && currentTab === "map") renderMapPins();
    if (changed && currentTab === "dragons") renderDragons();
    if (changed && currentTab === "players") renderAccounts();
  } catch (error) {
    clanUi.error = clanFriendlyError(error);
    if (currentTab === "clans" || !options.quiet) renderClans();
  }
}

function materializeClanSharedDragons(clanId, records) {
  const remoteKeys = new Set();
  let changed = false;
  const remoteRecords = Array.isArray(records)
    ? records.filter((record) => record?.source_user_id && record.source_user_id !== clanUi.user?.id)
    : [];

  remoteRecords.forEach((record) => {
    const shareKey = clanSharedDragonKey(clanId, record);
    remoteKeys.add(shareKey);
    const incoming = clanSharedDragonFromRecord(record, clanId, shareKey);
    if (!incoming) return;

    const account = ensureClanSharedAccount(incoming.username, incoming.accountName);
    if (account.created) changed = true;
    incoming.accountId = account.record.id;

    const existing = state.dragons.find((dragon) => (
      dragon.clanImported && clanShareKeysForDragon(dragon).includes(shareKey)
    )) || state.dragons.find((dragon) => (
      dragonIdentityKey(dragon) === dragonIdentityKey(incoming)
      && (!dragon.clanImported || dragon.clanShareClanId === clanId)
    ));

    if (!existing) {
      state.dragons.push(incoming);
      changed = true;
      return;
    }

    if (mergeClanSharedDragon(existing, incoming, record.summary)) changed = true;
  });

  if (removeMissingClanSharedDragons(clanId, remoteKeys)) changed = true;
  if (!changed) return false;

  state.accounts.sort((a, b) => sortText(a.username, b.username) || sortText(a.accountName, b.accountName));
  state.dragons.sort((a, b) => sortText(a.username, b.username) || sortText(a.accountName, b.accountName) || sortText(a.species, b.species));
  refreshAllDerivedRecords();
  saveState();
  return true;
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

function clanSharedDragonFromRecord(record, clanId, shareKey) {
  const summary = record?.summary && typeof record.summary === "object" ? record.summary : {};
  const username = text(summary.playerName || summary.username || clanMemberName(record.source_user_id)) || "Clan member";
  const accountName = text(summary.accountName || summary.displayName);
  const species = canonicalSpeciesName(summary.species);
  if (!accountName || !species) return null;

  const timestamp = text(record.updated_at || summary.updatedAt) || new Date().toISOString();
  return normalizeDragon({
    id: uid("clan-dragon"),
    createdAt: timestamp,
    updatedAt: timestamp,
    username,
    accountName,
    name: accountName,
    species,
    sex: summary.sex,
    status: summary.status,
    nestRole: summary.nestRole,
    server: summary.server,
    skin: summary.skin,
    skinType: summary.skinType,
    recessiveSkin: summary.recessiveSkin,
    motherName: summary.motherName,
    fatherName: summary.fatherName,
    bloodline: summary.bloodline,
    stats: summary.stats,
    dominantMutation: summary.dominantMutation,
    elderProgress: summary.elderProgress,
    socialPoints: summary.socialPoints,
    agilePoints: summary.agilePoints,
    fastMutation: summary.fastMutation,
    scavengerPoints: summary.scavengerPoints,
    survivorMutation: summary.survivorMutation,
    birthDate: summary.birthDate,
    tags: Array.isArray(summary.tags) ? summary.tags : [],
    clanImported: true,
    clanShareKey: shareKey,
    clanShareKeys: [shareKey],
    clanShareClanId: clanId,
    clanShareUpdatedAt: timestamp
  });
}

function ensureClanSharedAccount(username, accountName) {
  const existing = state.accounts.find((account) => (
    accountIdentityKey(account.username, account.accountName) === accountIdentityKey(username, accountName)
  ));
  if (existing) return { record: existing, created: false };
  const record = normalizeAccount({
    id: uid("clan-account"),
    username,
    accountName,
    clanImported: true
  });
  state.accounts.push(record);
  return { record, created: true };
}

function mergeClanSharedDragon(existing, incoming, rawSummary) {
  const summary = rawSummary && typeof rawSummary === "object" ? rawSummary : {};
  const has = (key) => Object.prototype.hasOwnProperty.call(summary, key);
  const shareKeys = existing.clanImported
    ? [...new Set([...clanShareKeysForDragon(existing), incoming.clanShareKey].filter(Boolean))]
    : clanShareKeysForDragon(existing);
  const useIncomingDetails = !existing.clanImported
    || new Date(incoming.clanShareUpdatedAt || 0).getTime() >= new Date(existing.clanShareUpdatedAt || 0).getTime();
  const next = {
    ...existing,
    accountId: useIncomingDetails ? incoming.accountId : existing.accountId,
    username: useIncomingDetails ? incoming.username : existing.username,
    accountName: useIncomingDetails ? incoming.accountName : existing.accountName,
    name: useIncomingDetails ? incoming.accountName : existing.name,
    updatedAt: useIncomingDetails ? incoming.updatedAt : existing.updatedAt,
    clanImported: Boolean(existing.clanImported),
    clanShareKey: existing.clanImported ? shareKeys[0] || "" : existing.clanShareKey,
    clanShareKeys: shareKeys,
    clanShareClanId: existing.clanImported ? incoming.clanShareClanId : existing.clanShareClanId,
    clanShareUpdatedAt: existing.clanImported && useIncomingDetails ? incoming.clanShareUpdatedAt : existing.clanShareUpdatedAt
  };
  [
    "species", "sex", "status", "nestRole", "server", "skin", "skinType", "recessiveSkin",
    "motherName", "fatherName", "bloodline", "birthDate", "dominantMutation", "elderProgress",
    "socialPoints", "agilePoints", "fastMutation", "scavengerPoints", "survivorMutation"
  ].forEach((key) => {
    if (useIncomingDetails && has(key)) next[key] = incoming[key];
  });
  if (useIncomingDetails && has("stats") && summary.stats && typeof summary.stats === "object") {
    next.stats = { ...existing.stats, ...incoming.stats };
  }
  if (useIncomingDetails && has("tags") && Array.isArray(summary.tags)) next.tags = incoming.tags;

  const normalized = normalizeDragon(next);
  if (JSON.stringify(existing) === JSON.stringify(normalized)) return false;
  Object.assign(existing, normalized);
  return true;
}

function removeMissingClanSharedDragons(clanId, activeShareKeys) {
  let changed = false;
  const removed = state.dragons.filter((dragon) => {
    if (!dragon.clanImported || dragon.clanShareClanId !== clanId) return false;
    const currentKeys = clanShareKeysForDragon(dragon);
    const remainingKeys = currentKeys.filter((key) => activeShareKeys.has(key));
    if (!remainingKeys.length) return true;
    if (remainingKeys.length !== currentKeys.length) {
      dragon.clanShareKeys = remainingKeys;
      dragon.clanShareKey = remainingKeys[0] || "";
      changed = true;
    }
    return false;
  });
  if (!removed.length) return changed;

  const removedIds = new Set(removed.map((dragon) => dragon.id));
  state.dragons = state.dragons.filter((dragon) => !removedIds.has(dragon.id));
  clearDragonParentReferences(removedIds);
  const accountIdsInUse = new Set(state.dragons.map((dragon) => dragon.accountId));
  state.accounts = state.accounts.filter((account) => !account.clanImported || accountIdsInUse.has(account.id));
  return true;
}

function renderClans() {
  if (!els.clanContent) return;
  if (!clanSync) {
    els.clanContent.innerHTML = `<section class="clan-panel empty-state"><h2>Secure sync is unavailable</h2><p>This build is missing the clan sync client.</p></section>`;
    return;
  }

  const config = clanSync.getConfig();
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
          <div><dt>Steam</dt><dd>Optional SteamID64 verification through Steam OpenID.</dd></div>
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
  const steamLinked = clanUi.identityLinks.some((link) => link.provider === "steam");
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
  const sharedRows = filteredSharedDragons.length
    ? filteredSharedDragons.map((record) => {
      const summary = record.summary && typeof record.summary === "object" ? record.summary : {};
      return `
        <article class="clan-share-row">
          <strong>${escapeHtml(summary.displayName || "Shared Dragon")}</strong>
          <span>${escapeHtml(compactJoin([summary.species, summary.sex, summary.skin, summary.recessiveSkin ? `Res: ${summary.recessiveSkin}` : "", summary.status]))}</span>
          <small>Shared by ${escapeHtml(clanMemberName(record.source_user_id))}</small>
        </article>
      `;
    }).join("")
    : `<p class="account-empty">${clanUi.sharedDragons.length ? "No shared dragons match these filters." : "No dragons have been shared with this clan yet."}</p>`;

  els.clanContent.innerHTML = `
    <section class="clan-panel clan-identity-panel">
      <div class="card-head">
        <div class="card-title"><h2>${escapeHtml(clanDisplayName(clanUi.user))}</h2><p class="card-subtitle">Discord identity connected</p></div>
        <span class="pill">Connected</span>
      </div>
      <dl class="line-list">
        <div><dt>Steam</dt><dd>${steamLinked ? "SteamID verified" : "Not linked"}</dd></div>
        <div><dt>Data default</dt><dd>Local only</dd></div>
      </dl>
      ${clanUi.error ? `<p class="clan-error">${escapeHtml(clanUi.error)}</p>` : ""}
      <div class="card-actions">
        <button class="tool-button" type="button" data-clan-action="refresh">Refresh</button>
        ${steamLinked ? "" : `<button class="tool-button" type="button" data-clan-action="link-steam">Link Steam</button>`}
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
          ${membership?.role === "owner" ? "" : `<button class="danger-button" type="button" data-clan-action="leave">Leave Clan</button>`}
        </div>
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
      <div class="card-head"><div class="card-title"><h2>Shared Library</h2><p class="card-subtitle">Only items chosen by members</p></div><span class="pill">${filteredSharedDragons.length} of ${clanUi.sharedDragons.length} dragons / ${clanUi.sharedPins.length} pins</span></div>
      <form class="clan-library-search" data-clan-form="library-search">
        <div class="field"><label for="clanLibraryDragon">Dragon</label><select id="clanLibraryDragon" name="dragon">${dragonOptions}</select></div>
        <div class="field"><label for="clanLibrarySkin">Skin</label><select id="clanLibrarySkin" name="skin">${skinOptions}</select></div>
        <div class="field"><label for="clanLibraryRecessive">Recessive</label><select id="clanLibraryRecessive" name="recessive">${recessiveOptions}</select></div>
        <div class="field"><label for="clanLibrarySex">Sex</label><select id="clanLibrarySex" name="sex">${sexOptions}</select></div>
        <div class="clan-library-search-actions"><button class="primary-button" type="submit">Apply</button><button class="tool-button" type="button" data-clan-action="clear-library-search">Clear</button></div>
      </form>
      <div class="clan-share-list">${sharedRows}</div>
    </section>
  `;
}

function clanLibraryFilterOptions(summaryKey, selectedValue, emptyLabel) {
  const values = [...new Set(clanUi.sharedDragons
    .map((record) => text(record.summary?.[summaryKey], 100))
    .filter(Boolean))]
    .sort(sortText);
  return [`<option value="">${escapeHtml(emptyLabel)}</option>`, ...values.map((value) => (
    `<option value="${escapeAttr(value)}"${value === selectedValue ? " selected" : ""}>${escapeHtml(value)}</option>`
  ))].join("");
}

function getFilteredClanSharedDragons() {
  const filters = clanUi.libraryFilters;
  const includes = (value, query) => !query || text(value).toLowerCase().includes(query.toLowerCase());
  return clanUi.sharedDragons.filter((record) => {
    const summary = record.summary && typeof record.summary === "object" ? record.summary : {};
    return includes(summary.displayName, filters.dragon)
      && includes(summary.skin, filters.skin)
      && includes(summary.recessiveSkin, filters.recessive)
      && (!filters.sex || text(summary.sex).toLowerCase() === filters.sex.toLowerCase());
  });
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
  Object.assign(clanUi, { activeClanId: "", error: "", identityLinks: [], inviteCode: "", members: [], memberships: [], profileUserId: "", sharedDragons: [], sharedPins: [], user: null, lastSignature: "" });
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
      clanUi.libraryFilters = { dragon: "", skin: "", recessive: "", sex: "" };
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
    if (action === "sign-out") {
      if (!confirm("Sign out of clan sync on this device? Your local tracker data will stay here.")) return;
      await clanSync.signOut();
      Object.assign(clanUi, { activeClanId: "", identityLinks: [], inviteCode: "", members: [], memberships: [], profileUserId: "", sharedDragons: [], sharedPins: [], user: null, lastSignature: "" });
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
      if (!clan || !confirm(`Leave ${clan.name}?`)) return;
      await clanSync.leaveClan(clan.id);
      if (removeMissingClanSharedDragons(clan.id, new Set())) {
        refreshAllDerivedRecords();
        saveState();
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
      sex: text(values.get("sex"), 20)
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
  return clanUi.sharedDragons.some((record) => record.source_user_id === clanUi.user?.id && record.source_local_id === dragon.id);
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

function renderMapAreaSelect() {
  if (!els.mapAreaSelect) return;
  const current = els.mapAreaSelect.value || MAP_REFERENCE_AREAS[0]?.id || "";
  const byRegion = new Map();
  MAP_REFERENCE_AREAS.forEach((area) => {
    const region = area.region || "Other";
    if (!byRegion.has(region)) byRegion.set(region, []);
    byRegion.get(region).push(area);
  });
  els.mapAreaSelect.innerHTML = [...byRegion.entries()].map(([region, areas]) => `
    <optgroup label="${escapeAttr(region)}">
      ${areas.map((area) => `<option value="${escapeAttr(area.id)}">${escapeHtml(area.name)}</option>`).join("")}
    </optgroup>
  `).join("");
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
  const localPins = [...state.mapPins].map((pin) => ({ ...pin, remote: false }));
  const remotePins = visibleClanMapPins().map((pin) => ({
    id: pin.id,
    label: pin.label,
    type: pin.pin_type,
    x: Number(pin.x),
    y: Number(pin.y),
    notes: pin.notes,
    sharedBy: clanMemberName(pin.source_user_id),
    remote: true,
    sourceUserId: pin.source_user_id
  }));
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
          <span>${escapeHtml(compactJoin([pin.type, pin.remote ? `Clan: ${pin.sharedBy}` : pin.sharedBy]))}</span>
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
  mapPinPlacementActive = true;
  els.addMapPinBtn?.classList.add("is-placing");
  showToast("Click the map to place a location pin");
}

function handleMapStageClick(event) {
  const pinButton = event.target.closest(".map-pin");
  if (pinButton) {
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
  const rect = els.mapStage.getBoundingClientRect();
  const x = clampPercent(((event.clientX - rect.left) / rect.width) * 100);
  const y = clampPercent(((event.clientY - rect.top) / rect.height) * 100);
  const label = text(prompt("Location name:", "Dragon sighting"));
  if (!label) {
    mapPinPlacementActive = false;
    els.addMapPinBtn?.classList.remove("is-placing");
    return;
  }
  const type = text(prompt("Location type:", "Dragon")) || "Dragon";
  const notes = text(prompt("Notes:", ""));
  const pin = normalizeMapPin({
    id: uid("pin"),
    label,
    type,
    x,
    y,
    notes,
    sharedBy: collectPlayerNames()[0] || ""
  });
  state.mapPins.push(pin);
  mapPinPlacementActive = false;
  els.addMapPinBtn?.classList.remove("is-placing");
  saveState();
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

function importMapLocationCode() {
  const code = prompt("Paste location code:");
  if (code === null) return;
  try {
    const pin = normalizeMapPin({
      ...decodeLocationCode(code),
      id: uid("pin"),
      updatedAt: new Date().toISOString()
    });
    state.mapPins.push(pin);
    saveState();
    renderAll();
    showToast(`${pin.label} imported`);
  } catch (error) {
    alert(`Could not import location code: ${error.message}`);
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
    <dt>Species</dt><dd>${collectSpeciesNames().length}</dd>
    <dt>Saved</dt><dd>${formatDateTime(state.updatedAt)}</dd>
    <dt>Backup size</dt><dd>${formatBytes(bytes)}</dd>
  `;
  renderSyncSettings();
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

function renderAppVersion() {
  if (!els.appVersionLabel) return;
  els.appVersionLabel.textContent = `Version ${APP_VERSION}`;
}

function handleDragonSkinControlChange(event) {
  if (event.target.id === "dragonSpecies") {
    renderDragonSkinSelects(event.target.value, "", "");
  }
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

function setDragonStatsTo18APlus() {
  STAT_FIELDS.forEach((field) => setFormValue(`stat-${field.key}`, "A+"));
  syncAllAPlusIndicator();
}

function syncAllAPlusIndicator() {
  const indicator = document.querySelector("#dragonAllAPlus");
  if (!indicator) return;
  indicator.checked = STAT_FIELDS.every((field) => gradeScore(document.querySelector(`#stat-${field.key}`)?.value) >= gradeScore("A+"));
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
    socialInput.title = locked ? "Locked to available Social points for this status or nest role." : "";
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
  const username = text(form.get("username"));
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
    accountName,
    discord: form.get("discord"),
    steam: form.get("steam"),
    dlc
  });

  saveState();
  closeModal("accountDialog");
  renderAll();
  showToast(`${account.accountName} saved`);
}

function handleDragonSubmit(event) {
  event.preventDefault();
  const form = new FormData(els.dragonForm);
  const id = form.get("id") || uid("dragon");
  const existing = dragonById(id);
  const selectedPlayer = text(document.querySelector("#dragonPlayerSelect")?.value);
  const typedPlayer = text(document.querySelector("#dragonUsername")?.value);
  const existingTypedPlayer = findExistingPlayerName(typedPlayer);
  const username = selectedPlayer || typedPlayer;

  if (!selectedPlayer && existingTypedPlayer) {
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
    owned: form.has("owned")
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

  if (action === "edit") openDragonDialog(id);
  if (action === "clone") cloneDragon(dragon);
  if (action === "toggleStatus") toggleDragonStatus(dragon);
  if (action === "share") void shareDragonWithClan(dragon);
  if (action === "delete") deleteDragon(dragon);
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

  if (action === "edit") openAccountDialog(account.id);
  if (action === "add-dragon") openDragonDialog("", { accountId: account.id });
  if (action === "share-account") void shareAccountWithClan(account);
  if (action === "delete-account") deleteAccount(account);
}

function handleSkinAction(event) {
  const button = event.target.closest("[data-skin-action]");
  if (!button) return;
  const id = button.dataset.id;
  const action = button.dataset.skinAction;
  const skin = skinById(id);
  if (!skin) return;

  if (action === "edit") openSkinDialog(id);
  if (action === "delete") deleteSkin(skin);
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
  state.dragons = state.dragons.filter((dragon) => !removedDragonIds.has(dragon.id));
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

function addRandomDragon() {
  const preferredSpecies = currentTab === "nesting"
    ? dragonById(els.parentOne.value)?.species || dragonById(els.parentTwo.value)?.species || ""
    : "";
  const dragon = createRandomDragon(preferredSpecies);
  state.dragons.push(dragon);
  refreshAllDerivedRecords();
  saveState();
  renderAll();

  if (currentTab === "nesting") {
    if (!els.parentOne.value) {
      els.parentOne.value = dragon.id;
    } else if (!els.parentTwo.value || els.parentTwo.value === els.parentOne.value) {
      els.parentTwo.value = dragon.id;
    }
    renderNesting();
  }

  showToast(`${dragon.name} added`);
}

function createRandomDragon(preferredSpecies = "") {
  const species = canonicalSpeciesName(preferredSpecies) || randomChoice(collectSpeciesNames()) || "Flame Stalker";
  const speciesSkins = skinOptionsForSpecies(species);
  const visibleSkin = randomChoice(speciesSkins) || "Iconic";
  const recessiveSkin = randomChoice(speciesSkins) || visibleSkin;
  const status = randomWeightedChoice([
    ["Grown", 70],
    ["4th Pointed", 20],
    ["Elder", 10]
  ]);
  const elderProgress = randomElderProgressForStatus(status);
  const sex = randomChoice(["Female", "Male"]);
  const socialPoints = randomWeightedChoice([
    [0, 26],
    [1, 22],
    [2, 22],
    [3, 30]
  ]);
  const nestRole = Math.random() < 0.28 ? "Breeder" : "Unknown";
  const agilePoints = randomInt(0, AGILE_POINTS_MAX);
  const scavengerPoints = randomInt(0, SCAVENGER_POINTS_MAX);
  const stats = Object.fromEntries(STAT_FIELDS.map((field) => [field.key, randomStatGrade()]));
  const account = upsertAccountRecord({
    username: randomChoice(["CPTBLUMISH", "Mystic", "Harbinger", "Kora", "Kiwi"]),
    accountName: nextRandomDragonName(species, visibleSkin)
  });

  const dragon = normalizeDragon({
    id: uid("dragon"),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    accountId: account.id,
    username: account.username,
    accountName: account.accountName,
    name: account.accountName,
    species,
    sex,
    status,
    nestRole,
    skin: visibleSkin,
    recessiveSkin,
    bloodline: randomBloodlineGrade(),
    stats,
    dominantMutation: Math.random() < 0.18,
    growth: 100,
    elderProgress,
    socialPoints,
    agilePoints,
    fastMutation: agilePoints >= AGILE_POINTS_MAX && Math.random() < 0.22,
    scavengerPoints,
    survivorMutation: scavengerPoints >= SCAVENGER_POINTS_MAX && Math.random() < 0.22,
    tags: ["debug", "random"],
    notes: "Generated with Add Random for testing."
  });

  dragon.skinType = skinTypeForName(dragon.skin, dragon.species);
  return dragon;
}

function nextRandomDragonName(species, skin) {
  const count = state.dragons.filter((dragon) => dragon.tags.includes("random")).length + 1;
  return `Debug ${skin || species} ${String(count).padStart(3, "0")}`;
}

function randomElderProgressForStatus(status) {
  if (status === "Elder") return 100;
  if (status === "4th Pointed") return randomInt(25, 99);
  return randomInt(0, 24);
}

function randomStatGrade() {
  return randomWeightedChoice([
    ["C", 12],
    ["C+", 12],
    ["B-", 14],
    ["B", 14],
    ["B+", 13],
    ["A-", 12],
    ["A", 10],
    ["A+", 8],
    ["A++", 5]
  ]);
}

function randomBloodlineGrade() {
  return randomWeightedChoice([
    ["C", 10],
    ["B", 14],
    ["A", 15]
  ]);
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
  saveState();
  downloadBlob(`day-of-dragons-tracker-${dateStamp()}.json`, JSON.stringify(state, null, 2), "application/json");
  showToast("JSON backup exported");
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
      const before = {
        accounts: state.accounts.length,
        dragons: state.dragons.length,
        skins: state.skins.length,
        upstats: state.upstats.length,
        lineageRecords: state.lineageRecords.length,
        mapPins: state.mapPins.length
      };
      if (!confirm("Merge this backup with the current tracker data? Matching accounts and dragons will update; new records will be added.")) return;
      state = mergeImportedState(state, parsed);
      refreshAllDerivedRecords();
      saveState();
      renderAll();
      const addedDragons = Math.max(0, state.dragons.length - before.dragons);
      const addedAccounts = Math.max(0, state.accounts.length - before.accounts);
      showToast(`Backup merged: ${addedAccounts} accounts, ${addedDragons} dragons added`);
    } catch (error) {
      alert(`Could not import backup: ${error.message}`);
    } finally {
      els.importFile.value = "";
    }
  };
  reader.readAsText(file);
}

function hasImportableBackupData(parsed) {
  return ["accounts", "dragons", "skins", "upstats", "lineageRecords", "mapPins"].some((key) => Array.isArray(parsed?.[key]));
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
  if (hash === "backup") return "settings";
  return TAB_NAMES.includes(hash) ? hash : DEFAULT_TAB;
}

function setTab(tabName, options = {}) {
  const nextTab = TAB_NAMES.includes(tabName) ? tabName : DEFAULT_TAB;
  currentTab = nextTab;
  if (options.updateHash && window.location.hash !== `#${nextTab}`) {
    window.location.hash = nextTab;
  } else if (options.replaceHash && window.location.hash && window.location.hash !== `#${nextTab}`) {
    history.replaceState(null, "", `#${nextTab}`);
  }
  els.tabs.forEach((tab) => tab.classList.toggle("is-active", tab.dataset.tab === nextTab));
  els.panels.forEach((panel) => panel.classList.toggle("is-active", panel.dataset.panel === nextTab));
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
  return state.accounts.find((account) => account.id === id);
}

function dragonsForAccount(accountId) {
  return state.dragons.filter((dragon) => dragon.accountId === accountId);
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

function randomChoice(values) {
  if (!values.length) return "";
  return values[Math.floor(Math.random() * values.length)];
}

function randomWeightedChoice(entries) {
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = Math.random() * total;
  for (const [value, weight] of entries) {
    roll -= weight;
    if (roll <= 0) return value;
  }
  return entries[entries.length - 1]?.[0] || "";
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
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
  return SOCIAL_LOCK_NEST_ROLES.has(normalizeNestRole(nestRole));
}

function normalizeMutationAllocation(values) {
  const status = values.status || "Hatchie";
  const nestRole = normalizeNestRole(values.nestRole);
  const total = Math.max(1, Number(values.mutationPoints) || estimateMutationPoints(status, "", values.elderProgress));
  let used = 0;

  const socialMax = Math.min(SOCIAL_POINTS_MAX, total);
  const socialPoints = shouldLockSocialPoints(status, nestRole)
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
