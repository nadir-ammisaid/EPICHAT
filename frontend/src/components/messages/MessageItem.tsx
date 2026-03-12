"use client";
import React from "react";
import { useState } from "react";
import { EmojiPicker } from "@/components/ui/EmojiPicker";
import { Check, Pencil, Trash2, X, SmilePlus } from "lucide-react";
import { formatDate } from "@/lib/utils/formatDate";

type MessageItemProps = {
  id: string;
  authorName: string;
  content: string;
  createdAt: string;
  updatedAt?: string | null;
  deletedAt?: string | null;
  type?: "text" | "gif";
  mediaUrl?: string | null;
  canEdit: boolean;
  canDelete: boolean;
  isEditing: boolean;
  editText: string;
  onEditStart: () => void;
  onEditCancel: () => void;
  onEditConfirm: () => void;
  onEditTextChange: (value: string) => void;
  onDelete: () => void;
  renderTextContent?: (content: string) => React.ReactNode;
  reactions?: { emoji: string; count: number; userIds: string[] }[];
  myUserId?: string;
  onToggleReaction?: (emoji: string) => void;
};

export function MessageItem({
  authorName,
  content,
  createdAt,
  updatedAt,
  deletedAt,
  type = "text",
  mediaUrl,
  canEdit,
  canDelete,
  isEditing,
  editText,
  onEditStart,
  onEditCancel,
  onEditConfirm,
  onEditTextChange,
  onDelete,
  renderTextContent,
  reactions,
  myUserId,
  onToggleReaction,
}: MessageItemProps) {
  const wasEdited = updatedAt && updatedAt !== createdAt && !deletedAt;
  const [showQuickPicker, setShowQuickPicker] = useState(false);
  const [showFullPicker, setShowFullPicker] = useState(false);
  const QUICK_EMOJIS = ["👍", "❤️", "😂", "😮", "🔥"];

  return (
    <div className="group mb-2 flex items-start gap-1 px-1 py-1 hover:bg-muted/40">
      <div className="w-16 shrink-0 flex justify-start gap-0.5">
        {canEdit && !isEditing ? (
          <button type="button"
            className="mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-background/70"
            onClick={onEditStart}>
            <Pencil className="h-4 w-4 opacity-70 hover:opacity-100" />
          </button>
        ) : (
          <span className="mt-0.5 invisible p-0.5"><Pencil className="h-4 w-4" /></span>
        )}
        {canDelete && !isEditing ? (
          <button type="button"
            className="mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-background/70"
            onClick={onDelete}>
            <Trash2 className="h-4 w-4 opacity-70 hover:opacity-100" />
          </button>
        ) : (
          <span className="mt-0.5 invisible p-0.5"><Trash2 className="h-4 w-4" /></span>
        )}
          {!isEditing && onToggleReaction && (
        <div className="relative flex items-start">
          <button
            type="button"
            className="mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-background/70"
            onClick={() => setShowQuickPicker((v) => !v)}
          >
            <SmilePlus className="h-4 w-4 opacity-70 hover:opacity-100" />

          </button>
          {showQuickPicker && (
            <div className="absolute bottom-full left-0 mb-1 flex gap-1 bg-background border border-border rounded-lg p-1 shadow-lg z-10">
              {QUICK_EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  className="text-base hover:scale-125 transition-transform p-0.5"
                  onClick={() => { onToggleReaction(e); setShowQuickPicker(false); }}
                >
                  {e}
                </button>
              ))}
              <button
                type="button"
                className="text-xs text-muted-foreground hover:text-foreground px-1"
                onClick={() => { setShowQuickPicker(false); setShowFullPicker(true); }}
              >
                +
              </button>
            </div>
          )}
          <EmojiPicker
            isOpen={showFullPicker}
            onClose={() => setShowFullPicker(false)}
            onEmojiSelect={(emoji) => { onToggleReaction(emoji); setShowFullPicker(false); }}
          />
        </div>
      )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="text-[11px] opacity-60 flex gap-1">
          <span>{authorName}</span>
          <span>-</span>
          <span>{formatDate(createdAt)}</span>
          {wasEdited && <span className="italic">(modifié)</span>}
        </div>

        {isEditing ? (
          <div className="flex gap-2 items-center mt-1">
            <input
              className="flex-1 rounded border border-border bg-background px-2 py-1 text-sm"
              value={editText}
              onChange={(e) => onEditTextChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onEditConfirm();
                if (e.key === "Escape") onEditCancel();
              }}
              autoFocus
            />
            <button type="button" className="p-1 rounded hover:bg-muted" onClick={onEditConfirm}>
              <Check className="h-4 w-4 text-green-500" />
            </button>
            <button type="button" className="p-1 rounded hover:bg-muted" onClick={onEditCancel}>
              <X className="h-4 w-4 text-red-500" />
            </button>
          </div>
        ) : (
          <div className="text-sm leading-5">
            {deletedAt ? (
              <i className="opacity-60">(supprimé)</i>
            ) : type === "gif" && mediaUrl ? (
              <a href={mediaUrl} target="_blank" rel="noreferrer" className="inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={mediaUrl} alt={content || "GIF"}
                  className="max-h-64 max-w-full rounded-md border border-border" loading="lazy" />
              </a>

            ) : renderTextContent ? (
              renderTextContent(content)
            ) : (
              content
            )}
          </div>
        )}
        {reactions && reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {reactions.map((r) => {
              const reacted = myUserId ? (r.userIds ?? []).includes(myUserId) : false;
              return (
                <button
                  key={r.emoji}
                  type="button"
                  onClick={() => onToggleReaction?.(r.emoji)}
                  className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs border transition-colors ${reacted ? "bg-brand/20 border-brand text-brand" : "bg-muted border-border hover:bg-muted/70"
                    }`}
                >
                  <span>{r.emoji}</span>
                  <span>{r.count}</span>
                </button>
              );
            })}
          </div>
        )}

      </div>
    </div >
  );
}
