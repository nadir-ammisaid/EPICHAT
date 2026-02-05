"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const navItems = [
  { label: "Pourquoi EpiChat ?", href: "#pourquoi" },
  { label: "Fonctionnalités", href: "#fonctionnalites" },
  { label: "Sécurité & accès", href: "#securite" },
  { label: "Pour qui ?", href: "#pourqui" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!open) return;
      const target = e.target as Node;
      if (panelRef.current && !panelRef.current.contains(target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur border-b border-border">
      <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center">
        <Image src="/logo.png" alt="EpiChat" width={130} height={130} priority/>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm">
          {navItems.map((item) => (
            <a key={item.href} href={item.href} className="text-foreground/80 hover:text-foreground transition">
              {item.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link
            href="/login" className="hidden md:inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium bg-[#2F6BFF] hover:bg-[#1E4ED8] text-white hover:opacity-90 transition">
            Se connecter
          </Link>
          <button type="button" className="md:hidden inline-flex items-center justify-center rounded-full p-2 border border-border hover:bg-foreground/5 transition" aria-label="Open menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 7H20" stroke="currentColor" strokeWidth="2"strokeLinecap="round"/>
              <path d="M4 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M4 17H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden px-4 pb-4">
          <div ref={panelRef} className="mx-auto max-w-6xl rounded-2xl border border-border bg-background shadow-sm overflow-hidden">
            <div className="p-2">
              <Link href="/login" className="flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium hover:bg-foreground/5 transition"
                onClick={() => setOpen(false)}>
                Se connecter
                <span className="text-foreground/50">→</span>
              </Link>
              <div className="my-2 border-t border-border" />
              {navItems.map((item) => (
                <a key={item.href} href={item.href} className="block rounded-xl px-4 py-3 text-sm text-foreground/80 hover:text-foreground hover:bg-foreground/5 transition"
                  onClick={() => setOpen(false)}>
                  {item.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}