"use client";

import { ArrowLeft, Mail, Users, UserPlus } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export const dynamic = "force-dynamic";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

interface Team {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  ownerId: string;
  createdAt: string;
  members: TeamMember[];
}

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

export default function TeamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const slug = params?.["slug"] as string;

  const [team, setTeam] = useState<Team | null>(null);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Invitation form state
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member">("member");
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/auth/signin?callbackUrl=/teams/${slug}`);
      return;
    }

    if (status === "authenticated") {
      fetchTeamData();
    }
  }, [status, router, slug]);

  const fetchTeamData = async () => {
    try {
      setIsLoading(true);
      const [teamResponse, invitationsResponse] = await Promise.all([
        fetch(`/api/teams/${slug}`),
        fetch(`/api/teams/${slug}/invitations`),
      ]);

      if (!teamResponse.ok) {
        if (teamResponse.status === 404) {
          throw new Error("Team not found");
        }
        throw new Error("Failed to fetch team");
      }

      const teamData = await teamResponse.json();
      setTeam(teamData.team);

      if (invitationsResponse.ok) {
        const invitationsData = await invitationsResponse.json();
        setInvitations(invitationsData.invitations || []);
      }
    } catch (error) {
      console.error("Error fetching team:", error);
      setError(error instanceof Error ? error.message : "Failed to load team");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsInviting(true);
    setInviteError("");
    setInviteSuccess("");

    try {
      const response = await fetch(`/api/teams/${slug}/invitations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send invitation");
      }

      setInviteSuccess(`Invitation sent to ${inviteEmail}`);
      setInviteEmail("");
      setShowInviteForm(false);
      fetchTeamData(); // Refresh data
    } catch (error) {
      console.error("Error sending invitation:", error);
      setInviteError(error instanceof Error ? error.message : "Failed to send invitation");
    } finally {
      setIsInviting(false);
    }
  };

  const canManageTeam = () => {
    if (!team || !session?.user?.id) {
      return false;
    }
    const member = team.members.find((m) => m.user.id === session.user.id);
    return team.ownerId === session.user.id || member?.role === "admin" || member?.role === "owner";
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-2 text-gray-600">Loading team...</p>
        </div>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-12">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-4 text-2xl font-bold text-gray-900">{error || "Team not found"}</h2>
          <Link href="/teams">
            <Button>Back to Teams</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Back Button */}
        <Link
          href="/teams"
          className="mb-6 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Teams
        </Link>

        {/* Team Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{team.name}</h1>
          <p className="mt-1 text-gray-600">/{team.slug}</p>
          {team.description && <p className="mt-2 text-gray-700">{team.description}</p>}
        </div>

        {/* Success Message */}
        {inviteSuccess && (
          <div className="mb-6 rounded-md bg-green-50 p-4">
            <p className="text-sm text-green-800">{inviteSuccess}</p>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Members Section */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Team Members ({team.members.length})
                    </CardTitle>
                    <CardDescription>People who have access to this team</CardDescription>
                  </div>
                  {canManageTeam() && (
                    <Button size="sm" onClick={() => setShowInviteForm(!showInviteForm)}>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Invite
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {/* Invite Form */}
                {showInviteForm && (
                  <form onSubmit={handleInvite} className="mb-6 rounded-lg border bg-gray-50 p-4">
                    <h3 className="mb-4 font-semibold">Invite Team Member</h3>
                    {inviteError && (
                      <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-800">
                        {inviteError}
                      </div>
                    )}
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="colleague@example.com"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          required
                          disabled={isInviting}
                        />
                      </div>
                      <div>
                        <Label htmlFor="role">Role</Label>
                        <select
                          id="role"
                          className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                          value={inviteRole}
                          onChange={(e) => setInviteRole(e.target.value as "admin" | "member")}
                          disabled={isInviting}
                        >
                          <option value="member">Member</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit" disabled={isInviting}>
                          {isInviting ? "Sending..." : "Send Invitation"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setShowInviteForm(false);
                            setInviteError("");
                          }}
                          disabled={isInviting}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </form>
                )}

                {/* Members List */}
                <div className="space-y-3">
                  {team.members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                          {member.user.name?.[0]?.toUpperCase() ||
                            member.user.email[0]?.toUpperCase() ||
                            "U"}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {member.user.name || "No name"}
                          </p>
                          <p className="text-sm text-gray-600">{member.user.email}</p>
                        </div>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          member.role === "owner"
                            ? "bg-purple-100 text-purple-800"
                            : member.role === "admin"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {member.role}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pending Invitations */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Pending Invitations
                </CardTitle>
                <CardDescription>Invitations waiting to be accepted</CardDescription>
              </CardHeader>
              <CardContent>
                {invitations.filter((inv) => inv.status === "pending").length === 0 ? (
                  <p className="text-sm text-gray-500">No pending invitations</p>
                ) : (
                  <div className="space-y-3">
                    {invitations
                      .filter((inv) => inv.status === "pending")
                      .map((invitation) => (
                        <div key={invitation.id} className="rounded-lg border p-3">
                          <p className="font-medium text-gray-900">{invitation.email}</p>
                          <div className="mt-1 flex items-center justify-between">
                            <span className="text-xs text-gray-600">{invitation.role}</span>
                            <span className="text-xs text-gray-500">
                              Expires {new Date(invitation.expiresAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
