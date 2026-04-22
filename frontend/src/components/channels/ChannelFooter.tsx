"use client"

import { useTranslation } from "react-i18next";

type Props = {
  serverId: string | null;
  count: number;
};

export default function ChannelFooter({ serverId, count }: Props) {
  const { t } = useTranslation("common");

  return (
    <div className="border-border border-t px-4 py-3 text-center text-xs text-slate-500">
      {serverId ? t("channels.footerCount", { count }) : "—"}
    </div>
  );
}
