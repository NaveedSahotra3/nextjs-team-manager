"use client";

import { CheckCircle, XCircle, Mail, Users } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export const dynamic = "force-dynamic";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface InvitationDetails {
  id: string;
  email: string;
  role: string;
  teamName: string;
  teamSlug: string;
  inviterName: string;
  expiresAt: string;
}

export default function AcceptInvitationPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const token = params?.["token"] as string;

  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (token) {
      fetchInvitation();
    }
  }, [token]);

  const fetchInvitation = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/invitations/${token}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch invitation");
      }

      setInvitation(data.invitation);
    } catch (error) {
      console.error("Error fetching invitation:", error);
      setError(error instanceof Error ? error.message : "Failed to load invitation");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptInvitation = async () => {
    if (!session?.user) {
      // Redirect to sign in with callback to this page
      router.push(`/auth/signin?callbackUrl=/invitations/${token}`);
      return;
    }

    setIsAccepting(true);
    setError("");

    try {
      const response = await fetch(`/api/invitations/${token}`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to accept invitation");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(`/teams/${data.team.slug}`);
      }, 2000);
    } catch (error) {
      console.error("Error accepting invitation:", error);
      setError(error instanceof Error ? error.message : "Failed to accept invitation");
      setIsAccepting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-2 text-gray-600">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-center">Invalid Invitation</CardTitle>
            <CardDescription className="text-center">{error}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/teams">
              <Button>Go to Teams</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-center">Success!</CardTitle>
            <CardDescription className="text-center">
              You&apos;ve successfully joined {invitation?.teamName}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-gray-600">Redirecting to your team...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <Mail className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-center">Team Invitation</CardTitle>
          <CardDescription className="text-center">
            You&apos;ve been invited to join a team
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</div>}

          {invitation && (
            <>
              {/* Invitation Details */}
              <div className="space-y-4 rounded-lg bg-gray-50 p-4">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-gray-600" />
                  <div>
                    <p className="text-sm text-gray-600">Team</p>
                    <p className="font-semibold text-gray-900">{invitation.teamName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-gray-600" />
                  <div>
                    <p className="text-sm text-gray-600">Invited by</p>
                    <p className="font-semibold text-gray-900">{invitation.inviterName}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Your role</p>
                  <span className="mt-1 inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
                    {invitation.role}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Expires on</p>
                  <p className="font-medium text-gray-900">
                    {new Date(invitation.expiresAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>

              {/* Authentication Status */}
              {!session?.user ? (
                <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-4">
                  <p className="text-sm text-yellow-800">
                    You need to sign in or create an account with{" "}
                    <strong>{invitation.email}</strong> to accept this invitation.
                  </p>
                </div>
              ) : session.user.email?.toLowerCase() !== invitation.email.toLowerCase() ? (
                <div className="rounded-lg border border-red-300 bg-red-50 p-4">
                  <p className="text-sm text-red-800">
                    This invitation was sent to <strong>{invitation.email}</strong>, but you&apos;re
                    signed in as <strong>{session.user.email}</strong>. Please sign in with the
                    correct account.
                  </p>
                </div>
              ) : null}

              {/* Actions */}
              <div className="space-y-3">
                {!session?.user ? (
                  <>
                    <Button
                      className="w-full"
                      onClick={() => router.push(`/auth/signin?callbackUrl=/invitations/${token}`)}
                    >
                      Sign In to Accept
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => router.push(`/auth/signup?callbackUrl=/invitations/${token}`)}
                    >
                      Create Account
                    </Button>
                  </>
                ) : session.user.email?.toLowerCase() === invitation.email.toLowerCase() ? (
                  <Button
                    className="w-full"
                    onClick={handleAcceptInvitation}
                    disabled={isAccepting}
                  >
                    {isAccepting ? "Accepting..." : "Accept Invitation"}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => router.push(`/auth/signin?callbackUrl=/invitations/${token}`)}
                  >
                    Sign In with Correct Account
                  </Button>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
