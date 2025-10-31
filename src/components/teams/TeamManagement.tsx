"use client";

import { Users2, Mail } from "lucide-react";
import * as React from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { InvitationsTable } from "./InvitationsTable";
import { InviteMembers } from "./InviteMembers";
import { MembersTable } from "./MembersTable";

interface TeamManagementProps {
  teamId: string;
  teamSlug: string;
  userId: string;
  userRole: string;
}

export function TeamManagement({ teamId, teamSlug, userId, userRole }: TeamManagementProps) {
  const [activeTab, setActiveTab] = React.useState("members");

  const isOwnerOrAdmin = userRole === "owner" || userRole === "admin";

  return (
    <div className="space-y-6">
      {/* Invite Section - Only for owner/admin */}
      {isOwnerOrAdmin && <InviteMembers teamSlug={teamSlug} />}

      {/* Team Management Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="members" className="gap-2">
            <Users2 className="h-4 w-4" />
            Team Members
          </TabsTrigger>
          <TabsTrigger value="invitations" className="gap-2">
            <Mail className="h-4 w-4" />
            Invitations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-4">
          <MembersTable teamId={teamId} teamSlug={teamSlug} userId={userId} userRole={userRole} />
        </TabsContent>

        <TabsContent value="invitations" className="space-y-4">
          <InvitationsTable teamId={teamId} teamSlug={teamSlug} userRole={userRole} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
