const { contextBridge, ipcRenderer } = require("electron");

const allowedKeys = new Set(["clan-sync-session", "clan-sync-discord-pkce"]);

function keyIsAllowed(key) {
  return typeof key === "string" && allowedKeys.has(key);
}

contextBridge.exposeInMainWorld("dragonTrackerDesktop", {
  isDesktop: true,
  secureGet(key) {
    if (!keyIsAllowed(key)) return Promise.reject(new Error("Unsupported secure storage key."));
    return ipcRenderer.invoke("dragon-tracker:secure-get", key);
  },
  secureSet(key, value) {
    if (!keyIsAllowed(key) || typeof value !== "string" || value.length > 65536) {
      return Promise.reject(new Error("Unsupported secure storage value."));
    }
    return ipcRenderer.invoke("dragon-tracker:secure-set", key, value);
  },
  secureDelete(key) {
    if (!keyIsAllowed(key)) return Promise.reject(new Error("Unsupported secure storage key."));
    return ipcRenderer.invoke("dragon-tracker:secure-delete", key);
  },
  openExternal(url) {
    return ipcRenderer.invoke("dragon-tracker:open-external", url);
  },
  onAuthCallback(callback) {
    if (typeof callback !== "function") return () => {};
    const listener = (_event, url) => callback(url);
    ipcRenderer.on("dragon-tracker:auth-callback", listener);
    return () => ipcRenderer.removeListener("dragon-tracker:auth-callback", listener);
  }
});
