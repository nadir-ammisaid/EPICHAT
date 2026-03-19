"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Hash } from "lucide-react";
import parseDashboardPath from "@/lib/utils/parseDashboardPath";
import { apiClient } from "@/lib/api/client";
import UserControls from "../ui/UserControls";

export default function UserBar() {
  const pathname = usePathname();
  const { channelId } = parseDashboardPath(pathname ?? "");
  const [channelName, setChannelName] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const displayChannelName = channelId ? channelName : null;

  useEffect(() => {
    if (!channelId) return;
    apiClient
      .request(`/channels/${channelId}`)
      .then((data: { name?: string; result?: { name: string } }) => {
        setChannelName(data?.name ?? data?.result?.name ?? null);
      })
      .catch(() => setChannelName(null));
  }, [channelId]);

  useEffect(() => {
    apiClient
      .request("/me")
      .then((user: { username?: string }) => {
        setUsername(user?.username ?? null);
      })
      .catch(() => setUsername(null));
  }, []);


  return (
    <div className="bg-background border-border flex h-[10%] w-full items-center justify-between border-b px-4">
      {displayChannelName ? (
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-2">
            <Hash className="text-muted-foreground h-5 w-5" />
            <h2 className="text-lg font-semibold">{displayChannelName}</h2>
          </div>
          <p className="text-muted-foreground hidden text-xs sm:block">
            Bienvenue dans ce canal de discussion
          </p>
        </div>
      ) : (
        <div className="flex flex-col justify-center">
          <h2 className="text-lg font-semibold">
            Bienvenue{username ? `, ${username}` : ""} !
          </h2>
        </div>
      )}
      <UserControls />
    </div>
  );
}