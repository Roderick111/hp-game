/**
 * LocationSelector Component Tests
 *
 * Tests for the location selection interface including:
 * - Location list rendering
 * - Current location highlighting
 * - Selection handling
 * - Visited location indicator
 * - Loading and error states
 * - Keyboard shortcuts
 *
 * @module components/__tests__/LocationSelector.test
 * @since Phase 5.2
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LocationSelector } from '../LocationSelector';
import type { LocationInfo } from '../../types/investigation';

// ============================================
// Test Data
// ============================================

const mockLocations: LocationInfo[] = [
  {
    id: 'library',
    name: 'Hogwarts Library',
    type: 'micro',
  },
  {
    id: 'dormitory',
    name: 'Slytherin Dormitory',
    type: 'micro',
  },
  {
    id: 'great_hall',
    name: 'Great Hall',
    type: 'building',
  },
];

const defaultProps = {
  locations: mockLocations,
  currentLocationId: 'library',
  visitedLocations: ['library'],
  loading: false,
  error: null,
  onSelectLocation: vi.fn(),
  changing: false,
};

// ============================================
// Test Suite
// ============================================

describe('LocationSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ------------------------------------------
  // Rendering Tests
  // ------------------------------------------

  describe('Rendering', () => {
    it('renders header', () => {
      render(<LocationSelector {...defaultProps} />);

      expect(screen.getByText(/LOCATIONS/i)).toBeInTheDocument();
    });

    it('renders all location names', () => {
      render(<LocationSelector {...defaultProps} />);

      expect(screen.getByText('Hogwarts Library')).toBeInTheDocument();
      expect(screen.getByText('Slytherin Dormitory')).toBeInTheDocument();
      expect(screen.getByText('Great Hall')).toBeInTheDocument();
    });

    it('renders keyboard shortcut hint', () => {
      render(<LocationSelector {...defaultProps} />);

      expect(screen.getByText(/Press 1-3 to quick-select/i)).toBeInTheDocument();
    });

    it('renders keyboard shortcut numbers next to locations', () => {
      render(<LocationSelector {...defaultProps} />);

      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  // ------------------------------------------
  // Current Location Highlighting Tests
  // ------------------------------------------

  describe('Current Location Highlighting', () => {
    it('highlights current location with darker background', () => {
      render(<LocationSelector {...defaultProps} />);

      const libraryButton = screen.getByText('Hogwarts Library').closest('button');
      expect(libraryButton).toHaveClass('bg-gray-800');
      expect(libraryButton).toHaveClass('border-gray-500');
    });

    it('shows ▸ symbol for current location', () => {
      render(<LocationSelector {...defaultProps} />);

      // Current location should show ▸ symbol
      const libraryButton = screen.getByText('Hogwarts Library').closest('button');
      expect(libraryButton?.textContent).toContain('▸');
    });

    it('shows · symbol for other locations', () => {
      render(<LocationSelector {...defaultProps} />);

      const dormitoryButton = screen.getByText('Slytherin Dormitory').closest('button');
      expect(dormitoryButton?.textContent).toContain('·');
    });

    it('shows "> HERE" indicator for current location', () => {
      render(<LocationSelector {...defaultProps} />);

      const libraryButton = screen.getByText('Hogwarts Library').closest('button');
      expect(libraryButton).toHaveTextContent('> HERE');
    });

    it('disables button for current location', () => {
      render(<LocationSelector {...defaultProps} />);

      const libraryButton = screen.getByText('Hogwarts Library').closest('button');
      expect(libraryButton).toBeDisabled();
    });
  });

  // ------------------------------------------
  // Visited Location Tests
  // ------------------------------------------

  describe('Location Symbols', () => {
    it('displays location numbers (1, 2, 3) for keyboard shortcuts', () => {
      render(<LocationSelector {...defaultProps} />);

      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('shows white text for current location', () => {
      render(<LocationSelector {...defaultProps} />);

      const libraryText = screen.getByText('Hogwarts Library');
      expect(libraryText).toHaveClass('text-white');
    });

    it('shows gray text for other locations', () => {
      render(<LocationSelector {...defaultProps} />);

      const dormitoryText = screen.getByText('Slytherin Dormitory');
      expect(dormitoryText).toHaveClass('text-gray-200');
    });
  });

  // ------------------------------------------
  // Selection Tests
  // ------------------------------------------

  describe('Selection', () => {
    it('calls onSelectLocation when location clicked', async () => {
      const user = userEvent.setup();
      const onSelectLocation = vi.fn();

      render(
        <LocationSelector {...defaultProps} onSelectLocation={onSelectLocation} />
      );

      const dormitoryButton = screen.getByText('Slytherin Dormitory').closest('button');
      await user.click(dormitoryButton!);

      expect(onSelectLocation).toHaveBeenCalledWith('dormitory');
    });

    it('does not call onSelectLocation for current location', async () => {
      const user = userEvent.setup();
      const onSelectLocation = vi.fn();

      render(
        <LocationSelector {...defaultProps} onSelectLocation={onSelectLocation} />
      );

      const libraryButton = screen.getByText('Hogwarts Library').closest('button');
      await user.click(libraryButton!);

      expect(onSelectLocation).not.toHaveBeenCalled();
    });
  });

  // ------------------------------------------
  // Keyboard Shortcuts Tests
  // ------------------------------------------

  describe('Keyboard Shortcuts', () => {
    it('selects location with number key 2', () => {
      const onSelectLocation = vi.fn();

      render(
        <LocationSelector {...defaultProps} onSelectLocation={onSelectLocation} />
      );

      fireEvent.keyDown(document, { key: '2' });

      expect(onSelectLocation).toHaveBeenCalledWith('dormitory');
    });

    it('selects location with number key 3', () => {
      const onSelectLocation = vi.fn();

      render(
        <LocationSelector {...defaultProps} onSelectLocation={onSelectLocation} />
      );

      fireEvent.keyDown(document, { key: '3' });

      expect(onSelectLocation).toHaveBeenCalledWith('great_hall');
    });

    it('does not select with key 1 (current location)', () => {
      const onSelectLocation = vi.fn();

      render(
        <LocationSelector {...defaultProps} onSelectLocation={onSelectLocation} />
      );

      fireEvent.keyDown(document, { key: '1' });

      expect(onSelectLocation).not.toHaveBeenCalled();
    });

    it('ignores keys outside range', () => {
      const onSelectLocation = vi.fn();

      render(
        <LocationSelector {...defaultProps} onSelectLocation={onSelectLocation} />
      );

      fireEvent.keyDown(document, { key: '9' });
      fireEvent.keyDown(document, { key: '0' });
      fireEvent.keyDown(document, { key: 'a' });

      expect(onSelectLocation).not.toHaveBeenCalled();
    });
  });

  // ------------------------------------------
  // Loading State Tests
  // ------------------------------------------

  describe('Loading State', () => {
    it('shows loading indicator when loading with no locations', () => {
      render(
        <LocationSelector
          {...defaultProps}
          locations={[]}
          loading={true}
        />
      );

      expect(screen.getByText(/Loading locations/i)).toBeInTheDocument();
    });

    it('shows locations when loading with existing locations', () => {
      render(
        <LocationSelector {...defaultProps} loading={true} />
      );

      // Should still show locations (refresh scenario)
      expect(screen.getByText('Hogwarts Library')).toBeInTheDocument();
    });
  });

  // ------------------------------------------
  // Changing State Tests
  // ------------------------------------------

  describe('Changing State', () => {
    it('shows "Traveling..." indicator when changing', () => {
      render(
        <LocationSelector {...defaultProps} changing={true} />
      );

      expect(screen.getByText(/Traveling/i)).toBeInTheDocument();
    });

    it('disables buttons when changing', () => {
      render(
        <LocationSelector {...defaultProps} changing={true} />
      );

      const dormitoryButton = screen.getByText('Slytherin Dormitory').closest('button');
      expect(dormitoryButton).toBeDisabled();
    });
  });

  // ------------------------------------------
  // Error State Tests
  // ------------------------------------------

  describe('Error State', () => {
    it('shows error message when error with no locations', () => {
      render(
        <LocationSelector
          {...defaultProps}
          locations={[]}
          error="Failed to load locations"
        />
      );

      expect(screen.getByText(/Failed to load locations/i)).toBeInTheDocument();
    });

    it('shows locations when error with existing locations', () => {
      render(
        <LocationSelector {...defaultProps} error="Refresh failed" />
      );

      // Should still show locations
      expect(screen.getByText('Hogwarts Library')).toBeInTheDocument();
    });
  });

  // ------------------------------------------
  // Empty State Tests
  // ------------------------------------------

  describe('Empty State', () => {
    it('shows empty message when no locations', () => {
      render(
        <LocationSelector {...defaultProps} locations={[]} />
      );

      expect(
        screen.getByText(/No locations available for this case/i)
      ).toBeInTheDocument();
    });
  });

  // ------------------------------------------
  // Accessibility Tests
  // ------------------------------------------

  describe('Accessibility', () => {
    it('has accessible location buttons with aria-pressed', () => {
      render(<LocationSelector {...defaultProps} />);

      const libraryButton = screen.getByText('Hogwarts Library').closest('button');
      expect(libraryButton).toHaveAttribute('aria-pressed', 'true');

      const dormitoryButton = screen.getByText('Slytherin Dormitory').closest('button');
      expect(dormitoryButton).toHaveAttribute('aria-pressed', 'false');
    });

    it('has accessible aria-labels on location buttons', () => {
      render(<LocationSelector {...defaultProps} />);

      const libraryButton = screen.getByLabelText(/Current location Hogwarts Library/i);
      expect(libraryButton).toBeInTheDocument();

      const dormitoryButton = screen.getByLabelText(/Go to Slytherin Dormitory/i);
      expect(dormitoryButton).toBeInTheDocument();
    });
  });
});
