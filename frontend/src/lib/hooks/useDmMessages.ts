"use client";

import { useEffect, useMemo, useState } from "react";
import { getSocket } from "@/lib/socket/socket";
import {
  getConversations,
  getConversationMessages,
  deleteDmMessage,
  updateDmMessage,
} from "@/lib/api/dm";
import type { DirectMessage } from "@/lib/types/dm";

export function useDmMessages(conversationId: string | null, myUserId: string | null) {
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [userMap, setUserMap] = useState<Map<string, string>>(new Map());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  // Build userMap from conversation participants
  useEffect(() => {
    if (!conversationId) return;
    getConversations()
      .then((convs) => {
        const conv = convs.find((c) => c.id === conversationId);
        if (!conv) return;
        const map = new Map<string, string>();
        map.set(conv.participant1.id, conv.participant1.username);
        map.set(conv.participant2.id, conv.participant2.username);
        setUserMap(map);
      })
      .catch(() => {});
  }, [conversationId]);

  // Fetch initial messages
  useEffect(() => {
    if (!conversationId) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      setMessages([]);
      try {
        const data = await getConversationMessages(conversationId!);
        if (!cancelled) setMessages(data.messages);
      } catch (e) {
        if (!cancelled && e instanceof Error) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [conversationId]);

  // Socket join/leave
  useEffect(() => {
    if (!conversationId) return;
    const socket = getSocket();

    const onConnect = () => socket.emit("dm:join", conversationId);
    socket.on("connect", onConnect);
    if (socket.connected) onConnect();

    return () => {
      socket.off("connect", onConnect);
    };
  }, [conversationId]);

  // Socket event listeners
  useEffect(() => {
    if (!conversationId) return;
    const socket = getSocket();

    const onMessageNew = (message: DirectMessage) => {
      if (message.conversationId !== conversationId) return;
      setMessages((prev) => {
        if (prev.some((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });
    };

    const onMessageDeleted = (payload: { id: string; conversationId: string }) => {
      if (payload.conversationId !== conversationId) return;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === payload.id ? { ...m, content: "", deletedAt: new Date().toISOString() } : m
        )
      );
    };

    const onMessageUpdated = (message: DirectMessage) => {
      if (message.conversationId !== conversationId) return;
      setMessages((prev) =>
        prev.map((m) => (m.id === message.id ? { ...m, ...message } : m))
      );
    };

    const onTypingUpdate = (payload: { conversationId: string; userIds: string[] }) => {
      if (payload.conversationId !== conversationId) return;
      setTypingUsers(payload.userIds ?? []);
    };

    socket.on("dm:message:new", onMessageNew);
    socket.on("dm:message:deleted", onMessageDeleted);
    socket.on("dm:message:updated", onMessageUpdated);
    socket.on("dm:typing:update", onTypingUpdate);

    return () => {
      socket.off("dm:message:new", onMessageNew);
      socket.off("dm:message:deleted", onMessageDeleted);
      socket.off("dm:message:updated", onMessageUpdated);
      socket.off("dm:typing:update", onTypingUpdate);
    };
  }, [conversationId]);

  async function handleDelete(messageId: string) {
    setError(null);
    try {
      await deleteDmMessage(messageId);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, content: "", deletedAt: new Date().toISOString() } : m
        )
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete error");
    }
  }

  async function handleEdit(messageId: string) {
    if (!editText.trim()) return;
    setError(null);
    try {
      const updated = await updateDmMessage(messageId, editText.trim());
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, ...updated } : m))
      );
      setEditingId(null);
      setEditText("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Edit error");
    }
  }

  function startEditing(message: DirectMessage) {
    setEditingId(message.id);
    setEditText(message.content);
  }

  function cancelEditing() {
    setEditingId(null);
    setEditText("");
  }

  const typingText = useMemo(() => {
    const others = myUserId ? typingUsers.filter((u) => u !== myUserId) : typingUsers;
    if (!others.length) return null;
    const names = others.map((id) => userMap.get(id) ?? id);
    return `${names.join(", ")} est en train d'écrire…`;
  }, [typingUsers, myUserId, userMap]);

  return {
    messages, loading, error,
    editingId, editText, setEditText,
    handleDelete, handleEdit,
    startEditing, cancelEditing,
    typingText,
  };
}
