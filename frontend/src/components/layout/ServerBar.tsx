"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Plus, Pencil, Trash2 } from "lucide-react";
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

  const [editServer, setEditServer] = useState<Server | null>(null);
  const [editName, setEditName] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [deleteServer, setDeleteServer] = useState<Server | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const serverIdFromPath = pathname?.split("/").filter(Boolean)[1] ?? null;

  const getServers = async () => {
    try {
      setServers([]);
      const data = await apiClient.request("/servers");
      setServers(Array.isArray(data) ? data : []);
    } catch (e) {
      setServers([]);
    }
  };

  useEffect(() => {
    getServers();
  }, []);

  const handleCreateServer = async (e: React.FormEvent) => {
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

  const openEdit = (server: Server) => {
    setEditServer(server);
    setEditName(server.name);
    setEditError(null);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editServer) return;
    const name = editName.trim();
    if (!name) return;
    setEditError(null);
    setEditLoading(true);
    try {
      const updated = await apiClient.request(`/servers/${editServer.id}`, {
        method: "PUT",
        body: JSON.stringify({ name }),
      });
      setServers((prev) =>
        prev.map((s) => (s.id === editServer.id ? { ...s, name: updated.name } : s))
      );
      setEditServer(null);
      setEditName("");
    } catch (e) {
      setEditError(e instanceof Error ? e.message : "Erreur modification");
    } finally {
      setEditLoading(false);
    }
  };

  const openDelete = (server: Server) => {
    setDeleteServer(server);
    setDeleteError(null);
  };

  const handleDelete = async () => {
    if (!deleteServer) return;
    setDeleteError(null);
    setDeleteLoading(true);
    try {
      await apiClient.request(`/servers/${deleteServer.id}`, { method: "DELETE" });
      setServers((prev) => prev.filter((s) => s.id !== deleteServer.id));
      if (serverIdFromPath === deleteServer.id) {
        router.push("/dashboard");
      }
      setDeleteServer(null);
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : "Erreur suppression");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <>
      <div
        className={`flex h-full shrink-0 flex-col items-center justify-between bg-background p-2 border border-border ${className}`}
      >
        <Link href="/dashboard" className="flex shrink-0" aria-label="Accueil">
            <Image
              src="/images/logo.png"
              alt="Epichat"
              width={100}
              height={100}
              className="rounded-lg object-cover"
            />
              </Link>
              
        {/* Liste de serveurs */}
        <div className="flex w-full flex-col gap-2 overflow-y-auto">
          {servers.map((server) => {
            const isActive = serverIdFromPath === server.id;  

            return (
              <div
                key={server.id}
                className={`
                  flex items-center gap-1 rounded-lg
                  bg-brand-muted text-foreground hover:bg-brand-muted/80
                 hover:cursor-pointer transition-colors
                  ${isActive ? "bg-brand-hover font-medium" : ""}
                `}
              >
                <Link
                  href={`/dashboard/${server.id}`}
                  title={server.name}
                  className="flex min-w-0 flex-1 items-center gap-3 px-4 py-2 rounded-full"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-brand text-background text-sm">
                    {server.name.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="truncate text-sm">{server.name}</span>
                </Link>
                
                <Dropdown className="shrink-0">
                  <Dropdown.Trigger>
                    <button
                      type="button"
                      className="flex h-8 w-8 items-center justify-center rounded-md text-foreground"
                      title="Options du serveur"
                      aria-label="Options du serveur"
                    >
                      <Pencil className="h-4 w-4 hover:cursor-pointer" />
                    </button>
                  </Dropdown.Trigger>
                  <Dropdown.Menu position="bottom" align="right">
                    <button
                      type="button"
                      onClick={() => {
                        openEdit(server);
                      }}
                      className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-foreground hover:bg-muted"
                      role="menuitem"
                    >
                      <Pencil className="h-4 w-4" />
                      Modifier le nom
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        openDelete(server);
                      }}
                      className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-error hover:bg-muted"
                      role="menuitem"
                    >
                      <Trash2 className="h-4 w-4" />
                      Supprimer le serveur
                    </button>
                  </Dropdown.Menu>
                </Dropdown>
              </div>
            );
          })}
        </div>

              
        {/* Bouton pour créer un serveur  */}
        <div className="shrink-0">
            <Button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="flex h-24 w-24 items-center justify-center rounded-xl hover:cursor-pointer hover:bg-brand-hover bg-brand text-foreground transition-colors"
            title="Créer un serveur"
            aria-label="Créer un serveur"
          >
            <Plus className="h-6 w-6 text-background" />
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
        <form onSubmit={handleCreateServer} className="flex flex-col gap-3">
          <Input
            label="Nom du serveur"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Mon serveur"
            maxLength={100}
            required
            disabled={createLoading}
          />
          {createError && <p className="text-sm text-error">{createError}</p>}
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
        open={!!editServer}
        onClose={() => {
          setEditServer(null);
          setEditName("");
          setEditError(null);
        }}
        title="Modifier le serveur"
      >
        <form onSubmit={handleEdit} className="flex flex-col gap-3">
          <Input
            label="Nom du serveur"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="Mon serveur"
            maxLength={100}
            required
            disabled={editLoading}
          />
          {editError && <p className="text-sm text-error">{editError}</p>}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => {
                setEditServer(null);
                setEditName("");
                setEditError(null);
              }}
              disabled={editLoading}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              disabled={editLoading || !editName.trim()}
            >
              {editLoading ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!deleteServer}
        onClose={() => {
          if (!deleteLoading) {
            setDeleteServer(null);
            setDeleteError(null);
          }
        }}
        title="Supprimer le serveur"
      >
        <div className="flex flex-col gap-3">
          {deleteServer && (
            <p className="text-sm text-foreground">
              Êtes-vous sûr de vouloir supprimer le serveur{" "}
              <strong>{deleteServer.name}</strong> ? Cette action est irréversible.
            </p>
          )}
          {deleteError && <p className="text-sm text-error">{deleteError}</p>}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => {
                setDeleteServer(null);
                setDeleteError(null);
              }}
              disabled={deleteLoading}
            >
              Annuler
            </Button>
            <Button
              type="button"
              variant="primary"
              className="flex-1 bg-error hover:opacity-90"
              onClick={handleDelete}
              disabled={deleteLoading}
            >
              {deleteLoading ? "Suppression…" : "Supprimer"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
