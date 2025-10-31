"use client";

import {
  ArrowLeft,
  Image as ImageIcon,
  Upload,
  Download,
  Zap,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const dynamic = "force-dynamic";

interface Headshot {
  id: string;
  status: "pending" | "processing" | "completed" | "failed";
  inputImages: string[] | null;
  outputImages: string[] | null;
  style: string | null;
  creditsCost: string;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

interface CreditBalance {
  allocated: number;
  used: number;
  available: number;
}

export default function TeamHeadshotsPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const slug = params?.["slug"] as string;

  const [team, setTeam] = useState<any>(null);
  const [headshots, setHeadshots] = useState<Headshot[]>([]);
  const [balance, setBalance] = useState<CreditBalance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Generation form state
  const [showGenerationForm, setShowGenerationForm] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState("professional");
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const styles = [
    { id: "professional", name: "Professional", description: "Formal business headshot" },
    { id: "casual", name: "Casual", description: "Relaxed and approachable" },
    { id: "creative", name: "Creative", description: "Artistic and unique" },
    { id: "linkedin", name: "LinkedIn", description: "Optimized for professional networks" },
  ];

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/auth/signin?callbackUrl=/teams/${slug}/headshots`);
      return;
    }

    if (status === "authenticated" && session?.user?.id) {
      fetchData();
    }
  }, [status, router, slug, session]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [teamResponse, headshotsResponse] = await Promise.all([
        fetch(`/api/teams/${slug}`),
        fetch(`/api/teams/${slug}/headshots`),
      ]);

      if (!teamResponse.ok) {
        throw new Error("Failed to fetch team");
      }

      if (!headshotsResponse.ok) {
        throw new Error("Failed to fetch headshots");
      }

      const teamData = await teamResponse.json();
      const headshotsData = await headshotsResponse.json();

      setTeam(teamData.team);
      setHeadshots(headshotsData.headshots || []);

      // Fetch credit balance
      const overviewResponse = await fetch(`/api/teams/${slug}/credits/overview`);
      if (overviewResponse.ok) {
        const overviewData = await overviewResponse.json();
        const myBalance = overviewData.memberBreakdown?.find(
          (m: any) => m.userId === session?.user?.id
        );
        if (myBalance) {
          setBalance({
            allocated: myBalance.allocated,
            used: myBalance.used,
            available: myBalance.available,
          });
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setError(error instanceof Error ? error.message : "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) {
      return;
    }

    // In a real app, you would upload these to a storage service (S3, Cloudinary, etc.)
    // For now, we'll just create object URLs as placeholders
    const urls: string[] = [];
    for (let i = 0; i < Math.min(files.length, 14); i++) {
      const file = files[i];
      if (file) {
        urls.push(URL.createObjectURL(file));
      }
    }

    setUploadedImages([...uploadedImages, ...urls].slice(0, 14));
  };

  const handleGenerateHeadshots = async () => {
    if (uploadedImages.length < 6) {
      setError("Please upload at least 6 photos");
      return;
    }

    if (!balance || balance.available < 1) {
      setError("Insufficient credits. Please contact your team admin.");
      return;
    }

    setIsGenerating(true);
    setError("");

    try {
      const response = await fetch(`/api/teams/${slug}/headshots/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputImages: uploadedImages,
          style: selectedStyle,
          creditsCost: 1,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate headshots");
      }

      setSuccess("Headshot generation started! This may take a few minutes.");
      setShowGenerationForm(false);
      setUploadedImages([]);
      fetchData(); // Refresh data
    } catch (error) {
      console.error("Error generating headshots:", error);
      setError(error instanceof Error ? error.message : "Failed to generate headshots");
    } finally {
      setIsGenerating(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "failed":
        return <XCircle className="h-5 w-5 text-red-600" />;
      case "processing":
        return <Clock className="h-5 w-5 animate-spin text-blue-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-2 text-gray-600">Loading headshots...</p>
        </div>
      </div>
    );
  }

  if (error && !team) {
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
            <h1 className="text-3xl font-bold text-gray-900">AI Headshots</h1>
            <p className="mt-1 text-gray-600">{team?.name}</p>
          </div>
          <div className="flex gap-2">
            <Link href={`/teams/${slug}/credits`}>
              <Button variant="outline" size="sm">
                <Zap className="mr-2 h-4 w-4" />
                {balance?.available || 0} Credits
              </Button>
            </Link>
            <Button size="sm" onClick={() => setShowGenerationForm(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Generate Headshots
            </Button>
          </div>
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

        {/* Credit Balance Card */}
        {balance && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Your Credit Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{balance.available}</p>
                  <p className="text-sm text-gray-600">
                    {balance.used} / {balance.allocated} used
                  </p>
                </div>
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                  <Zap className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full bg-blue-600"
                  style={{
                    width: `${balance.allocated > 0 ? (balance.used / balance.allocated) * 100 : 0}%`,
                  }}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Generation Form */}
        {showGenerationForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Generate AI Headshots</CardTitle>
              <CardDescription>
                Upload 6-14 selfies for best results. Each generation costs 1 credit.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Style Selection */}
                <div>
                  <Label>Select Style</Label>
                  <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {styles.map((style) => (
                      <button
                        key={style.id}
                        onClick={() => setSelectedStyle(style.id)}
                        className={`rounded-lg border-2 p-3 text-left transition-all ${
                          selectedStyle === style.id
                            ? "border-blue-600 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <h4 className="font-medium text-gray-900">{style.name}</h4>
                        <p className="text-xs text-gray-600">{style.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Image Upload */}
                <div>
                  <Label htmlFor="images">Upload Photos ({uploadedImages.length}/14)</Label>
                  <Input
                    id="images"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="mt-2"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Upload 6-14 clear selfies for best results
                  </p>
                </div>

                {/* Preview Uploaded Images */}
                {uploadedImages.length > 0 && (
                  <div className="grid grid-cols-4 gap-2">
                    {uploadedImages.map((url, idx) => (
                      <div key={idx} className="relative aspect-square">
                        <img
                          src={url}
                          alt={`Upload ${idx + 1}`}
                          className="h-full w-full rounded-lg object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    onClick={handleGenerateHeadshots}
                    disabled={
                      isGenerating || uploadedImages.length < 6 || !balance || balance.available < 1
                    }
                  >
                    {isGenerating ? "Generating..." : `Generate (1 Credit)`}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowGenerationForm(false);
                      setUploadedImages([]);
                    }}
                    disabled={isGenerating}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Headshots List */}
        <Card>
          <CardHeader>
            <CardTitle>Your Headshots</CardTitle>
            <CardDescription>View and download your generated headshots</CardDescription>
          </CardHeader>
          <CardContent>
            {headshots.length === 0 ? (
              <div className="py-12 text-center">
                <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">No headshots generated yet</p>
                <Button className="mt-4" onClick={() => setShowGenerationForm(true)}>
                  Generate Your First Headshot
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {headshots.map((headshot) => (
                  <div key={headshot.id} className="rounded-lg border p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {getStatusIcon(headshot.status)}
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-gray-900">
                              {headshot.style || "Custom"} Headshot
                            </h4>
                            <span
                              className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(
                                headshot.status
                              )}`}
                            >
                              {headshot.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            Created {new Date(headshot.createdAt).toLocaleDateString()}
                          </p>
                          {headshot.errorMessage && (
                            <p className="text-sm text-red-600">{headshot.errorMessage}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">{headshot.creditsCost} credit(s)</p>
                        {headshot.status === "completed" && headshot.outputImages && (
                          <Button size="sm" variant="outline" className="mt-2">
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Display generated images if completed */}
                    {headshot.status === "completed" && headshot.outputImages && (
                      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {headshot.outputImages.slice(0, 8).map((url, idx) => (
                          <div key={idx} className="aspect-square">
                            <img
                              src={url}
                              alt={`Generated ${idx + 1}`}
                              className="h-full w-full rounded-lg object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
