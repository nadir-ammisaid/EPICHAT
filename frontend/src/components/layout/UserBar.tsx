"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Hash } from "lucide-react";
import UserAvatar from "../ui/UserAvatar";
import parseDashboardPath from "@/lib/utils/parseDashboardPath";
import { apiClient } from "@/lib/api/client";

export default function UserBar() {
    const pathname = usePathname();
    const { channelId } = parseDashboardPath(pathname ?? "");
    const [channelName, setChannelName] = useState<string | null>(null);
    const displayChannelName = channelId ? channelName : null;

    useEffect(() => {
        if (!channelId) return;

        apiClient.request(`/channels/${channelId}`)
            .then((data: { name?: string; result?: { name: string } }) => {
                 setChannelName(data?.name ?? data?.result?.name ?? null);
            })
            .catch(() => setChannelName(null));
    }, [channelId]);

    return (
        <div className="bg-background border-b border-border h-[10%] flex items-center w-full px-4 justify-between">
            {displayChannelName ? (
                <div className="flex flex-col justify-center">
                    <div className="flex items-center gap-2">
                        <Hash className="h-5 w-5 text-muted-foreground" />
                        <h2 className="text-lg font-semibold">{displayChannelName}</h2>
                    </div>
                    <p className="text-xs text-muted-foreground hidden sm:block">
                        Bienvenue dans ce canal de discussion
                    </p>
                </div>
            ) : (
                <div />
            )}
            <div className="flex items-center gap-2">
                <UserAvatar />
            </div>
        </div>
    );
}