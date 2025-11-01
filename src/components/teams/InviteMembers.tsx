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

export function InviteMembers({ teamSlug }: InviteMembersProps) {
  const [emailInput, setEmailInput] = React.useState("");
  const [validEmails, setValidEmails] = React.useState<string[]>([]);
  const [invalidEmails, setInvalidEmails] = React.useState<string[]>([]);
  const [duplicateEmails, setDuplicateEmails] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [inviteLink, setInviteLink] = React.useState("");
  const [generatingLink, setGeneratingLink] = React.useState(false);
  const [copiedLink, setCopiedLink] = React.useState(false);
  const router = useRouter();
  const { toast } = useToast();

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

    try {
      // Send invitations one by one (can be optimized with batch API later)
      let successCount = 0;
      let errorCount = 0;
      const newDuplicateEmails: string[] = [];
      const errors: string[] = [];

      for (const email of validEmails) {
        try {
          const response = await fetch(`/api/teams/${teamSlug}/invitations`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, role: "member" }),
          });

          if (response.ok) {
            successCount++;
            // Remove from valid emails on success
            setValidEmails((prev) => prev.filter((e) => e !== email));
          } else {
            errorCount++;
            const data = await response.json();
            const errorMessage = data.error || "Failed";

            // Check if it's a duplicate/already invited error
            if (
              errorMessage.includes("already") ||
              errorMessage.includes("invitation has already been sent") ||
              errorMessage.includes("already a team member")
            ) {
              newDuplicateEmails.push(email);
              // Remove from valid and add to duplicate
              setValidEmails((prev) => prev.filter((e) => e !== email));
            } else {
              errors.push(`${email}: ${errorMessage}`);
            }
          }
        } catch {
          errorCount++;
          errors.push(`${email}: Network error`);
        }
      }

      // Update duplicate emails
      if (newDuplicateEmails.length > 0) {
        setDuplicateEmails([...duplicateEmails, ...newDuplicateEmails]);
      }

      // Show results
      if (successCount > 0 && errorCount === 0) {
        toast({
          title: "Success",
          description: `Successfully sent ${successCount} invitation${successCount > 1 ? "s" : ""}`,
        });
        router.refresh();
      } else if (successCount > 0 && errorCount > 0) {
        toast({
          title: "Partial Success",
          description: `Sent ${successCount} invitation${successCount > 1 ? "s" : ""}, ${errorCount} failed`,
          variant: "default",
        });
        router.refresh();
      } else {
        toast({
          title: "Error",
          description: `Failed to send ${errorCount} invitation${errorCount > 1 ? "s" : ""}. ${errors.slice(0, 3).join("; ")}`,
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to send invitations",
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
      </CardContent>
    </Card>
  );
}
