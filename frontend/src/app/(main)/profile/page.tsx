"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiClient } from "@/lib/api/client";
import { profileSchema } from "@/lib/validation/auth";
import getRandomAvatar from "@/lib/utils/getRandomAvatar";
import { Button, Input, Modal } from "@/components/ui";
import Loader from "@/components/ui/Loader";
import AuthGuard from "@/lib/auth/auth.guard";
import { ArrowLeft, MessageCircleWarning, RefreshCw } from "lucide-react";

interface UserProfile { id: string; email: string; username: string; createdAt: string };

export default function ProfilePage() {
  const router = useRouter();
  const [userLoading, setUserLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [avatarSeed, setAvatarSeed] = useState<string>("");

  useEffect(() => {
    apiClient
      .request("/auth/me")
      .then((data: UserProfile) => {
        setEmail(data.email ?? null);
        setUsername(data.username ?? "");
      })
      .catch(() => router.replace("/login"))
      .finally(() => setUserLoading(false));
  }, [router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = profileSchema.safeParse({ username });
    if (!result.success) {
      return;
    }
    setSaveLoading(true);
    try {
      const updated = await apiClient.request("/auth/me", {
        method: "PATCH",
        body: JSON.stringify({ username: result.data.username }),
      });
      setUsername(updated.username ?? username);
    } catch (err) {
      return;
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleteError(null);
    setDeleteLoading(true);
    try {
      await apiClient.request("/auth/me", { method: "DELETE" });
      localStorage.removeItem("token");
      router.replace("/login");
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setDeleteLoading(false);
    }
  };

  if (userLoading) {
    return (
      <AuthGuard>
        <Loader />
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="mx-auto flex max-w-md min-h-screen flex-col items-center justify-between gap-6 bg-background p-6">
        <div className="flex items-center w-fit gap-4 border border-border rounded-full p-2">
          <ArrowLeft className="h-4 w-4 " />
          <Link
            href="/dashboard"
            className="text-sm"
          >
            Retour
          </Link>
        </div>
        <h1 className="h3">Mon profil</h1>

        <section className="rounded-lg border flex flex-col gap-8 border-border p-8">
          <div className="flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={() => setAvatarSeed(`${username}-${Date.now()}`)}
              className="group relative flex shrink-0 rounded-full outline-none ring-2 ring-transparent focus:ring-brand"
              title="Changer l'avatar"
              aria-label="Changer l'avatar"
            >
              <img
                src={getRandomAvatar(avatarSeed || username || "default")}
                alt={username}
                className="h-24 w-24 rounded-full object-cover"
                width={96}
                height={96}
              />
              <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                <RefreshCw className="h-8 w-8 text-white" />
              </span>
            </button>
            <span className="text-xs text-muted-foreground">Cliquez sur l'avatar pour en générer un autre</span>
          </div>
          <h2 className="h4">Informations</h2>
          <form onSubmit={handleSave} className="flex flex-col gap-3">
            <Input
              label="Email"
              value={email ?? ""}
              disabled
              className="bg-muted border-border text-border"
              size="md"
            />
            <Input
              label="Nom d'utilisateur"
              name="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Mon pseudo"
              maxLength={32}
              disabled={saveLoading}
              size="md"
            />
            <Button type="submit" disabled={saveLoading}>
              {saveLoading ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </form>
        </section>

        <section className="rounded-md flex flex-col gap-2 items-center justify-center p-4">
          <span className="flex items-center gap-2">

          <MessageCircleWarning />
          <p className="mb-3 text-sm text-foreground">
            La suppression du compte est définitive. Toutes vos données seront effacées.
          </p>
          </span>
          <Button
            variant="primary"
            className="bg-error hover:bg-error/90"
            type="button"
            onClick={() => setDeleteOpen(true)}
          >
            Supprimer mon compte
          </Button>
        </section>
      </div>

      <Modal
        open={deleteOpen}
        onClose={() => !deleteLoading && setDeleteOpen(false)}
        title="Supprimer le compte ?"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-foreground">
            Cette action est irréversible. Toutes vos données (serveurs, messages, etc.)
            seront définitivement supprimées.
          </p>
          {deleteError && (
            <p className="text-sm text-error">{deleteError}</p>
          )}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={deleteLoading}
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              className="bg-error hover:bg-error/90"
              onClick={handleDelete}
              disabled={deleteLoading}
            >
              {deleteLoading ? "Suppression…" : "Supprimer mon compte"}
            </Button>
          </div>
        </div>
      </Modal>
    </AuthGuard>
  );
}
