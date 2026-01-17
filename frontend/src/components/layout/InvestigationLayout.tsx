/**
 * InvestigationLayout Component
 *
 * Orchestrates the 3-part investigation layout:
 * - Header: Location context + horizontal tabs
 * - Main Content: 70% narrative panel (left)
 * - Sidebar: 30% compact panels (right)
 *
 * Uses a 10-column grid for precise 70/30 split on desktop.
 * Stacks vertically on mobile for responsive design.
 *
 * @module components/layout/InvestigationLayout
 * @since Phase 6.5
 */

import type { ReactNode } from 'react';

// ============================================
// Types
// ============================================

interface InvestigationLayoutProps {
  /** Header content (LocationHeaderBar with horizontal tabs) */
  header: ReactNode;
  /** Main content area (LocationView narrative panel) */
  mainContent: ReactNode;
  /** Sidebar content (Witnesses, Evidence, Quick Help) */
  sidebar: ReactNode;
}

// ============================================
// Component
// ============================================

export function InvestigationLayout({
  header,
  mainContent,
  sidebar,
}: InvestigationLayoutProps) {
  return (
    <div className="space-y-4">
      {/* Header: Full width - Location context + horizontal tabs */}
      <div className="w-full">{header}</div>

      {/* Main Layout: 70/30 split on desktop, stacked on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-4">
        {/* Main Content: 70% (7 of 10 columns) */}
        <div className="lg:col-span-7">{mainContent}</div>

        {/* Sidebar: 30% (3 of 10 columns) */}
        <div className="lg:col-span-3 space-y-4">{sidebar}</div>
      </div>
    </div>
  );
}
