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
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import { authClient } from "@/lib/auth-client";
import { brandColors } from "@/lib/brand-colors";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";

function SignUpContent() {
  const [loading, setLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo");
  const router = useRouter();

  const validateName = (name: string): boolean => {
    if (!name || name.trim().length === 0) {
      setErrors(prev => ({ ...prev, name: "Name is required" }));
      return false;
    }
    if (name.trim().length < 2) {
      setErrors(prev => ({ ...prev, name: "Name must be at least 2 characters long" }));
      return false;
    }
    setErrors(prev => ({ ...prev, name: undefined }));
    return true;
  };

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

  const validatePassword = (password: string): boolean => {
    if (!password) {
      setErrors(prev => ({ ...prev, password: "Password is required" }));
      return false;
    }
    if (password.length < 8) {
      setErrors(prev => ({ ...prev, password: "Password must be at least 8 characters long" }));
      return false;
    }
    if (!/[A-Z]/.test(password)) {
      setErrors(prev => ({ ...prev, password: "Password must contain at least one uppercase letter" }));
      return false;
    }
    if (!/[a-z]/.test(password)) {
      setErrors(prev => ({ ...prev, password: "Password must contain at least one lowercase letter" }));
      return false;
    }
    if (!/[0-9]/.test(password)) {
      setErrors(prev => ({ ...prev, password: "Password must contain at least one number" }));
      return false;
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      setErrors(prev => ({ ...prev, password: "Password must contain at least one special character" }));
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
    if (password !== confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: "Passwords do not match" }));
      return false;
    }
    setErrors(prev => ({ ...prev, confirmPassword: undefined }));
    return true;
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const isNameValid = validateName(name);
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    const isConfirmPasswordValid = validateConfirmPassword(confirmPassword);

    if (!isNameValid || !isEmailValid || !isPasswordValid || !isConfirmPasswordValid) {
      return;
    }

    setEmailLoading(true);

    try {
      const result = await authClient.signUp.email({
        name: name.trim(),
        email,
        password,
        // Don't auto-login after signup
        callbackURL: undefined,
      });

      if (result.error) {
        console.error("Sign-up error:", result.error);

        // Handle specific error cases
        if (result.error.message?.includes("already exists") ||
          result.error.message?.includes("duplicate")) {
          toast.error("An account with this email already exists", {
            duration: 5000,
          });
        } else {
          toast.error(result.error.message || "Failed to create account", {
            duration: 5000,
          });
        }
      } else {
        // Account created successfully
        // Manually trigger verification email using BetterAuth client
        try {
          await authClient.sendVerificationEmail({
            email,
            callbackURL: `${process.env.NEXT_PUBLIC_APP_URL}/verify-email`,
          });

          toast.success("Account created! Please check your email to verify your account.", {
            description: "We've sent a verification link to your email address.",
            duration: 7000,
          });
        } catch (emailError) {
          console.error("Failed to send verification email:", emailError);
          toast.success("Account created! Please verify your email to continue.", {
            description: "You can request a verification email from the sign-in page.",
            duration: 7000,
          });
        }

        // Redirect to sign-in page with email parameter
        setTimeout(() => {
          router.push(`/sign-in?email=${encodeURIComponent(email)}&verified=false`);
        }, 1500);
      }
    } catch (error) {
      console.error("Sign-up failed:", error);
      toast.error("Failed to create account. Please try again.", {
        duration: 5000,
      });
    } finally {
      setEmailLoading(false);
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
              Create your account to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {/* Email/Password Sign Up Form */}
              <form onSubmit={handleEmailSignUp} className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (errors.name) validateName(e.target.value);
                    }}
                    onBlur={() => validateName(name)}
                    disabled={emailLoading}
                    aria-invalid={!!errors.name}
                    className="h-10 rounded-xl bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800"
                    required
                  />
                  {errors.name && (
                    <p className="text-destructive text-sm">{errors.name}</p>
                  )}
                </div>

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
                    disabled={emailLoading}
                    aria-invalid={!!errors.email}
                    className="h-10 rounded-xl bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800"
                    required
                  />
                  {errors.email && (
                    <p className="text-destructive text-sm">{errors.email}</p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) validatePassword(e.target.value);
                      if (confirmPassword && errors.confirmPassword) {
                        validateConfirmPassword(confirmPassword);
                      }
                    }}
                    onBlur={() => validatePassword(password)}
                    disabled={emailLoading}
                    aria-invalid={!!errors.password}
                    className="h-10 rounded-xl bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800"
                    required
                  />
                  {errors.password && (
                    <p className="text-destructive text-sm">{errors.password}</p>
                  )}
                  <p className="text-muted-foreground text-xs">
                    Must be at least 8 characters with uppercase, lowercase, number, and special character
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
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
                    disabled={emailLoading}
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
                  disabled={emailLoading || loading}
                >
                  {emailLoading ? "Creating account..." : "Sign up with Email"}
                </Button>
              </form>

              {/* Separator */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="bg-slate-200 dark:bg-slate-800" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className={`px-2 ${brandColors.backgrounds.glass} text-muted-foreground`}>
                    Or continue with
                  </span>
                </div>
              </div>

              {/* Google OAuth */}
              <Button
                variant="outline"
                className="w-full gap-2 h-10 rounded-xl border-slate-200 dark:border-slate-800 hover:bg-slate-50 hover:text-slate-900 dark:hover:bg-slate-900 dark:hover:text-white"
                disabled={loading || emailLoading}
                onClick={async () => {
                  try {
                    await authClient.signIn.social(
                      {
                        provider: "google",
                        callbackURL: returnTo || "/dashboard",
                      },
                      {
                        onRequest: () => {
                          setLoading(true);
                        },
                        onResponse: () => {
                          setLoading(false);
                        },
                        onError: (error) => {
                          setLoading(false);
                          console.error("Sign-in error:", error);
                        },
                      },
                    );
                  } catch (error) {
                    setLoading(false);
                    console.error("Sign-in failed:", error);
                    toast.error("Failed to sign in with Google", {
                      duration: 5000,
                    });
                  }
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="0.98em"
                  height="1em"
                  viewBox="0 0 256 262"
                >
                  <path
                    fill="#4285F4"
                    d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622l38.755 30.023l2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"
                  ></path>
                  <path
                    fill="#34A853"
                    d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055c-34.523 0-63.824-22.773-74.269-54.25l-1.531.13l-40.298 31.187l-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"
                  ></path>
                  <path
                    fill="#FBBC05"
                    d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82c0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602z"
                  ></path>
                  <path
                    fill="#EB4335"
                    d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0C79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"
                  ></path>
                </svg>
                {loading ? "Signing in..." : "Sign up with Google"}
              </Button>

              {/* Link to Sign In */}
              <div className="text-center text-sm">
                Already have an account?{" "}
                <Link
                  href="/sign-in"
                  className={`font-medium ${brandColors.text.secondary} hover:${brandColors.primary.text} underline-offset-4 hover:underline transition-colors`}
                >
                  Sign in
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
        <p className="mt-6 text-xs text-center text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          By signing up, you agree to our{" "}
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

export default function SignUp() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col justify-center items-center w-full min-h-screen">
          <div className="max-w-md w-full bg-slate-200 dark:bg-slate-800 animate-pulse rounded-[24px] h-96"></div>
        </div>
      }
    >
      <SignUpContent />
    </Suspense>
  );
}

