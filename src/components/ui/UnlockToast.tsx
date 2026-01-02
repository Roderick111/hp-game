/**
 * UnlockToast Component
 *
 * Toast notification for hypothesis unlock events.
 * Displays with amber/gold theme, auto-dismisses after timeout,
 * and provides accessible ARIA attributes for screen readers.
 *
 * Enhanced in Milestone 6 with framer-motion animations for dramatic entrance.
 *
 * @module components/ui/UnlockToast
 * @since Milestone 2
 * @updated Milestone 6 - Added framer-motion AnimatePresence integration
 */

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

export interface UnlockToastProps {
  /** The label of the hypothesis that was unlocked */
  hypothesisLabel: string;
  /** Callback when toast should be dismissed */
  onDismiss: () => void;
  /** Auto-dismiss timeout in milliseconds (default: 5000) */
  autoDismissMs?: number;
  /** Whether the toast is visible (for AnimatePresence integration) */
  isVisible?: boolean;
}

/**
 * Toast animation variants with spring physics for dramatic entrance
 */
const toastVariants = {
  initial: {
    opacity: 0,
    y: -20,
    scale: 0.9,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 20,
    },
  },
  exit: {
    opacity: 0,
    y: 20,
    scale: 0.9,
    transition: {
      duration: 0.2,
      ease: 'easeIn' as const,
    },
  },
};

/**
 * Reduced motion variants - instant transitions
 */
const reducedMotionVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.01 } },
  exit: { opacity: 0, transition: { duration: 0.01 } },
};

/**
 * Unlock icon SVG (open padlock)
 */
function UnlockIcon(): JSX.Element {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-6 w-6 text-amber-100"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
      />
    </svg>
  );
}

/**
 * Close icon SVG (X button)
 */
function CloseIcon(): JSX.Element {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

/**
 * Toast notification component for hypothesis unlocks.
 *
 * Features:
 * - Amber/gold gradient theme matching game aesthetic
 * - Spring animation entrance for dramatic effect
 * - Auto-dismiss with configurable timeout
 * - Progress bar showing remaining time
 * - Manual dismiss via button or click
 * - Accessible with role="alert" and aria-live
 * - Respects prefers-reduced-motion
 *
 * @example Basic Usage
 * ```tsx
 * <UnlockToast
 *   hypothesisLabel="Complex conspiracy theory"
 *   onDismiss={() => handleDismiss()}
 * />
 * ```
 *
 * @example With AnimatePresence wrapper
 * ```tsx
 * <AnimatePresence>
 *   {isVisible && (
 *     <UnlockToast
 *       key={notification.id}
 *       hypothesisLabel={notification.label}
 *       onDismiss={handleDismiss}
 *       isVisible={isVisible}
 *     />
 *   )}
 * </AnimatePresence>
 * ```
 */
export function UnlockToast({
  hypothesisLabel,
  onDismiss,
  autoDismissMs = 5000,
  isVisible = true,
}: UnlockToastProps): JSX.Element | null {
  const [internalVisible, setInternalVisible] = useState(true);
  const shouldReduceMotion = useReducedMotion();

  // Use internal visibility if isVisible prop not controlling
  const effectiveVisible = isVisible && internalVisible;

  // Handle dismiss with exit animation
  const handleDismiss = useCallback(() => {
    setInternalVisible(false);
    // Small delay to allow exit animation to complete
    setTimeout(onDismiss, shouldReduceMotion ? 10 : 200);
  }, [onDismiss, shouldReduceMotion]);

  // Auto-dismiss timer
  useEffect(() => {
    if (!effectiveVisible) return;

    const timer = setTimeout(() => {
      handleDismiss();
    }, autoDismissMs);

    return () => clearTimeout(timer);
  }, [autoDismissMs, effectiveVisible, handleDismiss]);

  // Handle keyboard dismiss (Enter or Space on dismiss button)
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleDismiss();
    }
  };

  // Select appropriate animation variants
  const variants = shouldReduceMotion ? reducedMotionVariants : toastVariants;

  return (
    <AnimatePresence>
      {effectiveVisible && (
        <motion.div
          variants={variants}
          initial="initial"
          animate="animate"
          exit="exit"
          role="alert"
          aria-live="polite"
          aria-atomic="true"
          className="max-w-sm w-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-lg shadow-lg overflow-hidden"
        >
          {/* Content area */}
          <div className="p-4">
            <div className="flex items-start">
              {/* Icon */}
              <div className="flex-shrink-0">
                <UnlockIcon />
              </div>

              {/* Text content */}
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-white">New hypothesis unlocked!</p>
                <p className="mt-1 text-sm text-amber-100">{hypothesisLabel}</p>
              </div>

              {/* Dismiss button */}
              <div className="ml-4 flex-shrink-0">
                <button
                  type="button"
                  onClick={handleDismiss}
                  onKeyDown={handleKeyDown}
                  className="
                    inline-flex rounded-md text-amber-200
                    hover:text-white focus:outline-none
                    focus:ring-2 focus:ring-white focus:ring-offset-2
                    focus:ring-offset-amber-500
                  "
                  aria-label="Dismiss notification"
                >
                  <CloseIcon />
                </button>
              </div>
            </div>
          </div>

          {/* Progress bar for auto-dismiss countdown */}
          <div className="h-1 bg-amber-400/30">
            <motion.div
              className="h-full bg-amber-200 origin-left"
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{
                duration: autoDismissMs / 1000,
                ease: 'linear',
              }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * UnlockToastContainer - Wrapper for positioning multiple toasts.
 *
 * Positions toasts in the top-right corner with proper z-index and stacking.
 *
 * @example
 * ```tsx
 * <UnlockToastContainer>
 *   {notifications.map((n, i) => (
 *     <UnlockToast
 *       key={n.eventId}
 *       hypothesisLabel={n.hypothesisLabel}
 *       onDismiss={() => acknowledge(n.eventId)}
 *       style={{ marginTop: i * 8 }}
 *     />
 *   ))}
 * </UnlockToastContainer>
 * ```
 */
export function UnlockToastContainer({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return (
    <div
      className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none"
      aria-label="Notifications"
    >
      <div className="pointer-events-auto">{children}</div>
    </div>
  );
}
