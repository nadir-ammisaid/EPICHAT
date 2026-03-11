"use client";

import { useCallback, useEffect, useState } from "react";

export const NOTIFICATION_PREF_KEYS = {
  enabled: "epichat_notifications_enabled",
  dm: "epichat_notifications_dm",
  mentions: "epichat_notifications_mentions",
} as const;

const DEFAULT_ENABLED = true;
const DEFAULT_DM = true;
const DEFAULT_MENTIONS = true;

function readBool(key: string, defaultValue: boolean): boolean {
  if (typeof window === "undefined") return defaultValue;
  const v = localStorage.getItem(key);
  if (v === null) return defaultValue;
  return v === "true";
}

function writeBool(key: string, value: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, String(value));
}

export type NotificationPreferences = {
  enabled: boolean;
  dm: boolean;
  mentions: boolean;
};

const defaultPrefs: NotificationPreferences = {
  enabled: DEFAULT_ENABLED,
  dm: DEFAULT_DM,
  mentions: DEFAULT_MENTIONS,
};

export function useNotificationPreferences() {
  const [mounted, setMounted] = useState(false);
  const [prefs, setPrefs] = useState<NotificationPreferences>(defaultPrefs);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    setPrefs({
      enabled: readBool(NOTIFICATION_PREF_KEYS.enabled, DEFAULT_ENABLED),
      dm: readBool(NOTIFICATION_PREF_KEYS.dm, DEFAULT_DM),
      mentions: readBool(NOTIFICATION_PREF_KEYS.mentions, DEFAULT_MENTIONS),
    });
  }, [mounted]);

  const setEnabled = useCallback((value: boolean) => {
    writeBool(NOTIFICATION_PREF_KEYS.enabled, value);
    setPrefs((p) => ({ ...p, enabled: value }));
  }, []);

  const setDm = useCallback((value: boolean) => {
    writeBool(NOTIFICATION_PREF_KEYS.dm, value);
    setPrefs((p) => ({ ...p, dm: value }));
  }, []);

  const setMentions = useCallback((value: boolean) => {
    writeBool(NOTIFICATION_PREF_KEYS.mentions, value);
    setPrefs((p) => ({ ...p, mentions: value }));
  }, []);

  return {
    preferences: prefs,
    setEnabled,
    setDm,
    setMentions,
    mounted,
  };
}

export function getNotificationPreferences(): NotificationPreferences {
  return {
    enabled: readBool(NOTIFICATION_PREF_KEYS.enabled, DEFAULT_ENABLED),
    dm: readBool(NOTIFICATION_PREF_KEYS.dm, DEFAULT_DM),
    mentions: readBool(NOTIFICATION_PREF_KEYS.mentions, DEFAULT_MENTIONS),
  };
}
