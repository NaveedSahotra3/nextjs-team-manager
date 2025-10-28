"use client";

import { MoreVertical, UserMinus, Shield, User } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

interface TeamMember {
  id: string;
  role: "owner" | "admin" | "member";
  joinedAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

interface MemberManagementProps {
  member: TeamMember;
  currentUserRole: "owner" | "admin" | "member";
  currentUserId: string;
  teamSlug: string;
  onMemberUpdated: () => void;
}

export function MemberManagement({
  member,
  currentUserRole,
  currentUserId,
  teamSlug,
  onMemberUpdated,
}: MemberManagementProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const canManage =
    currentUserRole === "owner" || (currentUserRole === "admin" && member.role !== "owner");

  const canChangeRole = currentUserRole === "owner" && member.role !== "owner";
  const isCurrentUser = member.user.id === currentUserId;

  const handleChangeRole = async (newRole: "admin" | "member") => {
    // eslint-disable-next-line no-alert
    if (!confirm(`Change ${member.user.name ?? member.user.email}'s role to ${newRole}?`)) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/teams/${teamSlug}/members/${member.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update role");
      }

      onMemberUpdated();
      setShowMenu(false);
    } catch (error) {
      console.error("Error changing role:", error);
      // eslint-disable-next-line no-alert
      alert(error instanceof Error ? error.message : "Failed to update role");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMember = async () => {
    const confirmMessage = isCurrentUser
      ? "Are you sure you want to leave this team?"
      : `Remove ${member.user.name ?? member.user.email} from the team?`;

    // eslint-disable-next-line no-alert
    if (!confirm(confirmMessage)) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/teams/${teamSlug}/members/${member.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to remove member");
      }

      onMemberUpdated();
      setShowMenu(false);
    } catch (error) {
      console.error("Error removing member:", error);
      // eslint-disable-next-line no-alert
      alert(error instanceof Error ? error.message : "Failed to remove member");
    } finally {
      setIsLoading(false);
    }
  };

  if (!canManage && !isCurrentUser) {
    return null;
  }

  return (
    <div className="relative">
      <Button variant="ghost" size="sm" onClick={() => setShowMenu(!showMenu)} disabled={isLoading}>
        <MoreVertical className="h-4 w-4" />
      </Button>

      {showMenu && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
          <div className="absolute right-0 top-8 z-20 w-48 rounded-md border bg-white shadow-lg">
            <div className="py-1">
              {canChangeRole && member.role !== "admin" && (
                <button
                  onClick={() => handleChangeRole("admin")}
                  disabled={isLoading}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                >
                  <Shield className="h-4 w-4" />
                  Make Admin
                </button>
              )}
              {canChangeRole && member.role === "admin" && (
                <button
                  onClick={() => handleChangeRole("member")}
                  disabled={isLoading}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                >
                  <User className="h-4 w-4" />
                  Make Member
                </button>
              )}
              {(canManage || isCurrentUser) && member.role !== "owner" && (
                <button
                  onClick={handleRemoveMember}
                  disabled={isLoading}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  <UserMinus className="h-4 w-4" />
                  {isCurrentUser ? "Leave Team" : "Remove Member"}
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
