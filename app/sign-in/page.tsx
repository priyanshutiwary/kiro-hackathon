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

function SignInContent() {
  const [loading, setLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo");
  const router = useRouter();

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
    setErrors(prev => ({ ...prev, password: undefined }));
    return true;
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    setEmailLoading(true);

    try {
      const result = await authClient.signIn.email({
        email,
        password,
        callbackURL: returnTo || "/dashboard",
      });

      if (result.error) {
        console.error("Sign-in error:", result.error);

        // Handle specific error cases
        if (result.error.message?.includes("verify") ||
          result.error.message?.includes("verification")) {
          // Automatically send verification email
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
              toast.error("Email not verified", {
                description: "A verification email has been sent to your inbox. Please verify your email to sign in.",
                duration: 7000,
                action: {
                  label: "Resend",
                  onClick: async () => {
                    try {
                      const resendResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/auth/send-verification-email`, {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ email }),
                      });

                      const resendData = await resendResponse.json();

                      if (resendResponse.ok && !resendData.error) {
                        toast.success("Verification email sent!", {
                          description: "Please check your inbox for the verification link.",
                          duration: 5000,
                        });
                      } else {
                        if (resendData.error?.message?.includes("rate limit") ||
                          resendData.error?.message?.includes("too many")) {
                          toast.error("Too many requests", {
                            description: "Please wait an hour before requesting another verification email.",
                            duration: 7000,
                          });
                        } else {
                          toast.error(resendData.error?.message || "Failed to send verification email");
                        }
                      }
                    } catch (error) {
                      console.error("Resend verification error:", error);
                      toast.error("Failed to send verification email. Please try again.");
                    }
                  },
                },
              });
            } else {
              // If sending fails (e.g., rate limit), show appropriate message
              if (data.error?.message?.includes("rate limit") ||
                data.error?.message?.includes("too many")) {
                toast.error("Email not verified", {
                  description: "Please check your inbox for the verification link. Too many emails sent recently.",
                  duration: 7000,
                });
              } else {
                toast.error("Email not verified", {
                  description: "Please verify your email address before signing in. Check your inbox for the verification link.",
                  duration: 7000,
                });
              }
            }
          } catch (error) {
            console.error("Auto-send verification error:", error);
            toast.error("Email not verified", {
              description: "Please verify your email address before signing in. Check your inbox for the verification link.",
              duration: 7000,
            });
          }
        } else if (result.error.message?.includes("locked") ||
          result.error.message?.includes("lockout")) {
          toast.error("Account temporarily locked", {
            description: "Too many failed login attempts. Please try again in 15 minutes.",
            duration: 7000,
          });
        } else if (result.error.message?.includes("credentials") ||
          result.error.message?.includes("invalid") ||
          result.error.message?.includes("incorrect")) {
          // Generic error message for security (don't reveal which field is wrong)
          toast.error("Invalid email or password", {
            description: "Please check your credentials and try again.",
            duration: 5000,
          });
        } else {
          toast.error(result.error.message || "Failed to sign in", {
            duration: 5000,
          });
        }
      } else {
        // Success handled by callback URL
        toast.success("Signed in successfully");
      }
    } catch (error) {
      console.error("Sign-in failed:", error);
      toast.error("Failed to sign in. Please try again.", {
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
              Welcome back! Sign in to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {/* Email/Password Sign In Form */}
              <form onSubmit={handleEmailSignIn} className="grid gap-4">
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
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link
                      href="/forgot-password"
                      className={`text-xs ${brandColors.text.secondary} hover:${brandColors.primary.text} underline-offset-4 hover:underline transition-colors`}
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) validatePassword(e.target.value);
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
                </div>

                <Button
                  type="submit"
                  className={`w-full h-10 ${brandColors.primary.gradient} hover:opacity-90 transition-opacity rounded-xl shadow-lg shadow-slate-500/20`}
                  disabled={emailLoading || loading}
                >
                  {emailLoading ? "Signing in..." : "Sign in with Email"}
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
                        onError: (ctx) => {
                          setLoading(false);
                          console.error("Sign-in failed:", ctx.error);
                          toast.error("Failed to sign in with Google", {
                            duration: 5000,
                          });
                        },
                      },
                    );
                  } catch (error) {
                    setLoading(false);
                    console.error("Authentication error:", error);
                    toast.error("Oops, something went wrong", {
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
                {loading ? "Signing in..." : "Sign in with Google"}
              </Button>

              {/* Link to Sign Up */}
              <div className="text-center text-sm">
                Don&apos;t have an account?{" "}
                <Link
                  href="/sign-up"
                  className={`font-medium ${brandColors.text.secondary} hover:${brandColors.primary.text} underline-offset-4 hover:underline transition-colors`}
                >
                  Sign up
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
        <p className="mt-6 text-xs text-center text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          By signing in, you agree to our{" "}
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

export default function SignIn() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col justify-center items-center w-full min-h-screen">
          <div className="max-w-md w-full bg-slate-200 dark:bg-slate-800 animate-pulse rounded-[24px] h-96"></div>
        </div>
      }
    >
      <SignInContent />
    </Suspense>
  );
}
