"use client";

import { Mail, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

interface InviteMembersProps {
  teamSlug: string;
}

export function InviteMembers({ teamSlug }: InviteMembersProps) {
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState("member");
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/teams/${teamSlug}/invitations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Invitation sent successfully",
        });
        setEmail("");
        setRole("member");
        router.refresh();
      } else {
        const data = await response.json();
        toast({
          title: "Error",
          description: data.error || "Failed to send invitation",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to send invitation",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-primary" />
          <CardTitle>Invite Members</CardTitle>
        </div>
        <CardDescription>Send email invitations to add new members to your team</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleInvite} className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              placeholder="colleague@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="w-full space-y-2 sm:w-40">
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={setRole} disabled={loading}>
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={loading} className="sm:w-auto">
            <Send className="mr-2 h-4 w-4" />
            {loading ? "Sending..." : "Invite"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
