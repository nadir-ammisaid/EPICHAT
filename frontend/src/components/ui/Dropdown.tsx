"use client";

import { createContext, useContext, useState, useRef, useEffect, useCallback, type ReactNode } from "react";

type DropdownContextValue = {
  open: boolean;
  setOpen: (value: boolean) => void;
  toggle: () => void;
};

const DropdownContext = createContext<DropdownContextValue | null>(null);

function useDropdown() {
  const ctx = useContext(DropdownContext);
  if (!ctx) throw new Error("Dropdown.Trigger and Dropdown.Menu must be used inside Dropdown");
  return ctx;
}

type DropdownProps = { children: ReactNode; className?: string };

export function Dropdown({ children, className = "" }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const toggle = useCallback(() => setOpen((v) => !v), []);
  return (
    <DropdownContext.Provider value={{ open, setOpen, toggle }}>
      <div className={`relative ${className}`}>{children}</div>
    </DropdownContext.Provider>
  );
}

type TriggerProps = { children: ReactNode; className?: string };

function Trigger({ children, className = "" }: TriggerProps) {
  const { toggle } = useDropdown();
  return (
    <div
      onClick={toggle}
      onKeyDown={(e) => e.key === "Enter" && toggle()}
      role="button"
      tabIndex={0}
      className={className}
    >
      {children}
    </div>
  );
}

type MenuProps = {
  children: ReactNode;
  /** Position du menu par rapport au trigger: "bottom" (sous) ou "top" (au-dessus) */
  position?: "bottom" | "top";
  /** Alignement: "left" ou "right" */
  align?: "left" | "right";
  className?: string;
};

function Menu({ children, position = "bottom", align = "left", className = "" }: MenuProps) {
  const { open, setOpen } = useDropdown();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", handleEscape);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open, setOpen]);

  if (!open) return null;

  const positionClasses = position === "top" ? "bottom-full mb-2" : "top-full mt-2";
  const alignClasses = align === "right" ? "right-0" : "left-0";

  return (
    <div
      ref={menuRef}
      className={`absolute z-50 min-w-[180px] rounded-lg border border-border bg-background py-1 shadow-lg ${positionClasses} ${alignClasses} ${className}`}
      role="menu"
    >
      {children}
    </div>
  );
}

Dropdown.Trigger = Trigger;
Dropdown.Menu = Menu;
