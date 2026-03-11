"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import parseDashboardPath from "@/lib/utils/parseDashboardPath";
import { apiClient } from "@/lib/api/client";
import getInitials from "@/lib/utils/getInitials";
import { getSocket } from "@/lib/socket/socket";
import { Dropdown } from "@/components/ui/Dropdown";
import { Settings } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/use-toast";

type ServerMember = {
  userId: string;
  role: "owner" | "admin" | "member";
  user: { id: string; username: string; email?: string; status?: string };
};

export default function MemberSection() {
  const pathname = usePathname();
  const { serverId } = parseDashboardPath(pathname ?? "");
  const { toast, ToastContainer } = useToast();

  // Decode JWT
  let user: any = null;
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  if (token) {
    try {
      user = JSON.parse(atob(token.split(".")[1]));
    } catch {}
  }

  const [members, setMembers] = useState<ServerMember[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal state
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<ServerMember | null>(null);
  const [newRole, setNewRole] = useState<"admin" | "member">("member");

  useEffect(() => {
    if (!serverId) return;

    setLoading(true);
    apiClient
      .request(`/servers/${serverId}/members`)
      .then((data: ServerMember[]) => setMembers(data))
      .finally(() => setLoading(false));
  }, [serverId]);

  // Current user's role
  const currentMember = members.find((m) => m.userId === user?.userId);
  const currentRole = currentMember?.role;

  // Permission
  function canManage(member: ServerMember) {
    if (!currentRole) return false;
    if (member.userId === user?.userId) return false;
    if (member.role === "owner") return false;
    if (currentRole === "owner") return true;
    if (currentRole === "admin") return member.role !== "owner";
    return false;
  }

  // Kick
  async function handleKick(member: ServerMember) {
    if (member.userId === user?.userId) {
      toast({ title: "You cannot kick yourself." });
      return;
    }

    if (member.role === "owner") {
      toast({ title: "You cannot kick the owner." });
      return;
    }

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
    if (member.userId === user?.userId) {
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
        <h2 className="h3 border-b border-border px-3 py-2">Members</h2>

        <div className="flex-1 overflow-auto p-2">
          {loading && <p>Loading...</p>}

          {members.map((m) => (
            <div
              key={m.userId}
              className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-neutral-100"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-muted/80 text-xs font-semibold text-white">
                {getInitials(m.user.username)}
              </span>

              <span className="flex-1 truncate">{m.user.username}</span>

              <span className="text-xs text-neutral-500">{m.role}</span>

              {canManage(m) && (
                <Dropdown>
                  <Dropdown.Trigger>
                    <button className="p-1 rounded hover:bg-neutral-200 text-neutral-600 hover:text-black">
                      <Settings size={16} />
                    </button>
                  </Dropdown.Trigger>

                  <Dropdown.Menu align="right">
                    <button
                      className="w-full px-3 py-2 text-left text-sm text-red-500 hover:bg-red-500/10"
                      onClick={() => handleKick(m)}
                    >
                      Kick
                    </button>

                    {currentRole === "owner" && (
                      <button
                        className="w-full px-3 py-2 text-left text-sm hover:bg-neutral-200"
                        onClick={() => openRoleModal(m)}
                      >
                        Change role
                      </button>
                    )}
                  </Dropdown.Menu>
                </Dropdown>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
