"use client";

import React from "react";

import { DashboardHeader } from "./DashboardHeader";
import { DashboardSidebar } from "./DashboardSidebar";

interface DashboardShellProps extends React.PropsWithChildren {
  userName?: string;
  userEmail?: string;
}

export function DashboardShell({
  children,
  userName = "User",
  userEmail = "",
}: DashboardShellProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <DashboardHeader userName={userName ?? "User"} userEmail={userEmail ?? ""} />

      {/* Sidebar and Main Content */}
      <div className="flex">
        {/* Sidebar */}
        <DashboardSidebar />

        {/* Main Content Area */}
        <main className="ml-64 min-h-[calc(100vh-4rem)] flex-1">
          <div className="container mx-auto p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
