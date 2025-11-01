"use client";

import { Check, Copy, Info, Link2, Loader2, Mail, RefreshCw, Send, Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import * as React from "react";
import * as XLSX from "xlsx";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

interface InviteMembersProps {
  teamSlug: string;
}

// Email validation helper
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

interface ProgressLog {
  timestamp: Date;
  message: string;
  type: "info" | "success" | "error" | "warning";
}

interface InvitationProgress {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  alreadyMembers: number;
  alreadyInvited: number;
  emailFailed: number;
  logs: ProgressLog[];
  isComplete: boolean;
}

export function InviteMembers({ teamSlug }: InviteMembersProps) {
  const [emailInput, setEmailInput] = React.useState("");
  const [validEmails, setValidEmails] = React.useState<string[]>([]);
  const [invalidEmails, setInvalidEmails] = React.useState<string[]>([]);
  const [duplicateEmails, setDuplicateEmails] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [inviteLink, setInviteLink] = React.useState("");
  const [generatingLink, setGeneratingLink] = React.useState(false);
  const [copiedLink, setCopiedLink] = React.useState(false);

  // Progress tracking states
  const [progress, setProgress] = React.useState<InvitationProgress | null>(null);
  const [showProgress, setShowProgress] = React.useState(false);

  const router = useRouter();
  const { toast } = useToast();

  // Restore progress from localStorage on mount
  React.useEffect(() => {
    const savedProgress = localStorage.getItem(`invite-progress-${teamSlug}`);
    if (savedProgress) {
      try {
        const parsed = JSON.parse(savedProgress) as InvitationProgress;
        // Convert string dates back to Date objects
        parsed.logs = parsed.logs.map((log) => ({
          ...log,
          timestamp: new Date(log.timestamp),
        }));
        setProgress(parsed);
        setShowProgress(true);
      } catch (error) {
        console.error("Failed to restore progress:", error);
        localStorage.removeItem(`invite-progress-${teamSlug}`);
      }
    }
  }, [teamSlug]);

  // Save progress to localStorage
  const saveProgress = React.useCallback(
    (progressData: InvitationProgress) => {
      localStorage.setItem(`invite-progress-${teamSlug}`, JSON.stringify(progressData));
    },
    [teamSlug]
  );

  // Clear progress
  const clearProgress = React.useCallback(() => {
    setProgress(null);
    setShowProgress(false);
    localStorage.removeItem(`invite-progress-${teamSlug}`);
  }, [teamSlug]);

  // Add log entry
  const addLog = React.useCallback(
    (message: string, type: "info" | "success" | "error" | "warning" = "info") => {
      setProgress((prev) => {
        if (!prev) {
          return prev;
        }
        const newProgress = {
          ...prev,
          logs: [
            ...prev.logs,
            {
              timestamp: new Date(),
              message,
              type,
            },
          ],
        };
        saveProgress(newProgress);
        return newProgress;
      });
    },
    [saveProgress]
  );

  // Handle email input with comma separation
  const handleEmailInputChange = (value: string) => {
    setEmailInput(value);

    // Check if user pressed comma or space
    if (value.endsWith(",") || value.endsWith(" ")) {
      const email = value.slice(0, -1).trim();
      if (email) {
        addEmail(email);
      }
      setEmailInput("");
    }
  };

  const handleEmailInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const email = emailInput.trim();
      if (email) {
        addEmail(email);
        setEmailInput("");
      }
    }
  };

  const addEmail = (email: string) => {
    const trimmedEmail = email.toLowerCase().trim();

    if (!validateEmail(trimmedEmail)) {
      if (!invalidEmails.includes(trimmedEmail)) {
        setInvalidEmails([...invalidEmails, trimmedEmail]);
      }
      return;
    }

    // Check if already in valid list
    if (validEmails.includes(trimmedEmail)) {
      if (!duplicateEmails.includes(trimmedEmail)) {
        setDuplicateEmails([...duplicateEmails, trimmedEmail]);
      }
      return;
    }

    // Valid email - add to valid list and remove from errors if present
    setValidEmails([...validEmails, trimmedEmail]);
    setInvalidEmails(invalidEmails.filter((e) => e !== trimmedEmail));
    setDuplicateEmails(duplicateEmails.filter((e) => e !== trimmedEmail));
  };

  const removeValidEmail = (emailToRemove: string) => {
    setValidEmails(validEmails.filter((e) => e !== emailToRemove));
  };

  const removeInvalidEmail = (emailToRemove: string) => {
    setInvalidEmails(invalidEmails.filter((e) => e !== emailToRemove));
  };

  const removeDuplicateEmail = (emailToRemove: string) => {
    setDuplicateEmails(duplicateEmails.filter((e) => e !== emailToRemove));
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();

    // Add current input if any
    if (emailInput.trim()) {
      addEmail(emailInput.trim());
      setEmailInput("");
      return; // Let user see the tag first
    }

    if (validEmails.length === 0) {
      toast({
        title: "Error",
        description: "Please enter at least one valid email address",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setShowProgress(true);

    // Initialize progress
    const initialProgress: InvitationProgress = {
      total: validEmails.length,
      processed: 0,
      successful: 0,
      failed: 0,
      alreadyMembers: 0,
      alreadyInvited: 0,
      emailFailed: 0,
      logs: [
        {
          timestamp: new Date(),
          message: `Starting bulk invitation process for ${validEmails.length} email${validEmails.length > 1 ? "s" : ""}...`,
          type: "info",
        },
      ],
      isComplete: false,
    };

    setProgress(initialProgress);
    saveProgress(initialProgress);

    try {
      // Use batch API for better performance
      addLog(
        `Sending ${validEmails.length} invitation${validEmails.length > 1 ? "s" : ""} using batch API...`,
        "info"
      );

      const response = await fetch(`/api/teams/${teamSlug}/invitations/batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails: validEmails, role: "member" }),
      });

      if (!response.ok) {
        throw new Error("Batch invitation failed");
      }

      const data = (await response.json()) as {
        summary: {
          total: number;
          successful: number;
          failed: number;
          alreadyMembers: number;
          alreadyInvited: number;
          emailFailed: number;
        };
        results: Array<{
          email: string;
          success: boolean;
          error?: string;
          status?: string;
        }>;
      };

      // Update progress with results
      const finalProgress: InvitationProgress = {
        total: data.summary.total,
        processed: data.summary.total,
        successful: data.summary.successful,
        failed: data.summary.failed,
        alreadyMembers: data.summary.alreadyMembers,
        alreadyInvited: data.summary.alreadyInvited,
        emailFailed: data.summary.emailFailed,
        logs: [
          ...initialProgress.logs,
          {
            timestamp: new Date(),
            message: `Processed ${data.summary.total} email${data.summary.total > 1 ? "s" : ""}`,
            type: "info",
          },
        ],
        isComplete: true,
      };

      // Add detailed logs for each category
      if (data.summary.successful > 0) {
        finalProgress.logs.push({
          timestamp: new Date(),
          message: `✓ Successfully sent ${data.summary.successful} invitation${data.summary.successful > 1 ? "s" : ""}`,
          type: "success",
        });
      }

      if (data.summary.alreadyMembers > 0) {
        finalProgress.logs.push({
          timestamp: new Date(),
          message: `⚠ ${data.summary.alreadyMembers} email${data.summary.alreadyMembers > 1 ? "s" : ""} already team member${data.summary.alreadyMembers > 1 ? "s" : ""}`,
          type: "warning",
        });
      }

      if (data.summary.alreadyInvited > 0) {
        finalProgress.logs.push({
          timestamp: new Date(),
          message: `⚠ ${data.summary.alreadyInvited} invitation${data.summary.alreadyInvited > 1 ? "s" : ""} already sent previously`,
          type: "warning",
        });
      }

      if (data.summary.emailFailed > 0) {
        finalProgress.logs.push({
          timestamp: new Date(),
          message: `✗ ${data.summary.emailFailed} email${data.summary.emailFailed > 1 ? "s" : ""} failed to send`,
          type: "error",
        });
      }

      // Add individual email logs
      data.results.forEach((result) => {
        if (result.status === "sent") {
          finalProgress.logs.push({
            timestamp: new Date(),
            message: `✓ ${result.email} - Invitation sent successfully`,
            type: "success",
          });
        } else if (result.status === "already_member") {
          finalProgress.logs.push({
            timestamp: new Date(),
            message: `⚠ ${result.email} - Already a team member`,
            type: "warning",
          });
        } else if (result.status === "already_invited") {
          finalProgress.logs.push({
            timestamp: new Date(),
            message: `⚠ ${result.email} - Already invited`,
            type: "warning",
          });
        } else if (result.status === "email_failed") {
          finalProgress.logs.push({
            timestamp: new Date(),
            message: `✗ ${result.email} - Email failed: ${result.error}`,
            type: "error",
          });
        } else if (!result.success) {
          finalProgress.logs.push({
            timestamp: new Date(),
            message: `✗ ${result.email} - ${result.error}`,
            type: "error",
          });
        }
      });

      finalProgress.logs.push({
        timestamp: new Date(),
        message: "Invitation process completed",
        type: "info",
      });

      setProgress(finalProgress);
      saveProgress(finalProgress);

      // Clear successfully sent emails from the input
      const failedEmails = data.results.filter((r) => !r.success).map((r) => r.email);
      setValidEmails(failedEmails);

      // Update duplicate emails list
      const duplicates = data.results
        .filter((r) => r.status === "already_member" || r.status === "already_invited")
        .map((r) => r.email);
      setDuplicateEmails([...duplicateEmails, ...duplicates]);

      // Show summary toast
      if (data.summary.successful > 0 && data.summary.failed === 0) {
        toast({
          title: "Success",
          description: `Successfully sent ${data.summary.successful} invitation${data.summary.successful > 1 ? "s" : ""}`,
        });
        router.refresh();
      } else if (data.summary.successful > 0 && data.summary.failed > 0) {
        toast({
          title: "Partial Success",
          description: `Sent ${data.summary.successful} invitation${data.summary.successful > 1 ? "s" : ""}, ${data.summary.failed} had issues`,
          variant: "default",
        });
        router.refresh();
      } else {
        toast({
          title: "Error",
          description: `Failed to send invitations. Check progress log for details.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      addLog(`Error: ${error instanceof Error ? error.message : "Unknown error"}`, "error");
      toast({
        title: "Error",
        description: "Failed to send batch invitations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Generate invite link
  const generateInviteLink = async () => {
    setGeneratingLink(true);
    try {
      // Using the same token generation logic as email invitations
      const response = await fetch(`/api/teams/${teamSlug}/invitations/generate-link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        const data = await response.json();
        setInviteLink(data.invitationUrl);
        toast({
          title: "Success",
          description: "Invite link generated successfully",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to generate invite link",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to generate invite link",
        variant: "destructive",
      });
    } finally {
      setGeneratingLink(false);
    }
  };

  // Copy invite link
  const copyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopiedLink(true);
      toast({
        title: "Copied!",
        description: "Invite link copied to clipboard",
      });
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      });
    }
  };

  // Handle file upload and parse CSV/Excel
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    const fileName = file.name.toLowerCase();
    const fileExtension = fileName.split(".").pop();

    try {
      if (fileExtension === "csv") {
        // Parse CSV file
        const text = await file.text();
        const extractedEmails: string[] = [];

        Papa.parse(text, {
          header: false,
          skipEmptyLines: true,
          complete: (results) => {
            results.data.forEach((row: unknown) => {
              if (Array.isArray(row)) {
                row.forEach((cell) => {
                  if (typeof cell === "string" && cell.trim()) {
                    // Check if the cell contains a single email or multiple emails
                    if (validateEmail(cell.trim())) {
                      extractedEmails.push(cell.trim());
                    } else {
                      // Try splitting by common delimiters
                      const cellEmails = cell
                        .split(/[,\s;]+/)
                        .map((e) => e.trim())
                        .filter((e) => e && validateEmail(e));
                      extractedEmails.push(...cellEmails);
                    }
                  }
                });
              }
            });
            processExtractedEmails(extractedEmails);
          },
          error: (error: Error) => {
            toast({
              title: "Error",
              description: `Failed to parse CSV file: ${error.message}`,
              variant: "destructive",
            });
          },
        });
      } else if (fileExtension === "xlsx" || fileExtension === "xls") {
        // Parse Excel file
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const extractedEmails: string[] = [];

        // Iterate through all sheets
        workbook.SheetNames.forEach((sheetName) => {
          const worksheet = workbook.Sheets[sheetName];
          if (!worksheet) {
            return;
          }

          // Try with header first, then without
          let data = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

          // If no data found, try without header (using array format)
          if (data.length === 0) {
            const arrayData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
            data = arrayData;
          }

          data.forEach((row: unknown) => {
            if (typeof row === "object" && row !== null) {
              Object.values(row).forEach((cell) => {
                if (typeof cell === "string" && cell.trim()) {
                  // Check if the cell contains a single email
                  if (validateEmail(cell.trim())) {
                    extractedEmails.push(cell.trim());
                  } else {
                    // Try splitting by common delimiters
                    const cellEmails = cell
                      .split(/[,\s;]+/)
                      .map((e) => e.trim())
                      .filter((e) => e && validateEmail(e));
                    extractedEmails.push(...cellEmails);
                  }
                } else if (typeof cell === "number") {
                  // Sometimes emails are stored as numbers
                  const cellStr = String(cell);
                  if (validateEmail(cellStr)) {
                    extractedEmails.push(cellStr);
                  }
                }
              });
            }
          });
        });

        processExtractedEmails(extractedEmails);
      } else {
        toast({
          title: "Invalid file type",
          description: "Please upload a CSV or Excel file (.csv, .xlsx, .xls)",
          variant: "destructive",
        });
        return;
      }
    } catch (error) {
      console.error("Error parsing file:", error);
      toast({
        title: "Error",
        description: "Failed to parse file. Please ensure the file format is correct.",
        variant: "destructive",
      });
    }

    // Reset file input
    e.target.value = "";
  };

  // Process extracted emails and add to valid/invalid lists
  const processExtractedEmails = (extractedEmails: string[]) => {
    const uniqueEmails = Array.from(new Set(extractedEmails.map((e) => e.toLowerCase().trim())));
    const newValidEmails: string[] = [];
    const newInvalidEmails: string[] = [];

    uniqueEmails.forEach((email) => {
      if (validateEmail(email)) {
        if (!validEmails.includes(email)) {
          newValidEmails.push(email);
        }
      } else {
        if (!invalidEmails.includes(email)) {
          newInvalidEmails.push(email);
        }
      }
    });

    if (newValidEmails.length > 0) {
      setValidEmails([...validEmails, ...newValidEmails]);
      toast({
        title: "Success",
        description: `Added ${newValidEmails.length} valid email${newValidEmails.length > 1 ? "s" : ""} from file`,
      });
    }

    if (newInvalidEmails.length > 0) {
      setInvalidEmails([...invalidEmails, ...newInvalidEmails]);
      toast({
        title: "Warning",
        description: `Found ${newInvalidEmails.length} invalid email${newInvalidEmails.length > 1 ? "s" : ""} in file`,
        variant: "destructive",
      });
    }

    if (newValidEmails.length === 0 && newInvalidEmails.length === 0) {
      toast({
        title: "No emails found",
        description: "No valid email addresses were found in the file",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-primary" />
          <CardTitle>Invite Members</CardTitle>
        </div>
        <CardDescription>Add new members to your team via email or shareable link</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Invite by Email Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="email" className="text-sm font-medium">
              Invite by email
            </Label>
            <Info className="h-3.5 w-3.5 cursor-help text-muted-foreground" />
          </div>

          <form onSubmit={handleInvite} className="space-y-3">
            {/* Email Input with Tags */}
            <div className="space-y-2">
              <div className="min-h-[42px] rounded-lg border border-input bg-background px-3 py-2 transition-all focus-within:ring-2 focus-within:ring-primary/20">
                <div className="flex flex-wrap gap-2">
                  {/* Valid Email Tags */}
                  {validEmails.map((email) => (
                    <span
                      key={email}
                      className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-xs text-primary"
                    >
                      {email}
                      <button
                        type="button"
                        onClick={() => removeValidEmail(email)}
                        className="hover:text-primary/70"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}

                  {/* Input Field */}
                  <input
                    id="email"
                    type="text"
                    placeholder={
                      validEmails.length === 0 &&
                      invalidEmails.length === 0 &&
                      duplicateEmails.length === 0
                        ? "example@gmail.com"
                        : ""
                    }
                    value={emailInput}
                    onChange={(e) => handleEmailInputChange(e.target.value)}
                    onKeyDown={handleEmailInputKeyDown}
                    disabled={loading}
                    className="min-w-[200px] flex-1 border-0 bg-transparent p-0 text-sm focus:outline-none focus:ring-0"
                  />
                </div>
              </div>

              {/* Error Messages Below Input */}
              {(invalidEmails.length > 0 || duplicateEmails.length > 0) && (
                <div className="space-y-2 rounded-md border border-destructive/20 bg-destructive/5 p-3">
                  {invalidEmails.length > 0 && (
                    <div>
                      <p className="mb-1 text-xs font-medium text-destructive">
                        Invalid email{invalidEmails.length > 1 ? "s" : ""}:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {invalidEmails.map((email) => (
                          <span
                            key={email}
                            className="inline-flex items-center gap-1 rounded-md bg-destructive/10 px-2 py-1 text-xs text-destructive"
                          >
                            {email}
                            <button
                              type="button"
                              onClick={() => removeInvalidEmail(email)}
                              className="hover:text-destructive/70"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {duplicateEmails.length > 0 && (
                    <div>
                      <p className="mb-1 text-xs font-medium text-destructive">
                        Duplicate/Already invited email{duplicateEmails.length > 1 ? "s" : ""}:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {duplicateEmails.map((email) => (
                          <span
                            key={email}
                            className="inline-flex items-center gap-1 rounded-md bg-destructive/10 px-2 py-1 text-xs text-destructive"
                          >
                            {email}
                            <button
                              type="button"
                              onClick={() => removeDuplicateEmail(email)}
                              className="hover:text-destructive/70"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Helper Text and File Upload */}
              <div className="flex flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-1.5">
                  <Check className="h-3 w-3 text-primary" />
                  <span>Separate multiple emails with commas or press Enter</span>
                </div>
                <label className="flex cursor-pointer items-center gap-1.5 text-primary transition-colors hover:text-primary/80">
                  <Upload className="h-3.5 w-3.5" />
                  <span className="font-medium">Upload CSV/Excel</span>
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Invite Button */}
            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={loading || (validEmails.length === 0 && !emailInput.trim())}
                className="flex-1 sm:flex-initial"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Invite {validEmails.length > 0 && `(${validEmails.length})`}
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">Or</span>
          </div>
        </div>

        {/* Invite by Link Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Link2 className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm font-medium">Invite by link</Label>
            <Info className="h-3.5 w-3.5 cursor-help text-muted-foreground" />
          </div>

          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                value={inviteLink}
                placeholder="Click 'Generate new link' to create an invite link"
                readOnly
                className="flex-1 font-mono text-sm"
              />
              <Button
                type="button"
                variant="outline"
                onClick={copyInviteLink}
                disabled={!inviteLink || copiedLink}
                className="shrink-0"
              >
                {copiedLink ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy
                  </>
                )}
              </Button>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={generateInviteLink}
              disabled={generatingLink}
              className="w-full sm:w-auto"
            >
              {generatingLink ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Generate new link
                </>
              )}
            </Button>

            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Check className="h-3 w-3 text-primary" />
              Anyone with this link can join as a member
            </p>
          </div>
        </div>

        {/* Progress Tracking Section */}
        {showProgress && progress && (
          <>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Progress</span>
              </div>
            </div>

            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Invitation Progress</CardTitle>
                  {progress.isComplete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearProgress}
                      className="h-8 text-xs"
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Progress Summary */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-lg bg-background p-3">
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="text-2xl font-bold">{progress.total}</p>
                  </div>
                  <div className="rounded-lg bg-green-500/10 p-3">
                    <p className="text-xs text-green-600 dark:text-green-400">Successful</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {progress.successful}
                    </p>
                  </div>
                  <div className="rounded-lg bg-yellow-500/10 p-3">
                    <p className="text-xs text-yellow-600 dark:text-yellow-400">Warnings</p>
                    <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                      {progress.alreadyMembers + progress.alreadyInvited}
                    </p>
                  </div>
                  <div className="rounded-lg bg-red-500/10 p-3">
                    <p className="text-xs text-red-600 dark:text-red-400">Failed</p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {progress.emailFailed}
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                {!progress.isComplete && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Processing...</span>
                      <span>
                        {progress.processed} / {progress.total}
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-background">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{
                          width: `${progress.total > 0 ? (progress.processed / progress.total) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Detailed Logs */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Detailed Log</Label>
                    <span className="text-xs text-muted-foreground">
                      {progress.logs.length} entries
                    </span>
                  </div>
                  <div className="max-h-64 space-y-1 overflow-y-auto rounded-lg border bg-background p-3">
                    {progress.logs.map((log, index) => (
                      <div
                        key={index}
                        className={`flex items-start gap-2 text-xs ${
                          log.type === "success"
                            ? "text-green-600 dark:text-green-400"
                            : log.type === "error"
                              ? "text-red-600 dark:text-red-400"
                              : log.type === "warning"
                                ? "text-yellow-600 dark:text-yellow-400"
                                : "text-muted-foreground"
                        }`}
                      >
                        <span className="shrink-0 font-mono">
                          {log.timestamp.toLocaleTimeString()}
                        </span>
                        <span>{log.message}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {progress.isComplete && (
                  <div className="rounded-lg border-2 border-primary/20 bg-primary/10 p-3">
                    <p className="text-center text-sm font-medium text-primary">
                      ✓ Invitation process completed
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </CardContent>
    </Card>
  );
}
