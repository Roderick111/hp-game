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
}

// ============================================
// Helper Components
// ============================================

/**
 * Category badge with neutral styling
 */
function CategoryBadge({ category }: { category: string }) {
  return (
    <span className="inline-block px-2 py-0.5 text-xs bg-gray-800 text-gray-400 border border-gray-700 rounded capitalize">
      {category}
    </span>
  );
}

/**
 * Individual spell card (read-only display)
 */
function SpellCard({ spell }: { spell: SpellDefinition }) {
  const isRestricted = spell.safetyLevel === "restricted";

  return (
    <div
      className={`p-4 rounded border ${
        isRestricted
          ? "border-red-700/40 bg-red-900/10"
          : "border-gray-700 bg-gray-800/50"
      }`}
      data-testid={`spell-card-${spell.id}`}
    >
      {/* Spell Name */}
      <h3
        className={`text-lg font-bold mb-2 ${
          isRestricted ? "text-red-400" : "text-yellow-400"
        }`}
      >
        {spell.name}
      </h3>

      {/* Description */}
      <p className="text-gray-300 text-sm mb-3 leading-relaxed">
        {spell.description}
      </p>

      {/* Category Badge */}
      <div className="flex gap-2 flex-wrap">
        <CategoryBadge category={spell.category} />
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
 * Keyboard shortcut: Cmd+H to open (handled by parent)
 */
export function AurorHandbook({ isOpen, onClose }: AurorHandbookProps) {
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
      title="Auror's Handbook - Investigation Spells"
    >
      <div className="space-y-4">
        {/* Instructions */}
        <p className="text-gray-400 text-sm border-b border-gray-700 pb-3">
          Reference guide for investigation spells. To cast a spell, type{" "}
          <span className="text-amber-400 font-mono">
            &quot;I&apos;m casting [Spell Name]&quot;
          </span>{" "}
          in the investigation input.
        </p>

        {/* Spell Grid */}
        <div className="grid gap-3 max-h-[60vh] overflow-y-auto pr-1">
          {SPELL_DEFINITIONS.map((spell) => (
            <SpellCard key={spell.id} spell={spell} />
          ))}
        </div>
      </div>
    </Modal>
  );
}

// Export spell definitions for use in quick actions
// eslint-disable-next-line react-refresh/only-export-components
export { SPELL_DEFINITIONS };
