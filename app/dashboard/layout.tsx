import { ReactNode } from "react";
import DashboardHeader from "./_components/dashboard-header";
import DashboardSideBar from "./_components/sidebar";
import Chatbot from "./_components/chatbot";

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
          {children}
        </div>
      </main>
      <Chatbot />
    </div>
  );
}
