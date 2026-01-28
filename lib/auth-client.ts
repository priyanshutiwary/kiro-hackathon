import { createAuthClient } from "better-auth/react";
import { organizationClient } from "better-auth/client/plugins";
import { dodopaymentsClient } from "@dodopayments/better-auth";

// Use window.location.origin for client-side or fallback to env variable
const getBaseURL = () => {
  // In browser, use current origin
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  // During SSR/build, use env variable
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
};

export const authClient = createAuthClient({
  baseURL: getBaseURL(),
  plugins: [organizationClient(), dodopaymentsClient()],
});
