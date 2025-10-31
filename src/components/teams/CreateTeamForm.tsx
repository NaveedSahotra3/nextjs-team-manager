"use client";

import { Sparkles, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

export function CreateTeamForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  // Auto-generate slug from team name
  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      slug: name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim(),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: "Team created successfully",
        });
        router.push(`/teams/${formData.slug}`);
        router.refresh();
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to create team",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "An error occurred while creating the team",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <CardTitle className="text-2xl">Create a New Team</CardTitle>
        </div>
        <CardDescription>
          Set up your team workspace and start collaborating with your colleagues
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">
              Team Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="e.g., Engineering Team"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              This is your team&apos;s visible name within the app.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">
              Team URL Slug <span className="text-destructive">*</span>
            </Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">/teams/</span>
              <Input
                id="slug"
                placeholder="engineering-team"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                required
                disabled={isLoading}
                className="flex-1"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Auto-generated from team name. Must be unique and URL-friendly.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Input
              id="description"
              placeholder="Brief description of your team"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Help others understand what your team does.
            </p>
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              disabled={isLoading || !formData.name || !formData.slug}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Create Team
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
