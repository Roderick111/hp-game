/**
 * usePhaseTransition Hook
 *
 * Hook for managing phase transition state (entering/exiting).
 * Tracks phase changes and provides transition state for animations.
 *
 * @module hooks/usePhaseTransition
 * @since Milestone 6
 */

import { useState, useEffect, useRef } from 'react';
import type { GamePhase } from '../types/game';

export interface PhaseTransitionState {
  /** Whether the component is currently transitioning */
  isTransitioning: boolean;
  /** The phase we're transitioning from (null on initial render) */
  previousPhase: GamePhase | null;
  /** Direction of the transition (forward or backward in game flow) */
  direction: 'forward' | 'backward' | null;
}

/**
 * Order of phases in the game flow.
 * Used to determine transition direction.
 */
const PHASE_ORDER: GamePhase[] = [
  'briefing',
  'hypothesis',
  'investigation',
  'prediction',
  'resolution',
  'review',
];

/**
 * Get the index of a phase in the phase order.
 * Returns -1 if phase not found.
 */
function getPhaseIndex(phase: GamePhase): number {
  return PHASE_ORDER.indexOf(phase);
}

/**
 * Hook to manage phase transition state.
 *
 * Tracks changes to the current phase and provides:
 * - Whether we're currently transitioning
 * - The previous phase (for exit animations)
 * - Direction of travel through the game
 *
 * @param currentPhase - The current game phase
 * @param transitionDuration - Duration in ms to wait before resetting transition state
 * @returns Phase transition state object
 *
 * @example Basic usage
 * ```tsx
 * function GameController({ phase }: { phase: GamePhase }) {
 *   const { isTransitioning, direction } = usePhaseTransition(phase);
 *
 *   return (
 *     <div className={isTransitioning ? 'transitioning' : ''}>
 *       <PhaseTransition variant={direction === 'forward' ? 'slide-up' : 'slide-down'}>
 *         {renderPhase(phase)}
 *       </PhaseTransition>
 *     </div>
 *   );
 * }
 * ```
 */
export function usePhaseTransition(
  currentPhase: GamePhase,
  transitionDuration = 300
): PhaseTransitionState {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [previousPhase, setPreviousPhase] = useState<GamePhase | null>(null);
  const [direction, setDirection] = useState<'forward' | 'backward' | null>(null);

  // Track the previous phase value
  const prevPhaseRef = useRef<GamePhase>(currentPhase);

  useEffect(() => {
    const prevPhase = prevPhaseRef.current;

    // If phase hasn't changed, do nothing
    if (currentPhase === prevPhase) {
      return;
    }

    // Calculate direction
    const prevIndex = getPhaseIndex(prevPhase);
    const currentIndex = getPhaseIndex(currentPhase);
    const newDirection = currentIndex > prevIndex ? 'forward' : 'backward';

    // Update state
    setPreviousPhase(prevPhase);
    setDirection(newDirection);
    setIsTransitioning(true);

    // Update ref for next comparison
    prevPhaseRef.current = currentPhase;

    // Reset transition state after duration
    const timer = setTimeout(() => {
      setIsTransitioning(false);
    }, transitionDuration);

    return () => clearTimeout(timer);
  }, [currentPhase, transitionDuration]);

  return {
    isTransitioning,
    previousPhase,
    direction,
  };
}

/**
 * Get the appropriate animation variant based on transition direction.
 *
 * @param direction - The transition direction
 * @returns The animation variant to use
 *
 * @example
 * ```tsx
 * const { direction } = usePhaseTransition(phase);
 * const variant = getTransitionVariant(direction);
 * // 'forward' -> 'slide-up', 'backward' -> 'slide-down', null -> 'fade'
 * ```
 */
export function getTransitionVariant(
  direction: 'forward' | 'backward' | null
): 'fade' | 'slide-up' | 'slide-down' {
  if (direction === 'forward') {
    return 'slide-up';
  }
  if (direction === 'backward') {
    return 'slide-down';
  }
  return 'fade';
}

export default usePhaseTransition;
