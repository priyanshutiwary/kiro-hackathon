"use client";

import { useState } from "react";
import NavTabs from "./_components/nav-tabs";
import ReminderSettings from "./_components/reminder-settings";
import BusinessProfileSettings from "./_components/business-profile-settings";
import { DashboardTheme } from "@/lib/dashboard-theme";
import { motion, AnimatePresence } from "framer-motion";

export default function ConfigurationPage() {
  const [activeTab, setActiveTab] = useState("reminders");

  const tabs = [
    { id: "reminders", label: "Reminders" },
    { id: "business-profile", label: "Business Profile" },
  ];

  return (
    <div className="container max-w-7xl mx-auto py-6">
      <div className="flex flex-col gap-6">
        {/* Header Area */}
        <div className="space-y-1 mb-2">

          <p className="text-sm text-muted-foreground">
            Manage your AI agent behavior and business identity.
          </p>
        </div>

        <div className="flex flex-col">
          <NavTabs
            tabs={tabs}
            activeTab={activeTab}
            onChange={setActiveTab}
          />

          <div className="min-h-[500px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.15 }}
              >
                {activeTab === "reminders" ? (
                  <ReminderSettings />
                ) : (
                  <BusinessProfileSettings />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
