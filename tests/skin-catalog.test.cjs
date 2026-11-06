const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
const indexSource = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");

test("Stardust is available as an Uncommon Shadow Scale skin with a turntable", () => {
  assert.match(source, /species:\s*"Shadow Scale"[\s\S]*?\["Stardust",\s*"Uncommon",\s*"Spawnable"\]/);
  assert.match(source, /\["Shadow Scale::stardust",\s*"shadow-scale\/stardust\.mp4"\]/);
  assert.match(indexSource, /<script src="\.\/app\.js\?v=[^"]+"><\/script>/);
});

test("Celestial is available as a Common Shadow Scale skin with a turntable", () => {
  assert.match(source, /species:\s*"Shadow Scale"[\s\S]*?\["Celestial",\s*"Common",\s*"Spawnable"\]/);
  assert.match(source, /\["Shadow Scale::celestial",\s*"shadow-scale\/celestial\.mp4"\]/);
});

// Exercise the actual catalog and migration functions without starting the UI
// or reading the user's localStorage.
function loadSkinCatalog() {
  const runtimeMarker = source.indexOf("// Runtime state");
  assert.ok(runtimeMarker > 0, "catalog initialization precedes runtime state");
  // Loading declarations also includes dependencies of record normalizers,
  // while leaving all startup calls and event binding outside the sandbox.
  const functions = Array.from(source.matchAll(/^function \w+\([^]*?^\}/gm), (match) => match[0]).join("\n");
  return vm.runInNewContext(`${source.slice(0, runtimeMarker)}\n${functions}\n({
    STARTER_SKINS, SKIN_TURNTABLES, mergeSkinCatalog, turntableForSkin, renderSkinTurntable,
    normalizeSkin, normalizeDragon, normalizeUpstat, normalizeLineageRecord, canonicalSkinName
  })`, { URLSearchParams, window: { location: { search: "" } } });
}

const addedPreviews = [
  ["Feathered Zygovo", "Waxwing", "Unknown", ["feathered-zygovo/waxwing.mp4"]],
  ["Feathered Zygovo", "Sky Jay", "Unknown", ["feathered-zygovo/sky-jay.mp4"]],
  ["Feathered Zygovo", "Content Creator", "Pearl Overlay", ["feathered-zygovo/content-creator.mp4"]],
  ["Feathered Zygovo", "Snow Slayer", "Pearl Overlay", ["feathered-zygovo/snow-slayer.mp4"]],
  ["Mimikor", "Red Grey Fox", "Unknown", ["mimikor/red-grey-fox.mp4"]],
  ["Mimikor", "Snow Leopard", "Unknown", ["mimikor/snow-leopard.mp4"]],
  ["Mimikor", "Tasmanian Tiger", "Unknown", ["mimikor/tasmanian-tiger.mp4"]],
  ["Mimikor", "Trash Panda", "Unknown", ["mimikor/trash-panda.mp4"]],
  ["Mimikor", "Sand Slayer", "Pearl Overlay", ["mimikor/sand-slayer.mp4"]],
  ["Shadow Scale", "Midnight", "Unknown", ["shadow-scale/midnight.mp4"]]
];

test("downloaded skins are selectable catalog entries with all 16 retained local preview files", () => {
  const catalog = loadSkinCatalog();
  const previewFiles = [];
  for (const [species, name, type, files] of addedPreviews) {
    const matches = catalog.STARTER_SKINS.filter((skin) => skin.species === species && skin.name === name);
    assert.equal(matches.length, 1, `${species} ${name} has one catalog entry`);
    assert.equal(matches[0].type, type, `${species} ${name} has an appropriate known or pending classification`);
    const preview = catalog.turntableForSkin(matches[0]);
    assert.ok(preview, `${species} ${name} has a preview`);
    assert.deepEqual(Array.from(preview.variants, (variant) => variant.src), files.map((file) => `./assets/skins/${file}`));
    previewFiles.push(...files);
  }
  for (const species of ["Feathered Zygovo", "Mimikor"]) {
    const slug = species === "Mimikor" ? "mimikor" : "feathered-zygovo";
    for (const name of ["Crimson", "Golden"]) {
      const preview = catalog.turntableForSkin({ species, name });
      const file = `${slug}/${name.toLowerCase()}.mp4`;
      assert.equal(preview.src, `./assets/skins/${file}`);
      previewFiles.push(file);
    }
  }
  for (const [name, file] of [["Melanistic", "black.mp4"], ["Leucistic", "white.mp4"]]) {
    const preview = catalog.turntableForSkin({ species: "Feathered Zygovo", name });
    const relativePath = `feathered-zygovo/${file}`;
    assert.equal(preview.src, `./assets/skins/${relativePath}`);
    previewFiles.push(relativePath);
  }
  assert.equal(catalog.STARTER_SKINS.filter((skin) => skin.species === "Feathered Zygovo").length, 4);
  assert.equal(new Set(previewFiles).size, 16, "every retained video has a distinct local path");
  for (const file of previewFiles) {
    const info = fs.statSync(path.join(__dirname, "..", "assets", "skins", file));
    assert.ok(info.isFile() && info.size > 0, `${file} is packaged as a nonempty file`);
  }
});

test("shared Crimson and Golden skins expose both new species without duplicate catalog cards", () => {
  const catalog = loadSkinCatalog();
  for (const name of ["Crimson", "Golden"]) {
    const matches = catalog.STARTER_SKINS.filter((skin) => skin.name === name);
    assert.equal(matches.length, 1, `${name} remains one shared skin`);
    assert.equal(matches[0].species, "All");
    const preview = catalog.turntableForSkin(matches[0]);
    assert.ok(preview.variants.some((variant) => variant.species === "Feathered Zygovo"));
    assert.ok(preview.variants.some((variant) => variant.species === "Mimikor"));
    assert.equal(new Set(Array.from(preview.variants, (variant) => variant.src)).size, preview.variants.length);
  }
  assert.equal(catalog.turntableForSkin({ species: "Mimikor", name: "No preview recorded" }), null);
});

test("Snow Slayer has one Feathered Zygovo view without the duplicate preview", () => {
  const catalog = loadSkinCatalog();
  const skin = catalog.STARTER_SKINS.find((entry) => entry.species === "Feathered Zygovo" && entry.name === "Snow Slayer");
  const preview = catalog.turntableForSkin(skin);
  assert.equal(preview.variants.length, 1);
  assert.equal(preview.src, "./assets/skins/feathered-zygovo/snow-slayer.mp4");
  const markup = catalog.renderSkinTurntable(preview, skin);
  assert.equal((markup.match(/<option /g) || []).length, 0);
  assert.match(markup, /<video src="\.\/assets\/skins\/feathered-zygovo\/snow-slayer\.mp4"/);
  assert.ok(!fs.existsSync(path.join(__dirname, "..", "assets", "skins", "feathered-zygovo", "snow-slayer-alt.mp4")));
});

test("catalog upgrade adds downloaded skins without losing existing ownership, wishlist, or custom notes", () => {
  const catalog = loadSkinCatalog();
  const saved = [
    { id: "owned-crimson", species: "All", name: "Crimson", type: "Exotic", owned: true, wishlist: true, notes: "Keep my acquisition note", source: "My own source" },
    { id: "owned-stardust", species: "Shadow Scale", name: "Stardust", type: "Uncommon", owned: true, wishlist: true, notes: "Keep my breeding note" },
    { id: "custom-skin", species: "Mimikor", name: "My Custom Skin", type: "Custom", owned: false, wishlist: true, notes: "Keep my custom record" }
  ];
  const before = JSON.stringify(saved);
  const merged = catalog.mergeSkinCatalog(saved, catalog.STARTER_SKINS);
  assert.equal(JSON.stringify(saved), before, "migration does not mutate saved input");
  for (const original of saved) {
    const upgraded = merged.find((skin) => skin.id === original.id);
    assert.ok(upgraded, `${original.id} survives upgrade`);
    for (const field of ["species", "name", "type", "owned", "wishlist", "notes"]) {
      assert.equal(upgraded[field], original[field], `${original.id} preserves ${field}`);
    }
  }
  assert.equal(merged.find((skin) => skin.id === "owned-crimson").source, "My own source");
  for (const [species, name] of addedPreviews) {
    const matches = merged.filter((skin) => skin.species === species && skin.name === name);
    assert.equal(matches.length, 1, `${species} ${name} is added exactly once to saved data`);
    assert.equal(matches[0].owned, false, "adding a preview does not claim ownership");
    assert.equal(matches[0].wishlist, false, "adding a preview does not alter the wishlist");
  }
  const secondUpgrade = catalog.mergeSkinCatalog(merged, catalog.STARTER_SKINS);
  assert.equal(secondUpgrade.length, merged.length, "reloading the upgraded catalog does not duplicate skins");
  for (const skin of merged) {
    assert.equal(secondUpgrade.find((entry) => entry.species === skin.species && entry.name === skin.name).id, skin.id);
  }
});

test("species-specific overlay records retain ownership without sharing it with another species", () => {
  const catalog = loadSkinCatalog();
  const saved = [
    { id: "zygovo-snow-slayer", species: "Feathered Zygovo", name: "Snow Slayer", type: "Pearl Overlay", owned: true, wishlist: true, notes: "Keep my Zygovo overlay note" },
    { id: "mimikor-snow-slayer", species: "Mimikor", name: "Snow Slayer", type: "Custom", owned: false, wishlist: true, notes: "My separate Mimikor wishlist entry" }
  ];
  let merged = catalog.mergeSkinCatalog(saved, catalog.STARTER_SKINS);
  for (let load = 0; load < 2; load += 1) {
    for (const original of saved) {
      const matches = merged.filter((skin) => skin.species === original.species && skin.name === original.name);
      assert.equal(matches.length, 1, `${original.species} overlay survives load ${load + 1} exactly once`);
      for (const field of ["id", "type", "owned", "wishlist", "notes"]) {
        assert.equal(matches[0][field], original[field], `${original.species} preserves ${field} on load ${load + 1}`);
      }
    }
    assert.equal(merged.find((skin) => skin.id === "mimikor-snow-slayer").owned, false, "Zygovo ownership does not grant ownership to another species");
    const preview = catalog.turntableForSkin(merged.find((skin) => skin.id === "zygovo-snow-slayer"));
    assert.equal(preview.variants.length, 1, "saved overlay uses the retained preview");
    merged = catalog.mergeSkinCatalog(merged, catalog.STARTER_SKINS);
  }
});

test("color aliases resolve to shared skin names without changing compound names or inventing a grey preview", () => {
  const catalog = loadSkinCatalog();
  for (const [alias, expected] of [["bLaCk", "Melanistic"], [" WHITE ", "Leucistic"], ["Grey", "Leumelan"], ["gray", "Leumelan"]]) {
    const skin = catalog.normalizeSkin({ species: "Feathered Zygovo", name: alias, type: "Unknown" });
    assert.equal(skin.name, expected);
    assert.equal(skin.species, "All");
    assert.equal(skin.type, "Exotic");
    assert.equal(catalog.canonicalSkinName(alias), expected.toLowerCase());
  }
  const fox = catalog.normalizeSkin({ species: "Mimikor", name: "Red Grey Fox", type: "Unknown" });
  assert.equal(fox.name, "Red Grey Fox");
  assert.equal(fox.species, "Mimikor");
  assert.equal(fox.type, "Unknown");
  assert.equal(catalog.turntableForSkin({ species: "Feathered Zygovo", name: "Leumelan" }), null);
  assert.ok(catalog.STARTER_SKINS.some((skin) => skin.species === "All" && skin.name === "Leumelan"));
  assert.ok(!catalog.STARTER_SKINS.some((skin) => ["Black", "White", "Grey", "Gray"].includes(skin.name)));
});

test("saved dragon, recessive, upstat, and lineage skin fields use the corrected names", () => {
  const catalog = loadSkinCatalog();
  const original = { id: "legacy-dragon", species: "Feathered Zygovo", skin: "Black", recessiveSkin: "White", status: "Grown", notes: "Keep this dragon" };
  const dragon = catalog.normalizeDragon(original);
  assert.equal(dragon.id, original.id);
  assert.equal(dragon.skin, "Melanistic");
  assert.equal(dragon.recessiveSkin, "Leucistic");
  assert.equal(dragon.notes, original.notes);
  assert.equal(original.skin, "Black", "normalization does not mutate the saved input");
  assert.equal(original.recessiveSkin, "White");
  assert.equal(catalog.normalizeDragon({ species: "Feathered Zygovo", skin: "GREY", recessiveSkin: "gray" }).recessiveSkin, "Leumelan");
  assert.equal(catalog.normalizeUpstat({ id: "legacy-upstat", species: "Feathered Zygovo", skin: "Black" }).skin, "Melanistic");
  assert.equal(catalog.normalizeLineageRecord({ id: "legacy-parent", species: "Feathered Zygovo", skin: "White" }).skin, "Leucistic");
});

test("legacy Black and White catalog records retain their data when no canonical saved record exists", () => {
  const catalog = loadSkinCatalog();
  const saved = [
    { id: "saved-black", species: "Feathered Zygovo", name: "Black", type: "Unknown", owned: true, wishlist: true, notes: "My black acquisition note" },
    { id: "saved-white", species: "Feathered Zygovo", name: "White", type: "Unknown", owned: false, wishlist: true, notes: "My white wishlist note" }
  ];
  const before = JSON.stringify(saved);
  let merged = catalog.mergeSkinCatalog(saved, catalog.STARTER_SKINS);
  for (let load = 0; load < 2; load += 1) {
    for (const [index, name] of ["Melanistic", "Leucistic"].entries()) {
      const record = merged.find((skin) => skin.species === "All" && skin.name === name);
      assert.ok(record);
      for (const field of ["id", "owned", "wishlist", "notes"]) assert.equal(record[field], saved[index][field]);
      assert.equal(record.type, "Exotic");
    }
    assert.ok(!merged.some((skin) => ["Black", "White"].includes(skin.name)));
    merged = catalog.mergeSkinCatalog(merged, catalog.STARTER_SKINS);
  }
  assert.equal(JSON.stringify(saved), before);
});

test("legacy aliases merge with existing shared records without losing either record's notes or flags", () => {
  const catalog = loadSkinCatalog();
  const records = [
    { id: "canonical-melanistic", species: "All", name: "Melanistic", type: "Exotic", owned: false, wishlist: true, notes: "Existing canonical note" },
    { id: "legacy-black", species: "Feathered Zygovo", name: "Black", type: "Unknown", owned: true, wishlist: false, notes: "Legacy black note" },
    { id: "canonical-leucistic", species: "All", name: "Leucistic", type: "Exotic", owned: true, wishlist: false, notes: "Existing white note" },
    { id: "legacy-white", species: "Feathered Zygovo", name: "White", type: "Unknown", owned: false, wishlist: true, notes: "Legacy white note" }
  ];
  for (const saved of [records, [...records].reverse()]) {
    const first = catalog.mergeSkinCatalog(saved, catalog.STARTER_SKINS);
    const second = catalog.mergeSkinCatalog(first, catalog.STARTER_SKINS);
    for (const [name, id, expectedNotes] of [
      ["Melanistic", "canonical-melanistic", ["Existing canonical note", "Legacy black note"]],
      ["Leucistic", "canonical-leucistic", ["Existing white note", "Legacy white note"]]
    ]) {
      const matches = first.filter((skin) => skin.species === "All" && skin.name === name);
      assert.equal(matches.length, 1);
      const skin = matches[0];
      assert.equal(skin.id, id, "existing canonical record keeps its identity regardless of input order");
      assert.equal(skin.owned, true);
      assert.equal(skin.wishlist, true);
      assert.deepEqual(skin.notes.split("\n").sort(), [...expectedNotes].sort());
      const reloaded = second.find((entry) => entry.id === id);
      assert.equal(reloaded.notes, skin.notes, "reloading does not duplicate combined notes");
      assert.equal(reloaded.owned, true);
      assert.equal(reloaded.wishlist, true);
    }
  }
});
