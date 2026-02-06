"use client";

import { useEffect, useRef } from "react";
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

export default function DashboardShell() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { serverId, channelId } = parseDashboardPath(pathname ?? "");
  const inviteHandled = useRef(false);

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
        <ChannelBar />
        <div className="flex min-w-0 flex-1 flex-col">
          <UserBar />
          <div className="flex min-h-0 flex-1">
            <ChatSection />
            <MemberSection />
          </div>
        </div>
      </div>

      {/* Mobile  */}
      <div className="flex h-screen flex-col overflow-hidden md:hidden">
        {!serverId && (
          <div className="flex h-full w-full flex-col">
            <header className="flex shrink-0 items-center justify-between border-b border-border bg-background px-3 py-2">
              <span className="text-sm font-semibold">Serveurs</span>
              <UserAvatar />
            </header>
            <div className="min-h-0 flex-1">
              <ServerBar className="w-full min-w-0 max-w-none" />
            </div>
          </div>
        )}

        {serverId && !channelId && (
          <div className="flex h-full w-full flex-col">
            <header className="flex shrink-0 items-center justify-between gap-2 border-b border-border bg-background px-3 py-2">
              <Link href="/dashboard" className="text-sm font-medium text-brand hover:underline flex items-center gap-2 hover:cursor-pointer">
                <ArrowLeftIcon className="h-4 w-4" />
              </Link>
              <UserAvatar />
            </header>
            <div className="min-h-0 flex-1">
              <ChannelBar />
            </div>
          </div>
        )}

        {serverId && channelId && (
          <div className="flex h-full w-full flex-col">
            <header className="flex shrink-0 items-center gap-2 border-b border-border bg-background px-3 py-2">
              <Link href={`/dashboard/${serverId}`} className="text-sm font-medium text-brand hover:underline flex items-center gap-2 hover:cursor-pointer">
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
