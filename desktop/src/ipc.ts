import { ipcMain, Notification } from "electron";

export function registerIpcHandlers(): void {
  ipcMain.handle(
    "notify",
    (_event, title: string, body: string): boolean => {
      if (!Notification.isSupported()) {
        console.warn("[ipc] Notifications not supported on this OS");
        return false;
      }

      const notification = new Notification({
        title,
        body,
        silent: false,
      });

      notification.show();
      return true;
    },
  );
}
