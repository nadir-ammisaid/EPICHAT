"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import parseDashboardPath from "@/lib/utils/parseDashboardPath";
import { getSocket } from "@/lib/socket/socket";
import {
  SOCKET_EVENTS,
  type MessagePayload,
  type DmMessagePayload,
} from "@/lib/socket/socket.events";
import { getNotificationPreferences } from "@/lib/notifications/preferences";
import { showNotification as showNativeNotification } from "@/lib/notifications/native";
import { apiClient } from "@/lib/api/client";
import { getConversations } from "@/lib/api/dm";
import { getChannelDetails } from "@/lib/api/channels";
import { getServerDetails } from "@/lib/api/servers";

const DEBUG_NOTIF = true;
const log = (...args: unknown[]) =>
  DEBUG_NOTIF && console.log("[Notifications]", ...args);

const MAX_BODY_LENGTH = 80;

function snippet(text: string): string {
  const t = text.replace(/\s+/g, " ").trim();
  return t.length <= MAX_BODY_LENGTH ? t : t.slice(0, MAX_BODY_LENGTH) + "…";
}

function isMention(content: string, username: string): boolean {
  if (!username) return false;
  const regex = new RegExp(
    `@${username.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
    "i",
  );
  return regex.test(content);
}

type NotificationsContextValue = {
  hasUnread: boolean;
  markAllRead: () => void;
  notifications: NotificationItem[];
  clearAll: () => void;
};

const NotificationsContext = createContext<
  NotificationsContextValue | undefined
>(undefined);

type NotificationItem = {
  id: string;
  type: "channel" | "dm";
  title: string;
  body: string;
  href?: string;
  createdAt: string;
};

export function NotificationsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [hasUnread, setHasUnread] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [myUsername, setMyUsername] = useState<string | null>(null);
  const pathname = usePathname();
  const { serverId, channelId } = parseDashboardPath(pathname ?? "");

  const channelIdRef = useRef(channelId);
  const serverIdRef = useRef(serverId);
  const myUsernameRef = useRef(myUsername);
  const notificationsRef = useRef<NotificationItem[]>([]);
  channelIdRef.current = channelId;
  serverIdRef.current = serverId;
  myUsernameRef.current = myUsername;
  notificationsRef.current = notifications;

  log("Provider render", {
    pathname,
    serverId,
    channelId,
    myUsername,
    hasUnread,
  });

  useEffect(() => {
    apiClient
      .request("/me")
      .then((data: { username?: string }) => {
        setMyUsername(data?.username ?? null);
        log("GET /me → myUsername", data?.username ?? null);
      })
      .catch((err) => log("GET /me error", err));
  }, []);

  useEffect(() => {
    const socket = getSocket();
    log("Socket ref", { connected: socket.connected, id: socket.id });
    const onConnect = () => {
      log("Socket connect", socket.id);
      apiClient
        .request("/servers")
        .then((servers: { id: string }[] | unknown) => {
          const list = Array.isArray(servers) ? servers : [];
          list.forEach((s) => socket.emit("server:join", s.id));
          log("server:join pour", list.length, "serveur(s)");
        })
        .catch(() => {});
      getConversations()
        .then((convs) => {
          convs.forEach((c) => socket.emit("dm:join", c.id));
        })
        .catch(() => {});
    };
    socket.on("connect", onConnect);
    if (socket.connected) onConnect();
    return () => {
      socket.off("connect", onConnect);
    };
  }, []);

  useEffect(() => {
    const socket = getSocket();
    log("Listeners setup (once)");

    const onMessageNew = (message: MessagePayload) => {
      const currentChannelId = channelIdRef.current;
      const currentMyUsername = myUsernameRef.current;
      const isCurrentChannel =
        currentChannelId && message.channelId === currentChannelId;
      const prefs = getNotificationPreferences();

      log("message:new reçu", {
        messageChannelId: message.channelId,
        currentChannelId,
        isCurrentChannel,
        prefs,
        author: message.author?.username,
      });

      if (!isCurrentChannel) {
        const authorName = message.author?.username ?? "Quelqu'un";
        const body = snippet(message.content || "");
        const isMentionNotification =
          currentMyUsername &&
          isMention(message.content || "", currentMyUsername) &&
          prefs.mentions;

        // Pour les canaux, on ne badge + dropdown QUE pour les mentions
        if (isMentionNotification) {
          setHasUnread(true);
          log("→ setHasUnread(true) (mention)");

          (async () => {
            try {
              const channel = await getChannelDetails(message.channelId);
              const server = channel.serverId
                ? await getServerDetails(channel.serverId).catch(() => null)
                : null;

              const title = server
                ? `Nouvelle mention dans ${server.name}`
                : `Nouvelle mention dans #${channel.name}`;

              const href =
                channel.serverId && message.channelId
                  ? `/dashboard/${channel.serverId}/${message.channelId}`
                  : undefined;

              const next: NotificationItem = {
                id: message.id,
                type: "channel",
                title,
                body: `${authorName}: ${body}`,
                href,
                createdAt: new Date().toISOString(),
              };

              setNotifications((prev) => [next, ...prev].slice(0, 20));
            } catch (e) {
              log("Erreur lors de la récupération des infos canal/serveur", e);
              const fallback: NotificationItem = {
                id: message.id,
                type: "channel",
                title: "Nouvelle mention",
                body: `${authorName}: ${body}`,
                href: undefined,
                createdAt: new Date().toISOString(),
              };
              setNotifications((prev) => [fallback, ...prev].slice(0, 20));
            }
          })();
        }
      }

      if (!prefs.enabled || isCurrentChannel) {
        log(
          "→ pas de notif native",
          prefs.enabled ? "canal actuel" : "notifs désactivées",
        );
        return;
      }

      if (
        currentMyUsername &&
        isMention(message.content || "", currentMyUsername) &&
        prefs.mentions
      ) {
        const authorName = message.author?.username ?? "Quelqu'un";
        const body = snippet(message.content || "");
        log("→ notif mention", authorName);
        showNativeNotification("Tu as été mentionné", {
          body: `${authorName}: ${body}`,
          tag: `mention-${message.channelId}-${message.id}`,
        });
        return;
      }
    };

    const onDmMessageNew = (message: DmMessagePayload) => {
      const currentServerId = serverIdRef.current;
      const currentChannelId = channelIdRef.current;
      const isCurrentDm =
        currentServerId === "dm" && currentChannelId === message.conversationId;
      if (!isCurrentDm) {
        setHasUnread(true);

        const authorName = message.author?.username ?? "Quelqu'un";
        const body = snippet(message.content || "");

        const next: NotificationItem = {
          id: message.id,
          type: "dm",
          title: `Nouveau message de ${authorName}`,
          body,
          href: undefined,
          createdAt: new Date().toISOString(),
        };

        setNotifications((prev) => [next, ...prev].slice(0, 20));
      }

      const prefs = getNotificationPreferences();
      if (!prefs.enabled || !prefs.dm || isCurrentDm) return;

      const authorName = message.author?.username ?? "Quelqu'un";
      showNativeNotification(`Nouveau DM de ${authorName}`, {
        body: snippet(message.content || ""),
        tag: `dm-${message.conversationId}-${message.id}`,
      });
    };

    socket.on(SOCKET_EVENTS.MESSAGE_NEW, onMessageNew);
    socket.on(SOCKET_EVENTS.DM_MESSAGE_NEW, onDmMessageNew);
    log("Socket events attachés: message:new, dm:message:new");

    return () => {
      socket.off(SOCKET_EVENTS.MESSAGE_NEW, onMessageNew);
      socket.off(SOCKET_EVENTS.DM_MESSAGE_NEW, onDmMessageNew);
      log("Socket events détachés");
    };
  }, []);

  const value: NotificationsContextValue = {
    hasUnread,
    markAllRead() {
      setHasUnread(false);
      setNotifications([]);
    },
    notifications,
    clearAll() {
      setHasUnread(false);
      setNotifications([]);
    },
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error(
      "useNotifications must be used within NotificationsProvider",
    );
  }
  return ctx;
}
