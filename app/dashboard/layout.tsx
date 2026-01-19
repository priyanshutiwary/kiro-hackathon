import { ReactNode } from "react";
import DashboardHeader from "./_components/dashboard-header";
import DashboardSideBar from "./_components/sidebar";
import Chatbot from "./_components/chatbot";
import EmailVerificationBanner from "./_components/email-verification-banner";

// All dashboard pages require authentication and should be dynamic
// This applies to all pages under /dashboard/*
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden w-full">
      <DashboardSideBar />
      <main className="flex-1 overflow-y-auto">
        <DashboardHeader />
        <div className="flex-1 p-6">
          <EmailVerificationBanner />
          {children}
        </div>
      </main>
      <Chatbot />
    </div>
  );
}
