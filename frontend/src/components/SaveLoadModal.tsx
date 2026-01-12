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
import { Button } from './ui/Button';
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

  /**
   * Get metadata for a specific slot
   */
  const getSlotData = (slotId: string) => slots.find((s) => s.slot === slotId);

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
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50
                     bg-gray-900 border-2 border-gray-700 rounded-lg
                     w-full max-w-lg p-6 shadow-xl
                     focus:outline-none"
          onEscapeKeyDown={onClose}
        >
          {/* Title */}
          <Dialog.Title className="text-2xl font-bold text-amber-400 font-mono mb-6 tracking-wider">
            {mode === 'save' ? 'SAVE GAME' : 'LOAD GAME'}
          </Dialog.Title>

          {/* Manual save slots */}
          <div className="space-y-3 mb-6">
            {manualSlots.map((slotId, index) => {
              const slotData = getSlotData(slotId);
              return (
                <div
                  key={slotId}
                  className="border border-gray-700 rounded p-4 bg-gray-800/50"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-bold text-amber-400 mb-1">
                        Slot {index + 1}
                      </div>
                      {slotData ? (
                        <>
                          <div className="text-sm text-gray-400">
                            {formatTimestamp(slotData.timestamp)}
                          </div>
                          <div className="text-sm text-gray-400">
                            Location: {slotData.location}
                          </div>
                          <div className="text-sm text-gray-400">
                            Evidence: {slotData.evidence_count}
                          </div>
                        </>
                      ) : (
                        <div className="text-sm text-gray-500 italic">
                          Empty slot
                        </div>
                      )}
                    </div>
                    <Button
                      onClick={() =>
                        mode === 'save'
                          ? handleSaveClick(slotId)
                          : handleLoadClick(slotId)
                      }
                      disabled={
                        loading || (mode === 'load' && !slotData)
                      }
                      size="sm"
                      variant={mode === 'save' && slotData ? 'secondary' : 'primary'}
                      className="font-mono"
                    >
                      {mode === 'save'
                        ? slotData
                          ? 'OVERWRITE'
                          : 'SAVE HERE'
                        : 'LOAD'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Autosave slot (load mode only) */}
          {mode === 'load' && autosaveSlot && (
            <div className="border border-blue-700 rounded p-4 bg-blue-900/20">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="font-bold text-blue-400 mb-1">
                    Autosave
                  </div>
                  <div className="text-sm text-gray-400">
                    {formatTimestamp(autosaveSlot.timestamp)}
                  </div>
                  <div className="text-sm text-gray-400">
                    Location: {autosaveSlot.location}
                  </div>
                  <div className="text-sm text-gray-400">
                    Evidence: {autosaveSlot.evidence_count}
                  </div>
                </div>
                <Button
                  onClick={() => handleLoadClick('autosave')}
                  disabled={loading}
                  size="sm"
                  variant="primary"
                  className="font-mono"
                >
                  LOAD
                </Button>
              </div>
            </div>
          )}

          {/* Loading indicator */}
          {loading && (
            <div className="mt-4 text-center text-sm text-gray-500 font-mono">
              {mode === 'save' ? 'Saving...' : 'Loading...'}
            </div>
          )}

          {/* Close button (X) */}
          <Dialog.Close asChild>
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-white
                         focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none
                         rounded p-1 transition-colors"
              aria-label="Close"
            >
              <span className="text-xl font-mono">&times;</span>
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default SaveLoadModal;
