"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  UserPlus,
  Trash2,
  Settings,
  MessageSquareMore,
} from "lucide-react";
import Image from "next/image";
import { apiClient } from "@/lib/api/client";
import { useCurrentUserId } from "@/lib/hooks/useCurrentUserId";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Dropdown } from "@/components/ui/Dropdown";
import { useTranslation } from "react-i18next";

type Server = { id: string; name: string; ownerId: string; createdAt: string };

export default function ServerBar({ className = "" }: { className?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation("servers");

  const [servers, setServers] = useState<Server[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [joinOpen, setJoinOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [serverActionError, setServerActionError] = useState<string | null>(null);

  const serverIdFromPath = pathname?.split("/").filter(Boolean)[1] ?? null;
  const myUserId = useCurrentUserId();

  const getServers = async () => {
    try {
      setServers([]);
      setServerActionError(null);
      const data = await apiClient.request("/servers");
      setServers(Array.isArray(data) ? data : []);
    } catch {
      setServers([]);
    }
  };

  useEffect(() => {
    getServers();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    setCreateError(null);
    setCreateLoading(true);
    try {
      const server = await apiClient.request("/servers", {
        method: "POST",
        body: JSON.stringify({ name }),
      });
      setServers((prev) => [...prev, server]);
      setNewName("");
      setCreateOpen(false);
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : t("createModal.error"));
    } finally {
      setCreateLoading(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = inviteCode.trim();
    if (!code) return;
    setJoinError(null);
    setJoinLoading(true);
    try {
      const member = await apiClient.request(
        `/invites/${encodeURIComponent(code)}/join`,
        { method: "POST" }
      );
      await getServers();
      setInviteCode("");
      setJoinOpen(false);
      if (member?.serverId) {
        router.push(`/dashboard/${member.serverId}`);
      }
    } catch (e) {
      setJoinError(e instanceof Error ? e.message : t("joinModal.error"));
    } finally {
      setJoinLoading(false);
    }
  };

  const openInviteModal = (serverId?: string) => {
    const id = serverId ?? serverIdFromPath;
    setCreatedCode(null);
    setInviteOpen(true);
    if (id) {
      setInviteLoading(true);
      apiClient
        .request(`/servers/${id}/invites`, { method: "POST" })
        .then((invite: { code: string }) => setCreatedCode(invite.code))
        .catch(() => setCreatedCode(null))
        .finally(() => setInviteLoading(false));
    }
  };

  const inviteLink =
    typeof window !== "undefined" && createdCode
      ? `${window.location.origin}/dashboard?invite=${encodeURIComponent(createdCode)}`
      : "";

  const copyInviteLink = () => {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDeleteServer = async (serverId: string) => {
    try {
      setServerActionError(null);
      await apiClient.request(`/servers/${serverId}`, { method: "DELETE" });
      if (serverIdFromPath === serverId) router.push("/dashboard");
      await getServers();
    } catch (e) {
      setServerActionError(
        e instanceof Error ? e.message : t("errors.delete")
      );
    }
  };

  const handleLeaveServer = async (serverId: string) => {
    try {
      setServerActionError(null);
      await apiClient.request(`/servers/${serverId}/leave`, {
        method: "DELETE",
      });
      if (serverIdFromPath === serverId) router.push("/dashboard");
      await getServers();
    } catch (e) {
      setServerActionError(
        e instanceof Error ? e.message : t("errors.leave")
      );
    }
  };

  return (
    <>
      <div
        className={`bg-background border-border flex h-full shrink-0 flex-col items-center justify-start border-r p-2 ${className}`}
      >
        <div className="mt-2 flex w-full flex-col items-center gap-2">
          <Link href="/dashboard" className="hidden md:flex shrink-0" aria-label="Accueil">
            <Image src="/images/logo.png" alt="Epichat" width={100} height={100} className="rounded-lg object-cover" />
          </Link>
          <div className="flex w-full items-center gap-2 mt-2 mb-2">
          <hr className="border-border-muted flex-1" />
          <span className="text-muted-foreground text-lg font-bold uppercase">Messages</span>
          <hr className="border-border-muted flex-1" />
        </div>
          <Link
            href="/dashboard/dm"
            title={t("dm")}
            className={`hover:bg-brand-muted/80 flex w-full items-center gap-3 rounded-lg px-4 py-2 transition-colors hover:cursor-pointer ${
              pathname?.startsWith("/dashboard/dm")
                ? "bg-brand-hover font-medium"
                : "bg-brand-muted"
            }`}
          >
            <span className="bg-brand text-background flex h-8 w-8 shrink-0 items-center justify-center rounded-md">
              <MessageSquareMore className="h-5 w-5" />
            </span>
            <span className="truncate text-sm">{t("dm")}</span>
          </Link>
        </div>

        <div className="flex w-full items-center gap-2 mt-4 mb-2">
          <hr className="border-border-muted flex-1" />
          <span className="text-muted-foreground text-lg font-bold uppercase">{t("title")}</span>
          <hr className="border-border-muted flex-1" />
        </div>

        {/* Server list */}
        <div className="flex w-full flex-col gap-2 overflow-y-auto pb-24">
          {servers.map((server) => {
            const isActive = serverIdFromPath === server.id;
            const isOwner = myUserId && server.ownerId === myUserId;

            return (
              <div
                key={server.id}
                className={`text-foreground hover:bg-brand-muted/80 flex items-center gap-1 rounded-lg transition-colors hover:cursor-pointer ${
                  isActive ? "bg-brand-hover font-medium" : "bg-brand-muted"
                }`}
              >
                <Link
                  href={`/dashboard/${server.id}`}
                  title={server.name}
                  className="flex min-w-0 flex-1 items-center gap-3 rounded-full px-4 py-2"
                >
                  <span className="bg-brand text-background flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-sm">
                    {server.name.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="truncate text-sm">{server.name}</span>
                </Link>

                <Dropdown className="shrink-0">
                  <Dropdown.Trigger>
                    <button
                      type="button"
                      title={t("options")}
                      aria-label={t("options")}
                      className="text-foreground flex h-8 w-8 items-center justify-center rounded-md hover:cursor-pointer"
                    >
                      <Settings className="h-4 w-4" />
                    </button>
                  </Dropdown.Trigger>

                  <Dropdown.Menu position="bottom" align="right">
                    <button
                      onClick={() => openInviteModal(server.id)}
                      className="hover:bg-brand-muted/10 text-foreground flex w-full items-center gap-2 px-4 py-2 text-sm"
                    >
                      <UserPlus className="h-4 w-4" />
                      {t("invite")}
                    </button>

                    {isOwner ? (
                      <button
                        onClick={() => handleDeleteServer(server.id)}
                        className="hover:bg-brand-muted/10 text-error flex w-full items-center gap-2 px-4 py-2 text-sm"
                      >
                        <Trash2 className="h-4 w-4" />
                        {t("delete")}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleLeaveServer(server.id)}
                        className="hover:bg-brand-muted/10 text-error flex w-full items-center gap-2 px-4 py-2 text-sm"
                      >
                        <Trash2 className="h-4 w-4" />
                        {t("leave")}
                      </button>
                    )}
                  </Dropdown.Menu>
                </Dropdown>
              </div>
            );
          })}
          {serverActionError && (
            <p className="text-error px-3 py-1 text-xs">{serverActionError}</p>
          )}
        </div>

        {/* Create / Join */}
        <div className="mt-auto flex w-full shrink-0 flex-col items-center gap-2">
          <Button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="hover:bg-brand-hover bg-brand text-background w-full items-center justify-center gap-2 transition-colors hover:cursor-pointer"
            title="Créer un serveur"
            aria-label="Créer un serveur"
          >
            {t("actions.create")}
          </Button>

          {/* <Button variant="outline" size="sm" onClick={() => setJoinOpen(true)}>
            {t("actions.join")}
          </Button> */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="hover:!text-brand-hover w-full items-center justify-center gap-2 !text-black"
            onClick={() => {
              setJoinError(null);
              setInviteCode("");
              setJoinOpen(true);
            }}
            title={t("actions.join")}
            aria-label={t("actions.join")}
          >
            {t("actions.join")}
          </Button>        
        </div>
      </div>

      {/* Modale de création  */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title={t("createModal.title")}>
        <form onSubmit={handleCreate} className="flex flex-col gap-3">
          <Input
            label={t("createModal.nameLabel")}
            placeholder={t("createModal.namePlaceholder")}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          {createError && <p className="text-error text-sm">{createError}</p>}
          <Button type="submit">
            {createLoading ? t("createModal.loading") : t("createModal.submit")}
          </Button>
        </form>
      </Modal>

      {/* Modale pour rejoindre  */}
      <Modal open={joinOpen} onClose={() => setJoinOpen(false)} title={t("joinModal.title")}>
        <form onSubmit={handleJoin} className="flex flex-col gap-3">
          <Input
            label={t("joinModal.codeLabel")}
            placeholder={t("joinModal.codePlaceholder")}
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
          />
          {joinError && <p className="text-error text-sm">{joinError}</p>}
          <Button type="submit">
            {joinLoading ? t("joinModal.loading") : t("joinModal.submit")}
          </Button>
        </form>
      </Modal>

      {/* Modale d'invitation  */}
      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title={t("inviteModal.title")}>
        <div className="flex flex-col gap-3">
          {inviteLoading && <p>{t("inviteModal.generating")}</p>}
          {createdCode && (
            <>
              <p>{t("inviteModal.description")}</p>
              <Input readOnly value={inviteLink} />
              <Button onClick={copyInviteLink}>
                {copied ? t("inviteModal.copied") : t("inviteModal.copy")}
              </Button>
              <p>
                {t("inviteModal.codeLabel")} {createdCode}
              </p>
            </>
          )}
          <Button onClick={() => setInviteOpen(false)}>
            {t("inviteModal.close")}
          </Button>
        </div>
      </Modal>
    </>
  );
}