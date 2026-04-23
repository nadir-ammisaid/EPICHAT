import { app, BrowserWindow, Menu, Tray, nativeImage } from "electron";
import * as path from "node:path";

let tray: Tray | null = null;

export function createTray(
  getMainWindow: () => BrowserWindow | null,
  onQuit: () => void,
): void {
  const iconPath = path.join(__dirname, "assets", "tray-icon.png");
  const icon = nativeImage
    .createFromPath(iconPath)
    .resize({ width: 16, height: 16 });

  if (process.platform === "darwin") {
    icon.setTemplateImage(true);
  }

  tray = new Tray(icon);
  tray.setToolTip("Epichat");

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Afficher Epichat",
      click: () => {
        const win = getMainWindow();
        if (!win) return;
        if (win.isMinimized()) win.restore();
        win.show();
        win.focus();
      },
    },
    { type: "separator" },
    {
      label: "Quitter",
      click: () => {
        onQuit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);

  tray.on("click", () => {
    const win = getMainWindow();
    if (!win) return;
    if (win.isVisible()) {
      win.hide();
    } else {
      win.show();
      win.focus();
    }
  });
}
