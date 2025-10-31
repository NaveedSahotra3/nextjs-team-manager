"use client";

import { LayoutDashboard, Users, LogOut, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

import { TeamSwitcher } from "@/components/team-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type Team = {
  id: string;
  name: string;
  slug: string;
  role: string;
};

interface AppShellProps {
  children: React.ReactNode;
  userName: string;
  userEmail: string;
  teams: Team[];
  currentTeam?: Team | undefined;
}

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Team",
    href: (slug: string) => `/teams/${slug}`,
    icon: Users,
    requiresTeam: true,
  },
];

export function AppShell({ children, userName, userEmail, teams, currentTeam }: AppShellProps) {
  const pathname = usePathname();

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSignOut = async () => {
    const { signOut } = await import("next-auth/react");
    signOut({ callbackUrl: "/auth/signin" });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <div className="hidden w-64 flex-col bg-muted/30 md:flex">
        {/* Logo */}
        <div className="flex h-16 items-center border-b border-border px-6">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <span className="text-sm font-bold">TM</span>
            </div>
            <span className="text-lg">Team Manager</span>
          </Link>
        </div>

        {/* Team Switcher */}
        <div className="border-b border-border p-4">
          <TeamSwitcher teams={teams} currentTeam={currentTeam} />
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          {navigation.map((item) => {
            const href =
              typeof item.href === "function"
                ? currentTeam
                  ? item.href(currentTeam.slug)
                  : "#"
                : item.href;

            const isActive =
              typeof item.href === "function"
                ? pathname.startsWith("/teams")
                : pathname === item.href || pathname.startsWith(item.href + "/");

            const isDisabled = item.requiresTeam && !currentTeam;

            return (
              <Link
                key={item.name}
                href={isDisabled ? "#" : href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-accent text-accent-foreground shadow-sm"
                    : "text-foreground hover:bg-accent/80 hover:text-accent-foreground",
                  isDisabled && "pointer-events-none opacity-50"
                )}
                onClick={(e) => {
                  if (isDisabled) {
                    e.preventDefault();
                  }
                }}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Menu */}
        <div className="border-t border-border p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-muted-foreground">Theme</span>
            <ThemeToggle />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 px-2 hover:bg-accent/80 hover:text-accent-foreground"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-xs text-primary-foreground">
                    {getInitials(userName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start text-left text-sm">
                  <span className="font-medium">{userName}</span>
                  <span className="text-xs text-muted-foreground">{userEmail}</span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings" className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden bg-muted/30">
        {/* Mobile Header - Optional */}
        <div className="flex h-16 items-center border-b border-border bg-muted/30 px-6 md:hidden">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <span className="text-sm font-bold">TM</span>
            </div>
            <span className="text-lg">Team Manager</span>
          </Link>
        </div>

        {/* Page Content - with 20px top strip showing sidebar color */}
        <main
          className="flex-1 overflow-y-auto rounded-tl-2xl bg-card"
          style={{ marginTop: "20px", marginRight: "20px" }}
        >
          <div className="container mx-auto p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
