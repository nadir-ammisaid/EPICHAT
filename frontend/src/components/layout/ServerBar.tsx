"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import Image from "next/image";
import { apiClient } from "@/lib/api/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";

type Server = { id: string; name: string; ownerId: string; createdAt: string };

export default function ServerBar({ className = "" }: { className?: string }) {
  const pathname = usePathname();
  const [servers, setServers] = useState<Server[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

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

  return (
    <>
      <div
        className={`flex h-full shrink-0 flex-col items-center justify-between bg-background p-4 border border-border ${className}`}
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
              
        {/* Liste de serveurs      */}
        <div className="flex w-full flex-col items-center justify-center gap-2 overflow-y-auto">
            {
              servers.map((server) => {
                const isActive = serverIdFromPath === server.id;
                return (
                  <Link
                    key={server.id}
                    href={`/dashboard/${server.id}`}
                    className="bg-brand-muted text-foreground flex items-center justify-center rounded-xl h-[80px] w-[80px] hover:cursor-pointer hover:bg-brand-muted/80"
                    title={server.name}
                  >
                    {server.name.slice(0, 1).toUpperCase()}
                  </Link>
                );
              })}
        </div>
              
        {/* Bouton pour créer un serveur  */}
        <div className="shrink-0">
            <Button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="flex h-[100px] w-[100px] items-center justify-center rounded-xl hover:cursor-pointer hover:bg-brand-hover bg-brand text-foreground transition-colors"
            title="Créer un serveur"
            aria-label="Créer un serveur"
          >
            <Plus className="h-6 w-6 text-white" />
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
    </>
  );
}
