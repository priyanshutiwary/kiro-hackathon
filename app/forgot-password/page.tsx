"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/theme-toggle";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

export default function ForgotPassword() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
  }>({});

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setErrors(prev => ({ ...prev, email: "Email is required" }));
      return false;
    }
    if (!emailRegex.test(email)) {
      setErrors(prev => ({ ...prev, email: "Please enter a valid email address" }));
      return false;
    }
    setErrors(prev => ({ ...prev, email: undefined }));
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate email
    const isEmailValid = validateEmail(email);
    
    if (!isEmailValid) {
      return;
    }

    setLoading(true);
    
    try {
      // Call BetterAuth password reset request
      await authClient.requestPasswordReset({
        email,
        redirectTo: "/reset-password",
      });

      // Always show success message for security (don't reveal if email exists)
      setSubmitted(true);
      toast.success("Password reset email sent!", {
        description: "If an account exists with this email, you will receive a password reset link shortly.",
        duration: 7000,
      });
    } catch (error) {
      console.error("Password reset request failed:", error);
      
      // Check for rate limiting errors
      if (error instanceof Error && 
          (error.message.includes("rate limit") || 
           error.message.includes("too many"))) {
        toast.error("Too many requests", {
          description: "Please wait an hour before requesting another password reset email.",
          duration: 7000,
        });
      } else {
        // Still show success message for security
        setSubmitted(true);
        toast.success("Password reset email sent!", {
          description: "If an account exists with this email, you will receive a password reset link shortly.",
          duration: 7000,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col justify-center items-center w-full h-screen p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">
            Reset your password
          </CardTitle>
          <CardDescription className="text-xs md:text-sm">
            {submitted 
              ? "Check your email for a password reset link"
              : "Enter your email address and we'll send you a link to reset your password"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {submitted ? (
            <div className="grid gap-4">
              <div className="rounded-lg bg-green-50 dark:bg-green-950 p-4 text-sm text-green-800 dark:text-green-200">
                <p className="font-medium mb-1">Email sent!</p>
                <p>
                  If an account exists with <strong>{email}</strong>, you will receive a password reset link shortly.
                </p>
                <p className="mt-2">
                  The link will expire in 1 hour.
                </p>
              </div>
              
              <div className="text-center text-sm space-y-2">
                <p className="text-muted-foreground">
                  Didn't receive the email? Check your spam folder.
                </p>
                <Button
                  variant="link"
                  className="p-0 h-auto"
                  onClick={() => {
                    setSubmitted(false);
                    setEmail("");
                  }}
                >
                  Try a different email address
                </Button>
              </div>

              <div className="text-center text-sm pt-4">
                <Link
                  href="/sign-in"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  Back to sign in
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) validateEmail(e.target.value);
                  }}
                  onBlur={() => validateEmail(email)}
                  disabled={loading}
                  aria-invalid={!!errors.email}
                  required
                />
                {errors.email && (
                  <p className="text-destructive text-sm">{errors.email}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? "Sending..." : "Send reset link"}
              </Button>

              <div className="text-center text-sm">
                Remember your password?{" "}
                <Link
                  href="/sign-in"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  Sign in
                </Link>
              </div>
            </form>
          )}
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
