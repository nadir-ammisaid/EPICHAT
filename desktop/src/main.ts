import { app, BrowserWindow } from "electron";
import * as path from "node:path";
import { createTray } from "./tray";

const FRONTEND_URL = "http://localhost:3000";
const APP_ID = "com.epichat.desktop";

let mainWindow: BrowserWindow | null = null;
let isQuitting = false;

function loadFrontend(): void {
  if (!mainWindow) return;
  mainWindow.loadURL(FRONTEND_URL);
}

function loadErrorPage(): void {
  if (!mainWindow) return;
  mainWindow.loadFile(path.join(__dirname, "error.html"));
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    title: "Epichat",
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.once("ready-to-show", () => mainWindow?.show());

  mainWindow.on("close", (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  mainWindow.webContents.on(
    "did-fail-load",
    (_event, errorCode, errorDescription, validatedURL, isMainFrame) => {
      if (!isMainFrame) return;
      if (validatedURL.startsWith("file://")) return;
      console.warn(
        `[main] Frontend load failed (${errorCode} ${errorDescription}) → fallback`,
      );
      loadErrorPage();
    },
  );

  loadFrontend();
}

app.setAppUserModelId(APP_ID);

app.whenReady().then(() => {
  createWindow();
  createTray(
    () => mainWindow,
    () => {
      isQuitting = true;
      app.quit();
    },
  );
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  
});
