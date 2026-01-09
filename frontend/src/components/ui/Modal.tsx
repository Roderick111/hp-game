import React, { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  /** Terminal variant for dark theme */
  variant?: 'default' | 'terminal';
}

export function Modal({
  isOpen,
  onClose,
  children,
  title,
  variant = 'default',
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
        className={`relative rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden border-2 ${
          isTerminal
            ? 'bg-gray-900 border-gray-700'
            : 'bg-gray-900 border-gray-700'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
      >
        {/* Header */}
        <div
          className={`sticky top-0 px-6 py-4 border-b flex items-center justify-between ${
            isTerminal
              ? 'bg-gray-800 border-gray-700'
              : 'bg-gray-800 border-gray-700'
          }`}
        >
          {title && (
            <h2
              id="modal-title"
              className={`text-xl font-bold ${
                isTerminal
                  ? 'text-green-400 font-mono'
                  : 'text-yellow-400 font-mono uppercase tracking-wide'
              }`}
            >
              {isTerminal ? `[${title}]` : title}
            </h2>
          )}
          <button
            onClick={onClose}
            className={`text-2xl font-bold ml-auto ${
              isTerminal
                ? 'text-gray-400 hover:text-gray-200'
                : 'text-yellow-600 hover:text-yellow-400'
            }`}
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div className={`p-6 ${isTerminal ? 'font-mono text-gray-100' : 'font-mono text-gray-100'}`}>
          {children}
        </div>
      </div>
    </div>
  );
}
