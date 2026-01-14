import React, { useEffect } from 'react';

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
}

export function Modal({
  isOpen,
  onClose,
  children,
  title,
  variant = 'default',
  maxWidth = 'max-w-4xl',
  noPadding = false,
}: ModalProps) {
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
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal content */}
      <div
        className={`relative rounded-lg shadow-xl ${maxWidth} w-full max-h-[90vh] overflow-hidden border ${isTerminal
          ? 'bg-gray-900 border-gray-700'
          : 'bg-gray-900 border-gray-700'
          }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
      >
        {/* Header */}
        <div
          className={`sticky top-0 px-6 py-3 border-b flex items-center justify-between ${isTerminal
            ? 'bg-gray-900 border-gray-700'
            : 'bg-gray-800 border-gray-700'
            }`}
        >
          {title && (
            <h2
              id="modal-title"
              className={`font-mono font-bold uppercase tracking-widest ${isTerminal
                ? 'text-white text-sm'
                : 'text-yellow-400 text-xl'
                }`}
            >
              {isTerminal ? title : title}
            </h2>
          )}
          <button
            onClick={onClose}
            className={`font-mono transition-colors ${isTerminal
              ? 'text-gray-500 hover:text-white text-sm'
              : 'text-yellow-600 hover:text-yellow-400 text-2xl'
              }`}
            aria-label="Close modal"
          >
            {isTerminal ? '[X]' : <>&times;</>}
          </button>
        </div>

        {/* Body */}
        <div className={`${noPadding ? 'p-0' : 'p-6'} ${isTerminal ? 'font-mono text-gray-100' : 'font-mono text-gray-100'}`}>
          {children}
        </div>
      </div>
    </div>
  );
}
