/**
 * SaveLoadModal Component
 *
 * Modal for selecting save slots (save or load mode).
 * Shows 3 manual slots + 1 autosave slot (load mode only).
 * Displays metadata: timestamp, location, evidence count.
 *
 * @module components/SaveLoadModal
 * @since Phase 5.3
 */

import * as Dialog from '@radix-ui/react-dialog';
import { useEffect, useState } from 'react';
import { TERMINAL_THEME } from '../styles/terminal-theme';
import type { SaveSlotMetadata } from '../types/investigation';

// ============================================
// Types
// ============================================

export interface SaveLoadModalProps {
  /** Whether modal is open */
  isOpen: boolean;
  /** Callback to close modal */
  onClose: () => void;
  /** Mode: save or load */
  mode: 'save' | 'load';
  /** Callback when save button clicked */
  onSave: (slot: string) => Promise<void>;
  /** Callback when load button clicked */
  onLoad: (slot: string) => Promise<void>;
  /** Array of save slot metadata */
  slots: SaveSlotMetadata[];
  /** Loading state */
  loading: boolean;
}

// ============================================
// Component
// ============================================

export function SaveLoadModal({
  isOpen,
  onClose,
  mode,
  onSave,
  onLoad,
  slots,
  loading,
}: SaveLoadModalProps) {
  const manualSlots = ['slot_1', 'slot_2', 'slot_3'];
  const autosaveSlot = slots.find((s) => s.slot === 'autosave');

  // All available slots (manual + autosave if exists)
  const allSlots = mode === 'load' && autosaveSlot
    ? [...manualSlots, 'autosave']
    : manualSlots;

  // Selected slot index for keyboard navigation
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Keyboard shortcuts (1-4, arrows, Enter)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Number keys 1-4: Select slot directly
      if (e.key >= '1' && e.key <= '4') {
        e.preventDefault();
        e.stopPropagation();
        const index = parseInt(e.key) - 1;
        if (index < allSlots.length) {
          setSelectedIndex(index);
        }
      }
      // Arrow Up / W: Previous non-empty slot
      else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        e.stopPropagation();

        let nextIndex = selectedIndex;
        let attempts = 0;

        // Find previous non-empty slot
        do {
          nextIndex = nextIndex > 0 ? nextIndex - 1 : allSlots.length - 1;
          attempts++;

          const slotId = allSlots[nextIndex];
          const slotData = slots.find((s) => s.slot === slotId);

          // Accept if slot has data or is autosave
          if (slotData || slotId === 'autosave') {
            setSelectedIndex(nextIndex);
            break;
          }
        } while (attempts < allSlots.length);
      }
      // Arrow Down / S: Next non-empty slot
      else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        e.stopPropagation();

        let nextIndex = selectedIndex;
        let attempts = 0;

        // Find next non-empty slot
        do {
          nextIndex = nextIndex < allSlots.length - 1 ? nextIndex + 1 : 0;
          attempts++;

          const slotId = allSlots[nextIndex];
          const slotData = slots.find((s) => s.slot === slotId);

          // Accept if slot has data or is autosave
          if (slotData || slotId === 'autosave') {
            setSelectedIndex(nextIndex);
            break;
          }
        } while (attempts < allSlots.length);
      }
      // Enter: Confirm action on selected slot
      else if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        const slotId = allSlots[selectedIndex];
        const slotData = slots.find((s) => s.slot === slotId);

        // Don't allow loading empty slots
        if (mode === 'load' && !slotData && slotId !== 'autosave') {
          return;
        }

        if (mode === 'save') {
          void onSave(slotId).then(() => onClose());
        } else {
          void onLoad(slotId).then(() => onClose());
        }
      }
    };

    // Capture phase to block events before they reach landing page
    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, allSlots, selectedIndex, mode, onSave, onLoad, onClose, slots]);

  /**
   * Get metadata for a specific slot
   */
  const getSlotData = (slotId: string) => slots.find((s) => s.slot === slotId);

  /**
   * Get case name from case_id
   * TODO: Replace with API call when /api/cases endpoint is implemented
   */
  const getCaseName = (caseId: string): string => {
    const caseNames: Record<string, string> = {
      case_001: 'The Restricted Section',
      case_002: 'The Poisoned Potion',
      case_003: 'The Missing Wand',
      case_004: 'The Forbidden Forest',
      case_005: 'The Dark Artifact',
      case_006: 'The Memory Charm',
    };
    return caseNames[caseId] || caseId;
  };

  /**
   * Format slot timestamp for display
   */
  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch {
      return 'Unknown';
    }
  };

  /**
   * Handle save button click
   */
  const handleSaveClick = (slotId: string) => {
    void onSave(slotId).then(() => onClose());
  };

  /**
   * Handle load button click
   */
  const handleLoadClick = (slotId: string) => {
    void onLoad(slotId).then(() => onClose());
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        {/* Backdrop overlay */}
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60" />

        {/* Modal content */}
        <Dialog.Content
          className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50
                     ${TERMINAL_THEME.colors.bg.primary} border ${TERMINAL_THEME.colors.border.default} border-t-amber-900/50
                     w-full max-w-lg shadow-xl
                     focus:outline-none`}
          onEscapeKeyDown={onClose}
        >
          {/* Title */}
          <div className={`border-b ${TERMINAL_THEME.colors.border.default} px-6 py-4`}>
            <Dialog.Title className={`text-sm font-bold ${TERMINAL_THEME.colors.text.primary} font-mono uppercase tracking-wider`}>
              {TERMINAL_THEME.symbols.block} {mode === 'save' ? 'SAVE GAME' : 'LOAD GAME'}
            </Dialog.Title>
          </div>

          {/* Slots */}
          <div className="p-6 space-y-3">
            {/* Manual save slots */}
            {manualSlots.map((slotId, index) => {
              const slotData = getSlotData(slotId);
              const isEmpty = !slotData;
              const isSelected = selectedIndex === index;

              return (
                <div
                  key={slotId}
                  className={`border p-4 ${
                    isEmpty
                      ? `border-gray-800 ${TERMINAL_THEME.colors.bg.semiTransparent} opacity-50`
                      : isSelected
                      ? `border-amber-500/50 ${TERMINAL_THEME.colors.bg.hover}`
                      : `${TERMINAL_THEME.colors.border.default} ${TERMINAL_THEME.colors.bg.semiTransparent}`
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className={`font-bold mb-2 font-mono text-sm ${
                        isEmpty ? TERMINAL_THEME.colors.text.separator : TERMINAL_THEME.colors.text.primary
                      }`}>
                        {TERMINAL_THEME.symbols.prefix} {slotData ? getCaseName(slotData.case_id) : `Slot ${index + 1}`}
                      </div>
                      {slotData ? (
                        <>
                          <div className={`text-sm ${TERMINAL_THEME.colors.text.tertiary} font-mono`}>
                            {TERMINAL_THEME.symbols.bullet} {formatTimestamp(slotData.timestamp)}
                          </div>
                          <div className={`text-sm ${TERMINAL_THEME.colors.text.muted} font-mono`}>
                            {TERMINAL_THEME.symbols.bullet} Location: {slotData.location}
                          </div>
                          <div className={`text-sm ${TERMINAL_THEME.colors.text.muted} font-mono`}>
                            {TERMINAL_THEME.symbols.bullet} Evidence: {slotData.evidence_count}
                          </div>
                        </>
                      ) : (
                        <div className={`text-sm ${TERMINAL_THEME.colors.text.separator} font-mono italic`}>
                          Empty slot
                        </div>
                      )}
                    </div>
                  </div>
                  <div className={`border-t ${TERMINAL_THEME.colors.border.default} pt-3`}>
                    <button
                      onClick={() =>
                        mode === 'save'
                          ? handleSaveClick(slotId)
                          : handleLoadClick(slotId)
                      }
                      disabled={
                        loading || (mode === 'load' && !slotData)
                      }
                      className={`w-full text-left font-mono text-sm font-bold transition-colors uppercase tracking-wider ${
                        isEmpty
                          ? `${TERMINAL_THEME.colors.text.separator} disabled:${TERMINAL_THEME.colors.text.separator}`
                          : isSelected && !isEmpty
                          ? `${TERMINAL_THEME.colors.interactive.text} underline`
                          : `${TERMINAL_THEME.colors.text.primary} hover:${TERMINAL_THEME.colors.interactive.text} disabled:${TERMINAL_THEME.colors.text.separator}`
                      } disabled:no-underline`}
                    >
                      {mode === 'save'
                        ? slotData
                          ? `${TERMINAL_THEME.symbols.doubleArrowRight} [${index + 1}] OVERWRITE`
                          : `${TERMINAL_THEME.symbols.doubleArrowRight} [${index + 1}] SAVE HERE`
                        : slotData
                        ? `${TERMINAL_THEME.symbols.doubleArrowRight} [${index + 1}] LOAD`
                        : `${TERMINAL_THEME.symbols.doubleArrowRight} [${index + 1}] EMPTY`}
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Autosave slot (load mode only) */}
            {mode === 'load' && autosaveSlot && (
              <div className={`border p-4 ${
                selectedIndex === 3
                  ? `border-amber-500/50 ${TERMINAL_THEME.colors.bg.hover}`
                  : `${TERMINAL_THEME.colors.border.default} ${TERMINAL_THEME.colors.bg.semiTransparent}`
              }`}>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className={`font-bold ${TERMINAL_THEME.colors.text.primary} mb-2 font-mono text-sm`}>
                      {TERMINAL_THEME.symbols.prefix} {getCaseName(autosaveSlot.case_id)}
                    </div>
                    <div className={`text-xs ${TERMINAL_THEME.colors.text.muted} font-mono mb-1`}>
                      [Autosave]
                    </div>
                    <div className={`text-sm ${TERMINAL_THEME.colors.text.tertiary} font-mono`}>
                      {TERMINAL_THEME.symbols.bullet} {formatTimestamp(autosaveSlot.timestamp)}
                    </div>
                    <div className={`text-sm ${TERMINAL_THEME.colors.text.muted} font-mono`}>
                      {TERMINAL_THEME.symbols.bullet} Location: {autosaveSlot.location}
                    </div>
                    <div className={`text-sm ${TERMINAL_THEME.colors.text.muted} font-mono`}>
                      {TERMINAL_THEME.symbols.bullet} Evidence: {autosaveSlot.evidence_count}
                    </div>
                  </div>
                </div>
                <div className={`border-t ${TERMINAL_THEME.colors.border.default} pt-3`}>
                  <button
                    onClick={() => handleLoadClick('autosave')}
                    disabled={loading}
                    className={`w-full text-left font-mono text-sm font-bold transition-colors uppercase tracking-wider ${
                      selectedIndex === 3
                        ? `${TERMINAL_THEME.colors.interactive.text} underline`
                        : `${TERMINAL_THEME.colors.text.primary} hover:${TERMINAL_THEME.colors.interactive.text}`
                    } disabled:${TERMINAL_THEME.colors.text.separator} disabled:no-underline`}
                  >
                    {TERMINAL_THEME.symbols.doubleArrowRight} [4] LOAD
                  </button>
                </div>
              </div>
            )}

            {/* Loading indicator */}
            {loading && (
              <div className={`text-center text-sm ${TERMINAL_THEME.colors.text.muted} font-mono mt-4`}>
                {TERMINAL_THEME.symbols.block} {mode === 'save' ? 'Saving...' : 'Loading...'}
              </div>
            )}
          </div>

          {/* Close button [X] */}
          <Dialog.Close asChild>
            <button
              className={`absolute top-4 right-4 ${TERMINAL_THEME.colors.text.tertiary} hover:${TERMINAL_THEME.colors.interactive.text}
                         focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none
                         px-1 transition-colors font-mono text-sm`}
              aria-label="Close"
            >
              {TERMINAL_THEME.symbols.closeButton}
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default SaveLoadModal;
