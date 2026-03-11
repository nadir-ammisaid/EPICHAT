"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import ServerBar from "@/components/layout/ServerBar";
import ChannelBar from "@/components/layout/ChannelBar";
import ChatSection from "@/components/layout/ChatSection";
import MemberSection from "@/components/layout/MemberSection";
import UserBar from "@/components/layout/UserBar";
import UserAvatar from "@/components/ui/UserAvatar";
import parseDashboardPath from "@/lib/utils/parseDashboardPath";
import { ArrowLeftIcon } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import DmBar from "@/components/layout/DmBar";
import DmSection from "@/components/layout/DmSection";
import { getConversations } from "@/lib/api/dm";
import getInitials from "@/lib/utils/getInitials";

export default function DashboardShell() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { serverId, channelId } = parseDashboardPath(pathname ?? "");
  const inviteHandled = useRef(false);

  const [dmContact, setDmContact] = useState<{
    username: string;
    status: string;
  } | null>(null);

  useEffect(() => {
    async function load() {
      if (serverId !== "dm" || !channelId) {
        setDmContact(null);
        return;
      }
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const uid = JSON.parse(atob(token.split(".")[1])).userId ?? null;
        if (!uid) return;
        const convs = await getConversations();
        const conv = convs.find((c) => c.id === channelId);
        if (!conv) {
          setDmContact(null);
          return;
        }
        const other =
          conv.participant1Id === uid ? conv.participant2 : conv.participant1;
        setDmContact({ username: other.username, status: other.status });
      } catch {
        setDmContact(null);
      }
    }
    load();
  }, [serverId, channelId]);

  useEffect(() => {
    const code = searchParams.get("invite");
    if (!code || inviteHandled.current) return;
    inviteHandled.current = true;
    apiClient
      .request(`/invites/${encodeURIComponent(code)}/join`, { method: "POST" })
      .then((member: { serverId?: string }) => {
        if (member?.serverId) {
          router.replace(`/dashboard/${member.serverId}`);
        }
      })
      .catch(() => {
        inviteHandled.current = false;
      });
  }, [searchParams, router]);

  return (
    <>
      {/* Desktop  */}
      <div className="hidden h-screen overflow-hidden md:flex">
        <ServerBar />
        {serverId === "dm" ? (
          <>
            <DmBar />
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="bg-background border-border flex h-[10%] w-full items-center justify-between border-b px-4">
                {dmContact ? (
                  <div className="flex items-center gap-2">
                    <span className="bg-brand-muted/80 text-foreground relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                      {getInitials(dmContact.username) ?? "?"}
                      <span
                        className={`border-background absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full border-2 ${
                          dmContact.status === "online"
                            ? "bg-green-500"
                            : dmContact.status === "away"
                              ? "bg-yellow-500"
                              : dmContact.status === "busy"
                                ? "bg-red-500"
                                : "bg-gray-400"
                        }`}
                      />
                    </span>
                    <span className="text-sm font-semibold">
                      {dmContact.username}
                    </span>
                  </div>
                ) : (
                  <div />
                )}
                <UserAvatar />
              </div>
              <DmSection />
            </div>
          </>
        ) : (
          <>
            <ChannelBar />
            <div className="flex min-w-0 flex-1 flex-col">
              <UserBar />
              <div className="flex min-h-0 flex-1">
                <ChatSection />
                <MemberSection />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Mobile  */}
      <div className="flex h-screen flex-col overflow-hidden md:hidden">
        {!serverId && (
          <div className="flex h-full w-full flex-col">
            <header className="border-border bg-background flex shrink-0 items-center justify-between border-b px-3 py-2">
              <span className="text-sm font-semibold">Serveurs</span>
              <UserAvatar />
            </header>
            <div className="min-h-0 flex-1">
              <ServerBar className="w-full max-w-none min-w-0" />
            </div>
          </div>
        )}

        {serverId === "dm" && (
          <div className="flex h-full w-full flex-col">
            <header className="border-border bg-background flex shrink-0 items-center justify-between gap-2 border-b px-3 py-2">
              <Link
                href="/dashboard"
                className="text-brand flex items-center gap-2 text-sm font-medium hover:underline"
              >
                <ArrowLeftIcon className="h-4 w-4" />
              </Link>
              <UserAvatar />
            </header>
            <div className="flex min-h-0 flex-1">
              <DmSection />
            </div>
          </div>
        )}

        {serverId && serverId !== "dm" && !channelId && (
          <div className="flex h-full w-full flex-col">
            <header className="border-border bg-background flex shrink-0 items-center justify-between gap-2 border-b px-3 py-2">
              <Link
                href="/dashboard"
                className="text-brand flex items-center gap-2 text-sm font-medium hover:cursor-pointer hover:underline"
              >
                <ArrowLeftIcon className="h-4 w-4" />
              </Link>
              <UserAvatar />
            </header>
            <div className="min-h-0 flex-1">
              <ChannelBar />
            </div>
          </div>
        )}
        {serverId && serverId !== "dm" && channelId && (
          <div className="flex h-full w-full flex-col">
            <header className="border-border bg-background flex shrink-0 items-center gap-2 border-b px-3 py-2">
              <Link
                href={`/dashboard/${serverId}`}
                className="text-brand flex items-center gap-2 text-sm font-medium hover:cursor-pointer hover:underline"
              >
                <ArrowLeftIcon className="h-4 w-4" />
                Retour
              </Link>
            </header>
            <UserBar />
            <div className="flex min-h-0 flex-1">
              <ChatSection />
              <MemberSection />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
