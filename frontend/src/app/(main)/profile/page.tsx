"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { apiClient } from "@/lib/api/client";
import { disconnectSocket } from "@/lib/socket/socket";
import { profileSchema } from "@/lib/validation/auth";
import getRandomAvatar from "@/lib/utils/getRandomAvatar";
import { Button, Input, Modal } from "@/components/ui";
import Loader from "@/components/ui/Loader";
import AuthGuard from "@/lib/auth/auth.guard";
import { useNotificationPreferences } from "@/lib/notifications/preferences";
import {
  getPermission,
  requestPermission,
  isSupported as isNotificationsSupported,
} from "@/lib/notifications/native";
import { ArrowLeft, Bell, MessageCircleWarning, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const AVATAR_SEED_STORAGE_KEY = "epichat.avatarSeed";
const AVATAR_SEED_UPDATED_EVENT = "epichat:avatar-seed-updated";

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
  const [notificationPermission, setNotificationPermission] = useState<
    "granted" | "denied" | "default"
  >("default");
  const { t } = useTranslation("common");

  const {
    preferences: notifPrefs,
    setEnabled: setNotifEnabled,
    setDm: setNotifDm,
    setMentions: setNotifMentions,
    setSystemJoins: setNotifSystemJoins,
    mounted: notifMounted,
  } = useNotificationPreferences();

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

    if (typeof window !== "undefined") {
      setAvatarSeed(localStorage.getItem(AVATAR_SEED_STORAGE_KEY) ?? "");
    }
  }, [router]);

  useEffect(() => {
    if (typeof window !== "undefined" && isNotificationsSupported()) {
      setNotificationPermission(getPermission());
    }
  }, [notifMounted]);

  const handleRequestNotificationPermission = () => {
    requestPermission().then((p) => setNotificationPermission(p));
  };

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
      disconnectSocket();
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
      <main>
        <div className="bg-background mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-start gap-6 p-6 md:max-w-3xl md:p-12 lg:max-w-5xl lg:p-16 xl:max-w-6xl">
          <div className="flex w-full items-center justify-between gap-4">
            <Link
              href="/dashboard"
              className="border-border hover:bg-muted flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("pages.profile.back")}
            </Link>
            <LanguageSwitcher />
          </div>
          <h1 className="h3 w-full text-center md:text-left">
            {t("pages.profile.title")}
          </h1>

          <section className="border-border flex w-full flex-col gap-8 rounded-lg border p-6 md:flex-row md:p-8">
            <div className="flex flex-col items-center gap-3 md:w-1/3">
              <button
                type="button"
                onClick={() => {
                  const nextSeed = `${username || "default"}-${Date.now()}`;
                  setAvatarSeed(nextSeed);
                  if (typeof window !== "undefined") {
                    localStorage.setItem(AVATAR_SEED_STORAGE_KEY, nextSeed);
                    window.dispatchEvent(new Event(AVATAR_SEED_UPDATED_EVENT));
                  }
                }}
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
                  fetchPriority="high"
                />
                <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                  <RefreshCw className="h-8 w-8 text-white" />
                </span>
              </button>
              <span className="text-muted-foreground text-center text-xs">
                {t("pages.profile.avatarHint")}
              </span>
            </div>
            <div className="flex flex-col gap-4 md:w-2/3">
              <h2 className="h4">{t("pages.profile.infoTitle")}</h2>
              <form onSubmit={handleSave} className="flex flex-col gap-3">
                <Input
                  label={t("pages.profile.emailLabel")}
                  name="email"
                  value={email ?? ""}
                  disabled
                  className="bg-muted border-border text-border"
                  size="md"
                />
                <Input
                  label={t("pages.profile.usernameLabel")}
                  name="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={t("pages.profile.usernamePlaceholder")}
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
                    {saveLoading
                      ? t("pages.profile.saving")
                      : t("pages.profile.save")}
                  </Button>
                  {saved && (
                    <span className="text-sm font-medium text-green-600">
                      {t("pages.profile.saved")}
                    </span>
                  )}
                </div>
              </form>
            </div>
          </section>

          {notifMounted && (
            <section className="border-border flex w-full flex-col gap-4 rounded-lg border p-6 md:p-8">
              <h2 className="h4 flex items-center gap-2">
                <Bell className="h-5 w-5" />
                {t("pages.profile.notificationsTitle")}
              </h2>
              <div className="flex flex-col gap-4">
                <label className="text-foreground flex cursor-pointer items-center justify-between gap-4 text-sm">
                  <span>{t("pages.profile.notificationsEnable")}</span>
                  <input
                    type="checkbox"
                    checked={notifPrefs.enabled}
                    onChange={(e) => setNotifEnabled(e.target.checked)}
                    className="border-border h-4 w-4 rounded"
                  />
                </label>
                <label className="text-foreground flex cursor-pointer items-center justify-between gap-4 text-sm">
                  <span>{t("pages.profile.notificationsDm")}</span>
                  <input
                    type="checkbox"
                    checked={notifPrefs.dm}
                    onChange={(e) => setNotifDm(e.target.checked)}
                    disabled={!notifPrefs.enabled}
                    className="border-border h-4 w-4 rounded disabled:opacity-50"
                  />
                </label>
                <label className="text-foreground flex cursor-pointer items-center justify-between gap-4 text-sm">
                  <span>{t("pages.profile.notificationsMentions")}</span>
                  <input
                    type="checkbox"
                    checked={notifPrefs.mentions}
                    onChange={(e) => setNotifMentions(e.target.checked)}
                    disabled={!notifPrefs.enabled}
                    className="border-border h-4 w-4 rounded disabled:opacity-50"
                  />
                </label>
                <label className="text-foreground flex cursor-pointer items-center justify-between gap-4 text-sm">
                  <span>{t("pages.profile.notificationsSystemJoins")}</span>
                  <input
                    type="checkbox"
                    checked={notifPrefs.systemJoins}
                    onChange={(e) => setNotifSystemJoins(e.target.checked)}
                    disabled={!notifPrefs.enabled}
                    className="border-border h-4 w-4 rounded disabled:opacity-50"
                  />
                </label>
              </div>
              {isNotificationsSupported() ? (
                <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm">
                  <span>
                    {t("pages.profile.notificationsBrowserPermissionLabel")}{" "}
                    {notificationPermission === "granted"
                      ? t("pages.profile.notificationsPermissionGranted")
                      : notificationPermission === "denied"
                        ? t("pages.profile.notificationsPermissionDenied")
                        : t("pages.profile.notificationsPermissionDefault")}
                  </span>
                  {notificationPermission === "default" && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRequestNotificationPermission}
                    >
                      {t("pages.profile.notificationsAllowButton")}
                    </Button>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  {t("pages.profile.notificationsNotSupported")}
                </p>
              )}
            </section>
          )}

          <section className="border-border flex w-full flex-col items-center justify-between gap-4 rounded-lg border p-6 md:flex-row">
            <span className="flex items-center gap-2 text-center md:text-left">
              <MessageCircleWarning className="shrink-0" />
              <p className="text-foreground text-sm">
                {t("pages.profile.deleteNotice")}
              </p>
            </span>
            <Button
              variant="primary"
              className="bg-error hover:bg-error/90 shrink-0"
              type="button"
              onClick={() => setDeleteOpen(true)}
            >
              {t("pages.profile.deleteCta")}
            </Button>
          </section>
        </div>

        <Modal
          open={deleteOpen}
          onClose={() => !deleteLoading && setDeleteOpen(false)}
          title={t("pages.profile.deleteTitle")}
        >
          <div className="flex flex-col gap-4">
            <p className="text-foreground text-sm">
              {t("pages.profile.deleteWarning")}
            </p>
            {deleteError && <p className="text-error text-sm">{deleteError}</p>}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setDeleteOpen(false)}
                disabled={deleteLoading}
              >
                {t("buttons.cancel")}
              </Button>
              <Button
                variant="primary"
                className="bg-error hover:bg-error/90"
                onClick={handleDelete}
                disabled={deleteLoading}
              >
                {deleteLoading
                  ? t("pages.profile.deleteLoading")
                  : t("pages.profile.deleteCta")}
              </Button>
            </div>
          </div>
        </Modal>
      </main>
    </AuthGuard>
  );
}
