
import { brandColors } from "@/lib/brand-colors";

export const DashboardTheme = {
    layout: {
        container: "container mx-auto py-8 space-y-8",
        headerFlex: "flex flex-col md:flex-row md:items-center justify-between gap-4",
        sectionAnimateIn: "animate-in fade-in slide-in-from-bottom-4 duration-500",
        sectionAnimateInDelayed: "animate-in fade-in slide-in-from-bottom-6 duration-700",
        gridcols3: "grid grid-cols-1 md:grid-cols-3 gap-4",
        colSpan1: "md:col-span-1",
        colSpan2: "md:col-span-2",
    },
    card: {
        base: "rounded-xl border border-border/60 bg-card/30 overflow-hidden",
        gradient: "bg-gradient-to-br from-card to-card/50 border-border/60 shadow-sm",
        dashed: "border-dashed border-border/60 bg-muted/10 shadow-none",
        header: "pb-2",
        content: "p-6 pt-0",
        contentCompact: "p-0",
        titleWithIcon: "text-sm font-medium text-muted-foreground flex items-center gap-2",
        metricValue: "text-3xl font-bold tracking-tight",
        metricLabel: "text-xs text-muted-foreground mt-1",
    },
    table: {
        wrapper: "rounded-xl border border-border/60 overflow-hidden bg-card/30",
        headerRow: "hover:bg-transparent border-b border-border/60 bg-muted/20",
        headerCell: "h-11 text-xs font-semibold uppercase tracking-wider text-foreground/80 dark:text-muted-foreground",
        row: "hover:bg-muted/30 border-b border-border/40 last:border-0 transition-colors",
        cell: "text-sm font-medium text-foreground",
        cellMuted: "text-sm text-muted-foreground",
    },
    badge: {
        base: "flex items-center gap-1.5 w-fit font-normal",
        pending: brandColors.badge.pending,
        queued: brandColors.badge.queued,
        in_progress: brandColors.badge.inProgress,
        completed: brandColors.badge.completed,
        skipped: brandColors.badge.skipped,
        failed: brandColors.badge.failed,
        overdue: brandColors.badge.overdue,
        upcoming: brandColors.badge.upcoming,
        pill: brandColors.badge.pill,
    },
    filters: {
        container: "flex flex-col sm:flex-row gap-4 items-start sm:items-center bg-card/50 p-1 rounded-lg border border-border/50",
        group: "flex items-center p-1 bg-muted/50 rounded-md",
        buttonBase: "h-7 text-xs hover:bg-background hover:shadow-sm transition-all",
        selectTrigger: "w-[140px] h-9 border-none bg-transparent hover:bg-muted/50 focus:ring-0 shadow-none text-xs font-medium",
    },
    typography: {
        pageTitle: "text-muted-foreground/80 mt-1",
        sectionTitle: "text-lg font-semibold tracking-tight",
        subtext: "text-sm text-muted-foreground",
        errorTitle: "text-destructive font-medium",
    }
};

