"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api/client";
import NotificationBell from "./NotificationBell";
import UserAvatar from "./UserAvatar";
import { LanguageSwitcher } from "../LanguageSwitcher";

export default function UserControls() {
    const [username, setUsername] = useState<string | null>(null);

    useEffect(() => {
        apiClient
            .request("/me")
            .then((user: { username?: string }) => setUsername(user?.username ?? null))
            .catch(() => setUsername(null));
    }, []);

    return (
        <div className="flex items-center gap-3 sm:rounded-xl sm:border sm:border-border sm:bg-muted/30 sm:px-3 sm:py-1.5 sm:hover:bg-brand-muted/10 cursor-pointer">
            <LanguageSwitcher />
            <NotificationBell />
            {username && (
                <span className="hidden sm:block text-sm font-semibold text-foreground max-w-[120px] truncate">
                    {username}
                </span>
            )}
            <UserAvatar />
        </div>
    );
}
