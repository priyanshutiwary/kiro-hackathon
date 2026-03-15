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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ExternalLink, Check, AlertCircle, Loader2, Rocket, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { DashboardTheme } from "@/lib/dashboard-theme";
import NavTabs from "../configuration/_components/nav-tabs";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────────────────

type ConnectType = "oauth" | "upload";
type IntegrationStatus = "connected" | "available" | "error";
type IntegrationCategory = "Accounting" | "Marketing" | "Communication" | "Other";

interface IntegrationConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: IntegrationCategory;
  connectType: ConnectType;
  /** API path prefix, e.g. "/api/zoho" or "/api/google-sheets" */
  apiPrefix?: string;
}

interface IntegrationState extends IntegrationConfig {
  status: IntegrationStatus;
  errorMessage?: string;
  lastSync?: Date;
  /** For Google Sheets: show sheet config after connect */
  spreadsheetId?: string;
}

// ─── Static provider definitions ─────────────────────────────────────────────
// Adding a new provider in future = just add one entry here.

const PROVIDER_CONFIGS: IntegrationConfig[] = [
  {
    id: "zoho_books",
    name: "Zoho Books",
    description: "Sync invoices and customers from Zoho Books automatically.",
    icon: "📚",
    category: "Accounting",
    connectType: "oauth",
    apiPrefix: "/api/zoho",
  },
  {
    id: "google_sheets",
    name: "Google Sheets",
    description: "Connect a Google Spreadsheet as your invoice source. Syncs daily.",
    icon: "📊",
    category: "Accounting",
    connectType: "oauth",
    apiPrefix: "/api/google-sheets",
  },
  {
    id: "excel_upload",
    name: "Excel Upload",
    description: "Upload an .xlsx file with your invoices. Re-upload anytime to refresh.",
    icon: "📁",
    category: "Accounting",
    connectType: "upload",
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<IntegrationState[]>(
    PROVIDER_CONFIGS.map((p) => ({ ...p, status: "available" }))
  );
  const [isLoading, setIsLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);

  // Sheet URL modal (Google Sheets post-connect)
  const [sheetModalOpen, setSheetModalOpen] = useState(false);
  const [sheetUrl, setSheetUrl] = useState("");
  const [sheetName, setSheetName] = useState("Sheet1");
  const [savingSheet, setSavingSheet] = useState(false);

  // Excel upload
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState("all");

  const tabs = [
    { id: "all", label: "All Integrations" },
    { id: "accounting", label: "Accounting" },
    { id: "marketing", label: "Marketing" },
    { id: "communication", label: "Communication" },
  ];

  // ── Fetch status for all OAuth providers on mount ─────────────────────────

  useEffect(() => {
    fetchAllStatuses();

    const params = new URLSearchParams(window.location.search);
    const success = params.get("success");
    const error = params.get("error");
    const details = params.get("details");

    if (success === "zoho_connected") {
      toast.success("Zoho Books connected successfully!");
    } else if (success === "google_sheets_connected") {
      toast.success("Google Sheets connected! Now set your spreadsheet URL.");
      setSheetModalOpen(true);
    }

    if (error) {
      const errorMessages: Record<string, string> = {
        oauth_failed: "OAuth connection failed",
        missing_code: "Authorization code missing",
        callback_failed: "OAuth callback failed",
        unauthorized: "Please sign in to connect integrations",
        google_oauth_denied: "Google access was denied",
        google_missing_code: "Authorization code missing",
        google_callback_failed: "Google OAuth callback failed",
        google_invalid_state: "Security check failed — please try again",
        google_connect_failed: "Failed to start Google connection",
      };
      toast.error(errorMessages[error] || "An error occurred", {
        description: details ? decodeURIComponent(details) : undefined,
      });
    }

    if (success || error) {
      window.history.replaceState({}, "", "/dashboard/integrations");
    }
  }, []);

  const fetchAllStatuses = async () => {
    setIsLoading(true);
    try {
      // Fetch status for each OAuth provider in parallel
      const oauthProviders = PROVIDER_CONFIGS.filter((p) => p.connectType === "oauth");
      const results = await Promise.allSettled(
        oauthProviders.map((p) =>
          fetch(`${p.apiPrefix}/status`).then((r) => r.json())
        )
      );

      setIntegrations(
        PROVIDER_CONFIGS.map((config) => {
          if (config.connectType === "upload") {
            // For upload providers, check local storage / API
            return { ...config, status: "available" as IntegrationStatus };
          }

          const idx = oauthProviders.findIndex((p) => p.id === config.id);
          if (idx === -1) return { ...config, status: "available" as IntegrationStatus };

          const result = results[idx];
          if (result.status === "rejected") {
            return { ...config, status: "available" as IntegrationStatus };
          }

          const data = result.value;
          return {
            ...config,
            status: (data.connected
              ? "connected"
              : data.status === "error"
                ? "error"
                : "available") as IntegrationStatus,
            errorMessage: data.error,
            lastSync: data.lastSync ? new Date(data.lastSync) : undefined,
            spreadsheetId: data.spreadsheetId,
          };
        })
      );
    } catch (err) {
      console.error("Error fetching integration statuses:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Excel status check ────────────────────────────────────────────────────

  const fetchExcelStatus = async () => {
    try {
      const res = await fetch("/api/excel/status");
      if (res.ok) {
        const data = await res.json();
        setIntegrations((prev) =>
          prev.map((i) =>
            i.id === "excel_upload"
              ? {
                ...i,
                status: data.connected ? "connected" : "available",
                lastSync: data.lastUploadedAt ? new Date(data.lastUploadedAt) : undefined,
              }
              : i
          )
        );
      }
    } catch { }
  };

  useEffect(() => {
    fetchExcelStatus();
  }, []);

  // ── Connect handlers ──────────────────────────────────────────────────────

  const handleConnect = (integration: IntegrationState) => {
    if (integration.connectType === "oauth" && integration.apiPrefix) {
      window.location.href = `${integration.apiPrefix}/auth/connect`;
    } else if (integration.connectType === "upload") {
      setUploadModalOpen(true);
    } else {
      toast.info(`${integration.name} configuration coming soon`);
    }
  };

  const handleDisconnect = async (integration: IntegrationState) => {
    if (integration.connectType !== "oauth" || !integration.apiPrefix) return;

    try {
      setDisconnecting(integration.id);
      const res = await fetch(`${integration.apiPrefix}/auth/disconnect`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to disconnect");
      toast.success(`${integration.name} disconnected successfully`);
      await fetchAllStatuses();
    } catch {
      toast.error(`Failed to disconnect ${integration.name}`);
    } finally {
      setDisconnecting(null);
    }
  };

  // ── Google Sheets: save spreadsheet URL ──────────────────────────────────

  const handleSaveSheetUrl = async () => {
    if (!sheetUrl) return;
    setSavingSheet(true);
    try {
      const res = await fetch("/api/google-sheets/set-sheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sheetUrl, sheetName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Spreadsheet linked successfully!");
      setSheetModalOpen(false);
      setSheetUrl("");
      await fetchAllStatuses();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save spreadsheet");
    } finally {
      setSavingSheet(false);
    }
  };

  // ── Excel upload ──────────────────────────────────────────────────────────

  const handleExcelUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/excel/import", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(
        `Imported ${data.invoiceCount} invoices and ${data.customerCount} customers from ${file.name}`
      );
      setUploadModalOpen(false);
      await fetchExcelStatus();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to import file");
    } finally {
      setUploading(false);
    }
  };

  // ── Render helpers ────────────────────────────────────────────────────────

  const getActionButtons = (integration: IntegrationState) => {
    const isDisconnecting = disconnecting === integration.id;

    if (integration.status === "connected") {
      return (
        <div className="flex gap-2">
          {integration.id === "google_sheets" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSheetModalOpen(true)}
            >
              Edit Sheet
            </Button>
          )}
          {integration.id === "excel_upload" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setUploadModalOpen(true)}
            >
              <Upload className="h-3 w-3 mr-1" />
              Re-upload
            </Button>
          )}
          {integration.connectType === "oauth" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDisconnect(integration)}
              disabled={isDisconnecting}
            >
              {isDisconnecting ? <Loader2 className="h-3 w-3 animate-spin" /> : "Disconnect"}
            </Button>
          )}
        </div>
      );
    }

    if (integration.status === "error") {
      return (
        <Button variant="destructive" size="sm" onClick={() => handleConnect(integration)}>
          Reconnect <ExternalLink className="h-3 w-3 ml-2" />
        </Button>
      );
    }

    return (
      <Button
        variant="default"
        size="sm"
        onClick={() => handleConnect(integration)}
      >
        {integration.connectType === "upload" ? (
          <>
            <Upload className="h-3 w-3 mr-1" /> Upload File
          </>
        ) : (
          <>
            Connect <ExternalLink className="h-3 w-3 ml-2" />
          </>
        )}
      </Button>
    );
  };

  const filteredIntegrations = integrations.filter((i) => {
    if (activeTab === "all") return true;
    return i.category.toLowerCase() === activeTab;
  });

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="container max-w-7xl mx-auto py-6">
      <div className="flex flex-col gap-6">
        <div className="space-y-1 mb-2">
          <p className="text-sm text-muted-foreground">
            Manage your connected services and integrations.
          </p>
        </div>

        <div className="flex flex-col">
          <NavTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

          <div className="min-h-[500px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.15 }}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-12 justify-center">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading integrations...
                  </div>
                ) : filteredIntegrations.length > 0 ? (
                  <>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {filteredIntegrations.map((integration) => (
                        <Card
                          key={integration.id}
                          className={`${DashboardTheme.card.base} relative`}
                        >
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
                                    {integration.status === "connected" && (
                                      <Check className="h-3 w-3 mr-1" />
                                    )}
                                    {integration.status === "error" && (
                                      <AlertCircle className="h-3 w-3 mr-1" />
                                    )}
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
                                <p className="text-xs text-destructive">{integration.errorMessage}</p>
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
                              {getActionButtons(integration)}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    <Card className={DashboardTheme.card.dashed + " mt-4"}>
                      <CardHeader className={DashboardTheme.card.content + " items-center text-center py-8"}>
                        <CardTitle className={DashboardTheme.card.metricLabel}>
                          Missing an integration?
                        </CardTitle>
                        <CardDescription className={DashboardTheme.card.metricValue + " text-sm font-normal max-w-md mx-auto"}>
                          We are continuously expanding our integration library.
                          If you need a specific tool, please reach out to support.
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center animate-in fade-in zoom-in-95 duration-200">
                    <div className="bg-muted/50 p-4 rounded-full mb-4 ring-1 ring-border">
                      <Rocket className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                    <h3 className="text-lg font-medium tracking-tight mb-1">
                      More Integrations Coming Soon
                    </h3>
                    <p className="text-muted-foreground max-w-sm text-sm">
                      We&apos;re currently expanding our {activeTab !== "all" ? activeTab : ""} library.
                      Have a specific request? Let us know!
                    </p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── Google Sheets: Set Spreadsheet URL Modal ───────────────────────── */}
      <Dialog open={sheetModalOpen} onOpenChange={setSheetModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Link Your Google Spreadsheet</DialogTitle>
            <DialogDescription>
              Paste the URL of the Google Sheet containing your invoice data.
              The sheet must have a header row with columns like{" "}
              <code className="text-xs bg-muted px-1 rounded">invoice_number</code>,{" "}
              <code className="text-xs bg-muted px-1 rounded">customer_name</code>,{" "}
              <code className="text-xs bg-muted px-1 rounded">due_date</code>, etc.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="sheet-url">Google Sheet URL</Label>
              <Input
                id="sheet-url"
                placeholder="https://docs.google.com/spreadsheets/d/..."
                value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sheet-name">Sheet / Tab Name</Label>
              <Input
                id="sheet-name"
                placeholder="Sheet1"
                value={sheetName}
                onChange={(e) => setSheetName(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                The name of the specific tab in your spreadsheet (default: Sheet1).
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setSheetModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSheetUrl} disabled={savingSheet || !sheetUrl}>
              {savingSheet ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Spreadsheet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Excel Upload Modal ─────────────────────────────────────────────── */}
      <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Excel File</DialogTitle>
            <DialogDescription>
              Upload an .xlsx file with your invoice data. The first row must be
              a header row with columns like{" "}
              <code className="text-xs bg-muted px-1 rounded">invoice_number</code>,{" "}
              <code className="text-xs bg-muted px-1 rounded">customer_name</code>,{" "}
              <code className="text-xs bg-muted px-1 rounded">due_date</code>,{" "}
              <code className="text-xs bg-muted px-1 rounded">amount_due</code>, etc.
            </DialogDescription>
          </DialogHeader>

          <div
            className="border-2 border-dashed border-muted rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files[0];
              if (file) handleExcelUpload(file);
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleExcelUpload(file);
              }}
            />
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Importing...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium">Click or drag to upload</p>
                <p className="text-xs text-muted-foreground">.xlsx or .xls — max 10MB</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setUploadModalOpen(false)} disabled={uploading}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
