"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Check, AlertCircle, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { DashboardTheme } from "@/lib/dashboard-theme";

interface Integration {
  name: string;
  description: string;
  status: "connected" | "available" | "error";
  icon: string;
  category: string;
  id?: string;
  errorMessage?: string;
  lastSync?: Date;
  organizationId?: string;
}

const staticIntegrations: Integration[] = [];

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>(staticIntegrations);
  const [zohoStatus, setZohoStatus] = useState<Integration | null>(null);
  const [isLoadingZoho, setIsLoadingZoho] = useState(true);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  // Fetch Zoho integration status on mount
  useEffect(() => {
    fetchZohoStatus();

    // Check for success/error messages in URL
    const params = new URLSearchParams(window.location.search);
    const success = params.get("success");
    const error = params.get("error");
    const details = params.get("details");

    if (success === "zoho_connected") {
      toast.success("Zoho Books connected successfully!");
      // Clear URL parameters
      window.history.replaceState({}, "", "/dashboard/integrations");
    } else if (error) {
      const errorMessages: Record<string, string> = {
        oauth_failed: "Failed to connect Zoho Books",
        missing_code: "Authorization code missing",
        callback_failed: "OAuth callback failed",
        unauthorized: "Please sign in to connect integrations",
      };
      toast.error(errorMessages[error] || "An error occurred", {
        description: details ? decodeURIComponent(details) : undefined,
      });
      // Clear URL parameters
      window.history.replaceState({}, "", "/dashboard/integrations");
    }
  }, []);

  const fetchZohoStatus = async () => {
    try {
      setIsLoadingZoho(true);
      const response = await fetch("/api/zoho/status");

      if (!response.ok) {
        throw new Error("Failed to fetch Zoho status");
      }

      const data = await response.json();

      const zohoIntegration: Integration = {
        id: "zoho_books",
        name: "Zoho Books",
        description: "Fetch and view your business bills",
        status: data.connected ? "connected" : data.status === "error" ? "error" : "available",
        icon: "📚",
        category: "Accounting",
        errorMessage: data.error,
        organizationId: data.organizationId,
        lastSync: data.lastSync ? new Date(data.lastSync) : undefined,
      };

      setZohoStatus(zohoIntegration);

      // Add Zoho to integrations list
      setIntegrations([...staticIntegrations, zohoIntegration]);
    } catch (error) {
      console.error("Error fetching Zoho status:", error);
      // Add Zoho as available if we can't fetch status
      const zohoIntegration: Integration = {
        id: "zoho_books",
        name: "Zoho Books",
        description: "Fetch and view your business bills",
        status: "available",
        icon: "📚",
        category: "Accounting",
      };
      setZohoStatus(zohoIntegration);
      setIntegrations([...staticIntegrations, zohoIntegration]);
    } finally {
      setIsLoadingZoho(false);
    }
  };

  const handleConnect = (integration: Integration) => {
    if (integration.id === "zoho_books") {
      // Redirect to Zoho OAuth flow
      window.location.href = "/api/zoho/auth/connect";
    } else {
      toast.info(`${integration.name} configuration coming soon`);
    }
  };

  const handleDisconnect = async (integration: Integration) => {
    if (integration.id === "zoho_books") {
      try {
        setIsDisconnecting(true);
        const response = await fetch("/api/zoho/auth/disconnect", {
          method: "POST",
        });

        if (!response.ok) {
          throw new Error("Failed to disconnect");
        }

        toast.success("Zoho Books disconnected successfully");

        // Refresh status
        await fetchZohoStatus();
      } catch (error) {
        console.error("Error disconnecting Zoho:", error);
        toast.error("Failed to disconnect Zoho Books");
      } finally {
        setIsDisconnecting(false);
      }
    }
  };

  const handleConfigure = (integration: Integration) => {
    if (integration.id === "zoho_books") {
      // Navigate to bills page
      window.location.href = "/dashboard/bills";
    } else {
      toast.info(`${integration.name} configuration coming soon`);
    }
  };

  const getButtonAction = (integration: Integration) => {
    if (integration.status === "connected") {
      return (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleConfigure(integration)}
          >
            View Bills
            <ExternalLink className="h-3 w-3 ml-2" />
          </Button>
          {integration.id === "zoho_books" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDisconnect(integration)}
              disabled={isDisconnecting}
            >
              {isDisconnecting ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                "Disconnect"
              )}
            </Button>
          )}
        </div>
      );
    } else if (integration.status === "error") {
      return (
        <Button
          variant="destructive"
          size="sm"
          onClick={() => handleConnect(integration)}
        >
          Reconnect
          <ExternalLink className="h-3 w-3 ml-2" />
        </Button>
      );
    } else {
      return (
        <Button
          variant="default"
          size="sm"
          onClick={() => handleConnect(integration)}
        >
          Connect
          <ExternalLink className="h-3 w-3 ml-2" />
        </Button>
      );
    }
  };
  return (
    <div className={DashboardTheme.layout.container}>
      {/* Header removed */}

      {isLoadingZoho && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading integrations...
        </div>
      )}

      <section className={DashboardTheme.layout.sectionAnimateInDelayed}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2 mb-2">
          <div>
            <h2 className={DashboardTheme.typography.sectionTitle}>Connected Services</h2>
            <p className={DashboardTheme.typography.subtext}>
              Manage your connected services and integrations
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {integrations.map((integration) => (
            <Card key={integration.name} className={`${DashboardTheme.card.base} relative`}>
              <CardHeader className={DashboardTheme.card.header}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{integration.icon}</span>
                    <div>
                      <CardTitle className={DashboardTheme.card.metricLabel + " text-lg"}>
                        {integration.name}
                      </CardTitle>
                      <Badge
                        variant={
                          integration.status === "connected"
                            ? "default"
                            : integration.status === "error"
                              ? "destructive"
                              : "secondary"
                        }
                        className="mt-1"
                      >
                        {integration.status === "connected" ? (
                          <Check className="h-3 w-3 mr-1" />
                        ) : integration.status === "error" ? (
                          <AlertCircle className="h-3 w-3 mr-1" />
                        ) : null}
                        {integration.status === "connected"
                          ? "Connected"
                          : integration.status === "error"
                            ? "Error"
                            : "Available"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className={DashboardTheme.card.content}>
                <CardDescription className="mb-4">
                  {integration.description}
                </CardDescription>

                {integration.status === "error" && integration.errorMessage && (
                  <div className="mb-4 p-2 bg-destructive/10 rounded-md">
                    <p className="text-xs text-destructive">
                      {integration.errorMessage}
                    </p>
                  </div>
                )}

                {integration.status === "connected" && integration.lastSync && (
                  <div className="mb-4">
                    <p className="text-xs text-muted-foreground">
                      Last synced: {new Date(integration.lastSync).toLocaleString()}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {integration.category}
                  </span>
                  {getButtonAction(integration)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Card className={DashboardTheme.card.dashed + " mt-4"}>
        <CardHeader className={DashboardTheme.card.content + " items-center text-center py-6"}>
          <CardTitle className={DashboardTheme.card.metricLabel}>Need More Integrations?</CardTitle>
          <CardDescription className={DashboardTheme.card.metricValue + " text-sm font-normal max-w-md mx-auto"}>
            Request new integrations or build custom ones using our API
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center pb-6">
          <Button variant="outline">
            View Documentation
            <ExternalLink className="h-4 w-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
