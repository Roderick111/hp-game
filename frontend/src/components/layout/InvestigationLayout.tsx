/**
 * InvestigationLayout Component
 *
 * Orchestrates the 2-part investigation layout:
 * - Main Content: 70% narrative panel (left)
 * - Sidebar: 30% compact panels (right)
 *
 * Uses a 10-column grid for precise 70/30 split on desktop.
 * Stacks vertically on mobile for responsive design.
 *
 * @module components/layout/InvestigationLayout
 */

import type { ReactNode } from "react";
import { useTheme } from "../../context/useTheme";

// ============================================
// Types
// ============================================

interface InvestigationLayoutProps {
  /** Main content area (LocationView narrative panel) */
  mainContent: ReactNode;
  /** Sidebar content (Witnesses, Evidence, Quick Help) */
  sidebar: ReactNode;
}

// ============================================
// Component
// ============================================

export function InvestigationLayout({
  mainContent,
  sidebar,
}: InvestigationLayoutProps) {
  const { theme } = useTheme();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-10 gap-4">
      {/* Main Content: 70% (7 of 10 columns) */}
      <div className="lg:col-span-7 relative">
        {/* Fade gradient below header — scoped to main content only */}
        <div
          className={`pointer-events-none sticky top-[4.5rem] h-8 bg-gradient-to-b ${theme.colors.gradient.fromBg} to-transparent z-10 -mb-10`}
        />
        {mainContent}
      </div>

      {/* Sidebar: 30% (3 of 10 columns) — sticky to viewport */}
      <div className="lg:col-span-3">
        <div className="lg:sticky lg:top-[5rem] space-y-4">{sidebar}</div>
      </div>
    </div>
  );
}
