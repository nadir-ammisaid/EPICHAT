"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";
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
import { useNotificationPreferences } from "@/lib/notifications/preferences";
import {
  listServerMembers,
  sendChannelGifMessage,
  sendChannelTextMessage,
  type ServerMember,
} from "@/lib/api/channels";

function renderContent(content: string) {
  const mentionRegex = /@(\w+)/g;
  const parts: (string | ReactNode)[] = [];
  let lastIndex = 0;
  let match;
  while ((match = mentionRegex.exec(content)) !== null) {
    if (match.index > lastIndex)
      parts.push(content.slice(lastIndex, match.index));
   parts.push(
  <span
    key={match.index}
      className={match[0] === "@Tous" ? "font-medium text-violet-800" : "text-brand font-medium"}
  >
    {match[0]}
  </span>,
);

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
  const [members, setMembers] = useState<ServerMember[]>([]);
  const myMember = members.find((m) => m.id === myUserId);
  const canModerate = myMember?.role === "owner" || myMember?.role === "admin";
  const inputRef = useRef<HTMLInputElement | null>(null);
  const typingStopTimer = useRef<number | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [channelId]);

  const {
    messages,
    loading,
    error,
    editingId,
    editText,
    setEditText,
    handleDelete,
    handleEdit,
    handleToggleReaction,
    startEditing,
    cancelEditing,
    typingText,
  } = useChannelMessages(channelId, myUserId);

  const { preferences: notifPrefs, mounted: notifMounted } =
    useNotificationPreferences();

  const { scrollRef, bottomRef } = useScrollToBottom(
    channelId,
    messages.length,
  );

  const {
    showMentions,
    setShowMentions,
    mentionIndex,
    setMentionIndex,
    filteredMembers,
    onTextChange,
    insertMention,
  } = useMentions(members, text, setText, inputRef);

  useEffect(() => {
    if (!serverId) return;
    const currentServerId = serverId;

    async function fetchMembers() {
      try {
        setMembers(await listServerMembers(currentServerId));
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
      await sendChannelTextMessage(channelId, content);
      setText("");
      if (myUserId)
        getSocket().emit(SOCKET_EVENTS.TYPING_STOP, {
          channelId,
          userId: myUserId,
        });
    } catch (e: unknown) {
      console.error(e instanceof Error ? e.message : "Failed to send message");
    } finally {
      flushSync(() => setSending(false));
      inputRef.current?.focus();
    }
  }

  if (!channelId) {
    return (
      <div className="border-border bg-background flex min-h-0 flex-1 flex-col border">
        <div className="flex-1 overflow-y-auto p-4">
          <p className="text-muted-foreground text-sm">
            Selectionnez un canal pour commencer à chatter.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="border-border bg-background flex min-h-0 flex-1 flex-col border">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
        {loading && <p className="text-sm">Loading…</p>}
        {error && <p className="text-red-500 text-sm">{error}</p>}
        {messages
          .filter((m) => {
            if (!notifMounted) return true;
            if (m.type === "system_new_member" && !notifPrefs.systemJoins) {
              return false;
            }
            return true;
          })
          .map((m) => (
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
              canEdit={
                !!myUserId &&
                m.authorId === myUserId &&
                !m.deletedAt &&
                m.type === "text"
              }
              canDelete={!!myUserId && !m.deletedAt && (m.authorId === myUserId || canModerate)}
              isEditing={editingId === m.id}
              editText={editText}
              onEditStart={() => startEditing(m)}
              onEditCancel={cancelEditing}
              onEditConfirm={() => handleEdit(m.id)}
              onEditTextChange={setEditText}
              onDelete={() => handleDelete(m.id)}
              reactions={m.reactions}
              myUserId={myUserId ?? undefined}
              onToggleReaction={(emoji) => handleToggleReaction(m.id, emoji)}
              renderTextContent={renderContent}
            />
          ))}
        <div ref={bottomRef} />
      </div>

      <div className="h-5 px-4 pb-2 text-xs opacity-70">{typingText ?? ""}</div>

      <MessageInputBar
        value={text}
        onChange={handleTypingChange}
        onSend={handleSendText}
        onSendGif={(gif) => sendChannelGifMessage(channelId, gif)}
        disabled={sending}
        placeholder="Ecrire un message..."
        inputRef={inputRef}
        aboveInput={
          showMentions && filteredMembers.length > 0 ? (
            <div className="border-border bg-background absolute bottom-full left-0 mb-1 max-h-40 w-48 overflow-y-auto rounded border shadow-lg">
              {filteredMembers.slice(0, 8).map((member, idx) => (
                <button
                  key={member.id}
                  type="button"
                  className={`hover:bg-muted w-full px-3 py-2 text-left text-sm ${idx === mentionIndex ? "bg-brand/20 text-brand font-medium" : ""}`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    insertMention(member.username);
                  }}
                >
                  @{member.username}
                </button>
              ))}
            </div>
          ) : undefined
        }
        extraKeyDown={(e) => {
          if (showMentions && filteredMembers.length > 0) {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setMentionIndex((prev) =>
                prev < Math.min(filteredMembers.length - 1, 7) ? prev + 1 : 0,
              );
              return true;
            }
            if (e.key === "ArrowUp") {
              e.preventDefault();
              setMentionIndex((prev) =>
                prev > 0 ? prev - 1 : Math.min(filteredMembers.length - 1, 7),
              );
              return true;
            }
            if (e.key === "Enter" || e.key === "Tab") {
              e.preventDefault();
              insertMention(filteredMembers[mentionIndex].username);
              return true;
            }
            if (e.key === "Escape") {
              setShowMentions(false);
              return true;
            }
          }
          return false;
        }}
      />
    </div>
  );
}
