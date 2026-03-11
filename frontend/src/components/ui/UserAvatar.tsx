"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { LogOut, User, UserIcon, Circle } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { Dropdown } from "@/components/ui/Dropdown";
import getRandomAvatar from "@/lib/utils/getRandomAvatar";

const AVATAR_SEED_STORAGE_KEY = "epichat.avatarSeed";
const AVATAR_SEED_UPDATED_EVENT = "epichat:avatar-seed-updated";

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
  const [avatarSeed, setAvatarSeed] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem(AVATAR_SEED_STORAGE_KEY) ?? "";
  });
  const avatarUrl = getRandomAvatar(avatarSeed || username || "default");

  useEffect(() => {
    apiClient
      .request("/me")
      .then((user: { username?: string; status?: string }) => {
        setUsername(user?.username ?? null);
        if (user?.status) {
          const s = user.status === "offline" ? "online" : user.status;
          setStatus(s as UserStatus);
        }
      })
      .catch(() => setUsername(null));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncAvatarSeed = () => {
      setAvatarSeed(localStorage.getItem(AVATAR_SEED_STORAGE_KEY) ?? "");
    };

    const onStorage = (event: StorageEvent) => {
      if (event.key === AVATAR_SEED_STORAGE_KEY) {
        syncAvatarSeed();
      }
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener(AVATAR_SEED_UPDATED_EVENT, syncAvatarSeed);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(AVATAR_SEED_UPDATED_EVENT, syncAvatarSeed);
    };
  }, []);

  const handleLogout = () => {
    apiClient
      .request("/auth/me/status", {
        method: "PATCH",
        body: JSON.stringify({ status: "offline" }),
      })
      .catch(() => {});
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
      <Dropdown.Trigger className="relative flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-full transition-opacity hover:opacity-90">
        <div className="border-border bg-brand-muted/80 h-full w-full overflow-hidden rounded-full border">
          {username ? (
            <Image
              src={avatarUrl}
              alt={username}
              className="h-full w-full object-cover"
              width={48}
              height={48}
              unoptimized
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <User className="text-foreground h-6 w-6" />
            </div>
          )}
        </div>
        <span
          className={`border-background absolute -right-1 -bottom-1 z-10 h-5 w-5 rounded-full border-[3px] ${
            status === "online"
              ? "bg-green-500"
              : status === "away"
                ? "bg-yellow-500"
                : status === "busy"
                  ? "bg-red-500"
                  : "bg-gray-400"
          }`}
        />
      </Dropdown.Trigger>
      <Dropdown.Menu position="bottom" align="right">
        <div className="text-muted-foreground border-border border-b px-4 py-2 text-xs">
          Statut
        </div>
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => handleStatusChange(opt.value)}
            className={`hover:bg-brand-muted/10 flex w-full items-center gap-2 px-4 py-2 text-left text-sm transition-colors ${
              status === opt.value ? "bg-brand-muted/20" : ""
            }`}
          >
            <Circle className={`h-3 w-3 fill-current ${opt.color}`} />
            {opt.label}
          </button>
        ))}
        <div className="border-border border-t" />
        <Link
          href="/profile"
          className="text-foreground hover:bg-brand-muted/10 flex w-full items-center gap-2 px-4 py-2 text-left text-sm transition-colors"
          role="menuitem"
        >
          <UserIcon className="text-foreground h-4 w-4" />
          Mon Profil
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="hover:bg-error/10 text-error flex w-full items-center gap-2 px-4 py-2 text-left text-sm transition-colors hover:cursor-pointer"
          role="menuitem"
        >
          <LogOut className="text-error h-4 w-4" />
          Deconnexion
        </button>
      </Dropdown.Menu>
    </Dropdown>
  );
}
