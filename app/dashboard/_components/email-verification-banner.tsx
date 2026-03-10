"use client";

import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Mail, X } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";

export default function EmailVerificationBanner() {
  const [user, setUser] = useState<{ emailVerified: boolean; email: string } | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    // Get user session
    const fetchUser = async () => {
      const session = await authClient.getSession();
      if (session?.data?.user) {
        setUser({
          emailVerified: session.data.user.emailVerified,
          email: session.data.user.email,
        });
      }
    };

    fetchUser();
  }, []);

  const handleResendEmail = async () => {
    if (!user) return; // Guard clause

    setSending(true);
    try {
      const response = await fetch("/api/auth/send-verification-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: user.email }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Verification email sent! Please check your inbox.");
      } else {
        toast.error(data.error || "Failed to send verification email");
      }
    } catch (error) {
      console.error("Error sending verification email:", error);
      toast.error("Failed to send verification email");
    } finally {
      setSending(false);
    }
  };

  // Don't show banner if user is verified, dismissed, or not loaded yet
  if (!user || user.emailVerified || dismissed) {
    return null;
  }

  return (
    <Alert className="mb-4 border-amber-500 bg-amber-50 dark:bg-amber-950/20">
      <Mail className="h-4 w-4 text-amber-600 dark:text-amber-500" />
      <AlertTitle className="text-amber-800 dark:text-amber-300">
        Email Verification Required
      </AlertTitle>
      <AlertDescription className="text-amber-700 dark:text-amber-400">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            Please verify your email address ({user.email}) to access all features.
            Check your inbox for the verification link.
          </div>
          <div className="flex items-center gap-2 ml-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleResendEmail}
              disabled={sending}
              className="border-amber-600 text-amber-700 hover:bg-amber-100 dark:border-amber-500 dark:text-amber-400 dark:hover:bg-amber-950/40"
            >
              {sending ? "Sending..." : "Resend Email"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDismissed(true)}
              className="text-amber-700 hover:bg-amber-100 dark:text-amber-400 dark:hover:bg-amber-950/40"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}
