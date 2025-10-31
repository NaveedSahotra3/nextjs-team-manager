"use client";

import { MoreVertical, Trash2, UserCog } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";

interface Member {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  role: string;
  joinedAt: string;
}

interface MembersTableProps {
  teamId: string;
  teamSlug: string;
  userId: string;
  userRole: string;
}

export function MembersTable({ teamSlug, userId, userRole }: MembersTableProps) {
  const [members, setMembers] = React.useState<Member[]>([]);
  const [loading, setLoading] = React.useState(true);
  const router = useRouter();
  const { toast } = useToast();

  const isOwnerOrAdmin = userRole === "owner" || userRole === "admin";

  React.useEffect(() => {
    fetchMembers();
  }, [teamSlug]);

  const fetchMembers = async () => {
    try {
      const response = await fetch(`/api/teams/${teamSlug}`);
      if (response.ok) {
        const data = await response.json();
        setMembers(data.members || []);
      }
    } catch {
      console.error("Error fetching members:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    // eslint-disable-next-line no-alert
    if (!window.confirm("Are you sure you want to remove this member?")) {
      return;
    }

    try {
      const response = await fetch(`/api/teams/${teamSlug}/members/${memberId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Member removed successfully",
        });
        fetchMembers();
        router.refresh();
      } else {
        const data = await response.json();
        toast({
          title: "Error",
          description: data.error || "Failed to remove member",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to remove member",
        variant: "destructive",
      });
    }
  };

  const handleChangeRole = async (memberId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/teams/${teamSlug}/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Role updated successfully",
        });
        fetchMembers();
        router.refresh();
      } else {
        const data = await response.json();
        toast({
          title: "Error",
          description: data.error || "Failed to update role",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to update role",
        variant: "destructive",
      });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "owner":
        return "default";
      case "admin":
        return "secondary";
      default:
        return "outline";
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>Loading members...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Members</CardTitle>
        <CardDescription>
          {members.length} {members.length === 1 ? "member" : "members"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                {isOwnerOrAdmin && <TableHead className="w-[70px]">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={isOwnerOrAdmin ? 5 : 4}
                    className="text-center text-muted-foreground"
                  >
                    No members found
                  </TableCell>
                </TableRow>
              ) : (
                members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/10 text-xs text-primary">
                            {getInitials(member.userName)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{member.userName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{member.userEmail}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(member.role)} className="capitalize">
                        {member.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(member.joinedAt).toLocaleDateString()}
                    </TableCell>
                    {isOwnerOrAdmin && (
                      <TableCell>
                        {member.userId !== userId && member.role !== "owner" ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                                <span className="sr-only">Actions</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() =>
                                  handleChangeRole(
                                    member.id,
                                    member.role === "admin" ? "member" : "admin"
                                  )
                                }
                              >
                                <UserCog className="mr-2 h-4 w-4" />
                                {member.role === "admin" ? "Make Member" : "Make Admin"}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleRemoveMember(member.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Remove Member
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
