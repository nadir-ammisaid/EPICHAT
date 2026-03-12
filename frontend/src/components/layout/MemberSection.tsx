"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import parseDashboardPath from "@/lib/utils/parseDashboardPath";
import { apiClient } from "@/lib/api/client";
import getInitials from "@/lib/utils/getInitials";
import { getSocket } from "@/lib/socket/socket";
import { openConversation } from "@/lib/api/dm";

import { Dropdown } from "@/components/ui/Dropdown";
import { Settings, MessageCircle } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/use-toast";

type ServerMember = {
  userId: string;
  role: "owner" | "admin" | "member";
  user: { id: string; username: string; email?: string; status?: string };
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

  const [members, setMembers] = useState<ServerMember[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [onlineStatus, setOnlineStatus] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Modal state
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<ServerMember | null>(null);
  const [newRole, setNewRole] = useState<"admin" | "member">("member");

  const router = useRouter();
  const myUserId = useMemo(() => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return null;
      return JSON.parse(atob(token.split(".")[1])).userId ?? null;
    } catch {
      return null;
    }
  }, []);

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

    apiClient
      .request(`/servers/${serverId}/members`)
      .then((data: ServerMember[]) => {
        setError(null);

        const list = Array.isArray(data) ? data : [];
        setMembers(list);

        const statusMap: Record<string, string> = {};
        for (const m of list) {
          statusMap[m.userId] = m.user?.status ?? "offline";
        }
        setOnlineStatus(statusMap);
      })
      .catch((err: Error) => {
        setError(err.message ?? "Impossible de charger les membres");
        setMembers([]);
      })
      .finally(() => setLoading(false));
  }, [serverId]);

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

  // Current user's role
  const currentMember = members.find((m) => m.userId === myUserId);
  const currentRole = currentMember?.role;

  // Permissions
  function canManage(member: ServerMember) {
    if (!currentRole) return false;
    if (member.userId === myUserId) return false;
    if (member.role === "owner") return false;
    if (currentRole === "owner") return true;
    if (currentRole === "admin") return member.role !== "owner";
    return false;
  }

  // Kick
  async function handleKick(member: ServerMember) {
    if (member.userId === myUserId) {
      toast({ title: "You cannot kick yourself." });
      return;
    }

    if (member.role === "owner") {
      toast({ title: "You cannot kick the owner." });
      return;
    }

    const confirmKick = confirm(`Kick ${member.user.username} du serveur ?`);
    if (!confirmKick) return;

    try {
      await apiClient.request(`/servers/${serverId}/kick/${member.userId}`, {
        method: "POST",
      });

      setMembers((prev) => prev.filter((m) => m.userId !== member.userId));
      toast({ title: "Member kicked." });
    } catch {
      toast({ title: "Kick failed." });
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

  // Open modal
  function openRoleModal(member: ServerMember) {
    if (member.userId === myUserId) {
      toast({ title: "You cannot change your own role." });
      return;
    }

    if (member.role === "owner") {
      toast({ title: "You cannot change the owner's role." });
      return;
    }

    setSelectedMember(member);
    setNewRole(member.role === "admin" ? "admin" : "member");
    setRoleModalOpen(true);
  }

  // Confirm role change
  async function confirmRoleChange() {
    if (!selectedMember || !serverId) return;

    try {
      await updateRole(serverId, selectedMember.userId, newRole);

      setMembers((prev) =>
        prev.map((m) =>
          m.userId === selectedMember.userId ? { ...m, role: newRole } : m
        )
      );

      toast({ title: "Role updated." });
      setRoleModalOpen(false);
    } catch {
      toast({ title: "Failed to update role." });
    }
  }

  const roleLabel: Record<string, string> = {
    owner: "Propriétaire",
    admin: "Admin",
    member: "Membre",
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
        <div className="p-4 space-y-4 bg-white text-black rounded-md shadow-xl">
          <h2 className="text-lg font-semibold">Change role</h2>

          <Select
            value={newRole}
            onChange={(e) => setNewRole(e.target.value as any)}
          >
            <option value="admin">Admin</option>
            <option value="member">Member</option>
          </Select>

          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              className="bg-neutral-200 text-black hover:bg-neutral-300"
              onClick={() => setRoleModalOpen(false)}
            >
              Cancel
            </Button>

            <Button
              className="bg-black text-white hover:bg-neutral-800"
              onClick={confirmRoleChange}
            >
              Confirm
            </Button>
          </div>
        </div>
      </Modal>

      <div className="flex min-w-60 max-w-[280px] shrink-0 flex-col overflow-auto border-l border-border bg-white">
        <h2 className="h3 border-b border-border px-3 py-2">Membres</h2>

        <div className="flex-1 overflow-auto p-2">
          {loading && <p>Loading...</p>}
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
                      title="Envoyer un message"
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
                          Expluser
                        </button>

                        {currentRole === "owner" && (
                          <button
                            className="w-full px-3 py-2 text-left text-sm hover:bg-neutral-200"
                            onClick={(e) => {
                              e.stopPropagation();
                              openRoleModal(m);
                            }}
                          >
                            Change role
                          </button>
                        )}
                      </Dropdown.Menu>
                    </Dropdown>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
