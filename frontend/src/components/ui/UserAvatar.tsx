"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogOut, User, UserIcon, Circle } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { Dropdown } from "@/components/ui/Dropdown";
import getRandomAvatar from "@/lib/utils/getRandomAvatar";

type UserStatus = "online" | "away" | "busy" | "invisible";

const STATUS_OPTIONS: { value: UserStatus; label: string; color: string }[] = [
  { value: "online", label: "En ligne", color: "text-green-500" },
  { value: "away", label: "Absent", color: "text-yellow-500" },
  { value: "busy", label: "Occupe", color: "text-red-500" },
  { value: "invisible", label: "Invisible", color: "text-gray-400" },
];

export default function UserAvatar() {
  const router = useRouter();
  const [username, setUsername] = useState<string | null>(null);
  const [status, setStatus] = useState<UserStatus>("online");
  const avatarUrl = getRandomAvatar(username ?? "default");

  useEffect(() => {
    apiClient
      .request("/me")
      .then((user: { username?: string; status?: string }) => {
        setUsername(user?.username ?? null);
        if (user?.status) setStatus(user.status as UserStatus);
      })
      .catch(() => setUsername(null));
  }, []);

  const handleLogout = () => {
    apiClient.request("/auth/me/status", {
      method: "PATCH",
      body: JSON.stringify({ status: "offline" }),
    }).catch(() => {});
    localStorage.removeItem("token");
    router.push("/login");
  };

  const handleStatusChange = async (newStatus: UserStatus) => {
    try {
      await apiClient.request("/auth/me/status", {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      setStatus(newStatus);
    } catch {}
  };

  return (
    <Dropdown>
      <Dropdown.Trigger className="relative flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-border bg-brand-muted/80 transition-colors hover:opacity-90">
        {username ? (
          <img
            src={avatarUrl}
            alt={username}
            className="h-full w-full object-cover"
            width={48}
            height={48}
          />
        ) : (
          <User className="h-6 w-6 text-foreground" />
        )}
        <span
          className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-background ${
            status === "online" ? "bg-green-500" :
            status === "away" ? "bg-yellow-500" :
            status === "busy" ? "bg-red-500" : "bg-gray-400"
          }`}
        />
      </Dropdown.Trigger>
      <Dropdown.Menu position="bottom" align="right">
        <div className="px-4 py-2 text-xs text-muted-foreground border-b border-border">
          Statut
        </div>
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => handleStatusChange(opt.value)}
            className={`flex w-full items-center gap-2 px-4 py-2 text-left text-sm transition-colors hover:bg-brand-muted/10 ${
              status === opt.value ? "bg-brand-muted/20" : ""
            }`}
          >
            <Circle className={`h-3 w-3 fill-current ${opt.color}`} />
            {opt.label}
          </button>
        ))}
        <div className="border-t border-border" />
        <Link href="/profile" className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-foreground transition-colors hover:bg-brand-muted/10" role="menuitem">
          <UserIcon className="h-4 w-4 text-foreground" />
          Mon Profil
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center hover:bg-error/10 text-error hover:cursor-pointer gap-2 px-4 py-2 text-left text-sm transition-colors"
          role="menuitem"
        >
          <LogOut className="h-4 w-4 text-error" />
          Deconnexion
        </button>
      </Dropdown.Menu>
    </Dropdown>
  );
}

