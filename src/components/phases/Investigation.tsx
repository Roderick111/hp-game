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
 * @module components/phases/Investigation
 * @since Milestone 1
 * @updated Milestone 6 - Added animations and UX polish
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { CaseData, InvestigationAction } from '../../types/game';
import type { ConditionalHypothesis, Contradiction } from '../../types/enhanced';
import { useGame } from '../../hooks/useGame';
import { useUnlockNotifications } from '../../hooks/useUnlockNotifications';
import { findNewlyUnlockedHypotheses, createUnlockTrigger } from '../../utils/unlocking';
import { findNewlyDiscoveredContradictions } from '../../utils/contradictions';
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

  // Render action button
  const renderAction = (action: InvestigationAction) => {
    const collected = isCollected(action.id);
    const canAfford = ip >= action.cost;

    return (
      <motion.div
        key={action.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={canAfford && !collected ? { scale: 1.02 } : undefined}
        whileTap={canAfford && !collected ? { scale: 0.98 } : undefined}
        className={`
          p-4 rounded-lg border-2 transition-all duration-200
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
                  return (
                    <motion.div
                      key={id}
                      className="p-3 bg-green-50 rounded border border-green-200 cursor-pointer hover:bg-green-100 transition-colors flex items-center gap-2"
                      onClick={() => {
                        setActiveEvidence(action);
                        setShowEvidenceModal(true);
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className="text-green-600">&#x2713;</span>
                      <span className="text-green-800 text-sm font-medium">
                        {action.evidence.title}
                      </span>
                      {action.evidence.isCritical && (
                        <span className="text-red-500 text-xs">&#x2605;</span>
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
