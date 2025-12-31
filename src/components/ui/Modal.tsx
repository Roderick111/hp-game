import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

export function Modal({ isOpen, onClose, children, title }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal content */}
      <div className="relative bg-parchment-50 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto border-2 border-amber-700">
        {/* Header */}
        <div className="sticky top-0 bg-amber-100 px-6 py-4 border-b border-amber-300 flex items-center justify-between">
          {title && (
            <h2 className="text-xl font-serif font-bold text-amber-900">
              {title}
            </h2>
          )}
          <button
            onClick={onClose}
            className="text-amber-600 hover:text-amber-900 text-2xl font-bold ml-auto"
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
