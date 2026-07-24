const { app, BrowserWindow, Menu, dialog, shell, ipcMain, safeStorage } = require("electron");
const { autoUpdater } = require("electron-updater");
const fs = require("fs");
const path = require("path");

const packageJson = require("../package.json");

let mainWindow = null;
let manualUpdateCheck = false;
let updateDownloadPromptOpen = false;
let updateStatus = {
  phase: "idle",
  version: "",
  percent: 0,
  transferred: 0,
  total: 0,
  bytesPerSecond: 0,
  message: ""
};
let pendingAuthCallbacks = [];

const AUTH_PROTOCOL = "dragontracker";
const SECURE_STORE_FILE = "dragon-tracker-secure.json";
const SECURE_KEYS = new Set(["clan-sync-session", "clan-sync-discord-pkce"]);

function secureStorePath() {
  return path.join(app.getPath("userData"), SECURE_STORE_FILE);
}

function readSecureStore() {
  try {
    const raw = fs.readFileSync(secureStorePath(), "utf8");
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (_) {
    return {};
  }
}

function writeSecureStore(store) {
  fs.writeFileSync(secureStorePath(), JSON.stringify(store), { encoding: "utf8", mode: 0o600 });
}

function ensureSecureStorage() {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error("Secure storage is unavailable on this device. Clan sign-in cannot be saved safely.");
  }
}

function isAllowedSecureKey(key) {
  return typeof key === "string" && SECURE_KEYS.has(key);
}

function isSafeExternalUrl(value) {
  try {
    const url = new URL(value);
    const localHost = url.hostname === "localhost" || url.hostname === "127.0.0.1";
    return url.protocol === "https:" || (url.protocol === "http:" && localHost);
  } catch (_) {
    return false;
  }
}

function isAuthCallback(value) {
  try {
    const url = new URL(value);
    return url.protocol === `${AUTH_PROTOCOL}:` && url.hostname === "auth" && url.pathname === "/callback";
  } catch (_) {
    return false;
  }
}

function forwardAuthCallback(value) {
  if (!isAuthCallback(value)) return;
  if (!mainWindow || mainWindow.isDestroyed()) {
    pendingAuthCallbacks.push(value);
    return;
  }
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.show();
  mainWindow.focus();
  mainWindow.webContents.send("dragon-tracker:auth-callback", value);
}

function registerProtocolHandler() {
  if (process.defaultApp && process.argv.length >= 2) {
    app.setAsDefaultProtocolClient(AUTH_PROTOCOL, process.execPath, [path.resolve(process.argv[1])]);
    return;
  }
  app.setAsDefaultProtocolClient(AUTH_PROTOCOL);
}

function setupSecureIpc() {
  ipcMain.handle("dragon-tracker:secure-get", (_event, key) => {
    if (!isAllowedSecureKey(key)) throw new Error("Unsupported secure storage key.");
    ensureSecureStorage();
    const encrypted = readSecureStore()[key];
    if (!encrypted || typeof encrypted !== "string") return "";
    return safeStorage.decryptString(Buffer.from(encrypted, "base64"));
  });

  ipcMain.handle("dragon-tracker:secure-set", (_event, key, value) => {
    if (!isAllowedSecureKey(key) || typeof value !== "string" || value.length > 65536) {
      throw new Error("Unsupported secure storage value.");
    }
    ensureSecureStorage();
    const store = readSecureStore();
    store[key] = safeStorage.encryptString(value).toString("base64");
    writeSecureStore(store);
  });

  ipcMain.handle("dragon-tracker:secure-delete", (_event, key) => {
    if (!isAllowedSecureKey(key)) throw new Error("Unsupported secure storage key.");
    const store = readSecureStore();
    delete store[key];
    writeSecureStore(store);
  });

  ipcMain.handle("dragon-tracker:open-external", (_event, url) => {
    if (!isSafeExternalUrl(url)) throw new Error("Only secure web links can be opened from Dragon Tracker.");
    return shell.openExternal(url);
  });

  ipcMain.handle("dragon-tracker:get-update-status", () => ({ ...updateStatus }));

  ipcMain.handle("dragon-tracker:install-update", () => {
    if (updateStatus.phase !== "downloaded") {
      throw new Error("No downloaded update is ready to install.");
    }
    setImmediate(() => autoUpdater.quitAndInstall(false, true));
    return true;
  });
}

function releaseUrl() {
  const publish = Array.isArray(packageJson.build?.publish)
    ? packageJson.build.publish[0]
    : packageJson.build?.publish;
  const owner = publish?.owner;
  const repo = publish?.repo;
  if (!owner || !repo || owner === "YOUR_GITHUB_USERNAME") return "";
  return `https://github.com/${owner}/${repo}/releases`;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 900,
    minWidth: 980,
    minHeight: 680,
    title: "Dragon Tracker",
    backgroundColor: "#050403",
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: path.join(__dirname, "preload.cjs")
    }
  });

  mainWindow.once("ready-to-show", () => mainWindow.show());
  mainWindow.loadFile(path.join(__dirname, "..", "index.html"), {
    query: { appVersion: app.getVersion() }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.webContents.once("did-finish-load", () => {
    pendingAuthCallbacks.forEach((callback) => mainWindow?.webContents.send("dragon-tracker:auth-callback", callback));
    pendingAuthCallbacks = [];
    mainWindow?.webContents.send("dragon-tracker:update-status", updateStatus);
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function buildMenu() {
  const isMac = process.platform === "darwin";
  const releases = releaseUrl();
  const viewMenu = {
    label: "View",
    submenu: [
      { role: "reload" },
      { role: "forceReload" },
      { type: "separator" },
      { role: "resetZoom" },
      { role: "zoomIn" },
      { role: "zoomOut" },
      { type: "separator" },
      { role: "togglefullscreen" }
    ]
  };
  if (!app.isPackaged) {
    viewMenu.submenu.push(
      { type: "separator" },
      { role: "toggleDevTools" }
    );
  }

  const template = [
    ...(isMac ? [{
      label: "Dragon Tracker",
      submenu: [
        { role: "about" },
        { type: "separator" },
        { role: "services" },
        { type: "separator" },
        { role: "hide" },
        { role: "hideOthers" },
        { role: "unhide" },
        { type: "separator" },
        { role: "quit" }
      ]
    }] : []),
    {
      label: "File",
      submenu: [
        isMac ? { role: "close" } : { role: "quit" }
      ]
    },
    viewMenu,
    {
      label: "Help",
      submenu: [
        {
          label: "Check for Updates",
          click: () => checkForUpdates(true)
        },
        ...(releases ? [{
          label: "Open GitHub Releases",
          click: () => shell.openExternal(releases)
        }] : [])
      ]
    }
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function showUpdateMessage(options) {
  const target = mainWindow || BrowserWindow.getFocusedWindow();
  if (target) return dialog.showMessageBox(target, options);
  return dialog.showMessageBox(options);
}

function updateErrorDetail(error) {
  const message = error?.message || String(error || "");
  if (/\b404\b/.test(message)) {
    return "The update feed returned 404. This usually means the GitHub repository or release is private, unpublished, or not reachable by the desktop app.";
  }
  if (/ENOTFOUND|ECONNREFUSED|ETIMEDOUT|network|offline/i.test(message)) {
    return "Check your internet connection and try again.";
  }
  return "The update feed did not respond in a way Dragon Tracker could use. Try again later or open GitHub Releases from the Help menu.";
}

function showUpdateError(error) {
  showUpdateMessage({
    type: "warning",
    buttons: ["OK"],
    title: "Could Not Check for Updates",
    message: "Dragon Tracker could not reach the update feed.",
    detail: updateErrorDetail(error)
  });
}

function publishUpdateStatus(nextStatus) {
  updateStatus = {
    ...updateStatus,
    ...nextStatus,
    percent: Math.max(0, Math.min(100, Number(nextStatus.percent ?? updateStatus.percent) || 0)),
    transferred: Math.max(0, Number(nextStatus.transferred ?? updateStatus.transferred) || 0),
    total: Math.max(0, Number(nextStatus.total ?? updateStatus.total) || 0),
    bytesPerSecond: Math.max(0, Number(nextStatus.bytesPerSecond ?? updateStatus.bytesPerSecond) || 0)
  };
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("dragon-tracker:update-status", updateStatus);
  }
}

function beginUpdateDownload(info) {
  if (updateStatus.phase === "downloading" || updateStatus.phase === "downloaded") return;

  manualUpdateCheck = false;
  publishUpdateStatus({
    phase: "downloading",
    version: info?.version || updateStatus.version || "",
    percent: 0,
    transferred: 0,
    total: 0,
    bytesPerSecond: 0,
    message: "Preparing download"
  });

  Promise.resolve(autoUpdater.downloadUpdate()).catch(reportUpdaterError);
}

function reportUpdaterError(error) {
  const wasDownloading = updateStatus.phase === "downloading";
  const wasAlreadyReported = updateStatus.phase === "error";
  const shouldReport = manualUpdateCheck || wasDownloading;
  if (shouldReport) {
    publishUpdateStatus({
      phase: "error",
      bytesPerSecond: 0,
      message: updateErrorDetail(error)
    });
  }
  if (shouldReport && !wasAlreadyReported) showUpdateError(error);
  manualUpdateCheck = false;
}

function configureAutoUpdater() {
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on("update-available", async (info) => {
    if (updateDownloadPromptOpen || updateStatus.phase === "downloading" || updateStatus.phase === "downloaded") return;
    updateDownloadPromptOpen = true;
    try {
      const result = await showUpdateMessage({
        type: "info",
        buttons: ["Download", "Later"],
        defaultId: 0,
        cancelId: 1,
        title: "Dragon Tracker Update",
        message: `Dragon Tracker ${info.version} is available.`,
        detail: "Download it now? Your local tracker data stays on this machine."
      });
      if (result.response === 0) beginUpdateDownload(info);
    } finally {
      updateDownloadPromptOpen = false;
      manualUpdateCheck = false;
    }
  });

  autoUpdater.on("update-not-available", () => {
    if (!manualUpdateCheck) return;
    manualUpdateCheck = false;
    showUpdateMessage({
      type: "info",
      buttons: ["OK"],
      title: "Dragon Tracker",
      message: "Dragon Tracker is already up to date."
    });
  });

  autoUpdater.on("download-progress", (progress) => {
    publishUpdateStatus({
      phase: "downloading",
      percent: progress?.percent,
      transferred: progress?.transferred,
      total: progress?.total,
      bytesPerSecond: progress?.bytesPerSecond,
      message: "Downloading update"
    });
  });

  autoUpdater.on("update-downloaded", (info) => {
    manualUpdateCheck = false;
    publishUpdateStatus({
      phase: "downloaded",
      version: info?.version || updateStatus.version || "",
      percent: 100,
      bytesPerSecond: 0,
      message: "Update downloaded"
    });
  });

  autoUpdater.on("error", reportUpdaterError);
}

function checkForUpdates(manual = false) {
  if (updateStatus.phase === "downloading") {
    if (manual) {
      showUpdateMessage({
        type: "info",
        buttons: ["OK"],
        title: "Dragon Tracker Update",
        message: "An update is already downloading.",
        detail: "Use the download progress screen to follow it."
      });
    }
    return;
  }

  if (updateStatus.phase === "downloaded") {
    if (manual) {
      showUpdateMessage({
        type: "info",
        buttons: ["OK"],
        title: "Dragon Tracker Update Ready",
        message: "An update is ready to install.",
        detail: "Use the update progress screen to restart when you are ready."
      });
    }
    return;
  }

  manualUpdateCheck = manual;
  if (!app.isPackaged) {
    if (manual) {
      showUpdateMessage({
        type: "info",
        buttons: ["OK"],
        title: "Development Build",
        message: "Updates are only checked in packaged Dragon Tracker builds."
      });
    }
    return;
  }

  autoUpdater.checkForUpdates().catch((error) => {
    if (!manual) return;
    manualUpdateCheck = false;
    showUpdateError(error);
  });
}

const singleInstanceLock = app.requestSingleInstanceLock();
if (!singleInstanceLock) {
  app.quit();
} else {
  app.on("second-instance", (_event, commandLine) => {
    const callback = commandLine.find(isAuthCallback);
    if (callback) forwardAuthCallback(callback);
    else if (mainWindow && !mainWindow.isDestroyed()) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.on("open-url", (event, url) => {
    event.preventDefault();
    forwardAuthCallback(url);
  });
}

app.whenReady().then(() => {
  app.setAppUserModelId("com.dragontracker.app");
  registerProtocolHandler();
  setupSecureIpc();
  buildMenu();
  configureAutoUpdater();
  createWindow();

  setTimeout(() => checkForUpdates(false), 3000);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
