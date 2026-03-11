/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import parseDashboardPath from "@/lib/utils/parseDashboardPath";
import { getSocket } from "@/lib/socket/socket";
import { SOCKET_EVENTS } from "@/lib/socket/socket.events";
import { MessageInputBar } from "@/components/messages/MessageInputBar";
import { MessageItem } from "@/components/messages/MessageItem";
import { useCurrentUserId } from "@/lib/hooks/useCurrentUserId";
import { useScrollToBottom } from "@/lib/hooks/useScrollToBottom";
import { useChannelMessages } from "@/lib/hooks/useChannelMessages";
import { useMentions } from "@/lib/hooks/useMentions";

type Member = { id: string; username: string };

function renderContent(content: string) {
  const mentionRegex = /@(\w+)/g;
  const parts: (string | React.ReactNode)[] = [];
  let lastIndex = 0;
  let match;
  while ((match = mentionRegex.exec(content)) !== null) {
    if (match.index > lastIndex) parts.push(content.slice(lastIndex, match.index));
    parts.push(<span key={match.index} className="text-brand font-medium">{match[0]}</span>);
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < content.length) parts.push(content.slice(lastIndex));
  return parts.length > 0 ? parts : content;
}

export default function ChatSection() {
  const pathname = usePathname();
  const { channelId, serverId } = parseDashboardPath(pathname ?? "");
  const myUserId = useCurrentUserId();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const typingStopTimer = useRef<number | null>(null);

  const { messages, loading, error, editingId, editText, setEditText,
          handleDelete, handleEdit, startEditing, cancelEditing, typingText }
    = useChannelMessages(channelId, myUserId);

  const { scrollRef, bottomRef } = useScrollToBottom(channelId, messages.length);

  const { showMentions, setShowMentions, mentionIndex, setMentionIndex,
          filteredMembers, onTextChange, insertMention }
    = useMentions(members, text, setText, inputRef);

  useEffect(() => {
    if (!serverId) return;
    async function fetchMembers() {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/servers/${serverId}/members`, {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        });
        if (res.ok) {
          const data = await res.json();
          const list = data?.members ?? data ?? [];
          setMembers(list.map((m: { user?: { id: string; username: string }; userId?: string; username?: string }) => ({
            id: m.user?.id ?? m.userId,
            username: m.user?.username ?? m.username,
          })));
        }
      } catch {}
    }
    fetchMembers();
  }, [serverId]);

  function handleTypingChange(nextValue: string) {
    setText(nextValue);
    onTextChange(nextValue);
    if (!channelId || !myUserId) return;
    const socket = getSocket();
    socket.emit(SOCKET_EVENTS.TYPING_START, { channelId, userId: myUserId });
    if (typingStopTimer.current) window.clearTimeout(typingStopTimer.current);
    typingStopTimer.current = window.setTimeout(() => {
      socket.emit(SOCKET_EVENTS.TYPING_STOP, { channelId, userId: myUserId });
    }, 500);
  }

  async function handleSendText() {
    if (!channelId) return;
    const content = text.trim();
    if (!content) return;
    setSending(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/channels/${channelId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ type: "text", content }),
      });
      if (!res.ok) { const t = await res.text(); throw new Error(`${res.status} ${res.statusText} - ${t}`); }
      setText("");
      if (myUserId) getSocket().emit(SOCKET_EVENTS.TYPING_STOP, { channelId, userId: myUserId });
    } catch (e: unknown) {
      console.error(e instanceof Error ? e.message : "Failed to send message");
    } finally {
      setSending(false);
    }
  }

  if (!channelId) {
    return (
      <div className="flex min-h-0 flex-1 flex-col border border-border bg-background">
        <div className="flex-1 overflow-y-auto p-4">
          <p className="text-sm text-muted-foreground">Selectionnez un canal pour commencer à chatter.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col border border-border bg-background">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
        {loading && <p className="text-sm">Loading…</p>}
        {error && <p className="text-red-500 text-sm">{error}</p>}
        {messages.map((m) => (
          <MessageItem
            key={m.id}
            id={m.id}
            authorName={m.author?.username ?? m.authorId}
            content={m.content}
            createdAt={m.createdAt}
            updatedAt={m.updatedAt}
            deletedAt={m.deletedAt}
            type={m.type}
            mediaUrl={m.mediaUrl}
            canEdit={!!myUserId && m.authorId === myUserId && !m.deletedAt && m.type === "text"}
            canDelete={!!myUserId && m.authorId === myUserId && !m.deletedAt}
            isEditing={editingId === m.id}
            editText={editText}
            onEditStart={() => startEditing(m)}
            onEditCancel={cancelEditing}
            onEditConfirm={() => handleEdit(m.id)}
            onEditTextChange={setEditText}
            onDelete={() => handleDelete(m.id)}
            renderTextContent={renderContent}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="px-4 pb-2 text-xs opacity-70 h-5">{typingText ?? ""}</div>

      <MessageInputBar
        value={text}
        onChange={handleTypingChange}
        onSend={handleSendText}
        onSendGif={async (gif) => {
          const token = localStorage.getItem("token");
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/channels/${channelId}/messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
            body: JSON.stringify({ type: "gif", mediaUrl: gif.gifUrl, content: gif.title }),
          });
          if (!res.ok) { const t = await res.text(); throw new Error(`${res.status} - ${t}`); }
        }}
        disabled={sending}
        placeholder="Ecrire un message..."
        inputRef={inputRef}
        aboveInput={
          showMentions && filteredMembers.length > 0 ? (
            <div className="absolute bottom-full left-0 mb-1 w-48 rounded border border-border bg-background shadow-lg max-h-40 overflow-y-auto">
              {filteredMembers.slice(0, 8).map((member, idx) => (
                <button
                  key={member.id}
                  type="button"
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-muted ${idx === mentionIndex ? "bg-brand/20 text-brand font-medium" : ""}`}
                  onMouseDown={(e) => { e.preventDefault(); insertMention(member.username); }}
                >
                  @{member.username}
                </button>
              ))}
            </div>
          ) : undefined
        }
        extraKeyDown={(e) => {
          if (showMentions && filteredMembers.length > 0) {
            if (e.key === "ArrowDown") { e.preventDefault(); setMentionIndex((prev) => prev < Math.min(filteredMembers.length - 1, 7) ? prev + 1 : 0); return true; }
            if (e.key === "ArrowUp") { e.preventDefault(); setMentionIndex((prev) => prev > 0 ? prev - 1 : Math.min(filteredMembers.length - 1, 7)); return true; }
            if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); insertMention(filteredMembers[mentionIndex].username); return true; }
            if (e.key === "Escape") { setShowMentions(false); return true; }
          }
          return false;
        }}
      />
    </div>
  );
}
