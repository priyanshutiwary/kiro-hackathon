"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Save, Building2 } from "lucide-react";
import { toast } from "sonner";
import { DashboardTheme } from "@/lib/dashboard-theme";

interface BusinessProfile {
  id: string;
  companyName: string;
  businessDescription: string;
  industry: string | null;
  supportPhone: string;
  supportEmail: string | null;
  businessHours: Record<string, string> | null;
  preferredPaymentMethods: string[];
}

const INDUSTRIES = [
  "Technology",
  "Healthcare",
  "Finance",
  "Retail",
  "Manufacturing",
  "Construction",
  "Real Estate",
  "Legal Services",
  "Consulting",
  "Marketing & Advertising",
  "Education",
  "Non-profit",
  "Other",
];

const PAYMENT_METHODS = [
  { id: "credit_card", label: "Credit Card" },
  { id: "bank_transfer", label: "Bank Transfer" },
  { id: "check", label: "Check" },
  { id: "cash", label: "Cash" },
  { id: "online_portal", label: "Online Payment Portal" },
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

export default function BusinessProfilePage() {
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [wordCount, setWordCount] = useState(0);

  // Form state
  const [formData, setFormData] = useState({
    companyName: "",
    businessDescription: "",
    industry: "",
    supportPhone: "",
    supportEmail: "",
    businessHours: BUSINESS_HOURS_TEMPLATE,
    preferredPaymentMethods: ["credit_card", "bank_transfer"],
  });

  // Load existing profile
  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/business-profile");
      const result = await response.json();

      if (result.success && result.data) {
        const profileData = result.data;
        setProfile(profileData);
        setFormData({
          companyName: profileData.companyName || "",
          businessDescription: profileData.businessDescription || "",
          industry: profileData.industry || "",
          supportPhone: profileData.supportPhone || "",
          supportEmail: profileData.supportEmail || "",
          businessHours: profileData.businessHours || BUSINESS_HOURS_TEMPLATE,
          preferredPaymentMethods: profileData.preferredPaymentMethods || ["credit_card", "bank_transfer"],
        });
        setWordCount(countWords(profileData.businessDescription || ""));
      }
    } catch (error) {
      console.error("Error fetching business profile:", error);
      toast.error("Failed to load business profile");
    } finally {
      setLoading(false);
    }
  };

  const countWords = (text: string) => {
    return text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
  };

  const handleDescriptionChange = (value: string) => {
    setFormData({ ...formData, businessDescription: value });
    setWordCount(countWords(value));
  };

  const handlePaymentMethodChange = (methodId: string, checked: boolean) => {
    const currentMethods = formData.preferredPaymentMethods;
    if (checked) {
      setFormData({
        ...formData,
        preferredPaymentMethods: [...currentMethods, methodId],
      });
    } else {
      setFormData({
        ...formData,
        preferredPaymentMethods: currentMethods.filter(id => id !== methodId),
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (wordCount > 500) {
      toast.error("Business description must be 500 words or less");
      return;
    }

    if (formData.preferredPaymentMethods.length === 0) {
      toast.error("Please select at least one payment method");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/business-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        setProfile(result.data);
        toast.success(result.message);
      } else {
        toast.error(result.error || "Failed to save business profile");
      }
    } catch (error) {
      console.error("Error saving business profile:", error);
      toast.error("Failed to save business profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className={DashboardTheme.layout.container}>
      <div className={DashboardTheme.layout.sectionAnimateInDelayed}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2 mb-2">
          <div>
            <h2 className={DashboardTheme.typography.sectionTitle}>Business Profile</h2>
            <p className={DashboardTheme.typography.subtext}>
              {profile?.companyName || "Configure your business details"}
            </p>
          </div>
        </div>

        <Alert>
          <AlertDescription>
            This information helps our AI agent provide personalized and professional payment reminder calls
            that represent your business appropriately.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card className={DashboardTheme.card.base}>
            <CardHeader className={DashboardTheme.card.header}>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Basic Information
              </CardTitle>
              <CardDescription>
                Tell us about your business so our agent can represent you professionally.
              </CardDescription>
            </CardHeader>
            <CardContent className={DashboardTheme.card.content + " space-y-4"}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    placeholder="Your Company Name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Select
                    value={formData.industry}
                    onValueChange={(value) => setFormData({ ...formData, industry: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDUSTRIES.map((industry) => (
                        <SelectItem key={industry} value={industry}>
                          {industry}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessDescription">
                  Business Description *
                  <span className={`ml-2 text-sm ${wordCount > 500 ? 'text-red-500' : 'text-gray-500'}`}>
                    ({wordCount}/500 words)
                  </span>
                </Label>
                <Textarea
                  id="businessDescription"
                  value={formData.businessDescription}
                  onChange={(e) => handleDescriptionChange(e.target.value)}
                  placeholder="Describe what your business does, your services, and any important context that would help our agent represent you professionally during payment reminder calls..."
                  className="min-h-[120px]"
                  required
                />
                {wordCount > 500 && (
                  <p className="text-sm text-red-500">
                    Description is too long. Please reduce by {wordCount - 500} words.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className={DashboardTheme.card.base}>
            <CardHeader className={DashboardTheme.card.header}>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>
                How customers can reach you for questions or support.
              </CardDescription>
            </CardHeader>
            <CardContent className={DashboardTheme.card.content + " space-y-4"}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="supportPhone">Support Phone *</Label>
                  <Input
                    id="supportPhone"
                    value={formData.supportPhone}
                    onChange={(e) => setFormData({ ...formData, supportPhone: e.target.value })}
                    placeholder="+1 (555) 123-4567"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supportEmail">Support Email</Label>
                  <Input
                    id="supportEmail"
                    type="email"
                    value={formData.supportEmail}
                    onChange={(e) => setFormData({ ...formData, supportEmail: e.target.value })}
                    placeholder="support@yourcompany.com"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Methods */}
          <Card className={DashboardTheme.card.base}>
            <CardHeader className={DashboardTheme.card.header}>
              <CardTitle>Preferred Payment Methods</CardTitle>
              <CardDescription>
                Select the payment methods you accept. The agent will mention these during calls.
              </CardDescription>
            </CardHeader>
            <CardContent className={DashboardTheme.card.content}>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {PAYMENT_METHODS.map((method) => (
                  <div key={method.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={method.id}
                      checked={formData.preferredPaymentMethods.includes(method.id)}
                      onCheckedChange={(checked) =>
                        handlePaymentMethodChange(method.id, checked as boolean)
                      }
                    />
                    <Label htmlFor={method.id} className="text-sm">
                      {method.label}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button type="submit" disabled={saving || wordCount > 500}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Business Profile
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}