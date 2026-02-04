"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogOut, User } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { Dropdown } from "@/components/ui/Dropdown";
import getInitials from "@/lib/utils/getInitials";

export default function UserAvatar() {
  const router = useRouter();
  const [username, setUsername] = useState<string | null>(null);

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

  const initials = getInitials(username);

  return (
    <Dropdown>
      <Dropdown.Trigger className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-muted text-sm font-semibold text-foreground transition-colors hover:bg-muted/80 focus:outline-none focus:ring-2 focus:ring-brand">
        {initials ?? <User className="h-5 w-5" />}
      </Dropdown.Trigger>
      <Dropdown.Menu position="bottom" align="right">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-foreground transition-colors hover:bg-muted"
          role="menuitem"
        >
          <LogOut className="h-4 w-4" />
          Déconnexion
        </button>
      </Dropdown.Menu>
    </Dropdown>
  );
}
