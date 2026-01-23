/**
 * LocationSelector Component
 *
 * Displays available locations in a minimal B&W terminal aesthetic sidebar.
 * Allows player to navigate between locations via clickable buttons.
 * Uses centralized design system for consistent styling.
 *
 * @module components/LocationSelector
 * @since Phase 5.2
 * @updated Phase 5.3.1 (Design System)
 */

import { useEffect, useCallback } from 'react';
import { TerminalPanel } from './ui/TerminalPanel';
import { useTheme } from '../context/ThemeContext';
import type { TerminalTheme } from '../styles/terminal-theme';
import type { LocationInfo } from '../types/investigation';

// Re-export LocationInfo for convenience
export type { LocationInfo } from '../types/investigation';

// ============================================
// Types
// ============================================

interface LocationSelectorProps {
  /** Array of available locations */
  locations: LocationInfo[];
  /** Current location ID */
  currentLocationId: string;
  /** Array of visited location IDs */
  visitedLocations?: string[];
  /** Loading state */
  loading?: boolean;
  /** Error message */
  error?: string | null;
  /** Callback when location is selected */
  onSelectLocation: (locationId: string) => void;
  /** Whether location change is in progress */
  changing?: boolean;
  /** Whether panel can be collapsed */
  collapsible?: boolean;
  /** Initial collapsed state */
  defaultCollapsed?: boolean;
  /** Optional key to persist collapsed state */
  persistenceKey?: string;
}

// ============================================
// Sub-components
// ============================================

interface LocationButtonProps {
  location: LocationInfo;
  isSelected: boolean;
  index: number;
  onClick: () => void;
  disabled?: boolean;
  theme: TerminalTheme;
}

function LocationButton({
  location,
  isSelected,
  index,
  onClick,
  disabled = false,
  theme,
}: LocationButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || isSelected}
      className={`
        w-full text-left p-3 rounded border transition-colors
        ${isSelected
          ? `${theme.colors.bg.hover} ${theme.colors.border.hover} cursor-default`
          : `${theme.colors.bg.semiTransparent} ${theme.colors.border.default} ${theme.colors.interactive.borderHover} ${theme.colors.interactive.hover}`
        }
        ${disabled && !isSelected ? 'opacity-50 cursor-not-allowed' : ''}
        focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:outline-none
      `}
      aria-pressed={isSelected}
      aria-label={`${isSelected ? 'Current location' : 'Go to'} ${location.name}`}
    >
      <div className="flex items-center gap-2">
        {/* Keyboard shortcut number */}
        <span className={`${theme.colors.text.muted} text-xs font-mono`}>[{index + 1}]</span>
        {/* Location symbol - arrow for active */}
        <span className={isSelected ? theme.colors.text.primary : theme.colors.text.tertiary}>
          {isSelected ? theme.symbols.current : theme.symbols.other}
        </span>
        {/* Location name */}
        <span className={isSelected ? `${theme.colors.text.primary} font-bold` : `${theme.colors.interactive.text} ${theme.colors.interactive.hover} transition-colors`}>
          {location.name}
        </span>
      </div>
    </button>
  );
}

// ============================================
// Main Component
// ============================================

export function LocationSelector({
  locations,
  currentLocationId,
  visitedLocations: _visitedLocations = [],
  loading = false,
  error = null,
  onSelectLocation,
  changing = false,
  collapsible = false,
  defaultCollapsed = false,
  persistenceKey,
}: LocationSelectorProps) {
  const { theme } = useTheme();

  // Keyboard shortcuts: 1-9 to select locations
  const handleKeydown = useCallback(
    (e: KeyboardEvent) => {
      // Ignore if user is typing in an input/textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      // Ignore if a modal is open (common role="dialog")
      if (document.querySelector('[role="dialog"]')) {
        return;
      }

      // Only handle number keys 1-9
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= 9 && num <= locations.length) {
        e.preventDefault();
        const targetLocation = locations[num - 1];
        if (targetLocation && targetLocation.id !== currentLocationId) {
          onSelectLocation(targetLocation.id);
        }
      }
    },
    [locations, currentLocationId, onSelectLocation]
  );

  // Register keyboard listener
  useEffect(() => {
    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, [handleKeydown]);

  // Loading state
  if (loading && locations.length === 0) {
    return (
      <TerminalPanel
        title="LOCATIONS"
        collapsible={collapsible}
        defaultCollapsed={defaultCollapsed}
        persistenceKey={persistenceKey}
      >
        <div className="flex items-center justify-center py-8">
          <div className={`animate-pulse ${theme.colors.text.tertiary}`}>Loading locations...</div>
        </div>
      </TerminalPanel>
    );
  }

  // Error state
  if (error && locations.length === 0) {
    return (
      <TerminalPanel
        title="LOCATIONS"
        collapsible={collapsible}
        defaultCollapsed={defaultCollapsed}
        persistenceKey={persistenceKey}
      >
        <div className={`p-4 ${theme.colors.state.error.bg} border ${theme.colors.state.error.border} rounded ${theme.colors.state.error.text} text-sm`}>
          <span className="font-bold">Error:</span> {error}
        </div>
      </TerminalPanel>
    );
  }

  // Empty state
  if (locations.length === 0) {
    return (
      <TerminalPanel
        title="LOCATIONS"
        collapsible={collapsible}
        defaultCollapsed={defaultCollapsed}
        persistenceKey={persistenceKey}
      >
        <p className={`${theme.colors.text.muted} text-sm italic text-center py-4`}>
          No locations available for this case.
        </p>
      </TerminalPanel>
    );
  }

  return (
    <TerminalPanel
      title="LOCATIONS"
      footer={`Press 1-${Math.min(locations.length, 9)} to quick-select`}
      collapsible={collapsible}
      defaultCollapsed={defaultCollapsed}
      persistenceKey={persistenceKey}
    >
      {/* Location List */}
      <div className="space-y-2">
        {locations.map((location, index) => (
          <LocationButton
            key={location.id}
            location={location}
            isSelected={currentLocationId === location.id}
            index={index}
            onClick={() => onSelectLocation(location.id)}
            disabled={changing}
            theme={theme}
          />
        ))}
      </div>

      {/* Changing indicator */}
      {changing && (
        <div className="mt-3 text-center">
          <span className={`${theme.colors.text.tertiary} text-sm animate-pulse`}>
            Traveling...
          </span>
        </div>
      )}
    </TerminalPanel>
  );
}
