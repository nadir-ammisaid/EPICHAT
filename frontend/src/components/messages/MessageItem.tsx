"use client";
import React from "react";
import { Check, Pencil, Trash2, X } from "lucide-react";
import { formatDate } from "@/lib/utils/formatDate";
import type { MessageType } from "@/lib/types/message";

type MessageItemProps = {
  id: string;
  authorName: string;
  content: string;
  createdAt: string;
  updatedAt?: string | null;
  deletedAt?: string | null;
  type?: MessageType;
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
}: MessageItemProps) {
  const wasEdited = updatedAt && updatedAt !== createdAt && !deletedAt;

  if (type === "system_new_member") {
    return (
      <div className="my-2 flex justify-center">
        <div className="system-message bg-muted text-muted-foreground rounded-md px-3 py-1 text-center text-xs italic">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="group hover:bg-muted/40 mb-2 flex items-start gap-1 px-1 py-1">
      <div className="flex w-12 shrink-0 justify-start gap-0.5">
        {canEdit && !isEditing ? (
          <button
            type="button"
            className="hover:bg-background/70 mt-0.5 rounded p-0.5 opacity-0 transition-opacity group-hover:opacity-100"
            onClick={onEditStart}
          >
            <Pencil className="h-4 w-4 opacity-70 hover:opacity-100" />
          </button>
        ) : (
          <span className="invisible mt-0.5 p-0.5">
            <Pencil className="h-4 w-4" />
          </span>
        )}
        {canDelete && !isEditing ? (
          <button
            type="button"
            className="hover:bg-background/70 mt-0.5 rounded p-0.5 opacity-0 transition-opacity group-hover:opacity-100"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4 opacity-70 hover:opacity-100" />
          </button>
        ) : (
          <span className="invisible mt-0.5 p-0.5">
            <Trash2 className="h-4 w-4" />
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex gap-1 text-[11px] opacity-60">
          <span>{authorName}</span>
          <span>-</span>
          <span>{formatDate(createdAt)}</span>
          {wasEdited && <span className="italic">(modifié)</span>}
        </div>

        {isEditing ? (
          <div className="mt-1 flex items-center gap-2">
            <input
              className="border-border bg-background flex-1 rounded border px-2 py-1 text-sm"
              value={editText}
              onChange={(e) => onEditTextChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onEditConfirm();
                if (e.key === "Escape") onEditCancel();
              }}
              autoFocus
            />
            <button
              type="button"
              className="hover:bg-muted rounded p-1"
              onClick={onEditConfirm}
            >
              <Check className="h-4 w-4 text-green-500" />
            </button>
            <button
              type="button"
              className="hover:bg-muted rounded p-1"
              onClick={onEditCancel}
            >
              <X className="h-4 w-4 text-red-500" />
            </button>
          </div>
        ) : (
          <div className="text-sm leading-5">
            {deletedAt ? (
              <i className="opacity-60">(supprimé)</i>
            ) : type === "gif" && mediaUrl ? (
              <a
                href={mediaUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-block"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={mediaUrl}
                  alt={content || "GIF"}
                  className="border-border max-h-64 max-w-full rounded-md border"
                  loading="lazy"
                />
              </a>
            ) : renderTextContent ? (
              renderTextContent(content)
            ) : (
              content
            )}
          </div>
        )}
      </div>
    </div>
  );
}
