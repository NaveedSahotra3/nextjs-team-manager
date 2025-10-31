"use client";

import { ArrowRight, Check, Loader2, Sparkles, Users } from "lucide-react";
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
    <div className="grid gap-8 lg:grid-cols-3">
      {/* Main Form */}
      <Card className="border-border/50 shadow-lg lg:col-span-2">
        <CardHeader className="space-y-1 pb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">Team Details</CardTitle>
              <CardDescription className="text-sm">
                Fill in the information below to create your team
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Team Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="e.g., Engineering Team"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                required
                disabled={isLoading}
                className="h-11 transition-all focus:ring-2 focus:ring-primary/20"
              />
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Check className="h-3 w-3 text-primary" />
                This is your team&apos;s visible name within the app
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug" className="text-sm font-medium">
                Team URL Slug <span className="text-destructive">*</span>
              </Label>
              <div className="flex items-center gap-2 rounded-lg border border-input bg-background px-3 transition-all focus-within:ring-2 focus-within:ring-primary/20">
                <span className="text-sm text-muted-foreground">/teams/</span>
                <Input
                  id="slug"
                  placeholder="engineering-team"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  required
                  disabled={isLoading}
                  className="flex-1 border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Check className="h-3 w-3 text-primary" />
                Auto-generated from team name. Must be unique and URL-friendly
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Description <span className="text-xs text-muted-foreground">(Optional)</span>
              </Label>
              <Input
                id="description"
                placeholder="Brief description of your team"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                disabled={isLoading}
                className="h-11 transition-all focus:ring-2 focus:ring-primary/20"
              />
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Check className="h-3 w-3 text-primary" />
                Help others understand what your team does
              </p>
            </div>

            <div className="flex gap-3 border-t pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isLoading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !formData.name || !formData.slug}
                className="flex-1 bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    Create Team
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Benefits Section */}
      <div className="space-y-6">
        <Card className="border-border/50 bg-muted/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-primary" />
              Why Create a Team?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Check className="h-4 w-4 text-primary" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Centralized Collaboration</p>
                <p className="text-xs text-muted-foreground">
                  Bring all your team members together in one workspace
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Check className="h-4 w-4 text-primary" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Role-Based Access</p>
                <p className="text-xs text-muted-foreground">
                  Manage permissions with admin, member, and viewer roles
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Check className="h-4 w-4 text-primary" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Easy Management</p>
                <p className="text-xs text-muted-foreground">
                  Track progress, manage members, and stay organized
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-primary">
                <Sparkles className="h-4 w-4" />
                <p className="text-sm font-medium">Pro Tip</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Choose a descriptive team name that clearly represents your group. You can always
                update it later in team settings.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
