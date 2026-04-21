'use client'

import { useTranslation } from "react-i18next";

type ServerPageProps = {
  params: {
    serverId: string;
  };
};

export default function ServerPage({ params }: ServerPageProps) {
  const { t } = useTranslation("common");

  return (
    <main>
      <h1>{t("pages.servers.serverTitle", { id: params.serverId })}</h1>
    </main>
  );
}
