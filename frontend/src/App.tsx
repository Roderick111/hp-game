/**
 * App Component
 *
 * Main application layout for Phase 3 Investigation.
 * Integrates LocationView, EvidenceBoard, WitnessSelector, WitnessInterview,
 * and Verdict flow with terminal UI aesthetic.
 *
 * @module App
 * @since Phase 1, updated Phase 3
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { LocationView } from './components/LocationView';
import { EvidenceBoard } from './components/EvidenceBoard';
import { EvidenceModal } from './components/EvidenceModal';
import { WitnessSelector } from './components/WitnessSelector';
import { WitnessInterview } from './components/WitnessInterview';
import { VerdictSubmission } from './components/VerdictSubmission';
import { MentorFeedback } from './components/MentorFeedback';
import { ConfrontationDialogue } from './components/ConfrontationDialogue';
import { ConfirmDialog } from './components/ConfirmDialog';
import { BriefingModal } from './components/BriefingModal';
import { Modal } from './components/ui/Modal';
import { Button } from './components/ui/Button';
import { useInvestigation } from './hooks/useInvestigation';
import { useWitnessInterrogation } from './hooks/useWitnessInterrogation';
import { useVerdictFlow } from './hooks/useVerdictFlow';
import { useBriefing } from './hooks/useBriefing';
import { useTomChat } from './hooks/useTomChat';
import { getEvidenceDetails, resetCase } from './api/client';
import type { EvidenceDetails, Message } from './types/investigation';

// ============================================
// Configuration
// ============================================

const CASE_ID = 'case_001';
const LOCATION_ID = 'library';

// ============================================
// Component
// ============================================

export default function App() {
  // Investigation hook
  const {
    state,
    location,
    loading,
    error,
    saving,
    handleSave,
    handleLoad,
    handleEvidenceDiscovered,
    clearError,
    restoredMessages,
  } = useInvestigation({
    caseId: CASE_ID,
    locationId: LOCATION_ID,
  });

  // Witness interrogation hook
  const {
    state: witnessState,
    askQuestion,
    presentEvidenceToWitness,
    selectWitness,
    clearConversation,
  } = useWitnessInterrogation({
    caseId: CASE_ID,
    autoLoad: true,
  });

  // Verdict flow hook
  const {
    state: verdictState,
    submitVerdict,
    reset: resetVerdict,
  } = useVerdictFlow({
    caseId: CASE_ID,
  });

  // Briefing hook
  const {
    briefing,
    conversation: briefingConversation,
    selectedChoice: briefingSelectedChoice,
    choiceResponse: briefingChoiceResponse,
    loading: briefingLoading,
    loadBriefing,
    selectChoice: selectBriefingChoice,
    askQuestion: askBriefingQuestion,
    markComplete: markBriefingComplete,
  } = useBriefing({
    caseId: CASE_ID,
  });

  // Tom chat hook (Phase 4.1 - LLM-powered Tom conversation)
  const {
    checkAutoComment,
    sendMessage: sendTomMessage,
    loading: tomLoading,
  } = useTomChat({
    caseId: CASE_ID,
  });

  // Inline messages state (for Tom's ghost voice in conversation)
  const [inlineMessages, setInlineMessages] = useState<Message[]>([]);

  // Restore conversation messages on case load (Phase 4.4)
  useEffect(() => {
    if (restoredMessages && restoredMessages.length > 0) {
      setInlineMessages(restoredMessages);
    }
  }, [restoredMessages]);

  // Briefing modal state
  const [briefingModalOpen, setBriefingModalOpen] = useState(false);

  // Load briefing on mount - check backend completion state before opening modal
  useEffect(() => {
    const initBriefing = async () => {
      const content = await loadBriefing();
      // Show briefing modal if content loaded AND backend says not completed
      // The content.briefing_completed flag is now persisted in backend
      if (content && !content.briefing_completed) {
        setBriefingModalOpen(true);
      }
    };
    void initBriefing();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle briefing complete
  const handleBriefingComplete = useCallback(async () => {
    await markBriefingComplete();
    setBriefingModalOpen(false);
  }, [markBriefingComplete]);

  // Handle evidence discovered with Tom's auto-comment (Phase 4.1 LLM-powered)
  const handleEvidenceDiscoveredWithTom = useCallback(async (evidenceIds: string[]) => {
    // First, update the investigation state with discovered evidence
    handleEvidenceDiscovered(evidenceIds);

    // Check if Tom wants to auto-comment (30% chance, LLM-powered)
    // Non-blocking: errors don't interrupt investigation
    try {
      // Critical evidence forces Tom to comment
      const isCritical = evidenceIds.length > 1;
      const tomMessage = await checkAutoComment(isCritical);
      if (tomMessage) {
        // Add Tom's message to inline messages (with timestamp for ordering)
        setInlineMessages(prev => [...prev, tomMessage]);
      }
    } catch (error) {
      // Non-blocking: log error but don't interrupt investigation
      console.error('Tom auto-comment failed:', error);
    }
  }, [handleEvidenceDiscovered, checkAutoComment]);

  // Handle direct Tom message ("Tom, what do you think?")
  const handleTomMessage = useCallback(async (message: string) => {
    // Add user's question to conversation (as player message)
    const userMessage: Message = {
      type: 'player',
      text: `Tom, ${message}`,
      timestamp: Date.now(),
    };
    setInlineMessages(prev => [...prev, userMessage]);

    // Get Tom's response (always responds for direct chat)
    try {
      const tomResponse = await sendTomMessage(message);
      setInlineMessages(prev => [...prev, tomResponse]);
    } catch (error) {
      // Show error as Tom message
      console.error('Tom chat error:', error);
      const errorMessage: Message = {
        type: 'tom_ghost',
        text: "Tom seems distracted... he can't respond right now.",
        timestamp: Date.now(),
      };
      setInlineMessages(prev => [...prev, errorMessage]);
    }
  }, [sendTomMessage]);


  // Witness interview modal state
  const [witnessModalOpen, setWitnessModalOpen] = useState(false);

  // Verdict modal state
  const [verdictModalOpen, setVerdictModalOpen] = useState(false);

  // Evidence modal state
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceDetails | null>(null);
  const [evidenceLoading, setEvidenceLoading] = useState(false);
  const [evidenceError, setEvidenceError] = useState<string | null>(null);

  // Restart confirmation dialog state
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);
  const [restartLoading, setRestartLoading] = useState(false);

  // Handle witness selection from LocationView or WitnessSelector
  const handleWitnessClick = useCallback(async (witnessId: string) => {
    await selectWitness(witnessId);
    setWitnessModalOpen(true);
  }, [selectWitness]);

  // Handle witness modal close
  const handleWitnessModalClose = useCallback(() => {
    setWitnessModalOpen(false);
    clearConversation();
  }, [clearConversation]);

  // Handle evidence click from EvidenceBoard
  const handleEvidenceClick = useCallback(async (evidenceId: string) => {
    setEvidenceLoading(true);
    setEvidenceError(null);

    try {
      const details = await getEvidenceDetails(evidenceId, CASE_ID);
      setSelectedEvidence(details);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load evidence details';
      setEvidenceError(errorMessage);
    } finally {
      setEvidenceLoading(false);
    }
  }, []);

  // Handle evidence modal close
  const handleEvidenceModalClose = useCallback(() => {
    setSelectedEvidence(null);
    setEvidenceError(null);
  }, []);

  // Derive witnesses present at current location
  // For now, we'll show all witnesses as available
  // TODO: Filter by location when backend provides location data for witnesses
  const witnessesPresent = witnessState.witnesses.map(w => ({
    id: w.id,
    name: w.name,
  }));

  // Derive suspects for verdict submission (witnesses are potential suspects)
  const suspects = useMemo(() => {
    return witnessState.witnesses.map(w => ({
      id: w.id,
      name: w.name,
    }));
  }, [witnessState.witnesses]);

  // Derive discovered evidence with names for verdict submission
  const discoveredEvidenceWithNames = useMemo(() => {
    // Map evidence IDs to display names
    // For now, use ID as name; ideally would fetch from evidence details
    return (state?.discovered_evidence ?? []).map(id => ({
      id,
      name: id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    }));
  }, [state?.discovered_evidence]);

  // Handle verdict modal open
  const handleOpenVerdictModal = useCallback(() => {
    setVerdictModalOpen(true);
  }, []);

  // Handle verdict modal close
  const handleCloseVerdictModal = useCallback(() => {
    setVerdictModalOpen(false);
    // Don't reset verdict state - keep feedback visible if user closes and reopens
  }, []);

  // Handle verdict retry
  const handleVerdictRetry = useCallback(() => {
    resetVerdict();
    // Keep modal open for retry
  }, [resetVerdict]);

  // Handle confrontation close
  const handleConfrontationClose = useCallback(() => {
    setVerdictModalOpen(false);
    resetVerdict();
    // Could trigger navigation to case complete screen here
  }, [resetVerdict]);

  // Handle restart case
  const handleRestartCase = useCallback(async () => {
    setRestartLoading(true);
    try {
      const result = await resetCase(CASE_ID);
      if (result.success) {
        // Reload the page to reset all state cleanly
        window.location.reload();
      } else {
        console.error('Reset failed:', result.message);
        // Even if no saved state existed, reload to ensure fresh state
        window.location.reload();
      }
    } catch (error) {
      console.error('Error resetting case:', error);
      // On error, still close dialog
      setShowRestartConfirm(false);
      setRestartLoading(false);
    }
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse text-green-400 font-mono text-xl mb-2">
            Initializing Investigation...
          </div>
          <div className="text-gray-500 text-sm font-mono">
            Loading case files...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4">
      {/* Header */}
      <header className="max-w-6xl mx-auto mb-6">
        <div className="flex items-center justify-between border-b border-gray-700 pb-4">
          <div>
            <h1 className="text-3xl font-bold text-white font-mono tracking-widest">
              AUROR ACADEMY
            </h1>
            <p className="text-gray-500 text-sm font-mono mt-1">
              Case Investigation System v1.0
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setShowRestartConfirm(true)}
              variant="secondary"
              size="sm"
              className="font-mono bg-red-700 hover:bg-red-600 border-red-600 text-white"
            >
              Restart Case
            </Button>
            <Button
              onClick={() => void handleLoad()}
              variant="secondary"
              size="sm"
              className="font-mono bg-gray-800 hover:bg-gray-700 border-gray-600 text-gray-300"
            >
              Load
            </Button>
            <Button
              onClick={() => void handleSave()}
              disabled={saving || !state}
              variant="secondary"
              size="sm"
              className="font-mono bg-gray-800 hover:bg-gray-700 border-gray-600 text-gray-300"
            >
              {saving ? 'Saving...' : 'Save'}
            </Button>
            <Button
              onClick={handleOpenVerdictModal}
              disabled={verdictState.caseSolved}
              variant="primary"
              size="sm"
              className="font-mono bg-amber-700 hover:bg-amber-600 border-amber-600 text-white"
            >
              {verdictState.caseSolved ? 'Case Solved' : 'Submit Verdict'}
            </Button>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mt-4 p-3 bg-red-900/30 border border-red-700 rounded flex items-center justify-between">
            <span className="text-red-400 text-sm font-mono">{error}</span>
            <button
              onClick={clearError}
              className="text-red-400 hover:text-red-300 font-mono text-sm"
              aria-label="Dismiss error"
            >
              [X]
            </button>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Main Investigation Area (2/3 width on large screens) */}
          <div className="lg:col-span-2">
            <LocationView
              caseId={CASE_ID}
              locationId={LOCATION_ID}
              locationData={location}
              onEvidenceDiscovered={(ids) => void handleEvidenceDiscoveredWithTom(ids)}
              discoveredEvidence={state?.discovered_evidence ?? []}
              witnessesPresent={witnessesPresent}
              onWitnessClick={(id) => void handleWitnessClick(id)}
              inlineMessages={inlineMessages}
              onTomMessage={(msg) => void handleTomMessage(msg)}
              tomLoading={tomLoading}
            />
          </div>

          {/* Sidebar (1/3 width on large screens) */}
          <div className="space-y-4">
            {/* Witness Selector */}
            <WitnessSelector
              witnesses={witnessState.witnesses}
              selectedWitnessId={witnessState.currentWitness?.id}
              loading={witnessState.loading}
              error={witnessState.error}
              onSelectWitness={(id) => void handleWitnessClick(id)}
            />

            <EvidenceBoard
              evidence={state?.discovered_evidence ?? []}
              caseId={CASE_ID}
              onEvidenceClick={(id) => void handleEvidenceClick(id)}
            />

            {/* Case Status Panel */}
            <div className="font-mono bg-gray-900 text-gray-100 border border-gray-700 rounded-lg p-4">
              <h3 className="text-xl font-bold text-yellow-400 uppercase tracking-wide mb-3">
                CASE STATUS
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Case:</span>
                  <span className="text-green-400">{state?.case_id ?? CASE_ID}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Location:</span>
                  <span className="text-green-400">{state?.current_location ?? LOCATION_ID}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Evidence Found:</span>
                  <span className="text-yellow-400">
                    {state?.discovered_evidence?.length ?? 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Locations Visited:</span>
                  <span className="text-blue-400">
                    {state?.visited_locations?.length ?? 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Help */}
            <div className="font-mono bg-gray-800 border border-gray-700 rounded-lg p-4 text-xs">
              <h3 className="text-gray-400 uppercase tracking-wider mb-2">
                Quick Help
              </h3>
              <ul className="space-y-1 text-gray-500">
                <li>* Type actions in the text area</li>
                <li>* Press Ctrl+Enter to submit</li>
                <li>* Evidence auto-collects when found</li>
                <li>* Save regularly to preserve progress</li>
                <li className="text-amber-500/70">* Type &quot;Tom, ...&quot; to ask the ghost</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto mt-8 pt-4 border-t border-gray-800">
        <p className="text-center text-gray-600 text-xs font-mono">
          Auror Academy Case Investigation System - Phase 3 Prototype
        </p>
      </footer>

      {/* Briefing Modal */}
      {briefingModalOpen && briefing && (
        <Modal
          isOpen={briefingModalOpen}
          onClose={() => void handleBriefingComplete()}
          variant="default"
          title="Case Briefing"
        >
          <BriefingModal
            briefing={briefing}
            conversation={briefingConversation}
            selectedChoice={briefingSelectedChoice}
            choiceResponse={briefingChoiceResponse}
            onSelectChoice={selectBriefingChoice}
            onAskQuestion={askBriefingQuestion}
            onComplete={() => void handleBriefingComplete()}
            loading={briefingLoading}
          />
        </Modal>
      )}

      {/* Witness Interview Modal */}
      {witnessModalOpen && witnessState.currentWitness && (
        <Modal
          isOpen={witnessModalOpen}
          onClose={handleWitnessModalClose}
          title={`INTERROGATING: ${witnessState.currentWitness.name.toUpperCase()}`}
        >
          <WitnessInterview
            witness={witnessState.currentWitness}
            conversation={witnessState.conversation}
            trust={witnessState.trust}
            secretsRevealed={witnessState.secretsRevealed}
            discoveredEvidence={state?.discovered_evidence ?? []}
            loading={witnessState.loading}
            error={witnessState.error}
            onAskQuestion={askQuestion}
            onPresentEvidence={presentEvidenceToWitness}
          />
        </Modal>
      )}

      {/* Evidence Details Modal */}
      <EvidenceModal
        evidence={selectedEvidence}
        onClose={handleEvidenceModalClose}
        loading={evidenceLoading}
        error={evidenceError}
      />

      {/* Verdict Flow Modals */}
      {verdictModalOpen && (
        <>
          {/* Step 1: Verdict Submission (before submission or retry) */}
          {!verdictState.submitted && (
            <Modal
              isOpen={true}
              onClose={handleCloseVerdictModal}
              variant="terminal"
              title="Submit Verdict"
            >
              <VerdictSubmission
                suspects={suspects}
                discoveredEvidence={discoveredEvidenceWithNames}
                onSubmit={submitVerdict}
                loading={verdictState.submitting}
                disabled={verdictState.attemptsRemaining === 0 || verdictState.caseSolved}
                attemptsRemaining={verdictState.attemptsRemaining}
              />
            </Modal>
          )}

          {/* Step 2: Mentor Feedback (after incorrect verdict, no confrontation) */}
          {verdictState.submitted && verdictState.feedback && !verdictState.confrontation && (
            <Modal
              isOpen={true}
              onClose={handleCloseVerdictModal}
              variant="terminal"
              title="Moody's Feedback"
            >
              <MentorFeedback
                feedback={verdictState.feedback}
                correct={verdictState.correct}
                attemptsRemaining={verdictState.attemptsRemaining}
                wrongSuspectResponse={verdictState.wrongSuspectResponse}
                onRetry={verdictState.attemptsRemaining > 0 ? handleVerdictRetry : undefined}
              />

              {/* Reveal section (after max attempts) */}
              {verdictState.reveal && (
                <div className="mt-4 bg-gray-800 border border-red-700 rounded p-4 font-mono">
                  <h3 className="text-red-400 font-bold mb-2">[Correct Answer]</h3>
                  <p className="text-gray-300 text-sm">{verdictState.reveal}</p>
                </div>
              )}
            </Modal>
          )}

          {/* Step 3: Confrontation Dialogue (after correct verdict or max attempts) */}
          {verdictState.submitted && verdictState.confrontation && (
            <Modal
              isOpen={true}
              onClose={handleConfrontationClose}
              variant="terminal"
              title="Confrontation"
            >
              <ConfrontationDialogue
                dialogue={verdictState.confrontation.dialogue}
                aftermath={verdictState.confrontation.aftermath}
                onClose={handleConfrontationClose}
                caseSolvedCorrectly={verdictState.correct}
              />
            </Modal>
          )}
        </>
      )}

      {/* Restart Case Confirmation Dialog */}
      <ConfirmDialog
        open={showRestartConfirm}
        title="Restart Case"
        message="Reset all progress? Evidence, witnesses, and verdicts will be lost."
        confirmText={restartLoading ? 'Restarting...' : 'Restart'}
        cancelText="Cancel"
        destructive={true}
        onConfirm={() => void handleRestartCase()}
        onCancel={() => setShowRestartConfirm(false)}
      />
    </div>
  );
}
