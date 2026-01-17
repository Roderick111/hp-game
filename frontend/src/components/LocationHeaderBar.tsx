/**
 * LocationHeaderBar Component
 *
 * Displays location context and horizontal navigation tabs.
 * - Location name and description (unframed)
 * - Placeholder for future location illustration
 * - Horizontal location tabs with keyboard shortcuts
 *
 * Preserves existing keyboard shortcuts (1-9) from LocationSelector.
 *
 * @module components/LocationHeaderBar
 * @since Phase 6.5
 */

import { useEffect, useCallback } from 'react';
import { TERMINAL_THEME } from '../styles/terminal-theme';
import type { LocationInfo, LocationResponse } from '../types/investigation';

// ============================================
// Types
// ============================================

interface LocationHeaderBarProps {
  /** Array of available locations */
  locations: LocationInfo[];
  /** Current location ID */
  currentLocationId: string;
  /** Location data (name, description) */
  locationData: LocationResponse | null;
  /** Callback when location is selected */
  onSelectLocation: (locationId: string) => void;
  /** Whether location change is in progress */
  changing?: boolean;
  /** Array of visited location IDs */
  visitedLocations?: string[];
  /** Loading state */
  loading?: boolean;
  /** Error message */
  error?: string | null;
}

// ============================================
// Sub-components
// ============================================

interface LocationTabProps {
  location: LocationInfo;
  isSelected: boolean;
  index: number;
  onClick: () => void;
  disabled?: boolean;
}

function LocationTab({
  location,
  isSelected,
  index,
  onClick,
  disabled = false,
}: LocationTabProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || isSelected}
      className={`
        px-4 py-2 font-mono text-sm uppercase tracking-wide transition-all duration-200
        border-b-2
        ${isSelected
          ? 'border-amber-500 text-white font-bold cursor-default'
          : 'border-transparent text-gray-400 hover:text-amber-400 hover:border-gray-500'
        }
        ${disabled && !isSelected ? 'opacity-50 cursor-not-allowed' : ''}
        focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:outline-none
      `}
      aria-pressed={isSelected}
      aria-label={`${isSelected ? 'Current location' : 'Go to'} ${location.name}`}
    >
      <div className="flex items-center gap-2">
        {/* Location symbol - arrow for active */}
        <span className={isSelected ? 'text-amber-500' : 'text-gray-500'}>
          {isSelected ? TERMINAL_THEME.symbols.current : TERMINAL_THEME.symbols.other}
        </span>
        {/* Location name */}
        <span>{location.name}</span>
        {/* Keyboard shortcut hint */}
        <span className="text-gray-600 text-xs">[{index + 1}]</span>
      </div>
    </button>
  );
}

// ============================================
// Main Component
// ============================================

export function LocationHeaderBar({
  locations,
  currentLocationId,
  locationData,
  onSelectLocation,
  changing = false,
  visitedLocations: _visitedLocations = [],
  loading = false,
  error = null,
}: LocationHeaderBarProps) {
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

  // Loading state for location data
  if (!locationData && loading) {
    return (
      <div className="bg-gray-900 border border-gray-700 rounded p-4">
        <div className="animate-pulse text-gray-400 font-mono">
          Loading location...
        </div>
      </div>
    );
  }

  // Error state
  if (error && !locationData) {
    return (
      <div className="bg-gray-900 border border-red-700 rounded p-4">
        <span className="text-red-400 font-mono text-sm">Error: {error}</span>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border border-gray-700 rounded">
      {/* Location Context Header */}
      <div className="p-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Location Name & Description (3/4 width) */}
          <div className="lg:col-span-3">
            <h2 className={`${TERMINAL_THEME.typography.headerLg} mb-2`}>
              {locationData?.name ?? 'Unknown Location'}
            </h2>
            <p className={`${TERMINAL_THEME.typography.body} ${TERMINAL_THEME.colors.text.muted} leading-relaxed`}>
              {locationData?.description ?? 'No description available.'}
            </p>
          </div>

          {/* Illustration Placeholder (1/4 width) */}
          <div className="lg:col-span-1 hidden lg:block">
            <div className="h-24 bg-gray-800/30 border border-gray-700 rounded flex items-center justify-center">
              <span className="text-gray-600 text-xs font-mono uppercase tracking-wider">
                [Illustration]
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Horizontal Location Tabs */}
      <div className="border-t border-gray-700 px-4 py-2 flex items-center gap-1 overflow-x-auto">
        {locations.length === 0 ? (
          <span className="text-gray-500 text-sm font-mono py-2">
            No locations available
          </span>
        ) : (
          <>
            {locations.map((location, index) => (
              <LocationTab
                key={location.id}
                location={location}
                isSelected={currentLocationId === location.id}
                index={index}
                onClick={() => onSelectLocation(location.id)}
                disabled={changing}
              />
            ))}

            {/* Changing indicator */}
            {changing && (
              <span className="ml-4 text-gray-400 text-sm font-mono animate-pulse">
                Traveling...
              </span>
            )}
          </>
        )}
      </div>

      {/* Footer hint */}
      <div className="border-t border-gray-800 px-4 py-1.5">
        <span className={TERMINAL_THEME.typography.helper}>
          * Press 1-{Math.min(locations.length, 9)} to quick-select locations
        </span>
      </div>
    </div>
  );
}
