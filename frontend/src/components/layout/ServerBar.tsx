"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Loader2,
  UserPlus,
  Copy,
  Check,
  Pencil,
  Trash2,
  Settings,
  MessageSquareMore,
} from "lucide-react";
import Image from "next/image";
import { apiClient } from "@/lib/api/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Dropdown } from "@/components/ui/Dropdown";

type Server = { id: string; name: string; ownerId: string; createdAt: string };

export default function ServerBar({ className = "" }: { className?: string }) {
  const pathname = usePathname();
  const router = useRouter();
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
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [serverActionError, setServerActionError] = useState<string | null>(
    null,
  );

  const serverIdFromPath = pathname?.split("/").filter(Boolean)[1] ?? null;

  const [myUserId, setMyUserId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const payload = JSON.parse(atob(token.split(".")[1] ?? ""));
      if (typeof payload?.userId === "string") {
        setMyUserId(payload.userId);
      }
    } catch {
      // ignore invalid token
    }
  }, []);

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
      setCreateError(e instanceof Error ? e.message : "Erreur création");
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
        {
          method: "POST",
        },
      );
      await getServers();
      setInviteCode("");
      setJoinOpen(false);
      if (member?.serverId) {
        router.push(`/dashboard/${member.serverId}`);
      }
    } catch (e) {
      setJoinError(
        e instanceof Error ? e.message : "Erreur lors de l’utilisation du code",
      );
    } finally {
      setJoinLoading(false);
    }
  };

  const openInviteModal = (serverId?: string) => {
    const id = serverId ?? serverIdFromPath;
    setInviteError(null);
    setCreatedCode(null);
    setInviteOpen(true);
    if (id) {
      setInviteLoading(true);
      apiClient
        .request(`/servers/${id}/invites`, { method: "POST" })
        .then((invite: { code: string }) => {
          setCreatedCode(invite.code);
        })
        .catch((e: Error) => {
          setInviteError(e instanceof Error ? e.message : "Erreur");
        })
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

  // delete server (owner only)
  const handleDeleteServer = async (serverId: string) => {
    try {
      setServerActionError(null);
      await apiClient.request(`/servers/${serverId}`, { method: "DELETE" });
      if (serverIdFromPath === serverId) {
        router.push("/dashboard");
      }
      await getServers();
    } catch (e) {
      setServerActionError(
        e instanceof Error
          ? e.message
          : "Erreur lors de la suppression du serveur",
      );
    }
  };

  // leave server (members, non-owners)
  const handleLeaveServer = async (serverId: string) => {
    try {
      setServerActionError(null);
      await apiClient.request(`/servers/${serverId}/leave`, {
        method: "DELETE",
      });
      if (serverIdFromPath === serverId) {
        router.push("/dashboard");
      }
      await getServers();
    } catch (e) {
      setServerActionError(
        e instanceof Error ? e.message : "Erreur lors de la sortie du serveur",
      );
    }
  };
  return (
    <>
      <div
        className={`bg-background border-border flex h-full shrink-0 flex-col items-center justify-between border p-2 ${className}`}
      >
        <div className="mt-2 flex w-full flex-col items-center gap-2">
          <Link
            href="/dashboard"
            className="flex shrink-0"
            aria-label="Accueil"
          >
            <Image
              src="/images/logo.png"
              alt="Epichat"
              width={100}
              height={100}
              className="rounded-lg object-cover"
            />
          </Link>
          <hr className="border-border-muted w-full" />
          <Link
            href="/dashboard/dm"
            className={`hover:bg-brand-muted/80 flex w-full items-center gap-3 rounded-lg px-4 py-2 transition-colors hover:cursor-pointer ${
              pathname?.startsWith("/dashboard/dm")
                ? "bg-brand-hover font-medium"
                : "bg-brand-muted"
            }`}
            title="Messages privés"
          >
            <span className="bg-brand text-background flex h-8 w-8 shrink-0 items-center justify-center rounded-md">
              <MessageSquareMore className="h-5 w-5" />
            </span>
            <span className="truncate text-sm">Messages privés</span>
          </Link>
        </div>

        {/* Server list */}
        <div className="flex w-full flex-col gap-2 overflow-y-auto">
          {servers.map((server) => {
            const isActive = serverIdFromPath === server.id;
            const isOwner = myUserId && server.ownerId === myUserId;

            return (
              <div
                key={server.id}
                className={`text-foreground hover:bg-brand-muted/80 flex items-center gap-1 rounded-lg transition-colors hover:cursor-pointer ${isActive ? "bg-brand-hover font-medium" : "bg-brand-muted"} `}
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
                      className="text-foreground flex h-8 w-8 items-center justify-center rounded-md hover:cursor-pointer"
                      title="Options du serveur"
                      aria-label="Options du serveur"
                    >
                      <Settings className="h-4 w-4" />
                    </button>
                  </Dropdown.Trigger>
                  <Dropdown.Menu position="bottom" align="right">
                    <button
                      type="button"
                      onClick={() => openInviteModal(server.id)}
                      className="hover:bg-brand-muted/10 text-foreground hover:bg-muted flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:cursor-pointer"
                      role="menuitem"
                    >
                      <UserPlus className="h-4 w-4" />
                      Inviter
                    </button>
                    <button
                      type="button"
                      onClick={() => {}}
                      className="hover:bg-brand-muted/10 text-foreground hover:bg-muted flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:cursor-pointer"
                      role="menuitem"
                    >
                      <Pencil className="h-4 w-4" />
                      Modifier le nom
                    </button>
                    {isOwner ? (
                      <button
                        type="button"
                        onClick={() => handleDeleteServer(server.id)}
                        className="hover:bg-brand-muted/10 text-error hover:bg-muted flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:cursor-pointer"
                        role="menuitem"
                      >
                        <Trash2 className="h-4 w-4" />
                        Supprimer le serveur
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleLeaveServer(server.id)}
                        className="hover:bg-brand-muted/10 text-error hover:bg-muted flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:cursor-pointer"
                        role="menuitem"
                      >
                        <Trash2 className="h-4 w-4" />
                        Quitter le serveur
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
        <div className="flex w-full shrink-0 flex-col items-center gap-2">
          <Button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="hover:bg-brand-hover bg-brand text-background w-full items-center justify-center gap-2 transition-colors hover:cursor-pointer"
            title="Créer un serveur"
            aria-label="Créer un serveur"
          >
            Créer un serveur
          </Button>
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
            title="Rejoindre un serveur avec un code"
            aria-label="Rejoindre un serveur"
          >
            Rejoindre un serveur
          </Button>
        </div>
      </div>

      <Modal
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
          setNewName("");
          setCreateError(null);
        }}
        title="Nouveau serveur"
      >
        <form onSubmit={handleCreate} className="flex flex-col gap-3">
          <Input
            label="Nom du serveur"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Mon serveur"
            maxLength={100}
            required
            disabled={createLoading}
          />
          {createError && <p className="text-error text-sm">{createError}</p>}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => {
                setCreateOpen(false);
                setNewName("");
                setCreateError(null);
              }}
              disabled={createLoading}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              disabled={createLoading || !newName.trim()}
            >
              {createLoading ? "Création…" : "Créer"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={joinOpen}
        onClose={() => {
          setJoinOpen(false);
          setInviteCode("");
          setJoinError(null);
        }}
        title="Rejoindre un serveur"
      >
        <form onSubmit={handleJoin} className="flex flex-col gap-3">
          <Input
            label="Code d'invitation"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            placeholder="Collez le code reçu"
            disabled={joinLoading}
          />
          {joinError && <p className="text-error text-sm">{joinError}</p>}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => {
                setJoinOpen(false);
                setInviteCode("");
                setJoinError(null);
              }}
              disabled={joinLoading}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              disabled={joinLoading || !inviteCode.trim()}
            >
              {joinLoading ? "Rejoindre…" : "Rejoindre"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={inviteOpen}
        onClose={() => {
          setInviteOpen(false);
          setInviteError(null);
          setCreatedCode(null);
          setCopied(false);
        }}
        title="Inviter des utilisateurs"
      >
        <div className="flex flex-col gap-3">
          {inviteLoading && (
            <p className="text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Génération du lien…
            </p>
          )}
          {inviteError && <p className="text-error text-sm">{inviteError}</p>}
          {createdCode && !inviteLoading && (
            <>
              <p className="text-muted-foreground text-sm">
                Partagez ce lien ou le code pour que d’autres puissent rejoindre
                le serveur (via « Rejoindre »).
              </p>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={inviteLink}
                  className="font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={copyInviteLink}
                  className="shrink-0"
                  title="Copier le lien"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-muted-foreground text-xs">
                Code seul :{" "}
                <code className="bg-muted rounded px-1">{createdCode}</code>
              </p>
            </>
          )}
          <Button
            type="button"
            variant="outline"
            className="mt-2"
            onClick={() => {
              setInviteOpen(false);
              setInviteError(null);
              setCreatedCode(null);
            }}
          >
            Fermer
          </Button>
        </div>
      </Modal>
    </>
  );
}
