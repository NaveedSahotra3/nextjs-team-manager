import { Users, PlusCircle, Mail, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { DashboardShell } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { authOptions } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <DashboardShell userName={session.user?.name ?? "User"} userEmail={session.user?.email ?? ""}>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {session.user?.name?.split(" ")[0] ?? "there"}
          </h1>
          <p className="text-muted-foreground">
            Here&apos;s what&apos;s happening with your teams today
          </p>
        </div>

        {/* Quick Stats */}
        <DashboardStats />

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="teams">My Teams</TabsTrigger>
            <TabsTrigger value="invitations">Invitations</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card className="border-border/50 transition-all duration-200 hover:shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Users className="h-8 w-8 text-primary" />
                    <Badge variant="secondary">Start here</Badge>
                  </div>
                  <CardTitle className="mt-4">My Teams</CardTitle>
                  <CardDescription>View and manage all your teams in one place</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full">
                    <Link href="/teams">
                      <Users className="mr-2 h-4 w-4" />
                      View Teams
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-border/50 transition-all duration-200 hover:shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <PlusCircle className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="mt-4">Create Team</CardTitle>
                  <CardDescription>
                    Start a new team and invite members to collaborate
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full" variant="outline">
                    <Link href="/teams/create">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Create Team
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-border/50 transition-all duration-200 hover:shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Mail className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="mt-4">Invitations</CardTitle>
                  <CardDescription>View and accept pending team invitations</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full" variant="outline">
                    <Link href="/invitations">
                      <Mail className="mr-2 h-4 w-4" />
                      View Invitations
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Separator />

            <Card>
              <CardHeader>
                <CardTitle>Getting Started</CardTitle>
                <CardDescription>
                  Follow these steps to make the most of Team Manager
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    1
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">Create your first team</h4>
                    <p className="text-sm text-muted-foreground">
                      Start by creating a team and give it a meaningful name. You can always update
                      it later.
                    </p>
                  </div>
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-muted-foreground" />
                </div>

                <Separator />

                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    2
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">Invite team members</h4>
                    <p className="text-sm text-muted-foreground">
                      Send email invitations to your colleagues to join your team and collaborate.
                    </p>
                  </div>
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-muted-foreground" />
                </div>

                <Separator />

                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    3
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">Manage roles and permissions</h4>
                    <p className="text-sm text-muted-foreground">
                      Assign roles to team members to control their access and permissions within
                      the team.
                    </p>
                  </div>
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="teams" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Your Teams</CardTitle>
                <CardDescription>All teams where you are a member</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex min-h-[200px] flex-col items-center justify-center text-center">
                  <Users className="mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="mb-2 text-lg font-semibold">No teams yet</h3>
                  <p className="mb-6 text-sm text-muted-foreground">
                    Create your first team to start collaborating
                  </p>
                  <Button asChild>
                    <Link href="/teams/create">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Create Your First Team
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invitations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pending Invitations</CardTitle>
                <CardDescription>Team invitations waiting for your response</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex min-h-[200px] flex-col items-center justify-center text-center">
                  <Mail className="mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="mb-2 text-lg font-semibold">No pending invitations</h3>
                  <p className="text-sm text-muted-foreground">
                    You&apos;ll see team invitations here when someone invites you
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardShell>
  );
}
