import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

export const dynamic = "force-dynamic";

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
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="space-y-4 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <svg
              className="h-8 w-8 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <h1 className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-4xl font-bold tracking-tight text-transparent">
            Create Your Team
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Bring your team together in one place. Collaborate, manage, and grow with ease.
          </p>
        </div>

        <CreateTeamForm />
      </div>
    </AppShell>
  );
}
