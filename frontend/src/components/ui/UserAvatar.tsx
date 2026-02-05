"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogOut, User, UserIcon } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { Dropdown } from "@/components/ui/Dropdown";
import getRandomAvatar from "@/lib/utils/getRandomAvatar";

export default function UserAvatar() {
  const router = useRouter();
  const [username, setUsername] = useState<string | null>(null);
  const avatarUrl = getRandomAvatar(username ?? "default");

  useEffect(() => {
    apiClient
      .request("/auth/me")
      .then((user: { username?: string }) => setUsername(user?.username ?? null))
      .catch(() => setUsername(null));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  return (
    <Dropdown>
      <Dropdown.Trigger className="flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-border bg-brand-muted/80 transition-colors hover:opacity-90">
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
      </Dropdown.Trigger>
      <Dropdown.Menu position="bottom" align="right">
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
          Déconnexion
        </button>
      </Dropdown.Menu>
    </Dropdown>
  );
}
