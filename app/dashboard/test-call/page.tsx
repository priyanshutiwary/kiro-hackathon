"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Phone, Loader2, CheckCircle2, XCircle, AlertCircle, Wand2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { DashboardTheme } from "@/lib/dashboard-theme";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function TestCallPage() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{
        success: boolean;
        roomName?: string;
        sipParticipantId?: string;
        error?: string;
    } | null>(null);

    const [formData, setFormData] = useState({
        customerName: "",
        customerPhone: "",
        invoiceNumber: "",
        amountDue: "",
        currencyCode: "USD",
        currencySymbol: "$",
        dueDate: "",
        companyName: "",
        supportPhone: "",
        language: "en",
        voiceGender: "female",
    });

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const fillDummyData = () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 7);

        setFormData({
            customerName: "Jane Smith",
            customerPhone: "", // Leave phone empty for safety
            invoiceNumber: `INV-${Math.floor(Math.random() * 10000)}`,
            amountDue: "250.00",
            currencyCode: "USD",
            currencySymbol: "$",
            dueDate: futureDate.toISOString().split('T')[0],
            companyName: "Acme Corp",
            supportPhone: "+15550123456",
            language: "en",
            voiceGender: "female",
        });
        toast.info("Dummy data filled. Please enter a valid phone number.");
    };

    const handleTestCall = async () => {
        if (!formData.customerPhone) {
            toast.error("Please enter a phone number");
            return;
        }

        setLoading(true);
        setResult(null);

        try {
            const reminderId = `test-${Date.now()}`;
            const response = await fetch("/api/livekit/dispatch-call", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    reminderId,
                    ...formData,
                    amountDue: parseFloat(formData.amountDue) || 0,
                }),
            });

            const data = await response.json();
            setResult(data);

            if (data.success) {
                toast.success("Call dispatched successfully!");
            } else {
                toast.error(data.error || "Failed to dispatch call");
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            setResult({ success: false, error: errorMessage });
            toast.error("Error dispatching call");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={cn(DashboardTheme.layout.container, "max-w-7xl px-4")}>
            {/* Header */}
            <div className={DashboardTheme.layout.headerFlex}>
                <div className="space-y-1">
                    <p className={DashboardTheme.typography.subtext}>
                        Simulate a call to verify the AI agent's behavior and voice settings.
                    </p>
                </div>
                <Button variant="outline" onClick={fillDummyData} className="gap-2">
                    <Wand2 className="h-4 w-4 text-primary" />
                    Quick Fill
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* Left Column: Configuration Forms */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Customer Details Card */}
                    <div className={cn(DashboardTheme.card.base, "animate-in slide-in-from-left-4 duration-500")}>
                        <div className="p-6 pb-4 border-b border-border/40">
                            <h3 className="font-semibold flex items-center gap-2">
                                <div className="h-8 w-1 bg-primary rounded-full"></div>
                                Customer Details
                            </h3>
                        </div>
                        <div className="p-6 grid gap-5 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Name</Label>
                                <Input
                                    placeholder="e.g. John Doe"
                                    value={formData.customerName}
                                    onChange={(e) => handleInputChange("customerName", e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Phone Number (E.164)</Label>
                                <Input
                                    placeholder="+1234567890"
                                    value={formData.customerPhone}
                                    onChange={(e) => handleInputChange("customerPhone", e.target.value)}
                                />
                                <p className="text-[11px] text-muted-foreground">Must include country code (e.g. +1...)</p>
                            </div>
                            <div className="space-y-2">
                                <Label>Language</Label>
                                <Select value={formData.language} onValueChange={(v) => handleInputChange("language", v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="en">English</SelectItem>
                                        <SelectItem value="hi">Hindi</SelectItem>
                                        <SelectItem value="hinglish">Hinglish</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Voice</Label>
                                <Select value={formData.voiceGender} onValueChange={(v) => handleInputChange("voiceGender", v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="female">Female</SelectItem>
                                        <SelectItem value="male">Male</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Context Details Card */}
                    <div className={cn(DashboardTheme.card.base, "animate-in slide-in-from-left-4 duration-700 delay-100")}>
                        <div className="p-6 pb-4 border-b border-border/40">
                            <h3 className="font-semibold flex items-center gap-2">
                                <div className="h-8 w-1 bg-blue-500 rounded-full"></div>
                                Call Context
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1 ml-3">
                                Information the agent will know about the debt.
                            </p>
                        </div>
                        <div className="p-6 space-y-5">
                            <div className="grid gap-5 md:grid-cols-3">
                                <div className="space-y-2">
                                    <Label>Invoice #</Label>
                                    <Input
                                        value={formData.invoiceNumber}
                                        onChange={(e) => handleInputChange("invoiceNumber", e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Amount</Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">{formData.currencySymbol}</span>
                                        <Input
                                            className="pl-7"
                                            type="number"
                                            value={formData.amountDue}
                                            onChange={(e) => handleInputChange("amountDue", e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Due Date</Label>
                                    <Input
                                        type="date"
                                        value={formData.dueDate}
                                        onChange={(e) => handleInputChange("dueDate", e.target.value)}
                                    />
                                </div>
                            </div>
                            <Separator className="bg-border/50" />
                            <div className="grid gap-5 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Company Name</Label>
                                    <Input
                                        value={formData.companyName}
                                        onChange={(e) => handleInputChange("companyName", e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Support Phone</Label>
                                    <Input
                                        value={formData.supportPhone}
                                        onChange={(e) => handleInputChange("supportPhone", e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Status & Action */}
                <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-24">
                    {/* Action Card */}
                    <div className={cn(DashboardTheme.card.base, "border-primary/20 bg-primary/5 shadow-md")}>
                        <div className="p-6 space-y-4">
                            <div className="flex items-center gap-3 text-primary">
                                <div className="p-2 bg-primary/10 rounded-full"><Phone className="h-5 w-5" /></div>
                                <h3 className="font-semibold">Ready to Call?</h3>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                This will initiate a real phone call to the provided number. Ensure you have permission.
                            </p>
                            <Button
                                size="lg"
                                className="w-full font-semibold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]"
                                onClick={handleTestCall}
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                {loading ? "Dispatching..." : "Make Test Call"}
                            </Button>
                        </div>
                    </div>

                    {/* Live Status Card */}
                    <AnimatePresence mode="popLayout">
                        {result && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className={cn(
                                    "rounded-xl border p-5 shadow-sm",
                                    result.success
                                        ? "bg-green-500/5 border-green-500/20"
                                        : "bg-destructive/5 border-destructive/20"
                                )}
                            >
                                <div className="flex items-start gap-3">
                                    {result.success
                                        ? <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                                        : <XCircle className="h-5 w-5 text-destructive mt-0.5" />
                                    }
                                    <div className="space-y-1">
                                        <h4 className={cn(
                                            "font-semibold text-sm",
                                            result.success ? "text-green-700" : "text-destructive"
                                        )}>
                                            {result.success ? "Call Initiated Successfully" : "Call Failed"}
                                        </h4>
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            {result.success
                                                ? "The system has dispatched the call. It should ring within a few seconds."
                                                : result.error
                                            }
                                        </p>
                                        {result.success && result.roomName && (
                                            <div className="mt-3 pt-3 border-t border-green-500/10 grid grid-cols-1 gap-1">
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-muted-foreground">Room:</span>
                                                    <span className="font-mono">{result.roomName}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Info Tip */}
                    <Alert className="bg-muted/50 border-0">
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                        <AlertDescription className="text-muted-foreground text-xs">
                            Calls are recorded for quality assurance. Check the "Call History" tab for logs.
                        </AlertDescription>
                    </Alert>
                </div>
            </div>
        </div>
    );
}
