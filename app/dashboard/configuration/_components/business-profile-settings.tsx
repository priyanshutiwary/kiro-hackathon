"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Loader2, Save, Sparkles } from "lucide-react";
import { toast } from "sonner";
import SettingsRow from "./settings-row";

// ... (Constants kept same as before but abbreviated for this file write)
const INDUSTRIES = [
    "Technology", "Healthcare", "Finance", "Retail", "Manufacturing", "Construction",
    "Real Estate", "Legal Services", "Consulting", "Marketing & Advertising", "Education", "Non-profit", "Other"
];

const BUSINESS_HOURS_TEMPLATE = {
    monday: "9:00 AM - 5:00 PM",
    tuesday: "9:00 AM - 5:00 PM",
    wednesday: "9:00 AM - 5:00 PM",
    thursday: "9:00 AM - 5:00 PM",
    friday: "9:00 AM - 5:00 PM",
    saturday: "Closed",
    sunday: "Closed",
};

export default function BusinessProfileSettings() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        companyName: "",
        businessDescription: "",
        industry: "",
        supportPhone: "",
        supportEmail: "",
        businessHours: BUSINESS_HOURS_TEMPLATE,
        preferredPaymentMethods: ["credit_card", "bank_transfer"],
    });

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await fetch("/api/business-profile");
                const result = await response.json();
                if (result.success && result.data) {
                    const p = result.data;
                    setFormData({
                        companyName: p.companyName || "",
                        businessDescription: p.businessDescription || "",
                        industry: p.industry || "",
                        supportPhone: p.supportPhone || "",
                        supportEmail: p.supportEmail || "",
                        businessHours: p.businessHours || BUSINESS_HOURS_TEMPLATE,
                        preferredPaymentMethods: p.preferredPaymentMethods || ["credit_card", "bank_transfer"],
                    });
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const response = await fetch("/api/business-profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            const result = await response.json();
            if (result.success) toast.success("Profile saved");
            else toast.error("Failed to save");
        } catch {
            toast.error("Error saving profile");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-4 text-muted-foreground">Loading...</div>;

    return (
        <form onSubmit={handleSubmit} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="space-y-1">
                {/* Preview Banner */}
                <div className="mb-8 p-4 bg-muted/30 rounded-lg border border-border/50 flex items-start gap-4">
                    <div className="p-2 bg-background rounded-full border shadow-sm mt-1">
                        <Sparkles className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                        <h4 className="text-sm font-medium mb-1">Agent Introduction Preview</h4>
                        <p className="text-sm text-muted-foreground italic">
                            "Hello, this is [Agent Name] calling from <span className="text-foreground font-medium not-italic">{formData.companyName || "Your Company"}</span>. I'm calling regarding an invoice..."
                        </p>
                    </div>
                </div>

                <SettingsRow label="Company Name" description="The official name used in calls and emails.">
                    <Input
                        value={formData.companyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        placeholder="Acme Inc."
                        className="max-w-md"
                    />
                </SettingsRow>

                <SettingsRow label="Industry" description="Helps the AI understand your business context.">
                    <Select value={formData.industry} onValueChange={(v) => setFormData({ ...formData, industry: v })}>
                        <SelectTrigger className="max-w-xs"><SelectValue placeholder="Select..." /></SelectTrigger>
                        <SelectContent>
                            {INDUSTRIES.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </SettingsRow>

                <SettingsRow label="Business Description" description="Context for the AI to answer simple questions about what you do." alignTop>
                    <Textarea
                        className="min-h-[100px] max-w-lg"
                        value={formData.businessDescription}
                        onChange={(e) => setFormData({ ...formData, businessDescription: e.target.value })}
                        placeholder="We provide..."
                    />
                </SettingsRow>

                <SettingsRow label="Payment Methods" description="Methods the agent can suggest to customers.">
                    <div className="flex flex-wrap gap-2">
                        {["credit_card", "bank_transfer", "check", "cash", "online_portal"].map(method => (
                            <div
                                key={method}
                                onClick={() => {
                                    const current = formData.preferredPaymentMethods;
                                    const updated = current.includes(method) ? current.filter(m => m !== method) : [...current, method];
                                    setFormData({ ...formData, preferredPaymentMethods: updated });
                                }}
                                className={`px-3 py-1.5 rounded-md text-sm cursor-pointer border transition-colors ${formData.preferredPaymentMethods.includes(method) ? "bg-primary/10 text-primary border-primary/50" : "bg-background hover:bg-muted"}`}
                            >
                                {method.replace("_", " ")}
                            </div>
                        ))}
                    </div>
                </SettingsRow>

                <SettingsRow label="Support Phone" description="Where calls should be forwarded if escalation is needed.">
                    <Input
                        value={formData.supportPhone}
                        onChange={(e) => setFormData({ ...formData, supportPhone: e.target.value })}
                        placeholder="+1..."
                        className="max-w-xs"
                    />
                </SettingsRow>
            </div>

            <div className="mt-8 flex justify-end">
                <Button type="submit" disabled={saving}>
                    {saving ? "Saving..." : "Save Changes"}
                </Button>
            </div>
        </form>
    );
}
