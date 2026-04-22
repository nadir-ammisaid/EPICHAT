"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import parseDashboardPath from "@/lib/utils/parseDashboardPath";
import { apiClient } from "@/lib/api/client";
import getInitials from "@/lib/utils/getInitials";
import { getSocket } from "@/lib/socket/socket";
import { subscribeToPresence } from "@/lib/hooks/useGlobalPresence";
import { openConversation } from "@/lib/api/dm";
import { Dropdown } from "@/components/ui/Dropdown";
import { Settings, MessageCircle } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/use-toast";
import { useCurrentUserId } from "@/lib/hooks/useCurrentUserId";
import { useTranslation } from "react-i18next";

type ServerMember = {
  userId: string;
  role: "owner" | "admin" | "member";
  user: { id: string; username: string; email?: string; status?: string };
};

type Ban = {
  userId: string;
  username?: string;
  permanent: boolean;
  expiresAt: string | null;
  remaining?: string | null;
};

type PresenceUpdate = {
  serverId: string;
  userId: string;
  status: string;
};

const STATUS_COLORS: Record<string, string> = {
  online: "bg-green-500",
  away: "bg-yellow-500",
  busy: "bg-red-500",
  offline: "bg-gray-400",
};

export default function MemberSection() {
  const pathname = usePathname();
  const { serverId } = parseDashboardPath(pathname ?? "");
  const { toast, ToastContainer } = useToast();
  const { t } = useTranslation("members");

  const [members, setMembers] = useState<ServerMember[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [onlineStatus, setOnlineStatus] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Role modal
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<ServerMember | null>(null);
  const [newRole, setNewRole] = useState<"owner" | "admin" | "member">("member");

  // Ban system
  const [bans, setBans] = useState<Ban[]>([]);

  const [banModalOpen, setBanModalOpen] = useState(false);
  const [banTarget, setBanTarget] = useState<ServerMember | null>(null);
  const [banDuration, setBanDuration] = useState(1);
  const [banUnit, setBanUnit] = useState<"minutes" | "hours" | "days">("hours");

  const router = useRouter();
  const myUserId = useCurrentUserId();

  async function handleOpenDm(targetUserId: string) {
    try {
      const conv = await openConversation(targetUserId);
      router.push(`/dashboard/dm/${conv.id}`);
    } catch {}
  }

  // Fetch members
  useEffect(() => {
    if (!serverId) return;

    setLoading(true);

    const fetchMembers = async () => {
      try {
        const [membersData, bansData] = await Promise.all([
          apiClient.request(`/servers/${serverId}/members`),
          apiClient.request(`/servers/${serverId}/bans`),
        ]);
        setError(null);

        const list: ServerMember[] = Array.isArray(membersData) ? membersData : [];
        setMembers(list);

        const statusMap: Record<string, string> = {};
        for (const m of list) {
          statusMap[m.userId] = m.user?.status ?? "offline";
        }
        setOnlineStatus(statusMap);

        const raw: Ban[] = Array.isArray(bansData) ? bansData : [];
        setBans(raw);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message ?? t("error"));
        } else {
          setError(t("error"));
        }
        setMembers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [serverId, t]);

  // Presence socket
  useEffect(() => {
    if (!serverId) return;

    const socket = getSocket();
    socket.emit("server:join", serverId);

    const onPresenceInit = (payload: { serverId: string; presenceMap: Record<string, string> }) => {
      if (payload.serverId !== serverId) return;
      setOnlineStatus((prev) => ({ ...prev, ...payload.presenceMap }));
    };

    const onPresenceUpdate = (payload: PresenceUpdate) => {
      if (payload.serverId !== serverId) return;
      setOnlineStatus((prev) => ({
        ...prev,
        [payload.userId]: payload.status,
      }));
    };

    socket.on("presence:init", onPresenceInit);
    socket.on("presence:update", onPresenceUpdate);

    return () => {
      socket.off("presence:init", onPresenceInit);
      socket.off("presence:update", onPresenceUpdate);
      socket.emit("server:leave", serverId);
    };
  }, [serverId]);

  // Global presence updates
  useEffect(() => {
    if (!serverId) return;

    const unsubscribe = subscribeToPresence((globalMap) => {
      const newStatus: Record<string, string> = {};
      for (const member of members) {
        newStatus[member.userId] = globalMap.get(member.userId) ?? "offline";
      }
      setOnlineStatus(newStatus);
    });

    return unsubscribe;
  }, [serverId, members]);

  // Role update socket
  useEffect(() => {
    if (!serverId) return;

    const socket = getSocket();

    const onRoleUpdated = ({ userId, role }: { userId: string; role: "owner" | "admin" | "member" }) => {
      setMembers((prev) =>
        prev.map((m) => (m.userId === userId ? { ...m, role } : m)),
      );
    };

    socket.on("member:roleUpdated", onRoleUpdated);

    return () => {
      socket.off("member:roleUpdated", onRoleUpdated);
    };
  }, [serverId]);

  // Kick socket
  useEffect(() => {
    if (!serverId) return;

    const socket = getSocket();

    const onKick = ({ userId }: { userId: string }) => {
      setMembers((prev) => prev.filter((m) => m.userId !== userId));
    };

    socket.on("server:kick", onKick);
    return () => {
      socket.off("server:kick", onKick);
    };
  }, [serverId]);

  // Ownership transfer socket
  useEffect(() => {
    if (!serverId) return;

    const socket = getSocket();

    const onOwnershipTransferred = ({ previousOwnerId, newOwnerId }: { previousOwnerId: string; newOwnerId: string }) => {
      setMembers((prev) =>
        prev.map((m) => {
          if (m.userId === newOwnerId) return { ...m, role: "owner" };
          if (m.userId === previousOwnerId) return { ...m, role: "admin" };
          return m;
        }),
      );
    };

    socket.on("server:ownershipTransferred", onOwnershipTransferred);
    return () => {
      socket.off("server:ownershipTransferred", onOwnershipTransferred);
    };
  }, [serverId]);

  // Ban / unban socket
  useEffect(() => {
    if (!serverId) return;

    const socket = getSocket();

    const onMemberBanned = ({ userId }: { userId: string }) => {
      setMembers((prev) => {
        const member = prev.find((m) => m.userId === userId);
        if (member) {
          setBans((prevBans) => {
            if (prevBans.some((b) => b.userId === userId)) return prevBans;
            return [
              ...prevBans,
              {
                userId,
                username: member.user.username,
                permanent: true,
                expiresAt: null,
              },
            ];
          });
        }
        return prev.filter((m) => m.userId !== userId);
      });
    };

    const onMemberTempBanned = ({ userId, expiresAt }: { userId: string; expiresAt: string }) => {
      setMembers((prev) => {
        const member = prev.find((m) => m.userId === userId);
        if (member) {
          setBans((prevBans) => {
            if (prevBans.some((b) => b.userId === userId)) return prevBans;
            return [
              ...prevBans,
              {
                userId,
                username: member.user.username,
                permanent: false,
                expiresAt,
              },
            ];
          });
        }
        return prev.filter((m) => m.userId !== userId);
      });
    };

    const onMemberUnbanned = ({ userId }: { userId: string }) => {
      setBans((prev) => prev.filter((b) => b.userId !== userId));
    };

    socket.on("member:banned", onMemberBanned);
    socket.on("member:tempbanned", onMemberTempBanned);
    socket.on("member:unbanned", onMemberUnbanned);

    return () => {
      socket.off("member:banned", onMemberBanned);
      socket.off("member:tempbanned", onMemberTempBanned);
      socket.off("member:unbanned", onMemberUnbanned);
    };
  }, [serverId]);

  // Current user's role
  const currentMember = members.find((m) => m.userId === myUserId);
  const currentRole = currentMember?.role;

  // Permissions
  function canManage(member: ServerMember) {
    if (!currentRole) return false;
    if (member.userId === myUserId) return false;
    if (member.role === "owner") return false;
    if (currentRole === "owner") return true;
    if (currentRole === "admin") return true;
    return false;
  }

  // Kick
  async function handleKick(member: ServerMember) {
    if (member.userId === myUserId) {
      toast({ title: t("messages.cannotKickSelf") });
      return;
    }

    if (member.role === "owner") {
      toast({ title: t("messages.cannotKickOwner") });
      return;
    }

    const confirmKick = confirm(
      t("confirmations.kick", { username: member.user.username }),
    );
    if (!confirmKick) return;

    try {
      await apiClient.request(`/servers/${serverId}/kick/${member.userId}`, {
        method: "POST",
      });

      setMembers((prev) => prev.filter((m) => m.userId !== member.userId));
      toast({ title: t("messages.kickSuccess") });
    } catch {
      toast({ title: t("messages.kickFailed") });
    }
  }

  // Update role
  async function updateRole(serverId: string, userId: string, role: string) {
    return apiClient.request(`/servers/${serverId}/members/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
  }

  // Open role modal
  function openRoleModal(member: ServerMember) {
    if (member.userId === myUserId) {
      toast({ title: t("messages.cannotChangeOwnRole") });
      return;
    }

    if (member.role === "owner") {
      toast({ title: t("messages.cannotChangeOwnerRole") });
      return;
    }

    setSelectedMember(member);
    setNewRole(member.role === "admin" ? "admin" : "member");
    setRoleModalOpen(true);
  }

  // Confirm role change or ownership transfer if "owner" selected
  async function confirmRoleChange() {
    if (!selectedMember || !serverId) return;

    try {
      if (newRole === "owner") {
        await apiClient.request(`/servers/${serverId}/transfer-ownership/${selectedMember.userId}`, {
          method: "POST",
        });
        setMembers((prev) =>
          prev.map((m) => {
            if (m.userId === selectedMember.userId) return { ...m, role: "owner" as const };
            if (m.userId === myUserId) return { ...m, role: "admin" as const };
            return m;
          }),
        );
        toast({ title: t("messages.ownershipTransferred") });
      } else {
        await updateRole(serverId, selectedMember.userId, newRole);
        setMembers((prev) =>
          prev.map((m) =>
            m.userId === selectedMember.userId ? { ...m, role: newRole } : m,
          ),
        );
        toast({ title: t("messages.roleUpdated") });
      }
      setRoleModalOpen(false);
    } catch {
      toast({
        title:
          newRole === "owner"
            ? t("messages.ownershipTransferFailed")
            : t("messages.roleUpdateFailed"),
      });
    }
  }

  // Ban permanent
  async function handleBanPermanent(member: ServerMember) {
    if (!serverId) return;

    try {
      await apiClient.request(`/servers/${serverId}/ban`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: member.userId }),
      });

      setMembers((prev) => prev.filter((m) => m.userId !== member.userId));
      setBans((prev) => {
        if (prev.some((b) => b.userId === member.userId)) return prev;
        return [
          ...prev,
          {
            userId: member.userId,
            username: member.user.username,
            permanent: true,
            expiresAt: null,
          },
        ];
      });
      toast({ title: t("messages.banPermanentSuccess") });
    } catch {
      toast({ title: t("messages.banPermanentFailed") });
    }
  }

  // Ban temporaire
  async function handleBanTemporary() {
    if (!serverId || !banTarget) return;

    try {
      await apiClient.request(`/servers/${serverId}/tempban`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: banTarget.userId,
          duration: banDuration,
          unit: banUnit,
        }),
      });

      const durationMs =
        banDuration *
        (banUnit === "minutes" ? 60 : banUnit === "hours" ? 3600 : 86400) *
        1000;
      const expiresAt = new Date(Date.now() + durationMs).toISOString();

      setMembers((prev) => prev.filter((m) => m.userId !== banTarget.userId));
      setBans((prev) => {
        if (prev.some((b) => b.userId === banTarget.userId)) return prev;
        return [
          ...prev,
          {
            userId: banTarget.userId,
            username: banTarget.user.username,
            permanent: false,
            expiresAt,
          },
        ];
      });

      toast({ title: t("messages.banTemporarySuccess") });
      setBanModalOpen(false);
    } catch {
      toast({ title: t("messages.banTemporaryFailed") });
    }
  }

  // Unban
  async function handleUnban(userId: string) {
    if (!serverId) return;

    try {
      await apiClient.request(`/servers/${serverId}/unban/${userId}`, {
        method: "DELETE",
      });

      setBans((prev) => prev.filter((b) => b.userId !== userId));
      toast({ title: t("messages.unbanSuccess") });
    } catch {
      toast({ title: t("messages.unbanFailed") });
    }
  }

  const roleLabel: Record<string, string> = {
    owner: t("roles.owner"),
    admin: t("roles.admin"),
    member: t("roles.member"),
  };

  const sortedMembers = [...members].sort((a, b) => {
    const statusA = onlineStatus[a.userId] ?? "offline";
    const statusB = onlineStatus[b.userId] ?? "offline";
    const order = ["online", "away", "busy", "offline"];
    return order.indexOf(statusA) - order.indexOf(statusB);
  });

  return (
    <>
      <ToastContainer />

      <Modal open={roleModalOpen} onClose={() => setRoleModalOpen(false)}>
        <div className="p-4 space-y-4 bg-white text-black rounded-md shadow-xl max-w-sm">
          <h2 className="text-lg font-semibold">{t("modals.role.title")}</h2>

          <Select
            value={newRole}
            onChange={(e) => setNewRole(e.target.value as "owner" | "admin" | "member")}
          >
            <option value="admin">{t("roles.admin")}</option>
            <option value="member">{t("roles.member")}</option>
            {currentRole === "owner" && (
              <option value="owner">{t("roles.owner")}</option>
            )}
          </Select>

          {newRole === "owner" && (
            <p className="text-sm text-orange-600 bg-orange-50 border border-orange-200 rounded p-2">
              {t("modals.role.ownerWarning", {
                username: selectedMember?.user.username ?? "",
              })}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              className="bg-neutral-200 text-black hover:bg-neutral-300"
              onClick={() => setRoleModalOpen(false)}
            >
              {t("modals.role.cancel")}
            </Button>

            <Button
              className={newRole === "owner" ? "bg-red-600 text-white hover:bg-red-700" : "bg-black text-white hover:bg-neutral-800"}
              onClick={confirmRoleChange}
            >
              {t("modals.role.confirm")}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={banModalOpen} onClose={() => setBanModalOpen(false)}>
        <div className="p-4 space-y-4 bg-white text-black rounded-md shadow-xl">
          <h2 className="text-lg font-semibold">{t("modals.ban.title")}</h2>

          <div className="flex gap-2">
            <input
              type="number"
              min={1}
              value={banDuration}
              onChange={(e) => setBanDuration(Number(e.target.value))}
              className="w-20 border p-2 rounded"
            />

            <Select
              value={banUnit}
              onChange={(e) =>
                setBanUnit(e.target.value as "minutes" | "hours" | "days")
              }
            >
              <option value="minutes">{t("modals.ban.minutes")}</option>
              <option value="hours">{t("modals.ban.hours")}</option>
              <option value="days">{t("modals.ban.days")}</option>
            </Select>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              className="bg-neutral-200 text-black hover:bg-neutral-300"
              onClick={() => setBanModalOpen(false)}
            >
              {t("modals.ban.cancel")}
            </Button>

            <Button
              className="bg-black text-white hover:bg-neutral-800"
              onClick={handleBanTemporary}
            >
              {t("modals.ban.confirm")}
            </Button>
          </div>
        </div>
      </Modal>

      <div className="flex min-w-60 max-w-[280px] shrink-0 flex-col overflow-auto border-l border-border bg-white">
        <div className="flex items-center gap-2 px-3 py-2 mt-2">
  <hr className="border-border-muted flex-1" />
  <span className="text-muted-foreground text-lg font-bold uppercase">{t("title")}</span>
  <hr className="border-border-muted flex-1" />
</div>


        <div className="flex-1 overflow-auto p-2">
          {loading && <p>{t("loading")}</p>}
          {error && <p className="text-red-500">{error}</p>}

          {sortedMembers.map((m) => {
            const status = onlineStatus[m.userId] ?? "offline";

            return (
              <div
                key={m.userId}
                className="group relative flex items-center gap-2 px-2 py-1.5 rounded hover:bg-neutral-100"
                onClick={() => {
                  if (m.userId !== myUserId) handleOpenDm(m.userId);
                }}
              >
                <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-brand-muted/80 text-xs font-semibold text-white">
                  {getInitials(m.user.username)}
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${STATUS_COLORS[status]}`}
                  />
                </span>

                <span className="flex-1 truncate">{m.user.username}</span>

                <span className="text-xs text-neutral-500">
                  {roleLabel[m.role] ?? m.role}
                </span>

                <div className="flex items-center gap-1">
                  {m.userId !== myUserId && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDm(m.userId);
                      }}
                      className="p-1 rounded hover:bg-neutral-200 text-neutral-600 hover:text-black"
                      title={t("actions.sendMessage")}
                    >
                      <MessageCircle size={16} />
                    </button>
                  )}

                  {canManage(m) && (
                    <Dropdown>
                      <Dropdown.Trigger>
                        <button
                          onClick={(e) => e.stopPropagation()}
                          className="p-1 rounded hover:bg-neutral-200 text-neutral-600 hover:text-black"
                        >
                          <Settings size={16} />
                        </button>
                      </Dropdown.Trigger>

                      <Dropdown.Menu align="right">
                        <button
                          className="w-full px-3 py-2 text-left text-sm text-red-500 hover:bg-red-500/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleKick(m);
                          }}
                        >
                          {t("actions.kick")}
                        </button>

                        <button
                          className="w-full px-3 py-2 text-left text-sm text-red-500 hover:bg-red-500/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBanPermanent(m);
                          }}
                        >
                          {t("actions.banPermanent")}
                        </button>

                        <button
                          className="w-full px-3 py-2 text-left text-sm hover:bg-neutral-200"
                          onClick={(e) => {
                            e.stopPropagation();
                            setBanTarget(m);
                            setBanModalOpen(true);
                          }}
                        >
                          {t("actions.banTemporary")}
                        </button>

                        {currentRole === "owner" && (
                          <button
                            className="w-full px-3 py-2 text-left text-sm hover:bg-neutral-200"
                            onClick={(e) => {
                              e.stopPropagation();
                              openRoleModal(m);
                            }}
                          >
                            {t("actions.changeRole")}
                          </button>
                        )}
                      </Dropdown.Menu>
                    </Dropdown>
                  )}
                </div>
              </div>
            );
          })}

          {(currentRole === "owner" || currentRole === "admin") && (
            <>
              <h3 className="h3 border-t border-b border-border px-3 py-2 mt-4 text-sm font-semibold">
                {t("bans.title")}
              </h3>

              {bans.length === 0 && (
                <p className="px-3 text-xs text-neutral-400">{t("bans.empty")}</p>
              )}

              {bans.map((ban) => (
                <div
                  key={ban.userId}
                  className="flex items-center justify-between px-3 py-1.5 rounded hover:bg-neutral-100"
                >
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">
                      {ban.username ?? ban.userId}
                    </span>

                    <span className="text-neutral-500 text-xs">
                      {ban.permanent
                        ? t("actions.banPermanent")
                        : ban.expiresAt
                        ? t("bans.expiresOn", {
                            date: new Date(ban.expiresAt).toLocaleString(),
                          })
                        : t("actions.banTemporary")}
                    </span>
                  </div>

                  <button
                    className="px-2 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700 transition-colors"
                    onClick={() => handleUnban(ban.userId)}
                  >
                    {t("actions.unban")}
                  </button>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </>
  );
}
