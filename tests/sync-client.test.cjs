const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");
const { webcrypto } = require("node:crypto");

const source = fs.readFileSync(path.join(__dirname, "..", "sync-client.js"), "utf8");

function createStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); }
  };
}

function createClient(savedConfig = null) {
  const localStorage = createStorage(savedConfig ? {
    "dragon-tracker.sync-config.v1": JSON.stringify(savedConfig)
  } : {});
  const sessionStorage = createStorage();
  const secureValues = new Map();
  const openedUrls = [];
  const window = {
    dragonTrackerDesktop: {
      isDesktop: true,
      secureGet: async (key) => secureValues.get(key) || null,
      secureSet: async (key, value) => { secureValues.set(key, value); },
      secureDelete: async (key) => { secureValues.delete(key); },
      openExternal: async (url) => { openedUrls.push(url); }
    }
  };
  const context = vm.createContext({
    Headers,
    TextEncoder,
    URL,
    btoa: (value) => Buffer.from(value, "binary").toString("base64"),
    crypto: webcrypto,
    fetch,
    localStorage,
    sessionStorage,
    window
  });
  vm.runInContext(source, context, { filename: "sync-client.js" });
  return {
    client: new window.DragonTrackerSyncClient(),
    openedUrls,
    secureValues
  };
}

test("uses the official sync service without member configuration", () => {
  const { client } = createClient();
  const config = client.getConfig();
  assert.equal(config.url, "https://iigmqyvtiqrbmwanfezx.supabase.co");
  assert.ok(config.anonKey.startsWith("eyJ"));
  assert.equal(client.isConfigured(), true);
  assert.equal(client.isUsingOfficialConfig(), true);
});

test("repairs a stale official-project address or public key", () => {
  const { client } = createClient({
    url: "https://iigmqyvtiqrbmwanfezx.supabase.co/rest/v1/wrong",
    anonKey: "mistyped-key"
  });
  const config = client.getConfig();
  assert.equal(config.url, "https://iigmqyvtiqrbmwanfezx.supabase.co");
  assert.notEqual(config.anonKey, "mistyped-key");
  assert.equal(client.isUsingOfficialConfig(), true);
});

test("preserves an organizer's deliberate custom sync service", () => {
  const custom = { url: "https://example.supabase.co", anonKey: "public-custom-key" };
  const { client } = createClient(custom);
  assert.equal(client.getConfig().url, custom.url);
  assert.equal(client.getConfig().anonKey, custom.anonKey);
  assert.equal(client.getCustomConfig().url, custom.url);
  assert.equal(client.getCustomConfig().anonKey, custom.anonKey);
  assert.equal(client.isUsingOfficialConfig(), false);
});

test("holds a one-use invitation through Discord sign-in and redeems it once", async () => {
  const { client, openedUrls, secureValues } = createClient();
  await client.startDiscordSignIn({ inviteCode: "INVITE-123" });
  assert.equal(secureValues.get("clan-sync-pending-invite"), "INVITE-123");
  assert.equal(openedUrls.length, 1);

  let receivedCode = "";
  client.joinClan = async (inviteCode) => {
    receivedCode = inviteCode;
    return { id: "joined-clan" };
  };
  assert.deepEqual(await client.redeemPendingInvite(), { id: "joined-clan" });
  assert.equal(receivedCode, "INVITE-123");
  assert.equal(secureValues.has("clan-sync-pending-invite"), false);
  assert.equal(await client.redeemPendingInvite(), null);
});
