// Centralized Brand Color System
// Single source of truth for all color utilities across the app.
// CSS variables in globals.css define the raw values; this file maps them
// to reusable Tailwind class strings for components.

export const brandColors = {
  // ── Primary: Professional Blue ──
  primary: {
    from: "from-blue-600",
    to: "to-blue-700",
    gradient:
      "bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600",
    gradientBr:
      "bg-gradient-to-br from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600",
    text: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-600 dark:bg-blue-500",
    hover: "hover:bg-blue-700 dark:hover:bg-blue-600",
  },

  // ── Secondary: Slate Neutral ──
  secondary: {
    from: "from-slate-600",
    to: "to-slate-700",
    gradient:
      "bg-gradient-to-r from-slate-600 to-slate-700 dark:from-slate-500 dark:to-slate-600",
    gradientBr:
      "bg-gradient-to-br from-slate-600 to-slate-700 dark:from-slate-500 dark:to-slate-600",
    text: "text-slate-600 dark:text-slate-400",
    bg: "bg-slate-600 dark:bg-slate-500",
  },

  // ── Accent: Fuchsia/Pink ──
  accent: {
    from: "from-fuchsia-600",
    to: "to-fuchsia-700",
    gradient:
      "bg-gradient-to-r from-fuchsia-600 to-fuchsia-700 dark:from-fuchsia-500 dark:to-fuchsia-600",
    gradientBr:
      "bg-gradient-to-br from-fuchsia-600 to-fuchsia-700 dark:from-fuchsia-500 dark:to-fuchsia-600",
    text: "text-fuchsia-600 dark:text-fuchsia-400",
    bg: "bg-fuchsia-600 dark:bg-fuchsia-500",
  },

  // ── Success: Emerald Green ──
  success: {
    from: "from-emerald-600",
    to: "to-emerald-700",
    gradient:
      "bg-gradient-to-r from-emerald-600 to-emerald-700 dark:from-emerald-500 dark:to-emerald-600",
    gradientBr:
      "bg-gradient-to-br from-emerald-600 to-emerald-700 dark:from-emerald-500 dark:to-emerald-600",
    text: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-600 dark:bg-emerald-500",
  },

  // ── Feature card colors ──
  features: {
    voice:
      "from-blue-800 to-blue-900 dark:from-blue-600 dark:to-blue-700",
    integration:
      "from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600",
    scheduling:
      "from-slate-600 to-slate-700 dark:from-slate-500 dark:to-slate-600",
    security:
      "from-slate-700 to-slate-800 dark:from-slate-600 dark:to-slate-700",
    analytics:
      "from-indigo-600 to-indigo-700 dark:from-indigo-500 dark:to-indigo-600",
    success:
      "from-emerald-600 to-emerald-700 dark:from-emerald-500 dark:to-emerald-600",
  },

  // ── Backgrounds ──
  backgrounds: {
    hero: "bg-slate-50 dark:bg-slate-900",
    section: "bg-white dark:bg-slate-900/50",
    card: "bg-white dark:bg-slate-800",
    glass: "bg-white/95 backdrop-blur-xl dark:bg-slate-900/95",
  },

  // ── Text colors ──
  text: {
    primary: "text-slate-900 dark:text-white",
    secondary: "text-slate-700 dark:text-slate-200",
    muted: "text-slate-500 dark:text-slate-400",
    gradient: "text-slate-900 dark:text-white",
  },

  // ── Border colors ──
  border: {
    default: "border-slate-200 dark:border-slate-700",
    accent: "border-blue-200 dark:border-blue-800/50",
    glass: "border-slate-200/60 dark:border-slate-700/60",
  },

  // ── Semantic status colors (for icons and small indicators) ──
  status: {
    success: "text-green-500",
    error: "text-red-500",
    warning: "text-amber-500",
    info: "text-blue-500",
    purple: "text-purple-500",

    successBg: "bg-green-500/10",
    errorBg: "bg-red-500/10",
    warningBg: "bg-amber-500/10",
    infoBg: "bg-blue-500/10",
  },

  // ── Chat bubble colors ──
  chat: {
    userBubble: "bg-primary text-primary-foreground rounded-2xl rounded-br-sm",
    botBubble: "bg-muted text-foreground rounded-2xl rounded-bl-sm",
  },

  // ── Skeleton / loading state ──
  skeleton: {
    base: "bg-muted",
  },

  // ── Badge colors (status pills) ──
  badge: {
    active:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50",
    paid: "bg-emerald-500 hover:bg-emerald-600 text-white",
    partiallyPaid: "bg-amber-500 hover:bg-amber-600 text-white",
    overdue:
      "border-red-500/20 text-red-600 dark:text-red-400 bg-red-500/10 hover:bg-red-500/20",
    pending:
      "bg-slate-500/10 text-slate-600 dark:text-slate-400 hover:bg-slate-500/20 border-slate-500/20",
    queued:
      "bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 border-blue-500/20",
    inProgress:
      "bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 border-amber-500/20",
    completed:
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/20",
    skipped:
      "bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/20",
    failed:
      "bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/20",
    upcoming:
      "border-blue-500/20 text-blue-600 dark:text-blue-400 bg-blue-500/10 hover:bg-blue-500/20",
    savings: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
    pill: "inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium ring-1 ring-inset ring-muted-foreground/10",
  },

  // ── Theme toggle ──
  toggle: {
    dark: "hover:bg-inherit border-border bg-background",
    light: "hover:bg-inherit border-border bg-inherit",
  },

  // ── Savings / highlight card ──
  highlight: {
    successCard: "border-green-200 bg-green-50/50",
    successIcon: "rounded-full bg-green-100 p-2",
    successText: "font-semibold text-green-700",
  },
};

// Helper function to get gradient classes
export const getGradient = (type: keyof typeof brandColors.features) => {
  return brandColors.features[type];
};
