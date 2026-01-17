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

import { useState, useCallback, useMemo, useEffect } from "react";
import { LandingPage } from "./components/LandingPage";
import { LocationView } from "./components/LocationView";
import { EvidenceBoard } from "./components/EvidenceBoard";
import { EvidenceModal } from "./components/EvidenceModal";
import { WitnessSelector } from "./components/WitnessSelector";
import { WitnessInterview } from "./components/WitnessInterview";
import { VerdictSubmission } from "./components/VerdictSubmission";
import { MentorFeedback } from "./components/MentorFeedback";
import { ConfrontationDialogue } from "./components/ConfrontationDialogue";
import { ConfirmDialog } from "./components/ConfirmDialog";
import { BriefingModal } from "./components/BriefingModal";
import { MainMenu } from "./components/MainMenu";
import { LocationSelector } from "./components/LocationSelector";
import { SaveLoadModal } from "./components/SaveLoadModal";
import { Modal } from "./components/ui/Modal";
import { Button } from "./components/ui/Button";
import { Toast } from "./components/ui/Toast";
import { TerminalPanel } from "./components/ui/TerminalPanel";
import { useInvestigation } from "./hooks/useInvestigation";
import { useWitnessInterrogation } from "./hooks/useWitnessInterrogation";
import { useVerdictFlow } from "./hooks/useVerdictFlow";
import { useBriefing } from "./hooks/useBriefing";
import { useTomChat } from "./hooks/useTomChat";
import { useLocation } from "./hooks/useLocation";
import { useSaveSlots } from "./hooks/useSaveSlots";
import { getEvidenceDetails, resetCase, saveGameState } from "./api/client";
import type { EvidenceDetails, Message } from "./types/investigation";

// ============================================
// Configuration
// ============================================

const CASE_ID = "case_001";
// const DEFAULT_LOCATION_ID = 'library'; // DEPRECATED: Let backend determine default

// ============================================
// Component
// ============================================

export default function App() {
  // ==========================================
  // Phase 5.3.1: Landing Page State
  // ==========================================
  const [currentGameState, setCurrentGameState] = useState<"landing" | "game">(
    "landing",
  );
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);

  // Exit to main menu confirmation dialog state
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Toast state (needed for landing page too)
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastVariant, setToastVariant] = useState<
    "success" | "error" | "info"
  >("success");

  // Load modal state (can open from landing page)
  const [loadModalOpen, setLoadModalOpen] = useState(false);

  // Active case ID (use selected or default)
  const activeCaseId = selectedCaseId ?? CASE_ID;

  // Save slots hook (Phase 5.3) - needed for landing page load
  const {
    slots,
    loading: saveSlotsLoading,
    error: saveSlotsError,
    loadFromSlot,
    refreshSlots,
  } = useSaveSlots(activeCaseId);

  // Track loaded slot (used by useInvestigation to load from correct slot)
  const [loadedSlot, setLoadedSlot] = useState<string | null>(null);

  // Validation helpers for localStorage
  const validateCaseId = (caseId: string | null): string | null => {
    if (!caseId) return null;
    // Valid case IDs: case_001, case_002, etc.
    const CASE_ID_PATTERN = /^case_\d{3}$/;
    return CASE_ID_PATTERN.test(caseId) ? caseId : null;
  };

  const validateSlot = (slot: string | null): string => {
    if (!slot) return "default";
    const VALID_SLOTS = ["slot_1", "slot_2", "slot_3", "autosave", "default"];
    return VALID_SLOTS.includes(slot) ? slot : "default";
  };

  // Check on mount if we just loaded a save (after page reload)
  useEffect(() => {
    const justLoaded = localStorage.getItem("just_loaded");
    const rawCaseId = localStorage.getItem("loaded_case_id");
    const rawSlot = localStorage.getItem("loaded_slot");

    // Validate localStorage values
    const loadedCaseId = validateCaseId(rawCaseId);
    const loadedSlotValue = validateSlot(rawSlot);

    if (justLoaded === "true" && loadedCaseId) {
      // Clear flags
      localStorage.removeItem("just_loaded");
      localStorage.removeItem("loaded_case_id");
      localStorage.removeItem("loaded_slot");

      // Set game state with validated values
      setSelectedCaseId(loadedCaseId);
      setLoadedSlot(loadedSlotValue);
      setCurrentGameState("game");
    } else if (justLoaded === "true" && !loadedCaseId) {
      // Invalid case_id in localStorage - clear corrupted data
      console.warn("Invalid case_id in localStorage, clearing corrupted data");
      localStorage.removeItem("just_loaded");
      localStorage.removeItem("loaded_case_id");
      localStorage.removeItem("loaded_slot");
    }
  }, []);

  // Handler: Start new case from landing page
  const handleStartNewCase = useCallback((caseId: string) => {
    setSelectedCaseId(caseId);
    setCurrentGameState("game");
  }, []);

  // Handler: Load game from landing page
  const handleLoadGameFromLanding = useCallback(() => {
    setLoadModalOpen(true);
    void refreshSlots();
  }, [refreshSlots]);

  // Handler: Load from slot (landing or in-game)
  const handleToastClose = useCallback(() => {
    setToastMessage(null);
  }, []);

  const handleLoadFromSlot = useCallback(
    async (slot: string) => {
      const loadedState = await loadFromSlot(slot);
      if (loadedState) {
        setToastVariant("success");
        setToastMessage(`Loaded from ${slot.replace("_", " ")}`);
        setLoadModalOpen(false);
        // Store case ID and slot in localStorage before reload
        localStorage.setItem("loaded_case_id", loadedState.case_id);
        localStorage.setItem("loaded_slot", slot);
        localStorage.setItem("just_loaded", "true");
        // Reload page to apply loaded state
        window.location.reload();
      } else {
        setToastVariant("error");
        setToastMessage(saveSlotsError ?? "Load failed");
      }
    },
    [loadFromSlot, saveSlotsError],
  );

  // ==========================================
  // Landing Page View
  // ==========================================
  if (currentGameState === "landing") {
    return (
      <>
        <LandingPage
          onStartNewCase={handleStartNewCase}
          onLoadGame={handleLoadGameFromLanding}
        />

        {/* SaveLoadModal can open from landing page */}
        <SaveLoadModal
          isOpen={loadModalOpen}
          onClose={() => setLoadModalOpen(false)}
          mode="load"
          onSave={() => Promise.resolve()} // No-op for load mode
          onLoad={handleLoadFromSlot}
          slots={slots}
          loading={saveSlotsLoading}
        />

        {/* Toast Notification */}
        {toastMessage && (
          <Toast
            message={toastMessage}
            variant={toastVariant}
            onClose={handleToastClose}
          />
        )}
      </>
    );
  }

  // ==========================================
  // Investigation View (currentGameState === 'game')
  // ==========================================
  return (
    <InvestigationView
      caseId={activeCaseId}
      loadedSlot={loadedSlot}
      onExitToMainMenu={() => setShowExitConfirm(true)}
      showExitConfirm={showExitConfirm}
      onConfirmExit={() => {
        // Just exit to menu, don't reset case progress (Phase 5.4 fix)
        // Previously this called resetCase(activeCaseId) which wiped progress
        setCurrentGameState("landing");
        setSelectedCaseId(null);
        setShowExitConfirm(false);
        return Promise.resolve();
      }}
      onCancelExit={() => setShowExitConfirm(false)}
      toastMessage={toastMessage}
      toastVariant={toastVariant}
      setToastMessage={setToastMessage}
      setToastVariant={setToastVariant}
    />
  );
}

// ============================================
// Investigation View Component
// ============================================

interface InvestigationViewProps {
  caseId: string;
  loadedSlot: string | null;
  onExitToMainMenu: () => void;
  showExitConfirm: boolean;
  onConfirmExit: () => Promise<void>;
  onCancelExit: () => void;
  toastMessage: string | null;
  toastVariant: "success" | "error" | "info";
  setToastMessage: (msg: string | null) => void;
  setToastVariant: (variant: "success" | "error" | "info") => void;
}

function InvestigationView({
  caseId,
  loadedSlot,
  onExitToMainMenu,
  showExitConfirm,
  onConfirmExit,
  onCancelExit,
  toastMessage,
  toastVariant,
  setToastMessage,
  setToastVariant,
}: InvestigationViewProps) {
  const handleToastClose = useCallback(() => {
    setToastMessage(null);
  }, [setToastMessage]);

  // Location hook (Phase 5.2) - manage multi-location navigation
  const {
    locations,
    currentLocationId,
    visitedLocations,
    loading: locationLoading,
    changing: locationChanging,
    error: locationError,
    handleLocationChange,
  } = useLocation({
    caseId: caseId,
    // Phase 5.2: Allow backend to determine default location if not specified
    // initialLocationId: DEFAULT_LOCATION_ID,
  });

  // Investigation hook - now uses dynamic currentLocationId
  const {
    state,
    location,
    loading,
    error,
    handleEvidenceDiscovered,
    clearError,
    restoredMessages,
  } = useInvestigation({
    caseId: caseId,
    locationId: currentLocationId,
    slot: loadedSlot ?? "default",
  });

  // Witness interrogation hook
  const {
    state: witnessState,
    askQuestion,
    presentEvidenceToWitness,
    selectWitness,
    clearConversation,
  } = useWitnessInterrogation({
    caseId: caseId,
    autoLoad: true,
  });

  // Verdict flow hook
  const {
    state: verdictState,
    submitVerdict,
    reset: resetVerdict,
    confirmConfrontation,
  } = useVerdictFlow({ caseId: caseId });

  // Briefing hook
  const {
    briefing,
    conversation: briefingConversation,
    selectedChoice: briefingSelectedChoice,
    choiceResponse: briefingChoiceResponse,
    loading: briefingLoading,
    loadBriefing,
    selectChoice: selectBriefingChoice,
    resetChoice: resetBriefingChoice,
    askQuestion: askBriefingQuestion,
    markComplete: markBriefingComplete,
  } = useBriefing({
    caseId: caseId,
  });

  // Tom chat hook (Phase 4.1 - LLM-powered Tom conversation)
  const {
    checkAutoComment,
    sendMessage: sendTomMessage,
    loading: tomLoading,
  } = useTomChat({
    caseId: caseId,
  });

  // Inline messages state (for Tom's ghost voice in conversation)
  const [inlineMessages, setInlineMessages] = useState<Message[]>([]);

  // Restore conversation messages on case load (Phase 4.4)
  // Restore conversation messages on case load (Phase 4.4)
  useEffect(() => {
    // Phase 5.6: Fix for history leakage between locations
    // Always update inlineMessages, even if empty/null (to clear previous location's history)
    if (restoredMessages) {
      setInlineMessages(restoredMessages);
    } else {
      setInlineMessages([]);
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
  const handleEvidenceDiscoveredWithTom = useCallback(
    async (evidenceIds: string[]) => {
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
          setInlineMessages((prev) => [...prev, tomMessage]);
        }
      } catch (error) {
        // Non-blocking: log error but don't interrupt investigation
        console.error("Tom auto-comment failed:", error);
      }
    },
    [handleEvidenceDiscovered, checkAutoComment],
  );

  // Handle direct Tom message ("Tom, what do you think?")
  const handleTomMessage = useCallback(
    async (message: string) => {
      // Add user's question to conversation (as player message)
      const userMessage: Message = {
        type: "player",
        text: `Tom, ${message}`,
        timestamp: Date.now(),
      };
      setInlineMessages((prev) => [...prev, userMessage]);

      // Get Tom's response (always responds for direct chat)
      try {
        const tomResponse = await sendTomMessage(message);
        setInlineMessages((prev) => [...prev, tomResponse]);
      } catch (error) {
        // Show error as Tom message
        console.error("Tom chat error:", error);
        const errorMessage: Message = {
          type: "tom_ghost",
          text: "Tom seems distracted... he can't respond right now.",
          timestamp: Date.now(),
        };
        setInlineMessages((prev) => [...prev, errorMessage]);
      }
    },
    [sendTomMessage],
  );

  // Witness interview modal state
  const [witnessModalOpen, setWitnessModalOpen] = useState(false);

  // Verdict modal state
  const [verdictModalOpen, setVerdictModalOpen] = useState(false);

  // Evidence modal state
  const [selectedEvidence, setSelectedEvidence] =
    useState<EvidenceDetails | null>(null);
  const [evidenceLoading, setEvidenceLoading] = useState(false);
  const [evidenceError, setEvidenceError] = useState<string | null>(null);

  // Restart confirmation dialog state
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);
  const [restartLoading, setRestartLoading] = useState(false);

  // Main menu state (Phase 5.1)
  const [menuOpen, setMenuOpen] = useState(false);

  // Save/Load system state (Phase 5.3)
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [loadModalOpen, setLoadModalOpen] = useState(false);

  // Save slots hook (Phase 5.3)
  const {
    slots,
    loading: saveSlotsLoading,
    error: saveSlotsError,
    saveToSlot,
    loadFromSlot,
    refreshSlots,
  } = useSaveSlots(caseId);

  // Handle witness selection from LocationView or WitnessSelector
  const handleWitnessClick = useCallback(
    async (witnessId: string) => {
      await selectWitness(witnessId);
      setWitnessModalOpen(true);
    },
    [selectWitness],
  );

  // Handle witness modal close
  const handleWitnessModalClose = useCallback(() => {
    setWitnessModalOpen(false);
    clearConversation();
  }, [clearConversation]);

  // Handle evidence click from EvidenceBoard
  const handleEvidenceClick = useCallback(
    async (evidenceId: string) => {
      setEvidenceLoading(true);
      setEvidenceError(null);

      try {
        const details = await getEvidenceDetails(evidenceId, caseId);
        setSelectedEvidence(details);
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to load evidence details";
        setEvidenceError(errorMessage);
      } finally {
        setEvidenceLoading(false);
      }
    },
    [caseId],
  );

  // Handle evidence modal close
  const handleEvidenceModalClose = useCallback(() => {
    setSelectedEvidence(null);
    setEvidenceError(null);
  }, []);

  // Derive suspects for verdict submission (witnesses are potential suspects)
  const suspects = useMemo(() => {
    return witnessState.witnesses.map((w) => ({
      id: w.id,
      name: w.name,
    }));
  }, [witnessState.witnesses]);

  // Derive discovered evidence with names for verdict submission
  const discoveredEvidenceWithNames = useMemo(() => {
    // Map evidence IDs to display names
    // For now, use ID as name; ideally would fetch from evidence details
    return (state?.discovered_evidence ?? []).map((id) => ({
      id,
      name: id.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
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
      const result = await resetCase(caseId);
      if (result.success) {
        // Reload the page to reset all state cleanly
        window.location.reload();
      } else {
        console.error("Reset failed:", result.message);
        // Even if no saved state existed, reload to ensure fresh state
        window.location.reload();
      }
    } catch (error) {
      console.error("Error resetting case:", error);
      // On error, still close dialog
      setShowRestartConfirm(false);
      setRestartLoading(false);
    }
  }, [caseId]);

  // Menu restart handler (shows confirmation, closes menu)
  const handleMenuRestart = useCallback(() => {
    setMenuOpen(false);
    setShowRestartConfirm(true);
  }, []);

  // Save/Load handlers (Phase 5.3)
  const handleMenuSave = useCallback(() => {
    setMenuOpen(false);
    setSaveModalOpen(true);
    void refreshSlots(); // Refresh slot list before showing modal
  }, [refreshSlots]);

  const handleMenuLoad = useCallback(() => {
    setMenuOpen(false);
    setLoadModalOpen(true);
    void refreshSlots(); // Refresh slot list before showing modal
  }, [refreshSlots]);

  const handleSaveToSlot = useCallback(
    async (slot: string) => {
      if (!state) {
        setToastVariant("error");
        setToastMessage("No game state to save");
        return;
      }

      const success = await saveToSlot(slot, state);
      if (success) {
        setToastVariant("success");
        setToastMessage(`Saved to ${slot.replace("_", " ")}`);
        setSaveModalOpen(false);
      } else {
        setToastVariant("error");
        setToastMessage(saveSlotsError ?? "Save failed");
      }
    },
    [state, saveToSlot, saveSlotsError, setToastVariant, setToastMessage],
  );

  const handleLoadFromSlotInGame = useCallback(
    async (slot: string) => {
      const loadedState = await loadFromSlot(slot);
      if (loadedState) {
        setToastVariant("success");
        setToastMessage(`Loaded from ${slot.replace("_", " ")}`);
        setLoadModalOpen(false);
        // Store case ID and slot in localStorage before reload
        localStorage.setItem("loaded_case_id", loadedState.case_id);
        localStorage.setItem("loaded_slot", slot);
        localStorage.setItem("just_loaded", "true");
        // Reload page to apply loaded state
        window.location.reload();
      } else {
        setToastVariant("error");
        setToastMessage(saveSlotsError ?? "Load failed");
      }
    },
    [loadFromSlot, saveSlotsError, setToastVariant, setToastMessage],
  );

  // Auto-save on state changes (debounced, Phase 5.3)
  const [lastAutosave, setLastAutosave] = useState(0);
  useEffect(() => {
    if (!state) return;

    const timer = setTimeout(() => {
      const now = Date.now();
      if (now - lastAutosave > 2000) {
        // Autosave every 2+ seconds
        saveGameState(caseId, state, "autosave")
          .then(() => {
            setLastAutosave(now);
            void refreshSlots(); // Update slot list
          })
          .catch((error) => {
            console.error("Autosave failed:", error);
          });
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [state, lastAutosave, refreshSlots, caseId]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse text-gray-200 font-mono text-xl mb-2">
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
              onClick={() => setMenuOpen(true)}
              variant="terminal"
              size="md"
              className="hover:!bg-gray-800 hover:!border-gray-200 hover:!text-gray-100"
            >
              MENU
            </Button>
            <Button
              onClick={handleOpenVerdictModal}
              disabled={verdictState.caseSolved}
              variant="terminal-primary"
              size="md"
            >
              {verdictState.caseSolved ? "Case Solved" : "Submit Verdict"}
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
              caseId={caseId}
              locationId={currentLocationId}
              locationData={location}
              onEvidenceDiscovered={(ids) =>
                void handleEvidenceDiscoveredWithTom(ids)
              }
              discoveredEvidence={[...(state?.discovered_evidence ?? [])]}
              inlineMessages={inlineMessages}
              onTomMessage={(msg) => void handleTomMessage(msg)}
              tomLoading={tomLoading}
            />
          </div>

          {/* Sidebar (1/3 width on large screens) */}
          <div className="space-y-4">
            {/* Location Selector (Phase 5.2) */}
            <LocationSelector
              locations={locations}
              currentLocationId={currentLocationId}
              visitedLocations={visitedLocations}
              loading={locationLoading}
              error={locationError}
              onSelectLocation={(id) => void handleLocationChange(id)}
              changing={locationChanging}
              collapsible={true}
              defaultCollapsed={false}
              persistenceKey="sidebar-location-selector"
            />

            {/* Witness Selector */}
            <WitnessSelector
              witnesses={witnessState.witnesses}
              loading={witnessState.loading}
              error={witnessState.error}
              onSelectWitness={(id) => void handleWitnessClick(id)}
              keyboardStartIndex={locations.length + 1}
              collapsible={true}
              defaultCollapsed={false}
              persistenceKey="sidebar-witness-selector"
            />

            <EvidenceBoard
              evidence={[...(state?.discovered_evidence ?? [])]}
              caseId={caseId}
              onEvidenceClick={(id) => void handleEvidenceClick(id)}
              collapsible={true}
              defaultCollapsed={false}
              persistenceKey="sidebar-evidence-board"
            />

            {/* Quick Help */}
            <TerminalPanel
              title="QUICK HELP"
              collapsible={true}
              defaultCollapsed={false}
              persistenceKey="sidebar-quick-help"
            >
              <ul className="space-y-1.5 text-gray-400 text-sm text-left leading-relaxed font-mono">
                <li className="text-gray-300 font-bold text-xs uppercase tracking-wider mb-2">
                  Investigation
                </li>
                <li>
                  • Type actions naturally: &quot;examine desk&quot;, &quot;look
                  for clues&quot;
                </li>
                <li>
                  • Cast spells to find hidden evidence (press H for handbook)
                </li>
                <li>• Click witness names to interview them</li>

                <li className="text-gray-300 font-bold text-xs uppercase tracking-wider mt-3 mb-2">
                  Tom Thornfield&apos;s Ghost
                </li>
                <li>
                  • Start with &quot;Tom&quot; to ask him: &quot;Tom, what do
                  you think?&quot;
                </li>
                <li>
                  • He&apos;s helpful but sometimes misleading - verify his
                  claims
                </li>

                <li className="text-gray-300 font-bold text-xs uppercase tracking-wider mt-3 mb-2">
                  Controls
                </li>
                <li>• Press Enter to submit actions</li>
                <li>• Press 1-9 to switch locations/witnesses</li>
                <li>• Save regularly (from menu)</li>
              </ul>
            </TerminalPanel>
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
          variant="terminal"
          hideHeader={true}
          frameless={true}
          noPadding={true}
        >
          <BriefingModal
            briefing={briefing}
            conversation={briefingConversation}
            selectedChoice={briefingSelectedChoice}
            choiceResponse={briefingChoiceResponse}
            onSelectChoice={selectBriefingChoice}
            onResetChoice={resetBriefingChoice}
            onAskQuestion={askBriefingQuestion}
            onComplete={() => void handleBriefingComplete()}
            loading={briefingLoading}
            onClose={() => void handleBriefingComplete()}
          />
        </Modal>
      )}

      {/* Witness Interview Modal */}
      {witnessModalOpen && witnessState.currentWitness && (
        <Modal
          isOpen={witnessModalOpen}
          onClose={handleWitnessModalClose}
          title={`INTERROGATING: ${witnessState.currentWitness.name.toUpperCase()}`}
          maxWidth="max-w-6xl"
          noPadding={true}
          variant="terminal"
        >
          <WitnessInterview
            witness={witnessState.currentWitness}
            conversation={witnessState.conversation}
            trust={witnessState.trust}
            secretsRevealed={witnessState.secretsRevealed}
            discoveredEvidence={[...(state?.discovered_evidence ?? [])]}
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
                disabled={
                  verdictState.attemptsRemaining === 0 ||
                  verdictState.caseSolved
                }
                attemptsRemaining={verdictState.attemptsRemaining}
              />
            </Modal>
          )}

          {/* Step 2: Mentor Feedback (after incorrect verdict, no confrontation) */}
          {/* Step 2: Mentor Feedback (after check, before confrontation) */}
          {verdictState.submitted &&
            verdictState.feedback &&
            (!verdictState.confrontation ||
              !verdictState.confrontationConfirmed) && (
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
                  onRetry={
                    verdictState.attemptsRemaining > 0
                      ? handleVerdictRetry
                      : undefined
                  }
                  onConfront={
                    verdictState.confrontation
                      ? confirmConfrontation
                      : undefined
                  }
                  confrontLabel={
                    verdictState.correct ? 'Arrest the Culprit' : 'Proceed'
                  }
                />

                {/* Reveal section (after max attempts) */}
                {verdictState.reveal && (
                  <div className="mt-4 bg-gray-800 border border-red-700 rounded p-4 font-mono">
                    <h3 className="text-red-400 font-bold mb-2">
                      [Correct Answer]
                    </h3>
                    <p className="text-gray-300 text-sm">
                      {verdictState.reveal}
                    </p>
                  </div>
                )}
              </Modal>
            )}

          {/* Step 3: Confrontation Dialogue (after manual confirmation) */}
          {verdictState.submitted &&
            verdictState.confrontation &&
            verdictState.confrontationConfirmed && (
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

      {/* Main Menu Modal (Phase 5.1) */}
      <MainMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        onRestart={handleMenuRestart}
        onLoad={handleMenuLoad}
        onSave={handleMenuSave}
        onExitToMainMenu={() => {
          setMenuOpen(false);
          onExitToMainMenu();
        }}
        loading={restartLoading}
      />

      {/* Save/Load Modals (Phase 5.3) */}
      <SaveLoadModal
        isOpen={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        mode="save"
        onSave={handleSaveToSlot}
        onLoad={handleLoadFromSlotInGame}
        slots={slots}
        loading={saveSlotsLoading}
      />

      <SaveLoadModal
        isOpen={loadModalOpen}
        onClose={() => setLoadModalOpen(false)}
        mode="load"
        onSave={handleSaveToSlot}
        onLoad={handleLoadFromSlotInGame}
        slots={slots}
        loading={saveSlotsLoading}
      />

      {/* Toast Notification (Phase 5.3) */}
      {toastMessage && (
        <Toast
          message={toastMessage}
          variant={toastVariant}
          onClose={handleToastClose}
        />
      )}

      {/* Restart Case Confirmation Dialog */}
      <ConfirmDialog
        open={showRestartConfirm}
        title="Restart Case"
        message="Reset all progress? Evidence, witnesses, and verdicts will be lost."
        confirmText={restartLoading ? "Restarting..." : "Restart"}
        cancelText="Cancel"
        destructive={true}
        onConfirm={() => void handleRestartCase()}
        onCancel={() => setShowRestartConfirm(false)}
      />

      {/* Exit to Main Menu Confirmation Dialog (Phase 5.3.1) */}
      <ConfirmDialog
        open={showExitConfirm}
        title="Exit to Main Menu"
        message="Return to main menu? Any unsaved progress will be lost."
        confirmText="Exit"
        cancelText="Cancel"
        destructive={true}
        onConfirm={() => void onConfirmExit()}
        onCancel={onCancelExit}
      />
    </div>
  );
}
