"use client";

import { MoreVertical, Mail, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";

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

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  expiresAt: string;
}

interface InvitationsTableProps {
  teamId: string;
  teamSlug: string;
  userRole: string;
}

export function InvitationsTable({ teamSlug, userRole }: InvitationsTableProps) {
  const [invitations, setInvitations] = React.useState<Invitation[]>([]);
  const [loading, setLoading] = React.useState(true);
  const router = useRouter();
  const { toast } = useToast();

  const isOwnerOrAdmin = userRole === "owner" || userRole === "admin";

  React.useEffect(() => {
    fetchInvitations();
  }, [teamSlug]);

  const fetchInvitations = async () => {
    try {
      const response = await fetch(`/api/teams/${teamSlug}/invitations`);
      if (response.ok) {
        const data = await response.json();
        setInvitations(data.invitations || []);
      }
    } catch {
      console.error("Error fetching invitations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleResendInvitation = async (invitationId: string) => {
    try {
      const response = await fetch(`/api/teams/${teamSlug}/invitations/${invitationId}/resend`, {
        method: "POST",
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Invitation resent successfully",
        });
      } else {
        const data = await response.json();
        toast({
          title: "Error",
          description: data.error || "Failed to resend invitation",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to resend invitation",
        variant: "destructive",
      });
    }
  };

  const handleDeleteInvitation = async (invitationId: string) => {
    // eslint-disable-next-line no-alert
    if (!window.confirm("Are you sure you want to delete this invitation?")) {
      return;
    }

    try {
      const response = await fetch(`/api/teams/${teamSlug}/invitations/${invitationId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Invitation deleted successfully",
        });
        fetchInvitations();
        router.refresh();
      } else {
        const data = await response.json();
        toast({
          title: "Error",
          description: data.error || "Failed to delete invitation",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete invitation",
        variant: "destructive",
      });
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "pending":
        return "outline";
      case "accepted":
        return "default";
      case "expired":
        return "secondary";
      default:
        return "outline";
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invitations</CardTitle>
          <CardDescription>Loading invitations...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invitations</CardTitle>
        <CardDescription>
          {invitations.length} pending {invitations.length === 1 ? "invitation" : "invitations"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Invite Date</TableHead>
                <TableHead>Invite Status</TableHead>
                {isOwnerOrAdmin && <TableHead className="w-[70px]">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {invitations.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={isOwnerOrAdmin ? 4 : 3}
                    className="text-center text-muted-foreground"
                  >
                    No pending invitations
                  </TableCell>
                </TableRow>
              ) : (
                invitations.map((invitation) => (
                  <TableRow key={invitation.id}>
                    <TableCell className="font-medium">{invitation.email}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(invitation.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={getStatusBadgeVariant(invitation.status)}
                        className="capitalize"
                      >
                        {invitation.status}
                      </Badge>
                    </TableCell>
                    {isOwnerOrAdmin && (
                      <TableCell>
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
                            {invitation.status === "pending" && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => handleResendInvitation(invitation.id)}
                                >
                                  <Mail className="mr-2 h-4 w-4" />
                                  Resend Email
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                              </>
                            )}
                            <DropdownMenuItem
                              onClick={() => handleDeleteInvitation(invitation.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
