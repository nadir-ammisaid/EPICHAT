"use client";

import {
  useState,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { Smile, Image as ImageIcon, Search } from "lucide-react";
import { EmojiPicker } from "@/components/ui/EmojiPicker";
import { Modal } from "@/components/ui/Modal";
import { apiClient } from "@/lib/api/client";
import { useTranslation } from "react-i18next";

type GifSearchItem = {
  id: string;
  title: string;
  previewUrl: string;
  gifUrl: string;
};

type MessageInputBarProps = {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onSendGif: (gif: { gifUrl: string; title: string }) => Promise<void>;
  disabled?: boolean;
  placeholder?: string;
  inputRef?: RefObject<HTMLInputElement | null>;
  aboveInput?: ReactNode;
  extraKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => boolean;
};

export function MessageInputBar({
  value,
  onChange,
  onSend,
  onSendGif,
  disabled,
  placeholder,
  inputRef,
  aboveInput,
  extraKeyDown,
}: MessageInputBarProps) {
  const { t } = useTranslation("common");
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [gifModalOpen, setGifModalOpen] = useState(false);
  const [gifQuery, setGifQuery] = useState("");
  const [gifResults, setGifResults] = useState<GifSearchItem[]>([]);
  const [gifLoading, setGifLoading] = useState(false);
  const [gifError, setGifError] = useState<string | null>(null);
  const [gifOffset, setGifOffset] = useState(0);
  const [selectedGif, setSelectedGif] = useState<GifSearchItem | null>(null);
  const [gifSending, setGifSending] = useState(false);

  async function searchGifs(offset = 0, append = false) {
    const q = gifQuery.trim();
    if (!q) {
      setGifResults([]);
      setGifOffset(0);
      setSelectedGif(null);
      return;
    }
    setGifLoading(true);
    setGifError(null);
    try {
      const data = await apiClient.request(
        `/gif/search?q=${encodeURIComponent(q)}&limit=20&offset=${offset}`,
      );
      const items = (data?.items ?? []) as GifSearchItem[];
      setGifResults((prev) => (append ? [...prev, ...items] : items));
      setGifOffset(typeof data?.nextOffset === "number" ? data.nextOffset : 0);
      setSelectedGif((prev) => {
        if (append || prev) return prev;
        return items[0] ?? null;
      });
    } catch (e: unknown) {
      setGifError(
        e instanceof Error ? e.message : t("messageInput.searchError"),
      );
    } finally {
      setGifLoading(false);
    }
  }

  async function handleSendGif() {
    if (!selectedGif) return;
    setGifSending(true);
    setGifError(null);
    try {
      await onSendGif({ gifUrl: selectedGif.gifUrl, title: selectedGif.title });
      setGifModalOpen(false);
      setSelectedGif(null);
      setGifResults([]);
      setGifQuery("");
      setGifOffset(0);
    } catch (e: unknown) {
      setGifError(
        e instanceof Error ? e.message : t("messageInput.sendError"),
      );
    } finally {
      setGifSending(false);
    }
  }

  return (
    <div className="border-t border-border p-3">
      <div className="relative">
        {aboveInput}
        <div className="flex gap-2 items-center">
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setGifModalOpen(true);
                setGifError(null);
              }}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
              aria-label={t("messageInput.openGifSearch")}
            >
              <ImageIcon className="w-5 h-5" />
            </button>
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
              aria-label={t("messageInput.openEmojiPicker")}
            >
              <Smile className="w-5 h-5" />
            </button>
            <EmojiPicker
              isOpen={isEmojiPickerOpen}
              onClose={() => setIsEmojiPickerOpen(false)}
              onEmojiSelect={(emoji) => {
                onChange(value + emoji);
                setIsEmojiPickerOpen(false);
                inputRef?.current?.focus();
              }}
            />
          </div>
          <input
            ref={inputRef}
            className="flex-1 rounded border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={placeholder ?? t("messageInput.placeholder")}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (extraKeyDown?.(e)) return;
              if (e.key === "Enter") onSend();
            }}
            disabled={disabled}
          />
          <button
            className="rounded bg-brand px-3 py-2 text-sm text-white disabled:opacity-50"
            onClick={onSend}
            disabled={disabled || !value.trim()}
          >
            {t("messageInput.send")}
          </button>
        </div>
      </div>

      <Modal
        open={gifModalOpen}
        onClose={() => setGifModalOpen(false)}
        title={t("messageInput.gifModalTitle")}
      >
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              className="flex-1 rounded border border-border bg-background px-3 py-2 text-sm"
              placeholder={t("messageInput.gifSearchPlaceholder")}
              value={gifQuery}
              onChange={(e) => setGifQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") searchGifs(0, false);
              }}
            />
            <button
              type="button"
              className="rounded bg-brand px-3 py-2 text-sm text-white disabled:opacity-50"
              onClick={() => searchGifs(0, false)}
              disabled={gifLoading || !gifQuery.trim()}
            >
              <Search className="h-4 w-4" />
            </button>
          </div>

          {gifError && <p className="text-sm text-red-500">{gifError}</p>}

          {selectedGif && (
            <div className="rounded border border-border p-2">
              <p className="mb-2 text-xs text-muted-foreground">{t("messageInput.preview")}</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedGif.gifUrl}
                alt={selectedGif.title || "GIF"}
                className="max-h-56 w-full rounded object-contain"
              />
            </div>
          )}

          <div className="grid max-h-64 grid-cols-2 gap-2 overflow-y-auto rounded border border-border p-2">
            {gifResults.map((gif) => (
              <button
                key={gif.id}
                type="button"
                onClick={() => setSelectedGif(gif)}
                className={`overflow-hidden rounded border ${
                  selectedGif?.id === gif.id ? "border-brand" : "border-border"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={gif.previewUrl}
                  alt={gif.title || "GIF"}
                  className="h-24 w-full object-cover"
                  loading="lazy"
                />
              </button>
            ))}
            {!gifLoading && gifResults.length === 0 && (
              <p className="col-span-2 text-center text-sm text-muted-foreground">
                {t("messageInput.empty")}
              </p>
            )}
          </div>

          <div className="flex justify-between gap-2">
            <button
              type="button"
              className="rounded border border-border px-3 py-2 text-sm"
              onClick={() => searchGifs(gifOffset, true)}
              disabled={gifLoading || !gifOffset || !gifQuery.trim()}
            >
              {t("messageInput.loadMore")}
            </button>
            <button
              type="button"
              className="rounded bg-brand px-3 py-2 text-sm text-white disabled:opacity-50"
              onClick={handleSendGif}
              disabled={!selectedGif || gifSending}
            >
              {t("messageInput.sendGif")}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
