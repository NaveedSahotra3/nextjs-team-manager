"use client";

import { LayoutDashboard, Users, LogOut, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

import { TeamSwitcher } from "@/components/team-switcher";
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
      <div className="hidden w-64 flex-col border-r border-border/50 bg-background md:flex">
        {/* Logo */}
        <div className="flex h-16 items-center border-b border-border/50 px-6">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <span className="text-sm font-bold">TM</span>
            </div>
            <span className="text-lg">Team Manager</span>
          </Link>
        </div>

        {/* Team Switcher */}
        <div className="border-b border-border/50 p-4">
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
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
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
        <div className="border-t border-border/50 p-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start gap-3 px-2">
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
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile Header - Optional */}
        <div className="flex h-16 items-center border-b border-border/50 px-6 md:hidden">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <span className="text-sm font-bold">TM</span>
            </div>
            <span className="text-lg">Team Manager</span>
          </Link>
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
