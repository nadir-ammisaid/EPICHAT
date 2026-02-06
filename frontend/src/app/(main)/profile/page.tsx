"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { apiClient } from "@/lib/api/client";
import { profileSchema } from "@/lib/validation/auth";
import getRandomAvatar from "@/lib/utils/getRandomAvatar";
import { Button, Input, Modal } from "@/components/ui";
import Loader from "@/components/ui/Loader";
import AuthGuard from "@/lib/auth/auth.guard";
import { ArrowLeft, MessageCircleWarning, RefreshCw } from "lucide-react";

interface UserProfile {
  id: string;
  email: string;
  username: string;
  createdAt: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [userLoading, setUserLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [originalUsername, setOriginalUsername] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [avatarSeed, setAvatarSeed] = useState<string>("");

  useEffect(() => {
    apiClient
      .request("/me")
      .then((data: UserProfile) => {
        setEmail(data.email ?? null);
        setUsername(data.username ?? "");
        setOriginalUsername(data.username ?? "");
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
    setSaved(false);
    try {
      const updated = await apiClient.request("/me", {
        method: "PATCH",
        body: JSON.stringify({ username: result.data.username }),
      });
      setUsername(updated.username ?? username);
      setOriginalUsername(updated.username ?? username);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      return;
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleteError(null);
    setDeleteLoading(true);
    try {
      await apiClient.request("/me", { method: "DELETE" });
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
      <div className="bg-background mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-start gap-6 p-6 md:max-w-3xl md:p-12 lg:max-w-5xl lg:p-16 xl:max-w-6xl">
        <div className="flex w-full items-center justify-start gap-4">
          <Link
            href="/dashboard"
            className="border-border hover:bg-muted flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Link>
        </div>
        <h1 className="h3 w-full text-center md:text-left">Mon profil</h1>

        <section className="border-border flex w-full flex-col gap-8 rounded-lg border p-6 md:flex-row md:p-8">
          <div className="flex flex-col items-center gap-3 md:w-1/3">
            <button
              type="button"
              onClick={() => setAvatarSeed(`${username}-${Date.now()}`)}
              className="group focus:ring-brand relative flex shrink-0 rounded-full ring-2 ring-transparent outline-none"
              title="Changer l'avatar"
              aria-label="Changer l'avatar"
            >
              <Image
                src={getRandomAvatar(avatarSeed || username || "default")}
                alt={username}
                className="h-24 w-24 rounded-full object-cover md:h-32 md:w-32"
                width={96}
                height={96}
                unoptimized
              />
              <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                <RefreshCw className="h-8 w-8 text-white" />
              </span>
            </button>
            <span className="text-muted-foreground text-center text-xs">
              Cliquez sur l&apos;avatar pour en générer un autre
            </span>
          </div>
          <div className="flex flex-col gap-4 md:w-2/3">
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
              <div className="flex items-center gap-3">
                <Button
                  type="submit"
                  disabled={saveLoading || username === originalUsername}
                  className="md:w-fit"
                >
                  {saveLoading ? "Enregistrement…" : "Enregistrer"}
                </Button>
                {saved && (
                  <span className="text-sm font-medium text-green-600">
                    Modifications enregistrées
                  </span>
                )}
              </div>
            </form>
          </div>
        </section>

        <section className="border-border flex w-full flex-col items-center justify-between gap-4 rounded-lg border p-6 md:flex-row">
          <span className="flex items-center gap-2 text-center md:text-left">
            <MessageCircleWarning className="shrink-0" />
            <p className="text-foreground text-sm">
              La suppression du compte est définitive. Toutes vos données seront
              effacées.
            </p>
          </span>
          <Button
            variant="primary"
            className="bg-error hover:bg-error/90 shrink-0"
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
          <p className="text-foreground text-sm">
            Cette action est irréversible. Toutes vos données (serveurs,
            messages, etc.) seront définitivement supprimées.
          </p>
          {deleteError && <p className="text-error text-sm">{deleteError}</p>}
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
