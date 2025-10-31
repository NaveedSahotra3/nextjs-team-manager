import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { AppShell } from "@/components/layout/AppShell";
import { CreateTeamForm } from "@/components/teams/CreateTeamForm";
import { authOptions } from "@/lib/auth";
import { getUserTeams } from "@/lib/teams";

export default async function CreateTeamPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/auth/signin?callbackUrl=/teams/create");
  }

  const teams = await getUserTeams(session.user.id);

  return (
    <AppShell
      userName={session.user.name ?? "User"}
      userEmail={session.user.email ?? ""}
      teams={teams}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create New Team</h1>
          <p className="text-muted-foreground">
            Set up a new team to start collaborating with your colleagues
          </p>
        </div>

        <CreateTeamForm />
      </div>
    </AppShell>
  );
}
