"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";

interface ReminderFiltersProps {
  dateRange: { from: Date | null; to: Date | null };
  statusFilter: string;
  onDateRangeChange: (from: Date | null, to: Date | null) => void;
  onStatusFilterChange: (status: string) => void;
}

import { DashboardTheme } from "@/lib/dashboard-theme";

// ... existing imports

export function ReminderFilters({
  dateRange,
  statusFilter,
  onDateRangeChange,
  onStatusFilterChange,
}: ReminderFiltersProps) {
  const handleQuickFilter = (days: number) => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);
    onDateRangeChange(from, to);
  };

  const handleClearDateRange = () => {
    onDateRangeChange(null, null);
  };

  return (
    <div className={DashboardTheme.filters.container}>
      <div className={DashboardTheme.filters.group}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleQuickFilter(7)}
          className={DashboardTheme.filters.buttonBase}
        >
          7D
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleQuickFilter(30)}
          className={DashboardTheme.filters.buttonBase}
        >
          30D
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleQuickFilter(90)}
          className={DashboardTheme.filters.buttonBase}
        >
          90D
        </Button>
        {(dateRange.from || dateRange.to) && (
          <div className="pl-1 border-l ml-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearDateRange}
              className="h-7 w-7 p-0 hover:bg-destructive/10 hover:text-destructive"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>

      <Select value={statusFilter} onValueChange={onStatusFilterChange}>
        <SelectTrigger className={DashboardTheme.filters.selectTrigger}>
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="queued">Queued</SelectItem>
          <SelectItem value="in_progress">In Progress</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
          <SelectItem value="skipped">Skipped</SelectItem>
          <SelectItem value="failed">Failed</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
