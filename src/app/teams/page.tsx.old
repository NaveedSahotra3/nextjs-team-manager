"use client";

import { Plus, Users, Calendar, ArrowLeft, Loader2, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export const dynamic = "force-dynamic";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

interface Team {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  ownerId: string;
  createdAt: string;
  role: "owner" | "admin" | "member" | null;
}

export default function TeamsPage() {
  const router = useRouter();
  const { status } = useSession();
  const [teams, setTeams] = useState<Team[]>([]);
  const [filteredTeams, setFilteredTeams] = useState<Team[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin?callbackUrl=/teams");
      return;
    }

    if (status === "authenticated") {
      fetchTeams();
    }
  }, [status, router]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredTeams(teams);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredTeams(
        teams.filter(
          (team) =>
            team.name.toLowerCase().includes(query) ||
            team.slug.toLowerCase().includes(query) ||
            team.description?.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, teams]);

  const fetchTeams = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/teams");

      if (!response.ok) {
        throw new Error("Failed to fetch teams");
      }

      const data = await response.json();
      setTeams(data.teams || []);
      setFilteredTeams(data.teams || []);
    } catch (error) {
      console.error("Error fetching teams:", error);
      setError("Failed to load teams");
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted/20">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">Loading teams...</p>
        </div>
      </div>
    );
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "owner":
        return "default";
      case "admin":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Teams</h1>
            <p className="mt-1 text-muted-foreground">
              Manage your teams and collaborate with others
            </p>
          </div>
          <Link href="/teams/create">
            <Button className="transition-all duration-200 hover:scale-[1.02]">
              <Plus className="mr-2 h-4 w-4" />
              Create Team
            </Button>
          </Link>
        </div>

        {/* Error Message */}
        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive animate-in fade-in slide-in-from-top-1">
            {error}
          </div>
        )}

        {teams.length > 0 && (
          <>
            {/* Search Bar */}
            <Card className="border-border/50">
              <CardContent className="pt-6">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search teams by name, slug, or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>

            <Separator />
          </>
        )}

        {/* Teams Grid */}
        {filteredTeams.length === 0 ? (
          <Card className="border-border/50 shadow-lg">
            <CardContent className="flex min-h-[400px] flex-col items-center justify-center py-16 text-center">
              <Users className="mb-4 h-16 w-16 text-muted-foreground" />
              <h3 className="mb-2 text-xl font-semibold">
                {teams.length === 0 ? "No teams yet" : "No teams found"}
              </h3>
              <p className="mb-6 max-w-sm text-sm text-muted-foreground">
                {teams.length === 0
                  ? "Get started by creating your first team and invite members to collaborate"
                  : "Try adjusting your search query to find what you're looking for"}
              </p>
              {teams.length === 0 && (
                <Link href="/teams/create">
                  <Button size="lg">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Team
                  </Button>
                </Link>
              )}
              {teams.length > 0 && searchQuery && (
                <Button variant="outline" onClick={() => setSearchQuery("")}>
                  Clear Search
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {filteredTeams.length} of {teams.length}{" "}
                {teams.length === 1 ? "team" : "teams"}
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredTeams.map((team) => (
                <Link key={team.id} href={`/teams/${team.slug}`}>
                  <Card className="group h-full border-border/50 transition-all duration-200 hover:border-border hover:shadow-lg">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-1">
                          <CardTitle className="transition-colors group-hover:text-primary">
                            {team.name}
                          </CardTitle>
                          <CardDescription className="font-mono text-xs">
                            /{team.slug}
                          </CardDescription>
                        </div>
                        {team.role && (
                          <Badge variant={getRoleBadgeVariant(team.role)} className="capitalize">
                            {team.role}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="line-clamp-2 text-sm text-muted-foreground">
                        {team.description || "No description provided"}
                      </p>
                      <Separator />
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>Created {new Date(team.createdAt).toLocaleDateString()}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
