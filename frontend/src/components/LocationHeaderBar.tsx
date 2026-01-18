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
import { TERMINAL_THEME } from "../styles/terminal-theme";
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

function LocationIllustrationImage({
  locationId,
  locationName,
  className = "",
  lazy = true,
  priority = false,
}: LocationIllustrationImageProps) {
  const [hasError, setHasError] = useState(false);

  // Modern format URLs with fallback chain
  const avifUrl = `/locations/${locationId}.avif`;
  const webpUrl = `/locations/${locationId}.webp`;
  const pngUrl = `/locations/${locationId}.png`;

  if (hasError) {
    return (
      <div
        className={`w-full h-full flex items-center justify-center bg-gray-900/50 ${className}`}
      >
        <span className="text-gray-600 text-xs font-mono uppercase tracking-wider">
          NO VISUAL RECORD
        </span>
      </div>
    );
  }

  return (
    <div className={`w-full h-full overflow-hidden relative ${className}`}>
      {/* Modern image formats with automatic fallback */}
      <picture>
        <source srcSet={avifUrl} type="image/avif" />
        <source srcSet={webpUrl} type="image/webp" />
        <img
          src={pngUrl}
          alt={locationName}
          className="w-full h-full object-cover object-center transition-all duration-500"
          style={{ width: '100%', height: '100%' }}
          loading={priority ? "eager" : lazy ? "lazy" : "eager"}
          decoding="async"
          onError={() => setHasError(true)}
        />
      </picture>

      {/* Scanline overlay */}
      <div
        className={`absolute inset-0 ${TERMINAL_THEME.effects.scanlines}`}
      ></div>
    </div>
  );
}

interface LocationIllustrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  locationId: string;
  locationName: string;
}

function LocationIllustrationModal({
  isOpen,
  onClose,
  locationId,
  locationName,
}: LocationIllustrationModalProps) {
  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-8 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="illustration-modal-title"
    >
      {/* Modal Content - 80% of viewport */}
      <div
        className="relative w-[80vw] h-[90vh] bg-gray-900 border border-gray-700 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-gray-400 hover:text-white font-mono text-sm uppercase tracking-wider transition-colors"
        >
          [ESC] CLOSE
        </button>

        {/* Image container with corner brackets */}
        <div
          className={`w-full h-full bg-black border ${TERMINAL_THEME.colors.border.default} p-[1px] shadow-lg relative group`}
        >
          {/* Corner brackets decoration */}
          <div className={TERMINAL_THEME.effects.cornerBrackets.topLeft}></div>
          <div className={TERMINAL_THEME.effects.cornerBrackets.topRight}></div>
          <div
            className={TERMINAL_THEME.effects.cornerBrackets.bottomLeft}
          ></div>
          <div
            className={TERMINAL_THEME.effects.cornerBrackets.bottomRight}
          ></div>

          {/* Location illustration */}
          <LocationIllustrationImage
            locationId={locationId}
            locationName={locationName}
            lazy={true}
            priority={false}
          />
        </div>
      </div>
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
  return (
    <button
      onClick={onClick}
      disabled={disabled || isSelected}
      className={`
        px-4 py-2 font-mono text-sm uppercase tracking-wide transition-all duration-200
        border-b-2
        ${
          isSelected
            ? "border-amber-500 text-gray-300 font-bold cursor-default"
            : "border-transparent text-gray-400 hover:text-amber-400 hover:border-gray-500"
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
  const [isModalOpen, setIsModalOpen] = useState(false);

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
      <div className="px-4 pt-4 pb-4 h-52">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-full items-stretch">
          {/* Location Name & Description (3/4 width) */}
          <div className="lg:col-span-3 flex flex-col">
            <h2
              className={`${TERMINAL_THEME.typography.headerLg} mb-2 flex-shrink-0`}
            >
              {locationData?.name ?? "Unknown Location"}
            </h2>
            <p
              className={`${TERMINAL_THEME.typography.body} ${TERMINAL_THEME.colors.text.muted} leading-relaxed line-clamp-5 overflow-hidden`}
            >
              {locationData?.description ?? "No description available."}
            </p>
          </div>

          {/* Illustration (1/4 width) */}
          <div className="lg:col-span-1 hidden lg:flex w-full items-center justify-center min-h-0">
            <div
              onClick={() => setIsModalOpen(true)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setIsModalOpen(true);
                }
              }}
              className={`w-full h-full bg-black border ${TERMINAL_THEME.colors.border.default} p-[1px] shadow-lg relative group cursor-pointer hover:border-amber-500/50 transition-colors overflow-hidden`}
              aria-label="View location illustration fullscreen"
            >
              {/* Corner brackets decoration */}
              <div
                className={TERMINAL_THEME.effects.cornerBrackets.topLeft}
              ></div>
              <div
                className={TERMINAL_THEME.effects.cornerBrackets.topRight}
              ></div>
              <div
                className={TERMINAL_THEME.effects.cornerBrackets.bottomLeft}
              ></div>
              <div
                className={TERMINAL_THEME.effects.cornerBrackets.bottomRight}
              ></div>

              {/* Location illustration */}
              <LocationIllustrationImage
                locationId={currentLocationId}
                locationName={locationData?.name ?? "Unknown Location"}
                priority={true}
                lazy={false}
              />
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
      {/* <div className="px-4 py-1.5">
        <span className={TERMINAL_THEME.typography.helper}>
          * Press 1-{Math.min(locations.length, 9)} to quick-select locations
        </span>
      </div> */}

      {/* Illustration Modal */}
      <LocationIllustrationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        locationId={currentLocationId}
        locationName={locationData?.name ?? "Unknown Location"}
      />
    </div>
  );
}
