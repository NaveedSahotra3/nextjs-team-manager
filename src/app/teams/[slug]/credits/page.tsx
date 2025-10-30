"use client";

import { ArrowLeft, CreditCard, Users, TrendingUp, Plus, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CREDIT_PACKAGES, formatPrice } from "@/lib/stripe-config";

export const dynamic = "force-dynamic";

interface MemberCreditInfo {
  userId: string;
  userName: string;
  allocated: number;
  used: number;
  available: number;
}

interface CreditOverview {
  teamId: string;
  total: number;
  used: number;
  available: number;
  estimatedMembers: number;
  estimatedHeadshotsPerMember: number;
  memberBreakdown: MemberCreditInfo[];
}

export default function TeamCreditsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const slug = params?.["slug"] as string;

  const [overview, setOverview] = useState<CreditOverview | null>(null);
  const [team, setTeam] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Purchase credits state
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState("professional");
  const [customCredits, setCustomCredits] = useState(100);
  const [isPurchasing, setIsPurchasing] = useState(false);

  // Allocate credits state
  const [showAllocateForm, setShowAllocateForm] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [creditsToAllocate, setCreditsToAllocate] = useState(0);
  const [isAllocating, setIsAllocating] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/auth/signin?callbackUrl=/teams/${slug}/credits`);
      return;
    }

    if (status === "authenticated") {
      fetchCreditData();
    }

    // Check for success/cancel from Stripe
    const successParam = searchParams?.get("success");
    const canceledParam = searchParams?.get("canceled");
    const sessionId = searchParams?.get("session_id");

    if (successParam === "true" && sessionId) {
      // Verify payment and add credits
      verifyPayment(sessionId);
    } else if (canceledParam === "true") {
      setError("Purchase was canceled");
      router.replace(`/teams/${slug}/credits`);
    }
  }, [status, router, slug, searchParams]);

  const fetchCreditData = async () => {
    try {
      setIsLoading(true);
      const [teamResponse, overviewResponse] = await Promise.all([
        fetch(`/api/teams/${slug}`),
        fetch(`/api/teams/${slug}/credits/overview`),
      ]);

      if (!teamResponse.ok) {
        throw new Error("Failed to fetch team");
      }

      if (!overviewResponse.ok) {
        throw new Error("Failed to fetch credit overview");
      }

      const teamData = await teamResponse.json();
      const overviewData = await overviewResponse.json();

      setTeam(teamData.team);
      setOverview(overviewData);
    } catch (error) {
      console.error("Error fetching credit data:", error);
      setError(error instanceof Error ? error.message : "Failed to load credits");
    } finally {
      setIsLoading(false);
    }
  };

  const verifyPayment = async (sessionId: string) => {
    try {
      const response = await fetch("/api/stripe/verify-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sessionId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to verify payment");
      }

      setSuccess(
        `Credits purchased successfully! Added ${data.creditsAdded} credits to your team.`
      );
      // Clear URL params and refresh data
      router.replace(`/teams/${slug}/credits`);
      fetchCreditData();
    } catch (error) {
      console.error("Error verifying payment:", error);
      setError(error instanceof Error ? error.message : "Failed to verify payment");
      router.replace(`/teams/${slug}/credits`);
    }
  };

  const handlePurchaseCredits = async () => {
    setIsPurchasing(true);
    setError("");

    try {
      const response = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          teamId: team.id,
          packageId: selectedPackage,
          customCredits: selectedPackage === "custom" ? customCredits : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout");
      }

      // Redirect to Stripe checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Error purchasing credits:", error);
      setError(error instanceof Error ? error.message : "Failed to purchase credits");
      setIsPurchasing(false);
    }
  };

  const handleAllocateCredits = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAllocating(true);
    setError("");

    try {
      const response = await fetch(`/api/teams/${slug}/credits/allocate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: selectedUserId,
          credits: creditsToAllocate,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to allocate credits");
      }

      setSuccess(`Successfully allocated ${creditsToAllocate} credits`);
      setShowAllocateForm(false);
      setCreditsToAllocate(0);
      setSelectedUserId("");
      fetchCreditData();
    } catch (error) {
      console.error("Error allocating credits:", error);
      setError(error instanceof Error ? error.message : "Failed to allocate credits");
    } finally {
      setIsAllocating(false);
    }
  };

  const handleAutoDistribute = async () => {
    // eslint-disable-next-line no-alert
    if (
      !confirm("This will distribute all available credits equally among team members. Continue?")
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/teams/${slug}/credits/auto-distribute`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to auto-distribute credits");
      }

      setSuccess("Credits distributed successfully!");
      fetchCreditData();
    } catch (error) {
      console.error("Error auto-distributing credits:", error);
      setError(error instanceof Error ? error.message : "Failed to auto-distribute credits");
    }
  };

  const isOwner = team && session?.user?.id === team.ownerId;
  const isAdmin = team?.members?.find(
    (m: any) => m.user.id === session?.user?.id && ["owner", "admin"].includes(m.role)
  );

  if (status === "loading" || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-2 text-gray-600">Loading credits...</p>
        </div>
      </div>
    );
  }

  if (error && !overview) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-12">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-4 text-2xl font-bold text-gray-900">{error}</h2>
          <Link href={`/teams/${slug}`}>
            <Button>Back to Team</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Back Button */}
        <Link
          href={`/teams/${slug}`}
          className="mb-6 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Team
        </Link>

        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Credit Management</h1>
            <p className="mt-1 text-gray-600">{team?.name}</p>
          </div>
          {(isOwner || isAdmin) && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleAutoDistribute}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Auto-distribute
              </Button>
              <Button size="sm" onClick={() => setShowPurchaseForm(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Purchase Credits
              </Button>
            </div>
          )}
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 rounded-md bg-green-50 p-4">
            <p className="text-sm text-green-800">{success}</p>
          </div>
        )}
        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Credit Overview Stats */}
        <div className="mb-6 grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Credits</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview?.total || 0}</div>
              <p className="text-xs text-muted-foreground">Credits purchased</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview?.available || 0}</div>
              <p className="text-xs text-muted-foreground">{overview?.used || 0} used</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usage Rate</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {overview?.total ? Math.round((overview.used / overview.total) * 100) : 0}%
              </div>
              <p className="text-xs text-muted-foreground">Of total credits</p>
            </CardContent>
          </Card>
        </div>

        {/* Purchase Credits Form */}
        {showPurchaseForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Purchase Credits</CardTitle>
              <CardDescription>Choose a package or create your own</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {CREDIT_PACKAGES.map((pkg) => (
                  <button
                    key={pkg.id}
                    onClick={() => setSelectedPackage(pkg.id)}
                    className={`rounded-lg border-2 p-4 text-left transition-all ${
                      selectedPackage === pkg.id
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    } ${pkg.popular ? "ring-2 ring-blue-200" : ""}`}
                  >
                    {pkg.popular && (
                      <span className="mb-2 inline-block rounded-full bg-blue-600 px-2 py-1 text-xs font-medium text-white">
                        Popular
                      </span>
                    )}
                    <h3 className="font-semibold text-gray-900">{pkg.name}</h3>
                    <p className="mt-1 text-2xl font-bold text-gray-900">
                      {"price" in pkg ? formatPrice(pkg.price) : "Custom"}
                    </p>
                    <p className="mt-1 text-sm text-gray-600">
                      {pkg.credits > 0 ? `${pkg.credits} credits` : "Custom amount"}
                    </p>
                    <p className="mt-2 text-xs text-gray-500">{pkg.description}</p>
                  </button>
                ))}
              </div>

              {selectedPackage === "custom" && (
                <div className="mt-4">
                  <Label htmlFor="customCredits">Number of Credits</Label>
                  <Input
                    id="customCredits"
                    type="number"
                    min="1"
                    value={customCredits}
                    onChange={(e) => setCustomCredits(parseInt(e.target.value) || 0)}
                    placeholder="Enter number of credits"
                  />
                  <p className="mt-1 text-sm text-gray-600">
                    Total: {formatPrice(customCredits * 50)}
                  </p>
                </div>
              )}

              <div className="mt-6 flex gap-2">
                <Button
                  onClick={handlePurchaseCredits}
                  disabled={isPurchasing || (selectedPackage === "custom" && customCredits <= 0)}
                >
                  {isPurchasing ? "Processing..." : "Continue to Checkout"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowPurchaseForm(false)}
                  disabled={isPurchasing}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Allocate Credits Form */}
        {(isOwner || isAdmin) && showAllocateForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Allocate Credits</CardTitle>
              <CardDescription>Assign credits to a team member</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAllocateCredits} className="space-y-4">
                <div>
                  <Label htmlFor="member">Team Member</Label>
                  <select
                    id="member"
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    required
                  >
                    <option value="">Select a member</option>
                    {team?.members?.map((member: any) => (
                      <option key={member.user.id} value={member.user.id}>
                        {member.user.name || member.user.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="credits">Credits to Allocate</Label>
                  <Input
                    id="credits"
                    type="number"
                    min="1"
                    max={overview?.available || 0}
                    value={creditsToAllocate}
                    onChange={(e) => setCreditsToAllocate(parseInt(e.target.value) || 0)}
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Available: {overview?.available || 0} credits
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={isAllocating}>
                    {isAllocating ? "Allocating..." : "Allocate Credits"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAllocateForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Member Credit Breakdown */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Member Credits</CardTitle>
                <CardDescription>Credit allocation across team members</CardDescription>
              </div>
              {(isOwner || isAdmin) && (
                <Button size="sm" onClick={() => setShowAllocateForm(!showAllocateForm)}>
                  Allocate Credits
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {overview?.memberBreakdown && overview.memberBreakdown.length > 0 ? (
              <div className="space-y-3">
                {overview.memberBreakdown.map((member) => (
                  <div key={member.userId} className="rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{member.userName}</p>
                        <p className="text-sm text-gray-600">
                          {member.used} / {member.allocated} credits used
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">{member.available}</p>
                        <p className="text-xs text-gray-500">Available</p>
                      </div>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-200">
                      <div
                        className="h-full bg-blue-600"
                        style={{
                          width: `${member.allocated > 0 ? (member.used / member.allocated) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                No credits allocated yet. Purchase credits and distribute them to team members.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
