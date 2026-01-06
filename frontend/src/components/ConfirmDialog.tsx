/**
 * ConfirmDialog Component
 *
 * Reusable confirmation modal for destructive actions.
 * Uses the existing Modal component for consistent styling.
 *
 * Features:
 * - Title and message customization
 * - Confirm/Cancel buttons
 * - Accessible (keyboard navigation, ARIA)
 * - Terminal theme styling
 *
 * @module components/ConfirmDialog
 * @since Phase 3.1
 */

import { useEffect, useRef } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';

// ============================================
// Types
// ============================================

export interface ConfirmDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Dialog title */
  title: string;
  /** Dialog message/description */
  message: string;
  /** Callback when user confirms */
  onConfirm: () => void;
  /** Callback when user cancels */
  onCancel: () => void;
  /** Confirm button text (default: "Confirm") */
  confirmText?: string;
  /** Cancel button text (default: "Cancel") */
  cancelText?: string;
  /** Whether the action is destructive (red confirm button) */
  destructive?: boolean;
}

// ============================================
// Component
// ============================================

export function ConfirmDialog({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  destructive = false,
}: ConfirmDialogProps) {
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  // Focus confirm button when dialog opens
  useEffect(() => {
    if (open) {
      // Small delay to ensure modal is rendered
      const timer = setTimeout(() => {
        confirmButtonRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Handle keyboard events
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <Modal isOpen={open} onClose={onCancel} title={title} variant="terminal">
      <div className="space-y-4">
        <p className="text-gray-300 leading-relaxed">{message}</p>

        <div className="flex gap-3 justify-end pt-2">
          <Button
            onClick={onCancel}
            variant="secondary"
            size="sm"
            className="font-mono bg-gray-700 hover:bg-gray-600 border-gray-600 text-gray-200"
          >
            {cancelText}
          </Button>
          <Button
            ref={confirmButtonRef}
            onClick={onConfirm}
            variant="primary"
            size="sm"
            className={
              destructive
                ? 'font-mono bg-red-600 hover:bg-red-700 border-red-700 text-white'
                : 'font-mono bg-amber-600 hover:bg-amber-700 border-amber-700 text-white'
            }
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default ConfirmDialog;
