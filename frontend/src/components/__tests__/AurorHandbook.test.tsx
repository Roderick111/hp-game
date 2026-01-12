/**
 * AurorHandbook Component Tests
 *
 * Tests for the read-only spell reference modal:
 * - Renders all 7 spells
 * - No action buttons (read-only)
 * - Category badges
 * - Modal close behavior
 * - Keyboard shortcut
 *
 * @module components/__tests__/AurorHandbook.test
 * @since Phase 4.5
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AurorHandbook, SPELL_DEFINITIONS } from "../AurorHandbook";

// ============================================
// Test Data
// ============================================

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
};

// ============================================
// Test Suite
// ============================================

describe("AurorHandbook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ------------------------------------------
  // Rendering Tests
  // ------------------------------------------

  describe("Rendering", () => {
    it("renders modal title", () => {
      render(<AurorHandbook {...defaultProps} />);

      expect(
        screen.getByText("Auror's Handbook - Investigation Spells")
      ).toBeInTheDocument();
    });

    it("renders all 7 spells", () => {
      render(<AurorHandbook {...defaultProps} />);

      expect(screen.getByText("Revelio")).toBeInTheDocument();
      expect(screen.getByText("Homenum Revelio")).toBeInTheDocument();
      expect(screen.getByText("Specialis Revelio")).toBeInTheDocument();
      expect(screen.getByText("Lumos")).toBeInTheDocument();
      expect(screen.getByText("Prior Incantato")).toBeInTheDocument();
      expect(screen.getByText("Reparo")).toBeInTheDocument();
      expect(screen.getByText("Legilimency")).toBeInTheDocument();
    });

    it("renders spell descriptions", () => {
      render(<AurorHandbook {...defaultProps} />);

      expect(
        screen.getByText(/What's hidden wants to stay hidden/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/The air shivers when someone's near/)
      ).toBeInTheDocument();
    });

    it("renders instructions text", () => {
      render(<AurorHandbook {...defaultProps} />);

      expect(
        screen.getByText(/Reference guide for investigation spells/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/I'm casting \[Spell Name\]/)
      ).toBeInTheDocument();
    });

    it("renders restricted spell warning footer", () => {
      render(<AurorHandbook {...defaultProps} />);

      expect(
        screen.getByText(/RESTRICTED spells require authorization or consent/i)
      ).toBeInTheDocument();
    });

    it("does not render when isOpen is false", () => {
      render(<AurorHandbook isOpen={false} onClose={vi.fn()} />);

      expect(
        screen.queryByText("Auror's Handbook - Investigation Spells")
      ).not.toBeInTheDocument();
    });
  });

  // ------------------------------------------
  // Read-Only Tests (No Action Buttons)
  // ------------------------------------------

  describe("Read-Only Behavior", () => {
    it("does NOT have spell cast buttons", () => {
      render(<AurorHandbook {...defaultProps} />);

      // No buttons with cast-related names
      expect(screen.queryByRole("button", { name: /cast/i })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /use/i })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /select/i })).not.toBeInTheDocument();
    });

    it("spell cards are not clickable buttons", () => {
      render(<AurorHandbook {...defaultProps} />);

      // Spell cards should be divs, not buttons
      const spellCards = screen.getAllByTestId(/spell-card-/);
      spellCards.forEach((card) => {
        expect(card.tagName.toLowerCase()).toBe("div");
      });
    });

    it("has exactly 7 spell cards (read-only display)", () => {
      render(<AurorHandbook {...defaultProps} />);

      const spellCards = screen.getAllByTestId(/spell-card-/);
      expect(spellCards).toHaveLength(7);
    });
  });

  // ------------------------------------------
  // Category Badge Tests
  // ------------------------------------------

  describe("Category Badges", () => {
    it("renders category badges for all spells", () => {
      render(<AurorHandbook {...defaultProps} />);

      // Check for detection category (3 spells: Revelio, Homenum Revelio, Lumos)
      const detectionBadges = screen.getAllByText("detection");
      expect(detectionBadges.length).toBe(3);
    });

    it("renders analysis category", () => {
      render(<AurorHandbook {...defaultProps} />);

      const analysisBadges = screen.getAllByText("analysis");
      expect(analysisBadges.length).toBe(2);
    });

    it("renders restoration category", () => {
      render(<AurorHandbook {...defaultProps} />);

      expect(screen.getByText("restoration")).toBeInTheDocument();
    });

    it("renders mental category for Legilimency", () => {
      render(<AurorHandbook {...defaultProps} />);

      expect(screen.getByText("mental")).toBeInTheDocument();
    });
  });

  // ------------------------------------------
  // Modal Close Behavior Tests
  // ------------------------------------------

  describe("Modal Close Behavior", () => {
    it("calls onClose when close button is clicked", async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(<AurorHandbook isOpen={true} onClose={onClose} />);

      const closeButton = screen.getByRole("button", { name: /close modal/i });
      await user.click(closeButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("calls onClose when backdrop is clicked", async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(<AurorHandbook isOpen={true} onClose={onClose} />);

      // Backdrop is the element with aria-hidden="true"
      const backdrop = document.querySelector('[aria-hidden="true"]');
      expect(backdrop).toBeInTheDocument();

      await user.click(backdrop!);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("calls onClose when Escape key is pressed", () => {
      const onClose = vi.fn();

      render(<AurorHandbook isOpen={true} onClose={onClose} />);

      fireEvent.keyDown(document, { key: "Escape" });

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  // ------------------------------------------
  // Keyboard Shortcut Tests
  // ------------------------------------------

  describe("Keyboard Shortcut", () => {
    it("closes on Ctrl+H when open", () => {
      const onClose = vi.fn();

      render(<AurorHandbook isOpen={true} onClose={onClose} />);

      fireEvent.keyDown(document, { key: "h", ctrlKey: true });

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("closes on Cmd+H when open (Mac)", () => {
      const onClose = vi.fn();

      render(<AurorHandbook isOpen={true} onClose={onClose} />);

      fireEvent.keyDown(document, { key: "h", metaKey: true });

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("does not call onClose when Cmd+H pressed without modal open", () => {
      const onClose = vi.fn();

      render(<AurorHandbook isOpen={false} onClose={onClose} />);

      fireEvent.keyDown(document, { key: "h", metaKey: true });

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  // ------------------------------------------
  // Spell Data Integrity Tests
  // ------------------------------------------

  describe("Spell Data Integrity", () => {
    it("exports SPELL_DEFINITIONS with 7 spells", () => {
      expect(SPELL_DEFINITIONS).toHaveLength(7);
    });

    it("all spells have required fields", () => {
      SPELL_DEFINITIONS.forEach((spell) => {
        expect(spell).toHaveProperty("id");
        expect(spell).toHaveProperty("name");
        expect(spell).toHaveProperty("description");
        expect(spell).toHaveProperty("safetyLevel");
        expect(spell).toHaveProperty("category");
      });
    });

    it("Legilimency is the only restricted spell", () => {
      const restrictedSpells = SPELL_DEFINITIONS.filter(
        (spell) => spell.safetyLevel === "restricted"
      );
      expect(restrictedSpells).toHaveLength(1);
      expect(restrictedSpells[0].id).toBe("legilimency");
    });
  });

  // ------------------------------------------
  // Accessibility Tests
  // ------------------------------------------

  describe("Accessibility", () => {
    it("modal has proper ARIA attributes", () => {
      render(<AurorHandbook {...defaultProps} />);

      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveAttribute("aria-modal", "true");
    });

    it("close button has aria-label", () => {
      render(<AurorHandbook {...defaultProps} />);

      const closeButton = screen.getByRole("button", { name: /close modal/i });
      expect(closeButton).toBeInTheDocument();
    });

    it("each spell card has a test ID for testing", () => {
      render(<AurorHandbook {...defaultProps} />);

      expect(screen.getByTestId("spell-card-revelio")).toBeInTheDocument();
      expect(screen.getByTestId("spell-card-legilimency")).toBeInTheDocument();
    });
  });

  // ------------------------------------------
  // Styling Tests
  // ------------------------------------------

  describe("Styling", () => {
    it("Legilimency card has red styling", () => {
      render(<AurorHandbook {...defaultProps} />);

      const legilimencyCard = screen.getByTestId("spell-card-legilimency");
      expect(legilimencyCard).toHaveClass("border-red-700/40");
    });

    it("safe spell cards have gray border", () => {
      render(<AurorHandbook {...defaultProps} />);

      const revelioCard = screen.getByTestId("spell-card-revelio");
      expect(revelioCard).toHaveClass("border-gray-700");
    });

    it("Legilimency name is red", () => {
      render(<AurorHandbook {...defaultProps} />);

      const legilimencyName = screen.getByText("Legilimency");
      expect(legilimencyName).toHaveClass("text-red-400");
    });

    it("safe spell names are yellow", () => {
      render(<AurorHandbook {...defaultProps} />);

      const revelioName = screen.getByText("Revelio");
      expect(revelioName).toHaveClass("text-yellow-400");
    });
  });
});
