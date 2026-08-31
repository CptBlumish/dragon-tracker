const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");

test("grid and dropdown species follow the in-game selection order", () => {
  const defaults = source.match(/^const DEFAULT_SPECIES = \[[\s\S]*?^\];/m);
  const collect = source.match(/^function collectSpeciesNames\(\) \{[\s\S]*?^\}/m);
  assert.ok(defaults, "shared species list is present");
  assert.ok(collect, "shared species collector is present");
  const names = vm.runInNewContext(`${defaults[0]}\n${collect[0]}\ncollectSpeciesNames()`);

  assert.deepEqual(Array.from(names), [
    "Flame Stalker",
    "Shadow Scale",
    "Acid Spitter",
    "Inferno Ravager",
    "Bio",
    "Blitz Striker",
    "Brood Watcher",
    "Singe Crest",
    "Feathered Zygovo",
    "Mimikor"
  ]);
});
