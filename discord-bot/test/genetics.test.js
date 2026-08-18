import test from "node:test";
import assert from "node:assert/strict";

import {
  STAT_FIELDS,
  dragonMatchesFilters,
  inbredPairReason,
  normalizeDragonFilters,
  normalizeDragonGenetics,
  parseStats,
  statProgress,
  validateStats
} from "../src/genetics.js";

function baseDragon(overrides = {}) {
  return {
    name: "Harbinger",
    playerName: "Blumish",
    accountName: "Main",
    species: "Flame Stalker",
    sex: "Male",
    status: "Grown",
    bloodline: "E",
    ...overrides
  };
}

test("Pure fills a missing recessive skin", () => {
  const dragon = normalizeDragonGenetics(baseDragon({ skin: "Ashfall", pointTraits: "Pure" }));
  assert.equal(dragon.recessiveSkin, "Ashfall");
  assert.equal(dragon.nestRole, "Pure");
  assert.ok(dragon.pointTraits.includes("Pure"));
});

test("Pure requires a primary skin", () => {
  assert.throws(
    () => normalizeDragonGenetics(baseDragon({ pointTraits: "Pure" })),
    /primary skin/i
  );
});

test("matching primary and recessive skins automatically become Pure", () => {
  const dragon = normalizeDragonGenetics(baseDragon({ skin: "Ashfall", recessiveSkin: "ashfall" }));
  assert.ok(dragon.pointTraits.includes("Pure"));
  assert.equal(dragon.nestRole, "Pure");
});

test("Dominant promotes a dragon to 4th Pointed and preserves other traits", () => {
  const dragon = normalizeDragonGenetics(baseDragon({ pointTraits: "PvP, Breeder, Dominant" }));
  assert.equal(dragon.status, "4th Pointed");
  assert.deepEqual(dragon.pointTraits, ["PvP", "Breeder", "Dominant"]);
  assert.equal(dragon.dominantMutation, true);
});

test("new dragons default to 18 E stats and remain tagged for upstatting", () => {
  const dragon = normalizeDragonGenetics(baseDragon());
  assert.equal(Object.keys(dragon.stats).length, 18);
  assert.ok(Object.values(dragon.stats).every((grade) => grade === "E"));
  assert.equal(dragon.aPlusCount, 0);
  assert.equal(dragon.upstat, true);
});

test("bloodline must meet the flat letter of every stat", () => {
  assert.throws(
    () => validateStats({ lifeExpectancy: "A-" }, "B"),
    /requires A bloodline or better/
  );
  assert.equal(validateStats({ lifeExpectancy: "B+" }, "B").lifeExpectancy, "B+");
  assert.throws(() => validateStats({ lifeExpectancy: "A+++" }, "A"), /valid grade/i);
  assert.throws(() => normalizeDragonGenetics(baseDragon({ bloodline: "A+" })), /Bloodline must be E, D, C, B, or A/);
});

test("18 A+ is complete and requires A bloodline", () => {
  const stats = validateStats("18x A+", "A");
  assert.equal(Object.keys(stats).length, STAT_FIELDS.length);
  assert.deepEqual(statProgress(stats), { aPlusCount: 18, complete: true, upstat: false });
  assert.throws(() => validateStats("18x A+", "B"), /requires A bloodline or better/);
});

test("A++ requires a recorded 4th-pointed or Elder parent", () => {
  assert.throws(() => validateStats({ lifeExpectancy: "A++" }, "A"), /recorded parent/);
  assert.equal(
    validateStats({ lifeExpectancy: "A++" }, "A", { parentFourthPointed: true }).lifeExpectancy,
    "A++"
  );
});

test("an inbred result forces all 18 stats to F", () => {
  const stats = validateStats("18x A+", "A", { inbred: true });
  assert.ok(Object.values(stats).every((grade) => grade === "F"));
});

test("direct parent-child and sibling pairings are inbred", () => {
  const mother = baseDragon({ name: "Mystic", accountName: "Mystic" });
  const child = baseDragon({ name: "Harbinger", accountName: "Harbinger", motherName: "Mystic", fatherName: "Rook" });
  const sibling = baseDragon({ name: "Ember", accountName: "Ember", motherName: "Mystic", fatherName: "Rook" });
  assert.match(inbredPairReason(mother, child), /child/);
  assert.match(inbredPairReason(child, sibling), /siblings/);
});

test("aunts and grandparents remain valid pairings under the game rule", () => {
  const dragon = baseDragon({ name: "Harbinger", motherName: "Mystic", fatherName: "Rook" });
  const aunt = baseDragon({ name: "Aunt Ember", motherName: "Grand Dam", fatherName: "Grand Sire" });
  const grandparent = baseDragon({ name: "Grand Dam", motherName: "Older Dam", fatherName: "Older Sire" });
  assert.equal(inbredPairReason(dragon, aunt), "");
  assert.equal(inbredPairReason(dragon, grandparent), "");
  assert.equal(inbredPairReason(dragon, baseDragon({ species: "Bio", name: "Mystic", motherName: "Same Dam", fatherName: "Same Sire" })), "");
});

test("one search can combine species, skins, sex, bloodline, points, parents, and upstat", () => {
  const dragon = normalizeDragonGenetics(baseDragon({
    species: "Bio",
    sex: "Female",
    bloodline: "A",
    skin: "Monarch",
    recessiveSkin: "Monarch",
    pointTraits: "Breeder, Dominant",
    motherName: "Mystic",
    fatherName: "Harbinger",
    stats: parseStats("18x A+")
  }));
  const filters = normalizeDragonFilters({
    species: "Bio",
    sex: "Female",
    bloodline: "A",
    skin: "Monarch",
    pointTraits: "Breeder, Pure, Dominant",
    motherName: "Mystic",
    fatherName: "Harbinger",
    upstat: false
  });
  assert.equal(dragonMatchesFilters(dragon, filters), true);
  assert.equal(dragonMatchesFilters(dragon, { ...filters, sex: "Male" }), false);
  assert.throws(() => normalizeDragonFilters({ species: "Not a dragon" }), /valid dragon species/);
  assert.throws(() => normalizeDragonFilters({ bloodline: "A+" }), /Bloodline must be E, D, C, B, or A/);
});
