import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const DEEP_LINK = Deno.env.get("DRAGON_TRACKER_DEEP_LINK") || "dragontracker://auth/callback";
const STEAM_ENDPOINT = "https://steamcommunity.com/openid/login";
const EXPIRY_MINUTES = 10;
const DEFAULT_RETURN_URL = "dragontracker://auth/callback";

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
  });
}

function b64url(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes)).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

async function sha256(value: string) {
  const buffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(buffer)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function serviceClient() {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) throw new Error("Supabase server secrets are not configured");
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function currentUser(request: Request) {
  const authorization = request.headers.get("Authorization") || "";
  if (!authorization.startsWith("Bearer ")) return null;
  const client = serviceClient();
  const { data, error } = await client.auth.getUser(authorization.slice(7));
  if (error) return null;
  return data.user;
}

function steamUrl(callbackUrl: string) {
  const url = new URL(STEAM_ENDPOINT);
  url.searchParams.set("openid.ns", "http://specs.openid.net/auth/2.0");
  url.searchParams.set("openid.mode", "checkid_setup");
  url.searchParams.set("openid.return_to", callbackUrl);
  url.searchParams.set("openid.realm", new URL(callbackUrl).origin);
  url.searchParams.set("openid.identity", "http://specs.openid.net/auth/2.0/identifier_select");
  url.searchParams.set("openid.claimed_id", "http://specs.openid.net/auth/2.0/identifier_select");
  return url.toString();
}

async function verifySteamAssertion(url: URL) {
  const form = new URLSearchParams();
  url.searchParams.forEach((value, key) => {
    if (key.startsWith("openid.")) form.set(key, value);
  });
  form.set("openid.mode", "check_authentication");

  const response = await fetch(STEAM_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString()
  });
  const body = await response.text();
  if (!response.ok || !/^is_valid:true$/m.test(body)) throw new Error("Steam could not verify this sign-in");

  const claimedId = url.searchParams.get("openid.claimed_id") || "";
  const matched = claimedId.match(/^https:\/\/steamcommunity\.com\/openid\/id\/(\d{17})$/);
  if (!matched) throw new Error("Steam did not return a valid SteamID64");
  return matched[1];
}

function allowedReturnUrl(value: string | null) {
  const candidate = value || DEEP_LINK || DEFAULT_RETURN_URL;
  try {
    const url = new URL(candidate);
    const isDesktop = url.protocol === "dragontracker:" && url.hostname === "auth" && url.pathname === "/callback";
    const isLocalTracker = url.protocol === "http:"
      && (url.hostname === "localhost" || url.hostname === "127.0.0.1")
      && url.port === "8765"
      && url.pathname === "/index.html";
    return isDesktop || isLocalTracker ? url.toString() : (DEEP_LINK || DEFAULT_RETURN_URL);
  } catch (_) {
    return DEEP_LINK || DEFAULT_RETURN_URL;
  }
}

function requestedReturnUrl(request: Request, requestUrl: URL) {
  const explicitReturnUrl = requestUrl.searchParams.get("return_to");
  if (explicitReturnUrl) return allowedReturnUrl(explicitReturnUrl);

  const origin = request.headers.get("origin");
  return origin ? allowedReturnUrl(`${origin.replace(/\/$/, "")}/index.html`) : allowedReturnUrl(null);
}

function finishUrl(returnUrl: string, status: "linked" | "error", message = "") {
  const url = new URL(returnUrl);
  url.searchParams.set("provider", "steam");
  url.searchParams.set("status", status);
  if (message) url.searchParams.set("message", message.slice(0, 160));
  return url.toString();
}

Deno.serve(async (request) => {
  let returnUrl = DEEP_LINK || DEFAULT_RETURN_URL;
  try {
    const requestUrl = new URL(request.url);
    const action = requestUrl.searchParams.get("action");
    const database = serviceClient();

    if (action === "start") {
      const user = await currentUser(request);
      if (!user) return json({ error: "Authentication required" }, 401);
      returnUrl = requestedReturnUrl(request, requestUrl);

      const random = crypto.getRandomValues(new Uint8Array(32));
      const state = b64url(random);
      const stateHash = await sha256(state);
      const expiresAt = new Date(Date.now() + EXPIRY_MINUTES * 60_000).toISOString();
      const { error } = await database.from("identity_link_challenges").insert({
        user_id: user.id,
        provider: "steam",
        state_hash: stateHash,
        expires_at: expiresAt
      });
      if (error) throw error;

      const callbackUrl = new URL(requestUrl.toString());
      callbackUrl.search = "";
      callbackUrl.searchParams.set("action", "callback");
      callbackUrl.searchParams.set("state", state);
      callbackUrl.searchParams.set("return_to", returnUrl);
      return json({ url: steamUrl(callbackUrl.toString()), expiresAt });
    }

    if (action === "callback") {
      returnUrl = allowedReturnUrl(requestUrl.searchParams.get("return_to"));
      const state = requestUrl.searchParams.get("state") || "";
      const stateHash = await sha256(state);
      const { data: challenge, error: challengeError } = await database
        .from("identity_link_challenges")
        .select("id, user_id, expires_at, consumed_at")
        .eq("provider", "steam")
        .eq("state_hash", stateHash)
        .maybeSingle();

      if (challengeError || !challenge || challenge.consumed_at || new Date(challenge.expires_at).getTime() <= Date.now()) {
        return Response.redirect(finishUrl(returnUrl, "error", "The Steam sign-in link expired. Start again from Dragon Tracker."), 302);
      }

      const steamId = await verifySteamAssertion(requestUrl);
      const { error: linkError } = await database.from("identity_links").upsert({
        user_id: challenge.user_id,
        provider: "steam",
        external_id: steamId
      }, { onConflict: "user_id,provider" });
      if (linkError) throw linkError;

      await database.from("identity_link_challenges").update({ consumed_at: new Date().toISOString() }).eq("id", challenge.id);
      return Response.redirect(finishUrl(returnUrl, "linked"), 302);
    }

    return json({ error: "Unknown action" }, 400);
  } catch (error) {
    console.error("steam-openid failed", error);
    return Response.redirect(finishUrl(returnUrl, "error", "Steam linking could not be completed."), 302);
  }
});
