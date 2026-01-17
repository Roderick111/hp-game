/**
 * useLocation Hook
 *
 * Manages location state including:
 * - Loading available locations for a case
 * - Changing location via API call
 * - Tracking current location and visited locations
 *
 * @module hooks/useLocation
 * @since Phase 5.2
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getLocations, changeLocation } from '../api/client';
import type { LocationInfo, ChangeLocationResponse } from '../types/investigation';

// Re-export LocationInfo for convenience
export type { LocationInfo } from '../types/investigation';

// ============================================
// Types
// ============================================

interface UseLocationOptions {
  /** Case ID to load locations for */
  caseId: string;
  /** Initial location ID (defaults to 'library') */
  initialLocationId?: string;
  /** Player ID for state persistence (defaults to 'default') */
  playerId?: string;
  /** Session ID for state tracking */
  sessionId?: string;
  /** Auto-load locations on mount (defaults to true) */
  autoLoad?: boolean;
  /** Callback when location changes successfully */
  onLocationChange?: (locationId: string, response: ChangeLocationResponse) => void;
}

interface UseLocationReturn {
  /** Available locations for this case */
  locations: LocationInfo[];
  /** Current location ID */
  currentLocationId: string;
  /** Array of visited location IDs */
  visitedLocations: string[];
  /** Whether locations are loading */
  loading: boolean;
  /** Whether location change is in progress */
  changing: boolean;
  /** Error message if any operation failed */
  error: string | null;
  /** Change to a new location */
  handleLocationChange: (locationId: string) => Promise<void>;
  /** Manually set the current location ID (internal sync) */
  setCurrentLocationId: (locationId: string) => void;
  /** Reload locations from backend */
  reloadLocations: () => Promise<void>;
  /** Clear error state */
  clearError: () => void;
}

// ============================================
// Hook
// ============================================

export function useLocation({
  caseId,
  initialLocationId = '', // Phase 5.2: Empty string means let backend decide, or wait for fetch
  playerId = 'default',
  sessionId,
  autoLoad = true,
  onLocationChange,
}: UseLocationOptions): UseLocationReturn {
  // State
  const [locations, setLocations] = useState<LocationInfo[]>([]);
  const [currentLocationId, setCurrentLocationId] = useState(initialLocationId);
  const [visitedLocations, setVisitedLocations] = useState<string[]>(initialLocationId ? [initialLocationId] : []);
  const [loading, setLoading] = useState(true);
  const [changing, setChanging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ref to track latest locations for use in callbacks (avoids stale closure)
  const locationsRef = useRef<LocationInfo[]>(locations);
  useEffect(() => {
    locationsRef.current = locations;
  }, [locations]);

  // Load locations from backend
  const loadLocations = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const locs = await getLocations(caseId, sessionId);
      setLocations(locs);

      // If no current location set (initial load), default to the first available location
      // Use functional update to get the latest currentLocationId value
      setCurrentLocationId((prevLocationId) => {
        if (!prevLocationId && locs.length > 0) {
          const firstLocationId = locs[0].id;
          setVisitedLocations(prev => prev.includes(firstLocationId) ? prev : [...prev, firstLocationId]);
          return firstLocationId;
        }
        return prevLocationId;
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load locations';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [caseId, sessionId]);

  // Auto-load on mount
  useEffect(() => {
    if (autoLoad) {
      void loadLocations();
    }
  }, [autoLoad, loadLocations]);

  // Handle location change
  const handleLocationChange = useCallback(
    async (locationId: string) => {
      // Skip if already at this location
      if (locationId === currentLocationId) {
        return;
      }

      // Use ref to get latest locations (avoids stale closure issues)
      const currentLocations = locationsRef.current;
      const targetLocation = currentLocations.find((loc) => loc.id === locationId);
      if (!targetLocation) {
        setError(`Location not found: ${locationId}`);
        return;
      }

      setChanging(true);
      setError(null);

      try {
        const response = await changeLocation(caseId, locationId, playerId, sessionId);

        // Update current location
        setCurrentLocationId(locationId);

        // Add to visited locations if not already visited
        setVisitedLocations((prev) => {
          if (prev.includes(locationId)) {
            return prev;
          }
          return [...prev, locationId];
        });

        // Call optional callback
        if (onLocationChange) {
          onLocationChange(locationId, response);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to change location';
        setError(message);
      } finally {
        setChanging(false);
      }
    },
    [caseId, currentLocationId, playerId, sessionId, onLocationChange]
  );

  // Reload locations handler
  const reloadLocations = useCallback(async () => {
    await loadLocations();
  }, [loadLocations]);

  // Clear error handler
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    locations,
    currentLocationId,
    visitedLocations,
    loading,
    changing,
    error,
    handleLocationChange,
    setCurrentLocationId,
    reloadLocations,
    clearError,
  };
}
