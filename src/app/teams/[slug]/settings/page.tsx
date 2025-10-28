"use client";

import { ArrowLeft, Settings } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export const dynamic = "force-dynamic";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Team {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  ownerId: string;
}

export default function TeamSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const slug = params?.["slug"] as string;

  const [team, setTeam] = useState<Team | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/auth/signin?callbackUrl=/teams/${slug}/settings`);
      return;
    }

    if (status === "authenticated") {
      fetchTeam();
    }
  }, [status, router, slug]);

  const fetchTeam = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/teams/${slug}`);

      if (!response.ok) {
        throw new Error("Failed to fetch team");
      }

      const data = await response.json();
      setTeam(data.team);
      setFormData({
        name: data.team.name,
        description: data.team.description || "",
      });
    } catch (error) {
      console.error("Error fetching team:", error);
      setError("Failed to load team");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/teams/${slug}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update team");
      }

      setSuccess("Team updated successfully");
      setTeam(data.team);
    } catch (error) {
      console.error("Error updating team:", error);
      setError(error instanceof Error ? error.message : "Failed to update team");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTeam = async () => {
    // eslint-disable-next-line no-alert
    const confirmDelete = confirm(
      `Are you sure you want to delete "${team?.name}"? This action cannot be undone.`
    );
    if (!confirmDelete) {
      return;
    }

    // eslint-disable-next-line no-alert
    const confirmName = prompt("Type the team name to confirm deletion:");
    if (confirmName !== team?.name) {
      // eslint-disable-next-line no-alert
      alert("Team name doesn't match. Deletion cancelled.");
      return;
    }

    setIsDeleting(true);
    setError("");

    try {
      const response = await fetch(`/api/teams/${slug}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete team");
      }

      router.push("/teams");
    } catch (error) {
      console.error("Error deleting team:", error);
      setError(error instanceof Error ? error.message : "Failed to delete team");
    } finally {
      setIsDeleting(false);
    }
  };

  const isOwner = team && session?.user?.id === team.ownerId;

  if (status === "loading" || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-12">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-4 text-2xl font-bold text-gray-900">Team not found</h2>
          <Link href="/teams">
            <Button>Back to Teams</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-12">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-4 text-2xl font-bold text-gray-900">Access Denied</h2>
          <p className="mb-6 text-gray-600">Only the team owner can access settings</p>
          <Link href={`/teams/${slug}`}>
            <Button>Back to Team</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Link
          href={`/teams/${slug}`}
          className="mb-6 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Team
        </Link>

        <div className="mb-8">
          <h1 className="flex items-center gap-2 text-3xl font-bold text-gray-900">
            <Settings className="h-8 w-8" />
            Team Settings
          </h1>
          <p className="mt-1 text-gray-600">{team.name}</p>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 rounded-md bg-green-50 p-4">
            <p className="text-sm text-green-800">{success}</p>
          </div>
        )}
        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="space-y-6">
          {/* General Settings */}
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Update your team information</CardDescription>
            </CardHeader>
            <form onSubmit={handleUpdateTeam}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Team Name</Label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    disabled={isSaving}
                    maxLength={255}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">Team Slug (Read-only)</Label>
                  <Input id="slug" type="text" value={team.slug} disabled />
                  <p className="text-xs text-gray-500">The slug cannot be changed after creation</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    className="flex min-h-[100px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    disabled={isSaving}
                    maxLength={1000}
                  />
                  <p className="text-xs text-gray-500">
                    {formData.description.length}/1000 characters
                  </p>
                </div>

                <Button type="submit" disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </CardContent>
            </form>
          </Card>

          {/* Danger Zone */}
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-600">Danger Zone</CardTitle>
              <CardDescription>Irreversible actions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <h3 className="mb-2 font-semibold text-red-900">Delete Team</h3>
                <p className="mb-4 text-sm text-red-700">
                  Once you delete a team, there is no going back. This will permanently delete the
                  team and remove all members.
                </p>
                <Button variant="destructive" onClick={handleDeleteTeam} disabled={isDeleting}>
                  {isDeleting ? "Deleting..." : "Delete Team"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
