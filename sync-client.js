(() => {
  "use strict";

  const CONFIG_KEY = "dragon-tracker.sync-config.v1";
  const FALLBACK_SESSION_KEY = "dragon-tracker.sync-session.v1";
  const SESSION_STORE_KEY = "clan-sync-session";
  const PKCE_STORE_KEY = "clan-sync-discord-pkce";

  function cleanText(value, max = 500) {
    return String(value ?? "").trim().slice(0, max);
  }

  function base64Url(bytes) {
    let binary = "";
    bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
    return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
  }

  function randomVerifier() {
    const bytes = crypto.getRandomValues(new Uint8Array(48));
    return base64Url(bytes);
  }

  async function sha256Base64Url(value) {
    const buffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
    return base64Url(new Uint8Array(buffer));
  }

  function normalizeConfig(input = {}) {
    const url = cleanText(input.url, 500).replace(/\/$/, "");
    const anonKey = cleanText(input.anonKey, 4000);
    let parsed = null;
    try { parsed = url ? new URL(url) : null; } catch (_) { parsed = null; }
    const isLocal = parsed?.hostname === "localhost" || parsed?.hostname === "127.0.0.1";
    const validUrl = Boolean(parsed && (parsed.protocol === "https:" || (isLocal && parsed.protocol === "http:")));
    return { url: validUrl ? parsed.toString().replace(/\/$/, "") : "", anonKey };
  }

  async function secureGet(key) {
    if (window.dragonTrackerDesktop?.secureGet) return window.dragonTrackerDesktop.secureGet(key);
    return sessionStorage.getItem(`${FALLBACK_SESSION_KEY}:${key}`);
  }

  async function secureSet(key, value) {
    if (window.dragonTrackerDesktop?.secureSet) return window.dragonTrackerDesktop.secureSet(key, value);
    sessionStorage.setItem(`${FALLBACK_SESSION_KEY}:${key}`, value);
  }

  async function secureDelete(key) {
    if (window.dragonTrackerDesktop?.secureDelete) return window.dragonTrackerDesktop.secureDelete(key);
    sessionStorage.removeItem(`${FALLBACK_SESSION_KEY}:${key}`);
  }

  function openExternal(url) {
    if (window.dragonTrackerDesktop?.openExternal) return window.dragonTrackerDesktop.openExternal(url);
    window.open(url, "_blank", "noopener,noreferrer");
    return Promise.resolve();
  }

  function discordRedirectUrl() {
    if (window.dragonTrackerDesktop?.isDesktop) return "dragontracker://auth/callback";

    const current = new URL(window.location.href);
    if (current.protocol !== "http:" && current.protocol !== "https:") {
      throw new Error("Open the local tracker through http://localhost or http://127.0.0.1 before connecting Discord.");
    }
    return `${current.origin}${current.pathname}`;
  }

  class DragonTrackerSyncClient {
    getConfig() {
      try {
        return normalizeConfig(JSON.parse(localStorage.getItem(CONFIG_KEY) || "{}"));
      } catch (_) {
        return normalizeConfig();
      }
    }

    saveConfig(input) {
      const config = normalizeConfig(input);
      if (!config.url || !config.anonKey) throw new Error("Enter a valid sync address and connection key.");
      localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
      return config;
    }

    clearConfig() {
      localStorage.removeItem(CONFIG_KEY);
    }

    isConfigured() {
      const config = this.getConfig();
      return Boolean(config.url && config.anonKey);
    }

    async getSession() {
      const raw = await secureGet(SESSION_STORE_KEY);
      if (!raw) return null;
      try {
        const session = JSON.parse(raw);
        if (!session?.access_token || !session?.refresh_token) return null;
        return session;
      } catch (_) {
        await secureDelete(SESSION_STORE_KEY);
        return null;
      }
    }

    async setSession(session) {
      if (!session?.access_token || !session?.refresh_token) throw new Error("The sign-in response did not include a usable session.");
      await secureSet(SESSION_STORE_KEY, JSON.stringify(session));
      return session;
    }

    async getUsableSession() {
      const session = await this.getSession();
      if (!session) return null;
      const expiresAt = Number(session.expires_at || 0) * 1000;
      if (!expiresAt || expiresAt > Date.now() + 60_000) return session;
      try {
        const refreshed = await this.request("/auth/v1/token?grant_type=refresh_token", {
          method: "POST",
          body: JSON.stringify({ refresh_token: session.refresh_token })
        });
        return this.setSession(refreshed);
      } catch (error) {
        await secureDelete(SESSION_STORE_KEY);
        throw error;
      }
    }

    async signOut() {
      const session = await this.getSession();
      if (session && this.isConfigured()) {
        try { await this.request("/auth/v1/logout", { method: "POST" }, true); } catch (_) { /* Local removal still protects the device. */ }
      }
      await secureDelete(SESSION_STORE_KEY);
      await secureDelete(PKCE_STORE_KEY);
    }

    async request(path, options = {}, requireAuth = false) {
      const config = this.getConfig();
      if (!config.url || !config.anonKey) throw new Error("Clan sync has not been connected yet.");

      const headers = new Headers(options.headers || {});
      headers.set("apikey", config.anonKey);
      headers.set("Accept", "application/json");
      if (options.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");

      if (requireAuth) {
        const session = await this.getUsableSession();
        if (!session?.access_token) throw new Error("Connect Discord before using clan sync.");
        headers.set("Authorization", `Bearer ${session.access_token}`);
      }

      const response = await fetch(`${config.url}${path}`, { ...options, headers });
      const text = await response.text();
      let payload = null;
      try { payload = text ? JSON.parse(text) : null; } catch (_) { payload = text; }
      if (!response.ok) {
        const message = typeof payload === "object" && payload ? (payload.message || payload.error || payload.msg) : "";
        if (response.status === 401) await secureDelete(SESSION_STORE_KEY);
        throw new Error(message || `Secure sync request failed (${response.status}).`);
      }
      return payload;
    }

    async getCurrentUser() {
      const session = await this.getSession();
      if (!session) return null;
      const user = await this.request("/auth/v1/user", { method: "GET" }, true);
      return user || null;
    }

    async upsertProfile(displayName) {
      const user = await this.getCurrentUser();
      if (!user) throw new Error("Connect Discord before setting up your profile.");
      const profileName = cleanText(displayName || user.user_metadata?.full_name || user.user_metadata?.name || "Tracker Member", 80) || "Tracker Member";
      await this.request("/rest/v1/profiles?on_conflict=id", {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify({ id: user.id, display_name: profileName })
      }, true);
      return user;
    }

    async startDiscordSignIn() {
      const config = this.getConfig();
      if (!config.url || !config.anonKey) throw new Error("Connect sync before connecting Discord.");
      const verifier = randomVerifier();
      const challenge = await sha256Base64Url(verifier);
      await secureSet(PKCE_STORE_KEY, verifier);
      const redirectTo = discordRedirectUrl();
      const url = new URL(`${config.url}/auth/v1/authorize`);
      url.searchParams.set("provider", "discord");
      url.searchParams.set("redirect_to", redirectTo);
      url.searchParams.set("code_challenge", challenge);
      url.searchParams.set("code_challenge_method", "s256");
      await openExternal(url.toString());
    }

    async finishDiscordSignIn(callbackUrl) {
      const parsed = new URL(callbackUrl);
      const error = parsed.searchParams.get("error_description") || parsed.searchParams.get("error");
      if (error) throw new Error(error);
      const code = parsed.searchParams.get("code");
      if (!code) throw new Error("Discord did not return a sign-in code.");
      const verifier = await secureGet(PKCE_STORE_KEY);
      if (!verifier) throw new Error("The Discord sign-in session expired. Start the connection again.");
      const session = await this.request("/auth/v1/token?grant_type=pkce", {
        method: "POST",
        body: JSON.stringify({ auth_code: code, code_verifier: verifier })
      });
      await this.setSession(session);
      await secureDelete(PKCE_STORE_KEY);
      return session;
    }

    async startSteamLink() {
      const result = await this.request("/functions/v1/steam-openid?action=start", { method: "POST" }, true);
      if (!result?.url) throw new Error("Steam linking did not return a sign-in address.");
      await openExternal(result.url);
    }

    async rpc(name, params = {}) {
      return this.request(`/rest/v1/rpc/${encodeURIComponent(name)}`, {
        method: "POST",
        body: JSON.stringify(params)
      }, true);
    }

    async getIdentityLinks() {
      return this.request("/rest/v1/identity_links?select=provider,external_id,linked_at&order=linked_at.desc", { method: "GET" }, true);
    }

    async getMemberships() {
      return this.request("/rest/v1/clan_memberships?select=clan_id,role,status,joined_at,clans(id,name,created_at)&status=eq.active&order=joined_at.asc", { method: "GET" }, true);
    }

    async getClanMembers(clanId) {
      return this.rpc("list_clan_members", { p_clan_id: clanId });
    }

    async createClan(name) {
      return this.rpc("create_clan", { p_name: cleanText(name, 60) });
    }

    async createInvite(clanId, maxUses = 1) {
      return this.rpc("create_clan_invite", { p_clan_id: clanId, p_max_uses: Number(maxUses) || 1, p_expires_at: null });
    }

    async joinClan(inviteCode) {
      return this.rpc("join_clan_with_invite", { p_invite_code: cleanText(inviteCode, 100) });
    }

    async leaveClan(clanId) {
      return this.rpc("leave_clan", { p_clan_id: clanId });
    }

    async setClanMemberRole(clanId, userId, role) {
      return this.rpc("set_clan_member_role", { p_clan_id: clanId, p_user_id: userId, p_role: role });
    }

    async transferClanOwnership(clanId, userId) {
      return this.rpc("transfer_clan_ownership", { p_clan_id: clanId, p_new_owner_id: userId });
    }

    async getSharedDragons(clanId) {
      return this.request(`/rest/v1/shared_dragons?select=id,source_user_id,source_local_id,summary,updated_at&clan_id=eq.${encodeURIComponent(clanId)}&order=updated_at.desc`, { method: "GET" }, true);
    }

    async shareDragon(clanId, sourceLocalId, summary) {
      const user = await this.getCurrentUser();
      if (!user) throw new Error("Connect Discord before sharing a dragon.");
      return this.request("/rest/v1/shared_dragons?on_conflict=clan_id,source_user_id,source_local_id", {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates,return=representation" },
        body: JSON.stringify({ clan_id: clanId, source_user_id: user.id, source_local_id: cleanText(sourceLocalId, 160), summary })
      }, true);
    }

    async unshareDragon(recordId) {
      return this.request(`/rest/v1/shared_dragons?id=eq.${encodeURIComponent(recordId)}`, { method: "DELETE", headers: { Prefer: "return=minimal" } }, true);
    }

    async getClanMapPins(clanId) {
      return this.request(`/rest/v1/clan_map_pins?select=id,source_user_id,source_local_id,label,pin_type,x,y,notes,updated_at&clan_id=eq.${encodeURIComponent(clanId)}&order=updated_at.desc`, { method: "GET" }, true);
    }

    async shareMapPin(clanId, pin) {
      const user = await this.getCurrentUser();
      if (!user) throw new Error("Connect Discord before sharing a map pin.");
      return this.request("/rest/v1/clan_map_pins?on_conflict=clan_id,source_user_id,source_local_id", {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates,return=representation" },
        body: JSON.stringify({
          clan_id: clanId,
          source_user_id: user.id,
          source_local_id: cleanText(pin.id, 160),
          label: cleanText(pin.label, 80),
          pin_type: cleanText(pin.type || "Location", 40),
          x: Number(pin.x),
          y: Number(pin.y),
          notes: cleanText(pin.notes, 500)
        })
      }, true);
    }

    async unshareMapPin(recordId) {
      return this.request(`/rest/v1/clan_map_pins?id=eq.${encodeURIComponent(recordId)}`, { method: "DELETE", headers: { Prefer: "return=minimal" } }, true);
    }
  }

  window.DragonTrackerSyncClient = DragonTrackerSyncClient;
})();
