"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

import parseDashboardPath from "@/lib/utils/parseDashboardPath";
import useChannels from "@/lib/utils/useChannels";

import ChannelSearch from "@/components/channels/ChannelSearch";
import ChannelHeader from "@/components/channels/ChannelHeader";
import ChannelList from "@/components/channels/ChannelList";
import ChannelFooter from "@/components/channels/ChannelFooter";
import ChannelModals from "@/components/channels/ChannelModals";

import type { Channel } from "@/lib/api/channels";
import type { ServerDetails } from "@/lib/api/servers";
import { getServerDetails } from "@/lib/api/servers";

export default function ChannelBar() {
  const pathname = usePathname();
  const { serverId, channelId } = useMemo(
    () => parseDashboardPath(pathname ?? ""),
    [pathname],
  );

  const [serverName, setServerName] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      if (!serverId) {
        setServerName(null);
        return;
      }
      try {
        const s = (await getServerDetails(serverId)) as ServerDetails;
        setServerName(s?.name ?? null);
      } catch {
        setServerName(null);
      }
    };

    run();
  }, [serverId]);

  const { channels, loading, channelDetails, permissionError, actions } =
    useChannels(serverId, channelId);

  const [query, setQuery] = useState("");
  useEffect(() => setQuery(""), [serverId]);

  const filteredChannels = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return channels;
    return channels.filter((c) => c.name.toLowerCase().includes(q));
  }, [channels, query]);

  const [menuFor, setMenuFor] = useState<string | null>(null);
  useEffect(() => setMenuFor(null), [serverId, channelId]);

  const [createOpen, setCreateOpen] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [renameOpen, setRenameOpen] = useState(false);
  const [renameLoading, setRenameLoading] = useState(false);
  const [renameError, setRenameError] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [selected, setSelected] = useState<Channel | null>(null);

  const formatDateFR = (iso?: string) => {
    if (!iso) return null;
    return new Date(iso).toLocaleDateString("fr-FR");
  };

  const activeLine = useMemo(() => {
    if (!serverId || !channelId || !channelDetails?.name) return null;

    const date = channelDetails.createdAt
      ? formatDateFR(channelDetails.createdAt)
      : null;

    return `Canal actif : #${channelDetails.name}${
      date ? ` créé le ${date}` : ""
    }`;
  }, [serverId, channelId, channelDetails]);

  const openRename = (ch: Channel) => {
    setSelected(ch);
    setRenameValue(ch.name);
    setRenameError(null);
    setRenameOpen(true);
    setMenuFor(null);
  };

  const openDelete = (ch: Channel) => {
    setSelected(ch);
    setDeleteError(null);
    setDeleteOpen(true);
    setMenuFor(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serverId) return;

    const name = newChannelName.trim();
    if (!name) return;

    setCreateError(null);
    setCreateLoading(true);

    try {
      await actions.create(name);
      setNewChannelName("");
      setCreateOpen(false);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Erreur création");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;

    const name = renameValue.trim();
    if (!name) return;

    setRenameError(null);
    setRenameLoading(true);

    try {
      await actions.rename(selected.id, name);
      setRenameOpen(false);
      setSelected(null);
    } catch (err) {
      setRenameError(err instanceof Error ? err.message : "Erreur renommage");
    } finally {
      setRenameLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;

    setDeleteError(null);
    setDeleteLoading(true);

    try {
      const deletedId = selected.id;
      await actions.remove(deletedId);

      if (serverId && channelId === deletedId) {
        window.location.href = `/dashboard/${serverId}`;
        return;
      }

      setDeleteOpen(false);
      setSelected(null);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Erreur suppression");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <>
      <aside className="border-border flex h-full shrink-0 flex-col border-r bg-[#F3F7FB] md:max-w-65 md:min-w-64">
        <ChannelSearch query={query} setQuery={setQuery} disabled={!serverId} />

        <ChannelHeader
          serverId={serverId}
          serverName={serverName}
          permissionError={permissionError}
          activeLine={activeLine}
          onCreate={() => setCreateOpen(true)}
          canCreate={!!serverId}
        />

        <ChannelList
          serverId={serverId}
          channelId={channelId}
          channels={filteredChannels}
          loading={loading}
          query={query}
          menuFor={menuFor}
          setMenuFor={setMenuFor}
          onOpenRename={openRename}
          onOpenDelete={openDelete}
        />

        <ChannelFooter serverId={serverId} count={channels.length} />
      </aside>

      <ChannelModals
        // create
        createOpen={createOpen}
        onCloseCreate={() => {
          setCreateOpen(false);
          setNewChannelName("");
          setCreateError(null);
        }}
        newChannelName={newChannelName}
        setNewChannelName={setNewChannelName}
        createLoading={createLoading}
        createError={createError}
        onSubmitCreate={handleCreate}
        // rename
        renameOpen={renameOpen}
        onCloseRename={() => {
          setRenameOpen(false);
          setSelected(null);
          setRenameError(null);
        }}
        renameValue={renameValue}
        setRenameValue={setRenameValue}
        renameLoading={renameLoading}
        renameError={renameError}
        onSubmitRename={handleRename}
        // delete
        deleteOpen={deleteOpen}
        onCloseDelete={() => {
          setDeleteOpen(false);
          setSelected(null);
          setDeleteError(null);
        }}
        deleteLoading={deleteLoading}
        deleteError={deleteError}
        selected={selected}
        onConfirmDelete={handleDelete}
      />

      {menuFor && (
        <button
          className="fixed inset-0 z-10 cursor-default"
          onClick={() => setMenuFor(null)}
          aria-hidden="true"
          tabIndex={-1}
        />
      )}
    </>
  );
}
