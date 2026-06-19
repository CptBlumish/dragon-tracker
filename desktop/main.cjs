const { app, BrowserWindow, Menu, dialog, shell } = require("electron");
const { autoUpdater } = require("electron-updater");
const path = require("path");

const packageJson = require("../package.json");

let mainWindow = null;
let manualUpdateCheck = false;
let updateDownloadPromptOpen = false;
let updateInstallPromptOpen = false;

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
      sandbox: true
    }
  });

  mainWindow.once("ready-to-show", () => mainWindow.show());
  mainWindow.loadFile(path.join(__dirname, "..", "index.html"));

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) shell.openExternal(url);
    return { action: "deny" };
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

function configureAutoUpdater() {
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on("update-available", async (info) => {
    if (updateDownloadPromptOpen) return;
    updateDownloadPromptOpen = true;
    const result = await showUpdateMessage({
      type: "info",
      buttons: ["Download", "Later"],
      defaultId: 0,
      cancelId: 1,
      title: "Dragon Tracker Update",
      message: `Dragon Tracker ${info.version} is available.`,
      detail: "Download it now? Your local tracker data stays on this machine."
    });
    updateDownloadPromptOpen = false;
    if (result.response === 0) autoUpdater.downloadUpdate();
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

  autoUpdater.on("update-downloaded", async (info) => {
    if (updateInstallPromptOpen) return;
    updateInstallPromptOpen = true;
    const result = await showUpdateMessage({
      type: "info",
      buttons: ["Restart and Install", "Later"],
      defaultId: 0,
      cancelId: 1,
      title: "Dragon Tracker Update Ready",
      message: `Dragon Tracker ${info.version} is ready to install.`,
      detail: "Restart the app now to finish updating."
    });
    updateInstallPromptOpen = false;
    if (result.response === 0) autoUpdater.quitAndInstall(false, true);
  });

  autoUpdater.on("error", (error) => {
    if (!manualUpdateCheck) return;
    manualUpdateCheck = false;
    showUpdateError(error);
  });
}

function checkForUpdates(manual = false) {
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

app.whenReady().then(() => {
  app.setAppUserModelId("com.dragontracker.app");
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
