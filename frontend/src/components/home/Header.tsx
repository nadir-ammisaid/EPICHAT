"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const navItems = [
  { labelKey: "sections.why.title", href: "#pourquoi" },
  { labelKey: "sections.features.title", href: "#fonctionnalites" },
  { labelKey: "sections.security.title", href: "#securite" },
  { labelKey: "sections.forWho.title", href: "#pourqui" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const { t } = useTranslation("home");

  return (
    <header className="bg-background/80 border-border sticky top-0 z-50 w-full border-b backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center">
          <Image
            src="/logo.png"
            alt="Texte epichat comme logo"
            width={130}
            height={130}
            priority
          />
        </Link>
        <nav className="hidden items-center gap-6 text-sm md:flex">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-foreground/80 hover:text-foreground transition"
            >
              {t(item.labelKey)}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex">
            <LanguageSwitcher />
          </div>
          <Link
            href="/login"
            className="hidden items-center justify-center rounded-full bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-hover hover:opacity-90 md:inline-flex"
          >
            Se connecter
          </Link>
          <button
            type="button"
            className="border-border hover:bg-foreground/5 inline-flex items-center justify-center rounded-full border p-2 transition md:hidden"
            aria-label="Open menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M4 7H20"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M4 12H20"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M4 17H20"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div className="px-4 pb-4 md:hidden">
          <div
            ref={panelRef}
            className="border-border bg-background mx-auto max-w-6xl overflow-hidden rounded-2xl border shadow-sm"
          >
            <div className="p-2">
              <div className="mb-2 flex items-center justify-end gap-2">
                <LanguageSwitcher />
              </div>
              <Link
                href="/login"
                className="hover:bg-foreground/5 flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition"
                onClick={() => setOpen(false)}
              >
                Se connecter
                <span className="text-foreground/50">→</span>
              </Link>
              <div className="border-border my-2 border-t" />
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="text-foreground/80 hover:text-foreground hover:bg-foreground/5 block rounded-xl px-4 py-3 text-sm transition"
                  onClick={() => setOpen(false)}
                >
                  {t(item.labelKey)}
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}