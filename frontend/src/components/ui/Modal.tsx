import React, { useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  /** Terminal variant for dark theme */
  variant?: 'default' | 'terminal';
  /** Optional max-width class override (default: max-w-4xl) */
  maxWidth?: string;
  /** Whether to remove default padding from content area */
  noPadding?: boolean;
  /** Whether to hide the default header bar */
  hideHeader?: boolean;
  /** Whether to remove the default window frame (border, bg, shadow) */
  frameless?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  children,
  title,
  variant = 'default',
  maxWidth = 'max-w-4xl',
  noPadding = false,
  hideHeader = false,
  frameless = false,
}: ModalProps) {
  const { theme } = useTheme();

  // ESC key listener for modal close
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isTerminal = variant === 'terminal';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 ${theme.components.modal.overlayStyle}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal content */}
      <div
        className={`relative ${maxWidth} w-full max-h-[90vh] overflow-hidden ${frameless
          ? '' // Frameless: No border/bg/shadow
          : `rounded-lg shadow-xl border ${theme.colors.bg.primary} ${theme.colors.border.default}`
          }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
      >
        {/* Header */}
        {!hideHeader && (
          <div
            className={`sticky top-0 px-6 py-3 border-b flex items-center justify-between ${theme.colors.bg.primary} ${theme.colors.border.default}`}
          >
            {title && (
              <h2
                id="modal-title"
                className={`font-mono font-bold uppercase tracking-widest ${isTerminal
                  ? `${theme.colors.text.primary} text-sm`
                  : `${theme.colors.interactive.text} text-xl`
                  }`}
              >
                {title}
              </h2>
            )}
            <button
              onClick={onClose}
              className={`font-mono transition-colors ${isTerminal
                ? `${theme.colors.text.muted} ${theme.colors.text.primaryHover} text-sm`
                : `${theme.colors.interactive.text} ${theme.colors.interactive.hover} text-2xl`
                }`}
              aria-label="Close modal"
            >
              {isTerminal ? '[X]' : <>&times;</>}
            </button>
          </div>
        )}

        {/* Body */}
        <div className={`${noPadding ? 'p-0' : 'p-6'} font-mono ${theme.colors.text.secondary} overflow-y-auto max-h-[calc(90vh-60px)]`}>
          {children}
        </div>
      </div>
    </div>
  );
}
