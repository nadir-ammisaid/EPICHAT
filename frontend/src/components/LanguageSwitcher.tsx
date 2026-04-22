"use client";

import { useTranslation } from "react-i18next";

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const current = i18n.language === "en" ? "en" : "fr";

  const change = (lng: "fr" | "en") => {
    if (lng !== current) {
      void i18n.changeLanguage(lng);
    }
  };

  return (
    <div className="bg-foreground/5 flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium">
      <button
        type="button"
        onClick={() => change("fr")}
        className={
          current === "fr"
            ? "bg-background text-foreground rounded-full px-2 py-1 shadow-sm"
            : "text-foreground/70 hover:text-foreground rounded-full px-2 py-1"
        }
      >
        FR
      </button>
      <button
        type="button"
        onClick={() => change("en")}
        className={
          current === "en"
            ? "bg-background text-foreground rounded-full px-2 py-1 shadow-sm"
            : "text-foreground/70 hover:text-foreground rounded-full px-2 py-1"
        }
      >
        EN
      </button>
    </div>
  );
}
