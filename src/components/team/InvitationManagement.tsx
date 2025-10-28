"use client";

import { X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

interface Invitation {
  id: string;
  email: string;
  role: "admin" | "member";
  status: "pending" | "accepted" | "expired";
  expiresAt: string;
  createdAt: string;
  inviter: {
    name: string | null;
    email: string;
  };
}

interface InvitationManagementProps {
  invitation: Invitation;
  teamSlug: string;
  onInvitationRevoked: () => void;
}

export function InvitationManagement({
  invitation,
  teamSlug,
  onInvitationRevoked,
}: InvitationManagementProps) {
  const [isRevoking, setIsRevoking] = useState(false);

  const handleRevoke = async () => {
    // eslint-disable-next-line no-alert
    if (!confirm(`Revoke invitation for ${invitation.email}?`)) {
      return;
    }

    setIsRevoking(true);
    try {
      const response = await fetch(`/api/teams/${teamSlug}/invitations/${invitation.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to revoke invitation");
      }

      onInvitationRevoked();
    } catch (error) {
      console.error("Error revoking invitation:", error);
      // eslint-disable-next-line no-alert
      alert(error instanceof Error ? error.message : "Failed to revoke invitation");
    } finally {
      setIsRevoking(false);
    }
  };

  if (invitation.status !== "pending") {
    return null;
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleRevoke}
      disabled={isRevoking}
      className="text-red-600 hover:bg-red-50 hover:text-red-700"
    >
      <X className="h-4 w-4" />
    </Button>
  );
}
