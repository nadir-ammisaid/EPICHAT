"use client";

import { useTranslation } from "react-i18next";

export default function Error() {
  const { t } = useTranslation("common");
  return <p>{t("pages.servers.error")}</p>;
}
