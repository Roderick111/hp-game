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

import { useEffect, useCallback, useState } from "react";
import { useTheme } from '../context/useTheme';
import { useTranslation } from '../i18n/LanguageContext';
import type { LocationInfo, LocationResponse } from "../types/investigation";

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

/**
 * Location illustration image component with convention-based auto-loading.
 * Loads illustrations from /locations/{locationId}.{format}
 * Uses modern formats (AVIF → WebP → PNG) with fallbacks.
 * Falls back to placeholder if image doesn't exist.
 */
interface LocationIllustrationImageProps {
  locationId: string;
  locationName: string;
  className?: string;
  /** Whether to lazy load (default: true for modal, false for thumbnail) */
  lazy?: boolean;
  /** Priority loading for above-fold images */
  priority?: boolean;
}

export function LocationIllustrationImage({
  locationId,
  locationName,
  className = "",
  lazy = true,
  priority = false,
}: LocationIllustrationImageProps) {
  const [hasError, setHasError] = useState(false);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const { theme } = useTheme();
  const { t } = useTranslation();

  // Try formats in order: AVIF → WebP → PNG
  // Using useEffect to probe for available formats
  useEffect(() => {
    setHasError(false);
    setImgSrc(null);

    const formats = [
      { ext: 'avif', type: 'image/avif' },
      { ext: 'webp', type: 'image/webp' },
      { ext: 'png', type: 'image/png' },
    ];

    let cancelled = false;

    const tryFormat = async (index: number) => {
      if (cancelled || index >= formats.length) {
        if (!cancelled && index >= formats.length) {
          setHasError(true);
        }
        return;
      }

      const format = formats[index];
      const url = `/locations/${locationId}.${format.ext}`;

      try {
        const response = await fetch(url, { method: 'HEAD' });
        const contentType = response.headers.get('Content-Type') ?? '';
        // Check both response.ok AND that Content-Type is an image
        // (Vite returns 200 with text/html for missing files)
        if (!cancelled && response.ok && contentType.startsWith('image/')) {
          setImgSrc(url);
          return;
        }
      } catch {
        // Format not available, try next
      }

      if (!cancelled) {
        void tryFormat(index + 1);
      }
    };

    void tryFormat(0);

    return () => {
      cancelled = true;
    };
  }, [locationId]);

  if (hasError) {
    return (
      <div
        className={`w-full h-full flex items-center justify-center ${theme.colors.bg.semiTransparent} ${className}`}
      >
        <span className={`${theme.colors.text.separator} text-xs ${theme.fonts.ui} uppercase tracking-wider`}>
          {t('location.noVisual')}
        </span>
      </div>
    );
  }

  if (!imgSrc) {
    return (
      <div
        className={`w-full h-full flex items-center justify-center ${theme.colors.bg.semiTransparent} ${className}`}
      >
        <span className={`${theme.colors.text.separator} text-xs ${theme.fonts.ui} uppercase tracking-wider animate-pulse`}>
          {t('location.loading')}
        </span>
      </div>
    );
  }

  return (
    <div className={`w-full h-full overflow-hidden relative ${className}`}>
      <img
        src={imgSrc}
        alt={locationName}
        className="w-full h-full object-cover object-center transition-all duration-500"
        style={{ width: '100%', height: '100%' }}
        loading={priority ? "eager" : lazy ? "lazy" : "eager"}
        decoding="async"
        onError={() => setHasError(true)}
      />

      {/* Scanline overlay */}
      <div
        className={`absolute inset-0 ${theme.effects.scanlines}`}
      ></div>
    </div>
  );
}

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
  const { theme } = useTheme();

  return (
    <button
      onClick={onClick}
      disabled={disabled || isSelected}
      className={`
        px-4 py-2 ${theme.fonts.ui} text-sm uppercase tracking-wide transition-all duration-200
        border-b-2 active:opacity-80
        ${
          isSelected
            ? `${theme.colors.interactive.border} ${theme.colors.text.secondary} font-bold cursor-default`
            : `border-transparent ${theme.colors.text.tertiary} ${theme.colors.interactive.hover} ${theme.colors.border.hoverClass}`
        }
        ${disabled && !isSelected ? "opacity-50 cursor-not-allowed" : ""}
        focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:outline-none
      `}
      aria-pressed={isSelected}
      aria-label={`${isSelected ? "Current location" : "Go to"} ${location.name}`}
    >
      <div className="flex items-center gap-2">
        {/* Location name */}
        <span>{location.name}</span>
        {/* Keyboard shortcut hint — hidden on mobile */}
        <span className={`hidden lg:inline ${theme.colors.text.separator} text-xs`}>[{index + 1}]</span>
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
    [locations, currentLocationId, onSelectLocation],
  );

  // Register keyboard listener
  useEffect(() => {
    document.addEventListener("keydown", handleKeydown);
    return () => document.removeEventListener("keydown", handleKeydown);
  }, [handleKeydown]);

  // Loading state for location data
  if (!locationData && loading) {
    return (
      <div className={`${theme.colors.bg.primary} p-4`}>
        <div className={`animate-pulse ${theme.colors.text.tertiary} ${theme.fonts.ui}`}>
          Loading location...
        </div>
      </div>
    );
  }

  // Error state
  if (error && !locationData) {
    return (
      <div className={`${theme.colors.bg.primary} p-4`}>
        <span className={`${theme.colors.state.error.text} ${theme.fonts.ui} text-sm`}>Error: {error}</span>
      </div>
    );
  }

  return (
    <div className={`${theme.colors.bg.primary}`}>
      {/* Horizontal Location Tabs */}
      <div className="flex items-center justify-center gap-1 overflow-x-auto">
        {locations.length === 0 ? (
          <span className={`${theme.colors.text.muted} text-sm ${theme.fonts.ui} py-2`}>
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
              <span className={`ml-4 ${theme.colors.text.tertiary} text-sm ${theme.fonts.ui} animate-pulse`}>
                Traveling...
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}
