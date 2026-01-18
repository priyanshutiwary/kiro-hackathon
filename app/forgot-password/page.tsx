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
import { brandColors } from "@/lib/brand-colors";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";

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
    <div className={`flex flex-col justify-center items-center w-full min-h-screen p-4 relative overflow-hidden ${brandColors.backgrounds.hero}`}>
      {/* Background Elements */}
      <div className={`absolute inset-0 ${brandColors.backgrounds.hero}`} />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(148,163,184,0.1),transparent_50%),radial-gradient(circle_at_70%_60%,rgba(148,163,184,0.1),transparent_50%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <Card className={`w-full ${brandColors.backgrounds.glass} backdrop-blur-xl shadow-2xl ring-1 ring-slate-200 dark:ring-white/10 rounded-[24px] border-0`}>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">
              <Link href="/" className="inline-flex items-center gap-1 mb-2">
                <span className={`text-xl ${brandColors.text.gradient} flex items-center gap-0.5`}>
                  <span className="font-medium">Invo</span>
                  <span className="font-extrabold">Call</span>
                </span>
              </Link>
            </CardTitle>
            <CardDescription className="text-center text-sm">
              {submitted
                ? "Check your email for a password reset link"
                : "Enter your email address to reset your password"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {submitted ? (
              <div className="grid gap-4">
                <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900 p-4 text-sm text-emerald-800 dark:text-emerald-200">
                  <p className="font-medium mb-1">Email sent!</p>
                  <p>
                    If an account exists with <strong>{email}</strong>, you will receive a password reset link shortly.
                  </p>
                  <p className="mt-2 text-xs opacity-80">
                    The link will expire in 1 hour.
                  </p>
                </div>

                <div className="text-center text-sm space-y-2">
                  <p className="text-muted-foreground">
                    Didn&apos;t receive the email? Check your spam folder.
                  </p>
                  <Button
                    variant="link"
                    className={`p-0 h-auto ${brandColors.text.primary} hover:underline`}
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
                    className={`font-medium ${brandColors.text.secondary} hover:${brandColors.primary.text} underline-offset-4 hover:underline transition-colors`}
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
                    className="h-10 rounded-xl bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800"
                    required
                  />
                  {errors.email && (
                    <p className="text-destructive text-sm">{errors.email}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className={`w-full h-10 ${brandColors.primary.gradient} hover:opacity-90 transition-opacity rounded-xl shadow-lg shadow-slate-500/20`}
                  disabled={loading}
                >
                  {loading ? "Sending..." : "Send reset link"}
                </Button>

                <div className="text-center text-sm">
                  Remember your password?{" "}
                  <Link
                    href="/sign-in"
                    className={`font-medium ${brandColors.text.secondary} hover:${brandColors.primary.text} underline-offset-4 hover:underline transition-colors`}
                  >
                    Sign in
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
        <p className="mt-6 text-xs text-center text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          By using this service, you agree to our{" "}
          <Link
            href="/terms-of-service"
            className="underline hover:text-slate-700 dark:hover:text-slate-300"
          >
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link
            href="/privacy-policy"
            className="underline hover:text-slate-700 dark:hover:text-slate-300"
          >
            Privacy Policy
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

