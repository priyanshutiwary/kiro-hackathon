// Centralized Brand Color Scheme
// Sophisticated Navy Blue + White - Professional & Trustworthy
// Perfect for financial/payment applications

export const brandColors = {
  // Primary: Slate/Dark Gray (Professional & Neutral)
  primary: {
    from: "from-slate-800",
    to: "to-slate-900",
    gradient: "bg-gradient-to-r from-slate-800 to-slate-900 dark:from-slate-700 dark:to-slate-800",
    gradientBr: "bg-gradient-to-br from-slate-800 to-slate-900 dark:from-slate-700 dark:to-slate-800",
    text: "text-slate-900 dark:text-slate-100",
    bg: "bg-slate-900 dark:bg-slate-700",
    hover: "hover:bg-slate-800 dark:hover:bg-slate-600",
  },

  // Secondary: Vibrant Blue (Works in both modes)
  secondary: {
    from: "from-blue-600",
    to: "to-blue-700",
    gradient: "bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600",
    gradientBr: "bg-gradient-to-br from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600",
    text: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-600 dark:bg-blue-500",
  },

  // Accent: Teal (Fresh & Modern)
  accent: {
    from: "from-teal-600",
    to: "to-teal-700",
    gradient: "bg-gradient-to-r from-teal-600 to-teal-700 dark:from-teal-500 dark:to-teal-600",
    gradientBr: "bg-gradient-to-br from-teal-600 to-teal-700 dark:from-teal-500 dark:to-teal-600",
    text: "text-teal-600 dark:text-teal-400",
    bg: "bg-teal-600 dark:bg-teal-500",
  },

  // Success: Emerald Green (Payment Success)
  success: {
    from: "from-emerald-600",
    to: "to-emerald-700",
    gradient: "bg-gradient-to-r from-emerald-600 to-emerald-700 dark:from-emerald-500 dark:to-emerald-600",
    gradientBr: "bg-gradient-to-br from-emerald-600 to-emerald-700 dark:from-emerald-500 dark:to-emerald-600",
    text: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-600 dark:bg-emerald-500",
  },

  // Feature card colors
  features: {
    voice: "from-blue-900 to-blue-950 dark:from-blue-600 dark:to-blue-700",
    integration: "from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600",
    scheduling: "from-teal-600 to-teal-700 dark:from-teal-500 dark:to-teal-600",
    security: "from-slate-700 to-slate-800 dark:from-slate-600 dark:to-slate-700",
    analytics: "from-indigo-600 to-indigo-700 dark:from-indigo-500 dark:to-indigo-600",
    success: "from-emerald-600 to-emerald-700 dark:from-emerald-500 dark:to-emerald-600",
  },

  // Backgrounds - Clean & Professional
  backgrounds: {
    hero: "bg-white dark:bg-slate-950",
    section: "bg-slate-50 dark:bg-slate-900",
    card: "bg-white dark:bg-slate-900",
    glass: "bg-white/95 backdrop-blur-xl dark:bg-slate-900/95",
  },

  // Text colors - Crisp & Readable
  text: {
    primary: "text-slate-900 dark:text-white",
    secondary: "text-slate-700 dark:text-slate-200",
    muted: "text-slate-600 dark:text-slate-400",
    gradient: "text-slate-900 dark:text-white",
  },

  // Border colors
  border: {
    default: "border-slate-200 dark:border-slate-800",
    accent: "border-blue-200 dark:border-blue-800",
    glass: "border-slate-200/60 dark:border-slate-800/60",
  },
};

// Helper function to get gradient classes
export const getGradient = (type: keyof typeof brandColors.features) => {
  return brandColors.features[type];
};
