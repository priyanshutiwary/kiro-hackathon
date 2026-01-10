import { IconTrendingUp, IconTrendingDown } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Phone, CheckCircle, XCircle, Clock } from "lucide-react";

interface ReminderStatsProps {
  stats: {
    overall: {
      total: number;
      completed: number;
      skipped: number;
      failed: number;
      pending: number;
      queued: number;
      inProgress: number;
      successRate: number;
    };
    customerResponses: Record<string, number>;
    byReminderType: Record<string, {
      total: number;
      completed: number;
      failed: number;
      skipped: number;
      pending: number;
    }>;
  };
}

export function ReminderStats({ stats }: ReminderStatsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Reminders</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums flex items-center gap-2">
            <Phone className="h-5 w-5" />
            {stats.overall.total}
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="text-muted-foreground">
            {stats.overall.pending} pending • {stats.overall.completed} completed
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Success Rate</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            {stats.overall.successRate.toFixed(1)}%
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {stats.overall.successRate >= 70 ? (
                <>
                  <IconTrendingUp />
                  Good
                </>
              ) : (
                <>
                  <IconTrendingDown />
                  Needs Attention
                </>
              )}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="text-muted-foreground">
            Based on completed calls
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Customer Responses</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {stats.customerResponses.will_pay_today || 0}
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="text-muted-foreground">
            Will pay today
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Failed Calls</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-500" />
            {stats.overall.failed}
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="text-muted-foreground">
            {stats.overall.skipped} skipped (already paid)
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
