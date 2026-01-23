import { IconTrendingUp } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MessageSquare, Phone, CheckCircle, DollarSign } from "lucide-react";

interface ChannelStatsProps {
  stats: {
    byChannel: {
      smsCount: number;
      voiceCount: number;
      completedSMS: number;
      completedVoice: number;
      failedSMS: number;
      failedVoice: number;
    };
  };
}

// Cost estimates (in USD)
const SMS_COST = 0.0075;
const VOICE_COST = 0.10;

export function ChannelStats({ stats }: ChannelStatsProps) {
  const { smsCount, voiceCount, completedSMS, completedVoice, failedSMS, failedVoice } = stats.byChannel;

  // Calculate success rates
  const smsAttempted = completedSMS + failedSMS;
  const voiceAttempted = completedVoice + failedVoice;
  const smsSuccessRate = smsAttempted > 0 ? (completedSMS / smsAttempted) * 100 : 0;
  const voiceSuccessRate = voiceAttempted > 0 ? (completedVoice / voiceAttempted) * 100 : 0;

  // Calculate estimated costs
  const smsCost = smsCount * SMS_COST;
  const voiceCost = voiceCount * VOICE_COST;
  const totalCost = smsCost + voiceCost;

  // Calculate potential savings if all were voice
  const allVoiceCost = (smsCount + voiceCount) * VOICE_COST;
  const savings = allVoiceCost - totalCost;
  const savingsPercentage = allVoiceCost > 0 ? (savings / allVoiceCost) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Channel Performance</h3>
          <p className="text-sm text-muted-foreground">
            SMS vs Voice reminder statistics
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* SMS Count */}
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>SMS Reminders</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-500" />
              {smsCount}
            </CardTitle>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="text-muted-foreground">
              {completedSMS} delivered • {failedSMS} failed
            </div>
          </CardFooter>
        </Card>

        {/* Voice Count */}
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Voice Reminders</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums flex items-center gap-2">
              <Phone className="h-5 w-5 text-green-500" />
              {voiceCount}
            </CardTitle>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="text-muted-foreground">
              {completedVoice} completed • {failedVoice} failed
            </div>
          </CardFooter>
        </Card>

        {/* SMS Success Rate */}
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>SMS Success Rate</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-blue-500" />
              {smsSuccessRate.toFixed(1)}%
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                {smsSuccessRate >= 70 ? (
                  <>
                    <IconTrendingUp />
                    Good
                  </>
                ) : (
                  "Needs Attention"
                )}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="text-muted-foreground">
              Based on {smsAttempted} attempts
            </div>
          </CardFooter>
        </Card>

        {/* Voice Success Rate */}
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Voice Success Rate</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              {voiceSuccessRate.toFixed(1)}%
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                {voiceSuccessRate >= 70 ? (
                  <>
                    <IconTrendingUp />
                    Good
                  </>
                ) : (
                  "Needs Attention"
                )}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="text-muted-foreground">
              Based on {voiceAttempted} attempts
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* Cost Tracking Section */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Estimated Costs */}
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Estimated Monthly Cost</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              ${totalCost.toFixed(2)}
            </CardTitle>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="text-muted-foreground">
              SMS: ${smsCost.toFixed(2)} • Voice: ${voiceCost.toFixed(2)}
            </div>
          </CardFooter>
        </Card>

        {/* Cost Savings */}
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Smart Mode Savings</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              ${savings.toFixed(2)}
            </CardTitle>
            <CardAction>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <IconTrendingUp />
                {savingsPercentage.toFixed(0)}% saved
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="text-muted-foreground">
              vs. voice-only approach
            </div>
          </CardFooter>
        </Card>

        {/* Monthly Usage Summary */}
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Total Reminders</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums">
              {smsCount + voiceCount}
            </CardTitle>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="text-muted-foreground">
              {smsCount > 0 && voiceCount > 0 ? (
                <>
                  {((smsCount / (smsCount + voiceCount)) * 100).toFixed(0)}% SMS • {((voiceCount / (smsCount + voiceCount)) * 100).toFixed(0)}% Voice
                </>
              ) : smsCount > 0 ? (
                "100% SMS"
              ) : voiceCount > 0 ? (
                "100% Voice"
              ) : (
                "No reminders yet"
              )}
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* Cost Savings Highlight */}
      {savings > 0 && (
        <Card className="border-green-200 bg-green-50/50">
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-green-100 p-2">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg">Cost Savings with Smart Mode</CardTitle>
                <CardDescription className="mt-1">
                  By using SMS for early reminders and voice for urgent ones, you&apos;re saving approximately{" "}
                  <span className="font-semibold text-green-700">${savings.toFixed(2)}</span> per month
                  ({savingsPercentage.toFixed(0)}% reduction) compared to using voice calls only.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}
