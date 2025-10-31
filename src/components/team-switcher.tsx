"use client";

import { Check, ChevronsUpDown, PlusCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";

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
// import { cn } from "@/lib/utils"

type Team = {
  id: string;
  name: string;
  slug: string;
  role: string;
};

interface TeamSwitcherProps {
  teams: Team[];
  currentTeam?: Team | undefined;
}

export function TeamSwitcher({ teams, currentTeam }: TeamSwitcherProps) {
  const router = useRouter();

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className="w-full justify-between border-border/50 bg-background/50 hover:bg-background"
        >
          <div className="flex items-center gap-2">
            {currentTeam ? (
              <>
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="bg-primary text-xs text-primary-foreground">
                    {getInitials(currentTeam.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate">{currentTeam.name}</span>
              </>
            ) : (
              <span className="text-muted-foreground">Select team...</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[240px]">
        <DropdownMenuLabel>Teams</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {teams.map((team) => (
          <DropdownMenuItem
            key={team.id}
            onClick={() => router.push(`/teams/${team.slug}`)}
            className="cursor-pointer"
          >
            <div className="flex w-full items-center justify-between">
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="bg-primary/10 text-xs text-primary">
                    {getInitials(team.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{team.name}</span>
                  <span className="text-xs capitalize text-muted-foreground">{team.role}</span>
                </div>
              </div>
              {currentTeam?.id === team.id && <Check className="h-4 w-4 text-primary" />}
            </div>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => router.push("/teams/create")}
          className="cursor-pointer text-primary"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Create team
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
