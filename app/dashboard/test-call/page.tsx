"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Phone, Loader2, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function TestCallPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    roomName?: string;
    sipParticipantId?: string;
    error?: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    customerName: "John Doe",
    customerPhone: "+1234567890",
    invoiceNumber: "INV-TEST-001",
    amountDue: "1500.00",
    currencyCode: "USD",
    currencySymbol: "$",
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    companyName: "Test Company Inc.",
    supportPhone: "+1987654321",
    language: "en",
    voiceGender: "female",
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTestCall = async () => {
    setLoading(true);
    setResult(null);

    try {
      // Generate a unique reminder ID for testing
      const reminderId = `test-${Date.now()}`;

      const response = await fetch("/api/livekit/dispatch-call", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reminderId,
          customerName: formData.customerName,
          customerPhone: formData.customerPhone,
          invoiceNumber: formData.invoiceNumber,
          amountDue: parseFloat(formData.amountDue),
          currencyCode: formData.currencyCode,
          currencySymbol: formData.currencySymbol,
          dueDate: formData.dueDate,
          companyName: formData.companyName,
          supportPhone: formData.supportPhone,
          language: formData.language,
          voiceGender: formData.voiceGender,
        }),
      });

      const data = await response.json();
      setResult(data);

      if (data.success) {
        toast.success("Call dispatched successfully! Customer should receive a call shortly.");
      } else {
        toast.error(data.error || "Failed to dispatch call");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      setResult({
        success: false,
        error: errorMessage,
      });
      toast.error("Error dispatching call");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          This makes real phone calls. Make sure you have permission to call the number you enter.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
            <CardDescription>Enter customer details for the test call</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customerName">Customer Name</Label>
              <Input
                id="customerName"
                value={formData.customerName}
                onChange={(e) => handleInputChange("customerName", e.target.value)}
                placeholder="John Doe"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerPhone">Phone Number (E.164 format)</Label>
              <Input
                id="customerPhone"
                value={formData.customerPhone}
                onChange={(e) => handleInputChange("customerPhone", e.target.value)}
                placeholder="+1234567890"
              />
              <p className="text-xs text-muted-foreground">
                Must start with + and country code (e.g., +1 for US)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select
                value={formData.language}
                onValueChange={(value) => handleInputChange("language", value)}
              >
                <SelectTrigger id="language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="hi">Hindi (हिंदी)</SelectItem>
                  <SelectItem value="hinglish">Hinglish (Mix)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="voiceGender">Voice Gender</Label>
              <Select
                value={formData.voiceGender}
                onValueChange={(value) => handleInputChange("voiceGender", value)}
              >
                <SelectTrigger id="voiceGender">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Invoice Information */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice Information</CardTitle>
            <CardDescription>Enter invoice details for the test call</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invoiceNumber">Invoice Number</Label>
              <Input
                id="invoiceNumber"
                value={formData.invoiceNumber}
                onChange={(e) => handleInputChange("invoiceNumber", e.target.value)}
                placeholder="INV-TEST-001"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amountDue">Amount Due</Label>
              <Input
                id="amountDue"
                type="number"
                step="0.01"
                value={formData.amountDue}
                onChange={(e) => handleInputChange("amountDue", e.target.value)}
                placeholder="1500.00"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currencyCode">Currency Code</Label>
                <Select
                  value={formData.currencyCode}
                  onValueChange={(value) => {
                    handleInputChange("currencyCode", value);
                    // Auto-update symbol
                    const symbols: Record<string, string> = {
                      USD: "$",
                      EUR: "€",
                      GBP: "£",
                      INR: "₹",
                      JPY: "¥",
                    };
                    handleInputChange("currencySymbol", symbols[value] || "$");
                  }}
                >
                  <SelectTrigger id="currencyCode">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="INR">INR</SelectItem>
                    <SelectItem value="JPY">JPY</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="currencySymbol">Symbol</Label>
                <Input
                  id="currencySymbol"
                  value={formData.currencySymbol}
                  onChange={(e) => handleInputChange("currencySymbol", e.target.value)}
                  placeholder="$"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => handleInputChange("dueDate", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Company Information */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
            <CardDescription>Enter your company details</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e) => handleInputChange("companyName", e.target.value)}
                placeholder="Test Company Inc."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="supportPhone">Support Phone</Label>
              <Input
                id="supportPhone"
                value={formData.supportPhone}
                onChange={(e) => handleInputChange("supportPhone", e.target.value)}
                placeholder="+1987654321"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Button */}
      <Card>
        <CardContent className="pt-6">
          <Button
            onClick={handleTestCall}
            disabled={loading}
            size="lg"
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Dispatching Call...
              </>
            ) : (
              <>
                <Phone className="mr-2 h-5 w-5" />
                Make Test Call
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
