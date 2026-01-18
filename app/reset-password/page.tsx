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
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";

function ResetPasswordContent() {
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<{
    password?: string;
    confirmPassword?: string;
  }>({});

  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter();

  const validatePassword = (password: string): boolean => {
    if (!password) {
      setErrors(prev => ({ ...prev, password: "Password is required" }));
      return false;
    }
    if (password.length < 8) {
      setErrors(prev => ({ ...prev, password: "Password must be at least 8 characters" }));
      return false;
    }

    // Check for password complexity
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
      setErrors(prev => ({
        ...prev,
        password: "Password must contain uppercase, lowercase, number, and special character"
      }));
      return false;
    }

    setErrors(prev => ({ ...prev, password: undefined }));
    return true;
  };

  const validateConfirmPassword = (confirmPassword: string): boolean => {
    if (!confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: "Please confirm your password" }));
      return false;
    }
    if (confirmPassword !== password) {
      setErrors(prev => ({ ...prev, confirmPassword: "Passwords do not match" }));
      return false;
    }
    setErrors(prev => ({ ...prev, confirmPassword: undefined }));
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if token exists
    if (!token) {
      toast.error("Invalid reset link", {
        description: "This password reset link is invalid. Please request a new one.",
        duration: 7000,
      });
      return;
    }

    // Validate all fields
    const isPasswordValid = validatePassword(password);
    const isConfirmPasswordValid = validateConfirmPassword(confirmPassword);

    if (!isPasswordValid || !isConfirmPasswordValid) {
      return;
    }

    setLoading(true);

    try {
      const result = await authClient.resetPassword({
        newPassword: password,
        token,
      });

      if (result.error) {
        console.error("Password reset error:", result.error);

        // Handle specific error cases
        if (result.error.message?.includes("expired") ||
          result.error.message?.includes("invalid")) {
          toast.error("Reset link expired or invalid", {
            description: "This password reset link has expired or is invalid. Please request a new one.",
            duration: 7000,
            action: {
              label: "Request new link",
              onClick: () => router.push("/forgot-password"),
            },
          });
        } else {
          toast.error(result.error.message || "Failed to reset password", {
            duration: 5000,
          });
        }
      } else {
        toast.success("Password reset successfully!", {
          description: "You can now sign in with your new password.",
          duration: 5000,
        });

        // Redirect to sign-in page
        setTimeout(() => {
          router.push("/sign-in");
        }, 1500);
      }
    } catch (error) {
      console.error("Password reset failed:", error);
      toast.error("Failed to reset password. Please try again.", {
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Common Layout Wrapper
  const LayoutWrapper = ({ children }: { children: React.ReactNode }) => (
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
          {children}
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

  // Show error if no token
  if (!token) {
    return (
      <LayoutWrapper>
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
            Invalid reset link
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive border border-destructive/20">
              <p className="font-medium mb-1">Link not valid</p>
              <p>
                This password reset link is invalid or has expired. Please request a new password reset link.
              </p>
            </div>

            <Button
              onClick={() => router.push("/forgot-password")}
              className={`w-full h-10 ${brandColors.primary.gradient} hover:opacity-90 transition-opacity rounded-xl shadow-lg shadow-slate-500/20`}
            >
              Request new reset link
            </Button>

            <div className="text-center text-sm">
              <Link
                href="/sign-in"
                className={`font-medium ${brandColors.text.secondary} hover:${brandColors.primary.text} underline-offset-4 hover:underline transition-colors`}
              >
                Back to sign in
              </Link>
            </div>
          </div>
        </CardContent>
      </LayoutWrapper>
    );
  }

  return (
    <LayoutWrapper>
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
          Create new password
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="password">New Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) validatePassword(e.target.value);
                // Re-validate confirm password if it's already filled
                if (confirmPassword) validateConfirmPassword(confirmPassword);
              }}
              onBlur={() => validatePassword(password)}
              disabled={loading}
              aria-invalid={!!errors.password}
              className="h-10 rounded-xl bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800"
              required
            />
            {errors.password && (
              <p className="text-destructive text-sm">{errors.password}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Must be at least 8 characters with uppercase, lowercase, number, and special character
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (errors.confirmPassword) validateConfirmPassword(e.target.value);
              }}
              onBlur={() => validateConfirmPassword(confirmPassword)}
              disabled={loading}
              aria-invalid={!!errors.confirmPassword}
              className="h-10 rounded-xl bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800"
              required
            />
            {errors.confirmPassword && (
              <p className="text-destructive text-sm">{errors.confirmPassword}</p>
            )}
          </div>

          <Button
            type="submit"
            className={`w-full h-10 ${brandColors.primary.gradient} hover:opacity-90 transition-opacity rounded-xl shadow-lg shadow-slate-500/20`}
            disabled={loading}
          >
            {loading ? "Resetting password..." : "Reset password"}
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
      </CardContent>
    </LayoutWrapper>
  );
}

export default function ResetPassword() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col justify-center items-center w-full min-h-screen">
          <div className="max-w-md w-full bg-slate-200 dark:bg-slate-800 animate-pulse rounded-[24px] h-96"></div>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
