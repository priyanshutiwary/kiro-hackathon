// Centralized Brand Font System
// All font-related utilities and stacks in one place

export const brandFonts = {
    // Tailwind utility classes
    sans: "font-sans",
    mono: "font-mono",

    // Compound heading/body classes
    heading: "font-sans font-medium tracking-tight",
    body: "font-sans antialiased",
    caption: "font-sans text-xs",
    code: "font-mono text-sm",

    // // Font stacks for inline HTML (emails)
    emailStack: "'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    monoStack: "'SF Mono', Menlo, monospace",
};
