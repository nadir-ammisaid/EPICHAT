"use client";

import { useEffect } from "react";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  titleId?: string;
};

export function Modal({ open, onClose, title, children, titleId }: ModalProps) {
  const id = titleId ?? (title ? "modal-title" : undefined);

  useEffect(() => {
    if (!open) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={id}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-sm rounded-lg bg-background p-4 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <h2 id={id} className="mb-4 h3">
            {title}
          </h2>
        )}
        {children}
      </div>
    </div>
  );
}
