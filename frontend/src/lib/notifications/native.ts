"use client";

export type NotificationPermission = "granted" | "denied" | "default";

export function isSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getPermission(): NotificationPermission {
  if (!isSupported()) return "denied";
  return Notification.permission as NotificationPermission;
}

export function requestPermission(): Promise<NotificationPermission> {
  if (!isSupported()) return Promise.resolve("denied");
  return Notification.requestPermission() as Promise<NotificationPermission>;
}

export type ShowNotificationOptions = {
  body?: string;
  tag?: string;
  silent?: boolean;
};

const DEBUG_NOTIF = false;
const log = (...args: unknown[]) =>
  DEBUG_NOTIF && console.log("[Notifications native]", ...args);

export function showNotification(
  title: string,
  options?: ShowNotificationOptions,
): void {
  if (!isSupported()) {
    log("showNotification ignoré: API non supportée");
    return;
  }
  if (getPermission() !== "granted") {
    log(
      "showNotification ignoré: permission",
      getPermission(),
      "(titre:",
      title,
      ")",
    );
    return;
  }
  try {
    const n = new Notification(title, {
      body: options?.body,
      tag: options?.tag ?? "epichat",
      silent: options?.silent ?? false,
    });
    n.onclick = () => {
      window.focus();
      n.close();
    };
    log("Notification affichée:", title, options?.body);
  } catch (e) {
    log("Erreur affichage notification", e);
  }
}
