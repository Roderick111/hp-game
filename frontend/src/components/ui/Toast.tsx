/**
 * Toast Notification Component
 *
 * Simple toast notifications for save/load feedback.
 * Auto-dismisses after specified duration.
 *
 * @module components/ui/Toast
 * @since Phase 5.3
 */

import { useEffect } from 'react';

// ============================================
// Types
// ============================================

export interface ToastProps {
  /** Toast message text */
  message: string;
  /** Toast variant (determines color scheme) */
  variant: 'success' | 'error' | 'info';
  /** Duration in ms before auto-dismiss (default 3000) */
  duration?: number;
  /** Callback when toast is dismissed */
  onClose: () => void;
}

// ============================================
// Component
// ============================================

export function Toast({
  message,
  variant,
  duration = 3000,
  onClose,
}: ToastProps) {
  // Auto-dismiss after duration
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  // Color schemes per variant
  const colors = {
    success: 'bg-green-900/90 border-green-700 text-green-400',
    error: 'bg-red-900/90 border-red-700 text-red-400',
    info: 'bg-blue-900/90 border-blue-700 text-blue-400',
  };

  return (
    <div
      className={`fixed top-4 right-4 z-[100] p-4 rounded border-2 font-mono text-sm shadow-xl ${colors[variant]}`}
      role="alert"
    >
      {message}
    </div>
  );
}

export default Toast;
