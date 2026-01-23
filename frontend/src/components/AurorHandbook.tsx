/**
 * AurorHandbook Component
 *
 * Read-only modal displaying the 7 investigation spells available to Aurors.
 * NO action buttons - this is purely a reference modal.
 * Players must cast spells via text input, not from this modal.
 *
 * @module components/AurorHandbook
 * @since Phase 4.5
 */

import { useEffect, useCallback } from "react";
import { Modal } from "./ui/Modal";
import type { SpellDefinition } from "../types/spells";

// ============================================
// Spell Definitions (from backend)
// ============================================

/**
 * Static spell definitions matching backend/src/spells/definitions.py
 * Read-only reference data - no API call needed
 */
const SPELL_DEFINITIONS: SpellDefinition[] = [
  {
    id: "revelio",
    name: "Revelio",
    description:
      "What's hidden wants to stay hidden. This charm convinces it otherwise—invisible ink bleeds into view, concealment charms flicker and fade, disguised objects remember their true form.",
    safetyLevel: "safe",
    category: "detection",
  },
  {
    id: "homenum_revelio",
    name: "Homenum Revelio",
    description:
      "The air shivers when someone's near. This charm reads that shiver—even through walls, even under cloaks meant to deceive. Useful when you suspect you're not alone.",
    safetyLevel: "safe",
    category: "detection",
  },
  {
    id: "specialis_revelio",
    name: "Specialis Revelio",
    description:
      "Scarpin's gift to investigators. Whisper this over a suspect potion and watch its secrets unravel—enchantments glow, poisons betray themselves, cursed objects confess their nature.",
    safetyLevel: "safe",
    category: "analysis",
  },
  {
    id: "lumos",
    name: "Lumos",
    description:
      "Light reveals what darkness protects. More than mere illumination—wandlight clings to bloodstains, traces the ghost of fire, shows you the things that hide between shadow and sight.",
    safetyLevel: "safe",
    category: "detection",
  },
  {
    id: "prior_incantato",
    name: "Prior Incantato",
    description:
      "Every wand remembers. Force it to speak and ghostly echoes rise—the last spells it cast, shadows of magic long finished. The wand must be in your hand for it to confess.",
    safetyLevel: "safe",
    category: "analysis",
  },
  {
    id: "reparo",
    name: "Reparo",
    description:
      "Shattered things yearn to be whole. As the pieces float back together, watch closely—the way glass breaks tells you how it was broken. Violence leaves patterns.",
    safetyLevel: "safe",
    category: "restoration",
  },
  {
    id: "legilimency",
    name: "Legilimency",
    description:
      "The mind has no lock a skilled Legilimens cannot pick. Slip past the eyes into memory itself—but tread carefully. Minds resist intrusion, and some remember being violated long after you've withdrawn.",
    safetyLevel: "restricted",
    category: "mental",
  },
];

// ============================================
// Types
// ============================================

interface AurorHandbookProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal is closed */
  onClose: () => void;
  /** Callback when a spell is selected for casting */
  onSelectSpell?: (spellName: string) => void;
}

// ============================================
// Helper Components
// ============================================

import { useTheme } from "../context/ThemeContext";
import type { TerminalTheme } from "../styles/terminal-theme";

/**
 * Category badge with neutral styling
 */
function CategoryBadge({ category, theme }: { category: string; theme: TerminalTheme }) {
  return (
    <span className={`inline-block px-1.5 py-0.5 text-[10px] ${theme.colors.bg.hover} ${theme.colors.text.tertiary} border ${theme.colors.border.default} uppercase tracking-wider font-mono`}>
      {category}
    </span>
  );
}

/**
 * Individual spell card (read-only display)
 */
function SpellCard({
  spell,
  onSelect,
  theme,
}: {
  spell: SpellDefinition;
  onSelect?: (spellName: string) => void;
  theme: TerminalTheme;
}) {
  const isRestricted = spell.safetyLevel === "restricted";
  const isClickable = !isRestricted && onSelect;

  return (
    <div
      onClick={() => isClickable && onSelect?.(spell.name)}
      className={`p-4 border group transition-all duration-200 relative ${
        isRestricted
          ? `${theme.colors.state.error.border} ${theme.colors.state.error.bg} cursor-not-allowed opacity-80`
          : isClickable
            ? `${theme.colors.border.default} ${theme.colors.bg.primary} ${theme.colors.interactive.borderHover} ${theme.colors.bg.hoverClass} cursor-pointer shadow-sm hover:shadow-md`
            : `${theme.colors.border.default} ${theme.colors.bg.primary} ${theme.colors.bg.hoverClass}`
      }`}
      data-testid={`spell-card-${spell.id}`}
    >
      {/* Click hint for non-restricted spells */}
      {isClickable && (
        <div className={`absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] ${theme.colors.interactive.text} font-mono uppercase tracking-widest font-bold`}>
          [CLICK TO CAST]
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <h3
          className={`font-mono font-bold uppercase tracking-wider text-sm flex items-center gap-2 ${
            isRestricted ? theme.colors.state.error.text : theme.colors.text.primary
          }`}
        >
          <span className={isRestricted ? theme.colors.state.error.text : theme.colors.text.muted}>
            {theme.symbols.bullet}
          </span>
          {spell.name}
        </h3>
        {isRestricted && (
          <span className={`text-[10px] ${theme.colors.state.error.text} border ${theme.colors.state.error.border} px-1 font-bold uppercase tracking-widest`}>
            RESTRICTED
          </span>
        )}
      </div>

      {/* Description */}
      <p className={`${theme.colors.text.tertiary} text-xs mb-3 leading-relaxed font-mono pl-5 opacity-90 group-hover:opacity-100 transition-opacity`}>
        {spell.description}
      </p>

      {/* Footer info */}
      <div className="pl-5 flex gap-2">
        <CategoryBadge category={spell.category} theme={theme} />
      </div>
    </div>
  );
}

// ============================================
// Main Component
// ============================================

/**
 * Auror's Handbook - Read-only spell reference modal
 *
 * Displays all 7 investigation spells with descriptions.
 * NO action buttons - players cast spells via text input.
 * Multi-column layout for spell cards.
 */
export function AurorHandbook({
  isOpen,
  onClose,
  onSelectSpell,
}: AurorHandbookProps) {
  const { theme } = useTheme();

  // Keyboard shortcut handler for Cmd/Ctrl+H
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "h") {
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
        // Opening is handled by parent component
      }
    },
    [isOpen, onClose],
  );

  // Register keyboard shortcut
  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="AUROR HANDBOOK // SPELL INDEX"
      variant="terminal"
    >
      <div className="space-y-4">
        {/* Instructions */}
        <div className={`border-b ${theme.colors.border.default} pb-3 mb-2`}>
          <p className={`${theme.colors.text.muted} text-xs font-mono`}>
            <span className={theme.colors.text.tertiary}>
              {theme.symbols.prefix}
            </span>{" "}
            For better results, be specific about what you want to achieve with
            a spell.
            <br />
            <span className={theme.colors.text.tertiary}>
              {theme.symbols.prefix}
            </span>{" "}
            To cast, type{" "}
            <span className={`${theme.colors.interactive.text} font-bold`}>
              &quot;I cast [Spell Name]&quot;
            </span>{" "}
            in the console.
          </p>
        </div>

        {/* Categories / Sections if we wanted, but flat list is fine for 7 spells */}

        {/* Spell Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin">
          {SPELL_DEFINITIONS.map((spell) => (
            <SpellCard key={spell.id} spell={spell} onSelect={onSelectSpell} theme={theme} />
          ))}
        </div>

        {/* Footer */}
        <div className={`pt-2 border-t ${theme.colors.border.default} flex justify-between items-center text-[10px] ${theme.colors.text.muted} uppercase tracking-widest`}>
          <span>MINISTRY OF MAGIC / DEPARTMENT OF MAGICAL LAW ENFORCEMENT</span>
          <span>CONFIDENTIAL</span>
        </div>
      </div>
    </Modal>
  );
}

// Export spell definitions for use in quick actions
// eslint-disable-next-line react-refresh/only-export-components
export { SPELL_DEFINITIONS };
