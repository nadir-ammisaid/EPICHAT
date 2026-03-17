"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Hash } from "lucide-react";
import UserAvatar from "../ui/UserAvatar";
import NotificationBell from "../ui/NotificationBell";
import parseDashboardPath from "@/lib/utils/parseDashboardPath";
import { apiClient } from "@/lib/api/client";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function UserBar() {
  const pathname = usePathname();
  const { channelId } = parseDashboardPath(pathname ?? "");
  const [channelName, setChannelName] = useState<string | null>(null);
  const displayChannelName = channelId ? channelName : null;
  const { t } = useTranslation("common");

  useEffect(() => {
    if (!channelId) return;

    apiClient
      .request(`/channels/${channelId}`)
      .then((data: { name?: string; result?: { name: string } }) => {
        setChannelName(data?.name ?? data?.result?.name ?? null);
      })
      .catch(() => setChannelName(null));
  }, [channelId]);

  return (
    <div className="bg-background border-border flex h-[10%] w-full items-center justify-between border-b px-4">
      {displayChannelName ? (
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-2">
            <Hash className="text-muted-foreground h-5 w-5" />
            <h2 className="text-lg font-semibold">{displayChannelName}</h2>
          </div>
          <p className="text-muted-foreground hidden text-xs sm:block">
            {t("chat.channelWelcome")}
          </p>
        </div>
      ) : (
        <div />
      )}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex">
          <LanguageSwitcher />
        </div>
        <NotificationBell />
        <UserAvatar />
      </div>
    </div>
  );
}
