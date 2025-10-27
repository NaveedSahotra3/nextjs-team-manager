import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage(): JSX.Element {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="text-xl font-bold">
            Team Manager
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/auth/signin">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/auth/signup">
              <Button>Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="container flex flex-col items-center justify-center gap-6 py-24 md:py-32">
          <div className="flex max-w-[980px] flex-col items-center gap-4 text-center">
            <h1 className="text-4xl font-bold leading-tight tracking-tighter md:text-6xl lg:leading-[1.1]">
              Manage Your Teams with <span className="text-primary">Security</span> in Mind
            </h1>
            <p className="max-w-[750px] text-lg text-muted-foreground sm:text-xl">
              A production-ready team management platform with secure authentication, role-based
              access control, and seamless team collaboration.
            </p>
            <div className="flex gap-4">
              <Link href="/auth/signup">
                <Button size="lg">Get Started Free</Button>
              </Link>
              <Link href="/auth/signin">
                <Button size="lg" variant="outline">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="container py-12 md:py-16">
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>🔐 Secure Authentication</CardTitle>
                <CardDescription>
                  Built with NextAuth.js and bcrypt password hashing
                </CardDescription>
              </CardHeader>
              <CardContent>
                Industry-standard security practices with encrypted sessions and secure token
                management.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>👥 Team Management</CardTitle>
                <CardDescription>
                  Create and manage teams with role-based permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                Invite members via email, assign roles, and manage your team structure efficiently.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>📧 Email Invitations</CardTitle>
                <CardDescription>Send secure invitation links to team members</CardDescription>
              </CardHeader>
              <CardContent>
                Token-based invitation system with expiration dates and automatic email
                notifications.
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="border-t bg-muted/50 py-12">
          <div className="container flex flex-col items-center gap-4 text-center">
            <h2 className="text-3xl font-bold">Built with Modern Technologies</h2>
            <p className="max-w-[600px] text-muted-foreground">
              Next.js 14, TypeScript, Neon Postgres, Drizzle ORM, Shadcn/ui, Tailwind CSS, and more.
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t py-6">
        <div className="container flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            © 2024 Team Manager. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link href="/privacy" className="text-sm text-muted-foreground hover:underline">
              Privacy
            </Link>
            <Link href="/terms" className="text-sm text-muted-foreground hover:underline">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
