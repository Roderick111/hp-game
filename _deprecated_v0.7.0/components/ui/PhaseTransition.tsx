/**
 * PhaseTransition Component
 *
 * Reusable wrapper for phase entrance animations.
 * Provides smooth fade-in and slide animations with accessibility support.
 *
 * Features:
 * - Multiple animation variants (fade, slide-up, slide-down)
 * - Respects prefers-reduced-motion media query
 * - GPU-accelerated animations (transform/opacity only)
 * - Configurable duration (default 300ms)
 *
 * @module components/ui/PhaseTransition
 * @since Milestone 6
 */

import { motion, Variants, useReducedMotion } from 'framer-motion';
import { ReactNode, useMemo } from 'react';

export type TransitionVariant = 'fade' | 'slide-up' | 'slide-down';

export interface PhaseTransitionProps {
  /** Content to animate */
  children: ReactNode;
  /** Animation variant to use */
  variant?: TransitionVariant;
  /** Animation duration in seconds (default: 0.3) */
  duration?: number;
  /** Delay before animation starts in seconds */
  delay?: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Animation variants for different transition types.
 * All animations use transform and opacity for GPU acceleration.
 */
const createVariants = (duration: number, delay: number): Record<TransitionVariant, Variants> => ({
  fade: {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: { duration, delay, ease: 'easeOut' },
    },
    exit: {
      opacity: 0,
      transition: { duration: duration * 0.75, ease: 'easeIn' },
    },
  },
  'slide-up': {
    initial: { opacity: 0, y: 20 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration, delay, ease: 'easeOut' },
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: { duration: duration * 0.75, ease: 'easeIn' },
    },
  },
  'slide-down': {
    initial: { opacity: 0, y: -20 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration, delay, ease: 'easeOut' },
    },
    exit: {
      opacity: 0,
      y: 20,
      transition: { duration: duration * 0.75, ease: 'easeIn' },
    },
  },
});

/**
 * Reduced motion variants - instant transitions with no animation
 */
const reducedMotionVariants: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0.01 },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.01 },
  },
};

/**
 * PhaseTransition wraps content in smooth entrance/exit animations.
 *
 * Automatically respects the user's prefers-reduced-motion preference,
 * falling back to instant transitions for accessibility.
 *
 * @example Basic fade-in
 * ```tsx
 * <PhaseTransition>
 *   <MyComponent />
 * </PhaseTransition>
 * ```
 *
 * @example Slide-up with custom duration
 * ```tsx
 * <PhaseTransition variant="slide-up" duration={0.4}>
 *   <PageContent />
 * </PhaseTransition>
 * ```
 *
 * @example With AnimatePresence for exit animations
 * ```tsx
 * import { AnimatePresence } from 'framer-motion';
 *
 * <AnimatePresence mode="wait">
 *   <PhaseTransition key={currentPhase}>
 *     {renderPhase(currentPhase)}
 *   </PhaseTransition>
 * </AnimatePresence>
 * ```
 */
export function PhaseTransition({
  children,
  variant = 'fade',
  duration = 0.3,
  delay = 0,
  className = '',
}: PhaseTransitionProps): JSX.Element {
  // Hook automatically detects prefers-reduced-motion
  const shouldReduceMotion = useReducedMotion();

  // Memoize variants to prevent recreation on each render
  const variants = useMemo(() => {
    if (shouldReduceMotion) {
      return reducedMotionVariants;
    }
    return createVariants(duration, delay)[variant];
  }, [shouldReduceMotion, duration, delay, variant]);

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={variants}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default PhaseTransition;
