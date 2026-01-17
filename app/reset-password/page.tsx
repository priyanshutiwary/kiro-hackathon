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
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { toast } from "sonner";

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

  // Show error if no token
  if (!token) {
    return (
      <div className="flex flex-col justify-center items-center w-full h-screen p-4">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">
              Invalid reset link
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">
              This password reset link is invalid or has expired
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
                <p className="font-medium mb-1">Link not valid</p>
                <p>
                  This password reset link is invalid or has expired. Please request a new password reset link.
                </p>
              </div>
              
              <Button
                onClick={() => router.push("/forgot-password")}
                className="w-full"
              >
                Request new reset link
              </Button>

              <div className="text-center text-sm">
                <Link
                  href="/sign-in"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  Back to sign in
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-center items-center w-full h-screen p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">
            Create new password
          </CardTitle>
          <CardDescription className="text-xs md:text-sm">
            Enter your new password below
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
                required
              />
              {errors.confirmPassword && (
                <p className="text-destructive text-sm">{errors.confirmPassword}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? "Resetting password..." : "Reset password"}
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

export default function ResetPassword() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col justify-center items-center w-full h-screen">
          <div className="max-w-md w-full bg-gray-200 dark:bg-gray-800 animate-pulse rounded-lg h-96"></div>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
