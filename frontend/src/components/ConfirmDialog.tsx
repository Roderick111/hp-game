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
// Note: ESC key handling is provided by Modal component - do not duplicate here
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { useTheme } from '../context/ThemeContext';

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
  const { theme } = useTheme();
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

  // Note: ESC key handling is already provided by Modal component via onClose prop
  // Do NOT add duplicate ESC handler here - it causes event conflicts

  if (!open) return null;

  return (
    <Modal isOpen={open} onClose={onCancel} title={title} variant="terminal">
      <div className="space-y-4">
        <p className={`${theme.colors.text.secondary} leading-relaxed`}>{message}</p>

        <div className="flex gap-3 justify-end pt-2">
          <Button
            onClick={onCancel}
            variant="terminal"
            size="sm"
            className={`${theme.colors.border.default} ${theme.colors.text.tertiary} hover:brightness-90`}
          >
            {cancelText}
          </Button>
          <Button
            ref={confirmButtonRef}
            onClick={onConfirm}
            variant={destructive ? 'terminal' : 'terminal-primary'}
            size="sm"
            className={destructive ? theme.components.button.danger : ''}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default ConfirmDialog;
