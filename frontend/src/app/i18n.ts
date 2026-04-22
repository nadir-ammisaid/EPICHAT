import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import frCommon from "../../public/locales/fr/common.json";
import frHome from "../../public/locales/fr/home.json";
import enCommon from "../../public/locales/en/common.json";
import enHome from "../../public/locales/en/home.json";
import frServers from "../../public/locales/fr/servers.json";
import enServers from "../../public/locales/en/servers.json";
import frNotifications from "../../public/locales/fr/notifications.json";
import enNotifications from "../../public/locales/en/notifications.json";
import frMembers from "../../public/locales/fr/members.json";
import enMembers from "../../public/locales/en/members.json";
import frDm from "../../public/locales/fr/dm.json";
import enDm from "../../public/locales/en/dm.json";

const resources = {
  fr: {
    common: frCommon,
    home: frHome,
    servers: frServers,
    notifications: frNotifications,
    members: frMembers,
    dm: frDm,
  },
  en: {
    common: enCommon,
    home: enHome,
    servers: enServers,
    notifications: enNotifications,
    members: enMembers,
    dm: enDm,
  },
} as const;

if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    resources,
    lng: "fr",
    fallbackLng: "fr",
    supportedLngs: ["fr", "en"],
    defaultNS: "common",
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
    initImmediate: false,
  });
}

export default i18n;