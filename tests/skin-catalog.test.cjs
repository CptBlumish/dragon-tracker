const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const source = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
const indexSource = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");

test("Stardust is available as an Uncommon Shadow Scale skin with a turntable", () => {
  assert.match(source, /species:\s*"Shadow Scale"[\s\S]*?\["Stardust",\s*"Uncommon",\s*"Spawnable"\]/);
  assert.match(source, /\["Shadow Scale::stardust",\s*"shadow-scale\/stardust\.mp4"\]/);
  assert.match(indexSource, /app\.js\?v=20260819-stardust/);
});
