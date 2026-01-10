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
    <div className="flex gap-2 flex-wrap">
      <div className="flex gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleQuickFilter(7)}
        >
          Last 7 Days
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleQuickFilter(30)}
        >
          Last 30 Days
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleQuickFilter(90)}
        >
          Last 90 Days
        </Button>
        {(dateRange.from || dateRange.to) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearDateRange}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <Select value={statusFilter} onValueChange={onStatusFilterChange}>
        <SelectTrigger className="w-[150px]">
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
