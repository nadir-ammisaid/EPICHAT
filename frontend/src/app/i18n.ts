"use client";

import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import frCommon from "../../public/locales/fr/common.json";
import frHome from "../../public/locales/fr/home.json";
import enCommon from "../../public/locales/en/common.json";
import enHome from "../../public/locales/en/home.json";
import frServers from "../../public/locales/fr/servers.json";
import enServers from "../../public/locales/en/servers.json";
import frNotifications from "../../public/locales/fr/notifications.json";
import enNotifications from "../../public/locales/en/notifications.json";

const resources = {
  fr: {
    common: frCommon,
    home: frHome,
    servers: frServers,
    notifications: frNotifications
  },
  en: {
    common: enCommon,
    home: enHome,
    servers: enServers,
    notifications: enNotifications
  },
} as const;

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources,
    lng: "fr",
    fallbackLng: "fr",
    supportedLngs: ["fr", "en"],
    defaultNS: "common",
    interpolation: {
      escapeValue: false,
    },
  });
}

export default i18n;

