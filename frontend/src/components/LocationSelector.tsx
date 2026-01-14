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
import { TERMINAL_THEME } from '../styles/terminal-theme';
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
}

function LocationButton({
  location,
  isSelected,
  index,
  onClick,
  disabled = false,
}: LocationButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || isSelected}
      className={`
        w-full text-left p-3 rounded border transition-colors
        ${isSelected
          ? 'bg-gray-800 border-gray-500 cursor-default'
          : 'bg-gray-800/50 border-gray-700 hover:border-gray-300 hover:bg-gray-800'
        }
        ${disabled && !isSelected ? 'opacity-50 cursor-not-allowed' : ''}
        focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:outline-none
      `}
      aria-pressed={isSelected}
      aria-label={`${isSelected ? 'Current location' : 'Go to'} ${location.name}`}
    >
      <div className="flex items-center gap-2">
        {/* Keyboard shortcut number */}
        <span className="text-gray-600 text-xs font-mono">[{index + 1}]</span>
        {/* Location symbol - arrow for active */}
        <span className={isSelected ? 'text-white' : 'text-gray-400'}>
          {isSelected ? TERMINAL_THEME.symbols.current : TERMINAL_THEME.symbols.other}
        </span>
        {/* Location name */}
        <span className={isSelected ? 'text-white font-bold' : 'text-amber-400 hover:text-amber-300 transition-colors'}>
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
}: LocationSelectorProps) {
  // Keyboard shortcuts: 1-9 to select locations
  const handleKeydown = useCallback(
    (e: KeyboardEvent) => {
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
      <TerminalPanel title="LOCATIONS">
        <div className="flex items-center justify-center py-8">
          <div className="animate-pulse text-gray-400">Loading locations...</div>
        </div>
      </TerminalPanel>
    );
  }

  // Error state
  if (error && locations.length === 0) {
    return (
      <TerminalPanel title="LOCATIONS">
        <div className="p-4 bg-red-900/30 border border-red-700 rounded text-red-400 text-sm">
          <span className="font-bold">Error:</span> {error}
        </div>
      </TerminalPanel>
    );
  }

  // Empty state
  if (locations.length === 0) {
    return (
      <TerminalPanel title="LOCATIONS">
        <p className="text-gray-500 text-sm italic text-center py-4">
          No locations available for this case.
        </p>
      </TerminalPanel>
    );
  }

  return (
    <TerminalPanel
      title="LOCATIONS"
      footer={`Press 1-${Math.min(locations.length, 9)} to quick-select`}
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
          />
        ))}
      </div>

      {/* Changing indicator */}
      {changing && (
        <div className="mt-3 text-center">
          <span className="text-gray-400 text-sm animate-pulse">
            Traveling...
          </span>
        </div>
      )}
    </TerminalPanel>
  );
}
