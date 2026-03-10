"use client";

import {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useCallback,
  type ReactNode,
  Children,
  cloneElement,
  isValidElement,
  type ReactElement,
} from "react";

type DropdownContextValue = {
  open: boolean;
  setOpen: (value: boolean) => void;
  toggle: () => void;
  triggerRef: React.RefObject<HTMLDivElement | null>;
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
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const toggle = useCallback(() => setOpen((v) => !v), []);
  return (
    <DropdownContext.Provider value={{ open, setOpen, toggle, triggerRef }}>
      <div ref={triggerRef} className={`relative ${className}`}>
        {children}
      </div>
    </DropdownContext.Provider>
  );
}

type TriggerProps = { children: ReactNode; className?: string };

function Trigger({ children, className = "" }: TriggerProps) {
  const { toggle } = useDropdown();
  const childArray = Children.toArray(children);
  const singleChild = childArray.length === 1 ? childArray[0] : null;
  const isSingleElement = singleChild !== null && isValidElement(singleChild);

  if (isSingleElement) {
    const prevOnClick = (singleChild.props as { onClick?: (e: React.MouseEvent) => void }).onClick;
    return (
      <div className={className}>
        {cloneElement(singleChild as ReactElement<{ onClick?: (e: React.MouseEvent) => void }>, {
          onClick: (e: React.MouseEvent) => {
            e.stopPropagation();
            toggle();
            prevOnClick?.(e);
          },
        })}
      </div>
    );
  }

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
  position?: "bottom" | "top";
  align?: "left" | "right";
  className?: string;
};

function Menu({ children, position = "bottom", align = "left", className = "" }: MenuProps) {
  const { open, setOpen, triggerRef } = useDropdown();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const inMenu = menuRef.current?.contains(target);
      const inTrigger = triggerRef.current?.contains(target);
      if (!inMenu && !inTrigger) setOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open, setOpen, triggerRef]);

  const handleMenuClick = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as Element).closest?.("[role='menuitem']")) setOpen(false);
    },
    [setOpen]
  );

  if (!open) return null;

  const positionClass = position === "top" ? "bottom-full mb-2" : "top-full mt-2";
  const alignClass = align === "right" ? "right-0" : "left-0";

  return (
    <div
      ref={menuRef}
      className={`absolute z-50 min-w-44 rounded-lg border border-border bg-background py-1 shadow-lg ${positionClass} ${alignClass} ${className} text-foreground`}
      role="menu"
      onClick={handleMenuClick}
    >
      {children}
    </div>
  );
}

Dropdown.Trigger = Trigger;
Dropdown.Menu = Menu;
