"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { authClient } from "@/lib/auth-client";
import { CheckCircle2, XCircle, Loader2, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { toast } from "sonner";

type VerificationStatus = "verifying" | "success" | "error" | "expired";

function VerifyEmailContent() {
  const [status, setStatus] = useState<VerificationStatus>("verifying");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [resendLoading, setResendLoading] = useState(false);
  const [email, setEmail] = useState<string>("");
  const [isRedirected, setIsRedirected] = useState(false);
  
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const emailParam = searchParams.get("email");
  const redirectParam = searchParams.get("redirect");

  useEffect(() => {
    if (emailParam) {
      setEmail(emailParam);
    }
    if (redirectParam === "true") {
      setIsRedirected(true);
      setStatus("error");
      setErrorMessage("Please verify your email address to access the dashboard.");
    }
  }, [emailParam, redirectParam]);

  useEffect(() => {
    // Skip verification if user was redirected from dashboard
    if (isRedirected) {
      return;
    }
    
    const verifyEmail = async () => {
      if (!token) {
        setStatus("error");
        setErrorMessage("No verification token provided");
        return;
      }

      try {
        // Use custom verification endpoint that properly handles our tokens
        const response = await fetch(`/api/auth/verify-email-custom?token=${token}`, {
          method: "GET",
        });

        if (response.ok) {
          setStatus("success");
          
          // Check if user has an active session
          const sessionResponse = await fetch("/api/auth/get-session");
          const sessionData = await sessionResponse.json();
          
          if (sessionData?.user) {
            // User is logged in, redirect to dashboard
            toast.success("Email verified successfully!", {
              description: "Redirecting to dashboard...",
              duration: 3000,
            });
            
            setTimeout(() => {
              router.push("/dashboard");
            }, 2000);
          } else {
            // User is not logged in, redirect to sign-in
            toast.success("Email verified successfully!", {
              description: "Please sign in to access your account.",
              duration: 5000,
            });
            
            setTimeout(() => {
              router.push("/sign-in");
            }, 2000);
          }
        } else {
          const data = await response.json();
          
          // Check if token is expired
          if (data.error?.message?.includes("expired") || 
              data.error?.message?.includes("invalid") ||
              data.message?.includes("expired") ||
              data.message?.includes("invalid")) {
            setStatus("expired");
            setErrorMessage("This verification link has expired or is invalid.");
          } else {
            setStatus("error");
            setErrorMessage(data.error?.message || data.message || "Failed to verify email");
          }
        }
      } catch (error) {
        console.error("Verification error:", error);
        setStatus("error");
        setErrorMessage("An unexpected error occurred. Please try again.");
      }
    };

    verifyEmail();
  }, [token, router, isRedirected]);

  const handleResendVerification = async () => {
    if (!email) {
      toast.error("Email address not found", {
        description: "Please sign up again to receive a new verification email.",
      });
      return;
    }

    setResendLoading(true);
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/auth/send-verification-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok && !data.error) {
        toast.success("Verification email sent!", {
          description: "Please check your inbox for the new verification link.",
          duration: 5000,
        });
        setStatus("verifying");
      } else {
        if (data.error?.message?.includes("rate limit") || 
            data.error?.message?.includes("too many")) {
          toast.error("Too many requests", {
            description: "Please wait an hour before requesting another verification email.",
            duration: 7000,
          });
        } else {
          toast.error(data.error?.message || "Failed to send verification email", {
            duration: 5000,
          });
        }
      }
    } catch (error) {
      console.error("Resend verification error:", error);
      toast.error("Failed to send verification email", {
        description: "Please try again later.",
        duration: 5000,
      });
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="flex flex-col justify-center items-center w-full h-screen p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-lg md:text-xl flex items-center gap-2">
            {status === "verifying" && (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Verifying Email
              </>
            )}
            {status === "success" && (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Email Verified!
              </>
            )}
            {(status === "error" || status === "expired") && (
              <>
                <XCircle className="h-5 w-5 text-destructive" />
                Verification Failed
              </>
            )}
          </CardTitle>
          <CardDescription className="text-xs md:text-sm">
            {status === "verifying" && "Please wait while we verify your email address..."}
            {status === "success" && "Your email has been successfully verified"}
            {(status === "error" || status === "expired") && "We couldn't verify your email address"}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="grid gap-4">
            {status === "verifying" && (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-sm text-muted-foreground text-center">
                  Verifying your email address...
                </p>
              </div>
            )}

            {status === "success" && (
              <div className="flex flex-col items-center justify-center py-8">
                <CheckCircle2 className="h-16 w-16 text-green-600 mb-4" />
                <p className="text-sm text-center mb-4">
                  Your email has been verified successfully! You can now sign in to your account.
                </p>
                <p className="text-xs text-muted-foreground text-center">
                  Redirecting to sign in page...
                </p>
              </div>
            )}

            {(status === "error" || status === "expired") && (
              <div className="flex flex-col items-center justify-center py-8">
                <XCircle className="h-16 w-16 text-destructive mb-4" />
                <p className="text-sm text-center mb-2 font-medium">
                  {errorMessage}
                </p>
                <p className="text-xs text-muted-foreground text-center mb-6">
                  {status === "expired" 
                    ? "Verification links expire after 24 hours for security reasons."
                    : "This could be due to an invalid or already used verification link."}
                </p>
                
                {email && (
                  <Button
                    onClick={handleResendVerification}
                    disabled={resendLoading}
                    className="w-full gap-2"
                  >
                    {resendLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4" />
                        Resend Verification Email
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}

            {/* Navigation Links */}
            <div className="flex flex-col gap-2 pt-4 border-t">
              {status === "success" && (
                <Button asChild className="w-full">
                  <Link href="/sign-in">
                    Go to Sign In
                  </Link>
                </Button>
              )}
              
              {(status === "error" || status === "expired") && !email && (
                <Button asChild variant="outline" className="w-full">
                  <Link href="/sign-up">
                    Create New Account
                  </Link>
                </Button>
              )}
              
              <Button asChild variant="ghost" className="w-full">
                <Link href="/">
                  Back to Home
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      <p className="mt-6 text-xs text-center text-gray-500 dark:text-gray-400 max-w-md">
        By using this service, you agree to our{" "}
        <Link
          href="/terms-of-service"
          className="underline hover:text-gray-700 dark:hover:text-gray-300"
        >
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link
          href="/privacy-policy"
          className="underline hover:text-gray-700 dark:hover:text-gray-300"
        >
          Privacy Policy
        </Link>
      </p>
    </div>
  );
}

export default function VerifyEmail() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col justify-center items-center w-full h-screen">
          <div className="max-w-md w-full bg-gray-200 dark:bg-gray-800 animate-pulse rounded-lg h-96"></div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
