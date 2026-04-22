"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Channel, ChannelDetails } from "@/lib/api/channels";
import {
  createChannel,
  deleteChannel,
  getChannelDetails,
  listServerChannels,
  renameChannel,
} from "@/lib/api/channels";

export default function useChannels(
  serverId: string | null,
  channelId: string | null,
) {
  const { t } = useTranslation("common");
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(false);

  const [permissionError, setPermissionError] = useState<string | null>(null);

  const [channelDetails, setChannelDetails] = useState<ChannelDetails | null>(
    null,
  );

  const refreshChannels = useCallback(async () => {
    if (!serverId) return;
    try {
      setLoading(true);
      const list = await listServerChannels(serverId);
      setChannels(list);
    } catch {
      setChannels([]);
    } finally {
      setLoading(false);
    }
  }, [serverId]);

  const refreshChannelDetails = useCallback(async () => {
    if (!channelId) {
      setChannelDetails(null);
      return;
    }
    try {
      const d = await getChannelDetails(channelId);
      setChannelDetails(d ?? null);
    } catch {
      setChannelDetails(null);
    }
  }, [channelId]);

  useEffect(() => {
    //reset when chnanging server
    setChannels([]);
    setPermissionError(null);
    setChannelDetails(null);

    if (serverId) refreshChannels();
  }, [serverId, refreshChannels]);

  useEffect(() => {
    // refresh when changing server
    setPermissionError(null);
    refreshChannelDetails();
  }, [channelId, refreshChannelDetails]);

  const clearPermissionError = useCallback(() => {
    setPermissionError(null);
  }, []);

  const actions = useMemo(() => {
    return {
      async create(name: string) {
        if (!serverId) return;

        clearPermissionError();
        const trimmed = name.trim();
        if (!trimmed) return;

        try {
          const created = await createChannel(serverId, trimmed);
          setChannels((prev) => [created, ...prev]);
        } catch (e) {
          if (e instanceof Error && e.message.includes("403")) {
            setPermissionError(t("channels.header.permissionError"));
            return;
          }
          throw e;
        }
      },

      async rename(id: string, name: string) {
        clearPermissionError();
        const trimmed = name.trim();
        if (!trimmed) return;

        try {
          const updated = await renameChannel(id, trimmed);

          setChannels((prev) =>
            prev.map((c) => (c.id === id ? { ...c, ...updated } : c)),
          );

          setChannelDetails((prev) =>
            prev?.id === id ? { ...prev, ...updated } : prev,
          );
        } catch (e) {
          if (e instanceof Error && e.message.includes("403")) {
            setPermissionError(t("channels.header.permissionError"));
            return;
          }
          throw e;
        }
      },

      async remove(id: string) {
        clearPermissionError();

        try {
          await deleteChannel(id);
          setChannels((prev) => prev.filter((c) => c.id !== id));
        } catch (e) {
          if (e instanceof Error && e.message.includes("403")) {
            setPermissionError(t("channels.header.permissionError"));
            return;
          }
          throw e;
        }
      },
    };
  }, [serverId, clearPermissionError, t]);

  return {
    channels,
    loading,
    channelDetails,
    permissionError,
    refreshChannels,
    refreshChannelDetails,
    clearPermissionError,
    actions,
    setChannels,
  };
}
