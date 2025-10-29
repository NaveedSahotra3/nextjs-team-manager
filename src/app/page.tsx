import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  // If user is already signed in, redirect to dashboard
  if (session) {
    redirect("/dashboard");
  }

  // If not signed in, redirect to sign-in page
  redirect("/auth/signin");
}
