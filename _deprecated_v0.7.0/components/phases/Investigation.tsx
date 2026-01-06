/**
 * Investigation Phase Component
 *
 * Phase where players collect evidence to investigate hypotheses.
 *
 * Enhanced in Milestone 6 with:
 * - PhaseTransition wrapper for smooth entrance
 * - Animated IP counter with visual scarcity tension
 * - Evidence-hypothesis linking via EvidenceCard
 * - Enhanced unlock toast positioning (z-index 9999)
 * - Newly discovered contradiction tracking
 *
 * Enhanced in Milestone 7 with:
 * - Active hypothesis selection sidebar
 * - Evidence relevance visualization (color-coded borders and badges)
 * - Hypothesis pivot tracking
 * - Keyboard navigation support
 * - ARIA labels for accessibility
 *
 * @module components/phases/Investigation
 * @since Milestone 1
 * @updated Milestone 7 - Added active hypothesis selection
 */

import { useState, useEffect, useMemo, useCallback, useRef, KeyboardEvent } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { CaseData, InvestigationAction } from '../../types/game';
import type { ConditionalHypothesis, Contradiction } from '../../types/enhanced';
import { useGame } from '../../hooks/useGame';
import { useUnlockNotifications } from '../../hooks/useUnlockNotifications';
import { findNewlyUnlockedHypotheses, createUnlockTrigger } from '../../utils/unlocking';
import { findNewlyDiscoveredContradictions } from '../../utils/contradictions';
import {
  calculateEvidenceRelevance,
  EvidenceRelevance,
} from '../../utils/evidenceRelevance';
import { CaseDataWithContradictions } from '../../utils/scoring';
import { PhaseTransition } from '../ui/PhaseTransition';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { EvidenceCard } from '../ui/EvidenceCard';
import { Modal } from '../ui/Modal';
import { UnlockToast, UnlockToastContainer } from '../ui/UnlockToast';
import { ContradictionPanel } from '../ui/ContradictionPanel';

interface Props {
  caseData: CaseData;
}

export function Investigation({ caseData }: Props) {
  const { state, dispatch } = useGame();
  const shouldReduceMotion = useReducedMotion();

  const [activeEvidence, setActiveEvidence] = useState<InvestigationAction | null>(null);
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [lastCollectedEvidenceId, setLastCollectedEvidenceId] = useState<string | null>(null);
  const [newlyDiscoveredContradictionIds, setNewlyDiscoveredContradictionIds] = useState<string[]>(
    []
  );

  const { investigationActions } = caseData;
  const ip = state.investigationPointsRemaining;
  const initialIp = caseData.briefing.investigationPoints;

  // Cast hypotheses to ConditionalHypothesis for unlock checking
  const hypotheses = caseData.hypotheses as unknown as ConditionalHypothesis[];

  // Get contradictions from case data (if available) - wrapped in useMemo for stable reference
  const contradictions = useMemo(() => {
    return (caseData as CaseDataWithContradictions).contradictions ?? [];
  }, [caseData]);

  // Get pending notifications and acknowledge function
  const { notifications, acknowledgeNotification } = useUnlockNotifications(hypotheses);

  // Ref for hypothesis sidebar keyboard navigation
  const hypothesisSidebarRef = useRef<HTMLDivElement>(null);

  // Get available hypotheses (Tier 1 + unlocked Tier 2)
  const availableHypotheses = useMemo(() => {
    return hypotheses.filter((h) => {
      return h.tier === 1 || state.unlockedHypotheses.includes(h.id);
    });
  }, [hypotheses, state.unlockedHypotheses]);

  // Get active hypothesis data for display
  const activeHypothesis = useMemo(() => {
    if (state.activeHypothesisId === null) return null;
    return availableHypotheses.find((h) => h.id === state.activeHypothesisId) ?? null;
  }, [state.activeHypothesisId, availableHypotheses]);

  // Handle hypothesis selection
  const handleHypothesisSelect = useCallback(
    (hypothesisId: string) => {
      dispatch({ type: 'SET_ACTIVE_HYPOTHESIS', hypothesisId });
    },
    [dispatch]
  );

  // Handle clearing active hypothesis
  const handleClearFocus = useCallback(() => {
    dispatch({ type: 'CLEAR_ACTIVE_HYPOTHESIS' });
  }, [dispatch]);

  // Calculate evidence relevance relative to active hypothesis
  const getEvidenceRelevance = useCallback(
    (evidenceId: string): EvidenceRelevance | undefined => {
      if (state.activeHypothesisId === null) {
        return undefined; // No active hypothesis = exploratory mode
      }

      const activeHyp = hypotheses.find((h) => h.id === state.activeHypothesisId);
      if (!activeHyp) {
        return undefined; // Safety check
      }

      return calculateEvidenceRelevance(evidenceId, activeHyp, contradictions);
    },
    [state.activeHypothesisId, hypotheses, contradictions]
  );

  // Keyboard navigation handler for hypothesis sidebar
  const handleHypothesisKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>, hypothesisId: string, index: number) => {
      switch (event.key) {
        case 'Enter':
        case ' ':
          event.preventDefault();
          handleHypothesisSelect(hypothesisId);
          break;
        case 'Escape':
          event.preventDefault();
          handleClearFocus();
          break;
        case 'ArrowDown':
          event.preventDefault();
          if (index < availableHypotheses.length - 1) {
            const nextButton = hypothesisSidebarRef.current?.querySelectorAll(
              '[role="radio"]'
            )[index + 1] as HTMLElement;
            nextButton?.focus();
          }
          break;
        case 'ArrowUp':
          event.preventDefault();
          if (index > 0) {
            const prevButton = hypothesisSidebarRef.current?.querySelectorAll(
              '[role="radio"]'
            )[index - 1] as HTMLElement;
            prevButton?.focus();
          }
          break;
      }
    },
    [handleHypothesisSelect, handleClearFocus, availableHypotheses.length]
  );

  // Build evidence map for ContradictionPanel
  const evidenceMap = useMemo(() => {
    const map = new Map<string, { title: string; description: string }>();
    for (const action of investigationActions) {
      map.set(action.id, {
        title: action.evidence.title,
        description: action.evidence.content,
      });
    }
    return map;
  }, [investigationActions]);

  // Clear newly discovered flag after animation
  useEffect(() => {
    if (newlyDiscoveredContradictionIds.length > 0) {
      const timer = setTimeout(() => {
        setNewlyDiscoveredContradictionIds([]);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [newlyDiscoveredContradictionIds]);

  // Evaluate unlocks and contradictions after evidence collection
  useEffect(() => {
    if (lastCollectedEvidenceId) {
      // Check for newly unlocked hypotheses
      const newlyUnlocked = findNewlyUnlockedHypotheses(hypotheses, state, initialIp);

      for (const hypothesisId of newlyUnlocked) {
        const trigger = createUnlockTrigger(lastCollectedEvidenceId, state, initialIp);
        dispatch({ type: 'UNLOCK_HYPOTHESIS', hypothesisId, trigger });
      }

      // Check for newly discovered contradictions
      const newlyDiscovered = findNewlyDiscoveredContradictions(
        contradictions,
        state.collectedEvidenceIds,
        state.discoveredContradictions
      );

      if (newlyDiscovered.length > 0) {
        // Track newly discovered for animation
        setNewlyDiscoveredContradictionIds(newlyDiscovered.map((c) => c.id));

        for (const contradiction of newlyDiscovered) {
          dispatch({ type: 'DISCOVER_CONTRADICTION', contradictionId: contradiction.id });
        }
      }

      setLastCollectedEvidenceId(null);
    }
  }, [lastCollectedEvidenceId, hypotheses, contradictions, state, initialIp, dispatch]);

  // Group actions by category
  const locations = investigationActions.filter((a) => a.category === 'location');
  const witnesses = investigationActions.filter((a) => a.category === 'witness');
  const records = investigationActions.filter((a) => a.category === 'records');

  // Check if action is already collected
  const isCollected = (id: string) => state.collectedEvidenceIds.includes(id);

  // Handle collecting evidence
  const collectEvidence = (action: InvestigationAction) => {
    if (ip < action.cost || isCollected(action.id)) return;

    dispatch({
      type: 'COLLECT_EVIDENCE',
      actionId: action.id,
      cost: action.cost,
    });

    // Track last collected evidence for unlock/contradiction evaluation
    setLastCollectedEvidenceId(action.id);

    setActiveEvidence(action);
    setShowEvidenceModal(true);
  };

  // Handle resolving a contradiction
  const handleResolveContradiction = (contradictionId: string) => {
    const contradiction = contradictions.find((c: Contradiction) => c.id === contradictionId);
    dispatch({
      type: 'RESOLVE_CONTRADICTION',
      contradictionId,
      resolution: contradiction?.resolution ?? 'Player acknowledged the contradiction.',
    });
  };

  // Get relevance border color based on evidence relevance to active hypothesis
  const getRelevanceBorderColor = (relevance: EvidenceRelevance | undefined): string => {
    if (!relevance) return ''; // No active hypothesis
    switch (relevance) {
      case 'supports':
        return 'border-l-4 border-l-green-500';
      case 'contradicts':
        return 'border-l-4 border-l-red-500';
      case 'neutral':
        return 'border-l-4 border-l-gray-300';
      default:
        return '';
    }
  };

  // Get relevance badge for collected evidence
  const RelevanceBadge = ({
    relevance,
  }: {
    relevance: EvidenceRelevance | undefined;
  }): JSX.Element | null => {
    if (!relevance || relevance === 'neutral') return null;

    const isSupports = relevance === 'supports';
    return (
      <span
        className={`
          inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium
          ${isSupports ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}
        `}
        aria-label={`${isSupports ? 'Supports' : 'Contradicts'} active hypothesis`}
      >
        <span aria-hidden="true">{isSupports ? '\u2191' : '\u2193'}</span>
        {isSupports ? 'Supports' : 'Contradicts'}
      </span>
    );
  };

  // Render action button
  const renderAction = (action: InvestigationAction) => {
    const collected = isCollected(action.id);
    const canAfford = ip >= action.cost;
    const relevance = collected ? getEvidenceRelevance(action.id) : undefined;
    const relevanceBorderClass = collected ? getRelevanceBorderColor(relevance) : '';

    return (
      <motion.div
        key={action.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={canAfford && !collected ? { scale: 1.02 } : undefined}
        whileTap={canAfford && !collected ? { scale: 0.98 } : undefined}
        className={`
          p-4 rounded-lg border-2 transition-all duration-200
          ${relevanceBorderClass}
          ${
            collected
              ? 'bg-green-50 border-green-300 cursor-pointer hover:bg-green-100'
              : canAfford
              ? 'bg-amber-50 border-amber-200 cursor-pointer hover:border-amber-400 hover:shadow-md'
              : 'bg-gray-50 border-gray-200 opacity-50 cursor-not-allowed'
          }
        `}
        onClick={() => {
          if (collected) {
            setActiveEvidence(action);
            setShowEvidenceModal(true);
          } else if (canAfford) {
            collectEvidence(action);
          }
        }}
      >
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            <h4 className={`font-bold ${collected ? 'text-green-800' : 'text-amber-900'}`}>
              {collected && <span className="mr-1">&#x2713;</span>}
              {action.title}
            </h4>
            <p className="text-sm text-amber-700 mt-1 line-clamp-2">{action.description}</p>
            {/* Show relevance badge when collected and hypothesis is active */}
            {collected && relevance && (
              <div className="mt-2">
                <RelevanceBadge relevance={relevance} />
              </div>
            )}
          </div>
          <span
            className={`
              px-3 py-1 rounded-full text-sm font-bold whitespace-nowrap
              ${
                collected
                  ? 'bg-green-100 text-green-700'
                  : canAfford
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-gray-100 text-gray-500'
              }
            `}
          >
            {collected ? 'Done' : `${action.cost} IP`}
          </span>
        </div>
      </motion.div>
    );
  };

  return (
    <PhaseTransition variant="slide-up">
      <div className="space-y-6">
        {/* IP Counter with visual tension */}
        <Card variant="official">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div>
              <h2 className="text-2xl font-serif font-bold text-amber-900">Investigation Phase</h2>
              <p className="text-amber-700 text-sm mt-1">
                Choose your investigation actions wisely. Each action costs Investigation Points.
              </p>
            </div>
            <div className="text-right">
              <motion.div
                className="text-3xl font-bold text-amber-900"
                key={ip}
                initial={!shouldReduceMotion ? { scale: 1.2 } : undefined}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500 }}
              >
                {ip} <span className="text-lg font-normal">IP remaining</span>
              </motion.div>

              {/* Animated IP dots */}
              <div className="flex gap-1.5 mt-2 justify-end">
                {Array.from({ length: initialIp }).map((_, i) => (
                  <motion.div
                    key={i}
                    className={`w-5 h-5 rounded-full ${
                      i < ip ? 'bg-amber-500' : 'bg-amber-200'
                    }`}
                    initial={false}
                    animate={{
                      scale: i === ip ? [1, 1.3, 1] : 1,
                      opacity: i >= ip ? 0.3 : 1,
                    }}
                    transition={{
                      scale: { duration: 0.3, repeat: i === ip && !shouldReduceMotion ? 2 : 0 },
                      opacity: { duration: 0.3 },
                    }}
                  />
                ))}
              </div>

              {/* Low IP warning */}
              <AnimatePresence>
                {ip <= 2 && ip > 0 && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-red-600 text-xs mt-2 font-medium"
                  >
                    Low investigation points - choose carefully!
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </div>
        </Card>

        {/* Main content: Hypothesis Sidebar + Evidence Grid */}
        <div className="grid grid-cols-12 gap-6">
          {/* Left sidebar: Hypothesis Selection */}
          <aside
            className="col-span-12 lg:col-span-3"
            ref={hypothesisSidebarRef}
            role="radiogroup"
            aria-label="Investigation focus selection"
          >
            <Card>
              <h3 className="font-bold text-amber-900 mb-3 text-lg flex items-center gap-2">
                <span className="text-xl" aria-hidden="true">
                  &#x1F50D;
                </span>
                Investigation Focus
              </h3>
              <p className="text-amber-700 text-xs mb-3">
                Select a hypothesis to see which evidence supports or contradicts it.
              </p>

              <div className="space-y-2">
                {availableHypotheses.map((hypothesis, index) => {
                  const isActive = state.activeHypothesisId === hypothesis.id;
                  return (
                    <div
                      key={hypothesis.id}
                      role="radio"
                      tabIndex={0}
                      aria-checked={isActive}
                      aria-label={`${hypothesis.label}${isActive ? ', currently investigating' : ''}`}
                      onClick={() => handleHypothesisSelect(hypothesis.id)}
                      onKeyDown={(e) => handleHypothesisKeyDown(e, hypothesis.id, index)}
                      className={`
                        w-full p-3 rounded-lg border-2 text-left transition-all cursor-pointer
                        focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2
                        ${
                          isActive
                            ? 'border-blue-500 bg-blue-50 shadow-md'
                            : 'border-gray-200 hover:border-amber-300 hover:bg-amber-50'
                        }
                      `}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-amber-900 text-sm">
                            {hypothesis.label}
                          </div>
                          {hypothesis.tier === 2 && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-purple-100 text-purple-700 mt-1">
                              Unlocked
                            </span>
                          )}
                        </div>
                        {isActive && (
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200 flex-shrink-0"
                            aria-hidden="true"
                          >
                            Active
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Clear focus button */}
                <AnimatePresence>
                  {state.activeHypothesisId !== null && (
                    <motion.button
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      onClick={handleClearFocus}
                      className="w-full p-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
                      aria-label="Return to exploratory mode"
                    >
                      Clear focus (explore all)
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </Card>
          </aside>

          {/* Right: Evidence Area */}
          <main className="col-span-12 lg:col-span-9 space-y-6">
            {/* Active Hypothesis Banner */}
            <AnimatePresence mode="wait">
              {activeHypothesis !== null && (
                <motion.div
                  key="active-hypothesis-banner"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}
                  className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg shadow-sm"
                  role="status"
                  aria-live="polite"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="text-blue-600 text-lg" aria-hidden="true">
                        &#x1F50E;
                      </span>
                      <div>
                        <span className="text-blue-900 font-semibold">Investigating: </span>
                        <span className="text-blue-800">{activeHypothesis.label}</span>
                      </div>
                    </div>
                    <button
                      onClick={handleClearFocus}
                      className="text-sm text-blue-600 hover:text-blue-800 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-400 rounded px-2 py-1"
                      aria-label="Clear investigation focus"
                    >
                      Clear
                    </button>
                  </div>
                  <p className="text-blue-700 text-xs mt-2">
                    Evidence cards now show relevance to this hypothesis. Green = supports, Red =
                    contradicts, Gray = neutral.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Actions Grid */}
            <div className="grid md:grid-cols-3 gap-6">
              {/* Locations */}
              <div>
                <h3 className="font-bold text-amber-900 mb-3 text-lg flex items-center gap-2">
                  <span className="text-2xl">&#x1F4CD;</span> Locations
                </h3>
                <div className="space-y-3">{locations.map(renderAction)}</div>
              </div>

              {/* Witnesses */}
              <div>
                <h3 className="font-bold text-amber-900 mb-3 text-lg flex items-center gap-2">
                  <span className="text-2xl">&#x1F464;</span> Witnesses
                </h3>
                <div className="space-y-3">{witnesses.map(renderAction)}</div>
              </div>

              {/* Records */}
              <div>
                <h3 className="font-bold text-amber-900 mb-3 text-lg flex items-center gap-2">
                  <span className="text-2xl">&#x1F4DC;</span> Records
                </h3>
                <div className="space-y-3">{records.map(renderAction)}</div>
              </div>
            </div>
          </main>
        </div>

        {/* Contradiction Panel - Shows when contradictions are discovered */}
        <AnimatePresence>
          {contradictions.length > 0 && state.discoveredContradictions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <ContradictionPanel
                contradictions={contradictions}
                discoveredIds={state.discoveredContradictions}
                resolvedIds={state.resolvedContradictions}
                evidenceMap={evidenceMap}
                onResolve={handleResolveContradiction}
                newlyDiscoveredIds={newlyDiscoveredContradictionIds}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collected Evidence Summary */}
        {state.collectedEvidenceIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <h3 className="font-bold text-amber-900 mb-3 flex items-center gap-2">
                <span className="text-xl">&#x1F4CB;</span> Evidence Collected (
                {state.collectedEvidenceIds.length})
              </h3>
              <div className="grid md:grid-cols-2 gap-2">
                {state.collectedEvidenceIds.map((id) => {
                  const action = investigationActions.find((a) => a.id === id);
                  if (!action) return null;
                  const relevance = getEvidenceRelevance(id);
                  const borderColor =
                    relevance === 'supports'
                      ? 'border-l-green-500'
                      : relevance === 'contradicts'
                      ? 'border-l-red-500'
                      : relevance === 'neutral'
                      ? 'border-l-gray-300'
                      : '';
                  return (
                    <motion.div
                      key={id}
                      className={`p-3 bg-green-50 rounded border border-green-200 cursor-pointer hover:bg-green-100 transition-colors ${relevance ? `border-l-4 ${borderColor}` : ''}`}
                      onClick={() => {
                        setActiveEvidence(action);
                        setShowEvidenceModal(true);
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-green-600">&#x2713;</span>
                        <span className="text-green-800 text-sm font-medium flex-1">
                          {action.evidence.title}
                        </span>
                        {action.evidence.isCritical && (
                          <span className="text-red-500 text-xs">&#x2605;</span>
                        )}
                      </div>
                      {relevance && relevance !== 'neutral' && (
                        <div className="mt-1 ml-5">
                          <RelevanceBadge relevance={relevance} />
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </Card>
          </motion.div>
        )}

        {/* Proceed Button */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-4 border-t border-amber-200">
          <span className="text-amber-700 text-center md:text-left">
            {state.collectedEvidenceIds.length === 0
              ? 'Collect at least one piece of evidence to proceed'
              : ip > 0
              ? `You can still investigate (${ip} IP remaining)`
              : 'No investigation points remaining'}
          </span>
          <Button
            onClick={() => dispatch({ type: 'ADVANCE_PHASE' })}
            disabled={state.collectedEvidenceIds.length === 0}
            size="lg"
          >
            Lock In & Make Predictions &#x2192;
          </Button>
        </div>

        {/* Evidence Modal */}
        <Modal
          isOpen={showEvidenceModal}
          onClose={() => setShowEvidenceModal(false)}
          title="Evidence Collected"
        >
          {activeEvidence && (
            <EvidenceCard
              evidence={activeEvidence.evidence}
              evidenceId={activeEvidence.id}
              hypotheses={hypotheses}
              contradictions={contradictions}
              showRelevance={true}
            />
          )}
        </Modal>

        {/* Unlock Toast Notifications - Fixed position with high z-index */}
        <UnlockToastContainer>
          <AnimatePresence>
            {notifications.map((notification, index) => (
              <motion.div
                key={notification.eventId}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                style={{ marginTop: index > 0 ? 8 : 0 }}
              >
                <UnlockToast
                  hypothesisLabel={notification.hypothesisLabel}
                  onDismiss={() => acknowledgeNotification(notification.eventId)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </UnlockToastContainer>
      </div>
    </PhaseTransition>
  );
}
