// Force all API routes to be dynamic (not pre-rendered at build time)
// This prevents build-time errors when database connections aren't available
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default function ApiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
