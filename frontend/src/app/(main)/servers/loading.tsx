"use client";

import { useTranslation } from "react-i18next";

export default function Loading() {
  const { t } = useTranslation("common");
  return <div>{t("pages.servers.loading")}</div>;
}
