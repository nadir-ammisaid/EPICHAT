"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";

import i18n from "./i18n";

type I18nProviderProps = {
  children: ReactNode;
  locale?: "fr" | "en";
};

export default function I18nProvider({
  children,
  locale = "fr",
}: I18nProviderProps) {
  useEffect(() => {
    if (locale && i18n.language !== locale) {
      void i18n.changeLanguage(locale);
    }
  }, [locale]);

  return <>{children}</>;
}
