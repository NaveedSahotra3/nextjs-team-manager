"use client";

import { ArrowLeft, Mail, Loader2, Calendar, Users, Clock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const dynamic = "force-dynamic";

interface Invitation {
  id: string;
  email: string;
  role: "owner" | "admin" | "member";
  status: "pending" | "accepted" | "rejected";
  expiresAt: string;
  createdAt: string;
  acceptedAt: string | null;
}

interface TeamWithInvitations {
  id: string;
  name: string;
  slug: string;
  invitations: Invitation[];
}

export default function InvitationsPage() {
  const router = useRouter();
  const { status } = useSession();
  const [teams, setTeams] = useState<TeamWithInvitations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin?callbackUrl=/invitations");
      return;
    }

    if (status === "authenticated") {
      void fetchTeamsWithInvitations();
    }
  }, [status, router]);

  const fetchTeamsWithInvitations = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/invitations");

      if (!response.ok) {
        throw new Error("Failed to fetch invitations");
      }

      const data = await response.json();
      setTeams(data.teams || []);
    } catch (err) {
      console.error("Error fetching invitations:", err);
      setError("Failed to load invitations");
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted/20">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">Loading invitations...</p>
        </div>
      </div>
    );
  }

  const totalPending = teams.reduce(
    (sum, team) => sum + team.invitations.filter((inv) => inv.status === "pending").length,
    0
  );

  const totalAccepted = teams.reduce(
    (sum, team) => sum + team.invitations.filter((inv) => inv.status === "accepted").length,
    0
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Back to Dashboard */}
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Invitations</h1>
          <p className="mt-1 text-muted-foreground">Manage invitations across all your teams</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive animate-in fade-in slide-in-from-top-1">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Teams</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{teams.length}</div>
              <p className="text-xs text-muted-foreground">Teams you manage</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Invitations</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalPending}</div>
              <p className="text-xs text-muted-foreground">Awaiting response</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Accepted</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalAccepted}</div>
              <p className="text-xs text-muted-foreground">Successfully joined</p>
            </CardContent>
          </Card>
        </div>

        {/* Teams Tabs */}
        {teams.length === 0 ? (
          <Card className="border-border/50 shadow-lg">
            <CardContent className="flex min-h-[400px] flex-col items-center justify-center py-16 text-center">
              <Users className="mb-4 h-16 w-16 text-muted-foreground" />
              <h3 className="mb-2 text-xl font-semibold">No teams found</h3>
              <p className="mb-6 max-w-sm text-sm text-muted-foreground">
                You need to create a team first to send invitations
              </p>
              <Button asChild>
                <Link href="/teams/create">Create Your First Team</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue={teams[0]!.id} className="space-y-4">
            <TabsList
              className="grid w-full"
              style={{ gridTemplateColumns: `repeat(${Math.min(teams.length, 4)}, 1fr)` }}
            >
              {teams.map((team) => (
                <TabsTrigger key={team.id} value={team.id} className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {team.name}
                  {team.invitations.filter((inv) => inv.status === "pending").length > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {team.invitations.filter((inv) => inv.status === "pending").length}
                    </Badge>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>

            {teams.map((team) => (
              <TabsContent key={team.id} value={team.id} className="space-y-4">
                <Card className="border-border/50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{team.name}</CardTitle>
                        <CardDescription className="mt-1">
                          /{team.slug} • {team.invitations.length} invitation
                          {team.invitations.length !== 1 ? "s" : ""} sent
                        </CardDescription>
                      </div>
                      <Button asChild variant="outline">
                        <Link href={`/teams/${team.slug}`}>View Team</Link>
                      </Button>
                    </div>
                  </CardHeader>
                </Card>

                {/* Pending Invitations */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">
                    Pending Invitations (
                    {team.invitations.filter((inv) => inv.status === "pending").length})
                  </h3>

                  {team.invitations.filter((inv) => inv.status === "pending").length === 0 ? (
                    <Card className="border-border/50">
                      <CardContent className="flex min-h-[200px] flex-col items-center justify-center py-12 text-center">
                        <Mail className="mb-4 h-12 w-12 text-muted-foreground" />
                        <h4 className="mb-2 font-semibold">No pending invitations</h4>
                        <p className="text-sm text-muted-foreground">
                          All invitations for this team have been accepted or have expired
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {team.invitations
                        .filter((inv) => inv.status === "pending")
                        .map((invitation) => (
                          <Card key={invitation.id} className="border-border/50">
                            <CardContent className="pt-6">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 space-y-2">
                                  <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium">{invitation.email}</span>
                                    <Badge variant="secondary" className="capitalize">
                                      {invitation.role}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      Sent {new Date(invitation.createdAt).toLocaleDateString()}
                                    </div>
                                    <Separator orientation="vertical" className="h-3" />
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      Expires {new Date(invitation.expiresAt).toLocaleDateString()}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline">Pending</Badge>
                                  <Button variant="ghost" size="sm">
                                    Resend
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  )}
                </div>

                {/* Accepted Invitations */}
                {team.invitations.filter((inv) => inv.status === "accepted").length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">
                        Accepted Invitations (
                        {team.invitations.filter((inv) => inv.status === "accepted").length})
                      </h3>
                      <div className="space-y-3">
                        {team.invitations
                          .filter((inv) => inv.status === "accepted")
                          .map((invitation) => (
                            <Card key={invitation.id} className="border-border/50 bg-muted/20">
                              <CardContent className="pt-6">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1 space-y-2">
                                    <div className="flex items-center gap-2">
                                      <Mail className="h-4 w-4 text-muted-foreground" />
                                      <span className="font-medium">{invitation.email}</span>
                                      <Badge variant="secondary" className="capitalize">
                                        {invitation.role}
                                      </Badge>
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      Joined{" "}
                                      {invitation.acceptedAt
                                        ? new Date(invitation.acceptedAt).toLocaleDateString()
                                        : "recently"}
                                    </div>
                                  </div>
                                  <Badge
                                    variant="outline"
                                    className="border-green-200 bg-green-50 text-green-700"
                                  >
                                    Accepted
                                  </Badge>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                      </div>
                    </div>
                  </>
                )}
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    </div>
  );
}
