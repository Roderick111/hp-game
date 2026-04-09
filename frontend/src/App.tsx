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
import { EvidenceModal } from "./components/EvidenceModal";
import { WitnessInterview } from "./components/WitnessInterview";
import { VerdictSubmission } from "./components/VerdictSubmission";
import { MentorFeedback } from "./components/MentorFeedback";
import { ConfrontationDialogue } from "./components/ConfrontationDialogue";
import { ConfirmDialog } from "./components/ConfirmDialog";
import { BriefingModal } from "./components/BriefingModal";
import { MainMenu } from "./components/MainMenu";
import { LocationHeaderBar } from "./components/LocationHeaderBar";
import { InvestigationLayout } from "./components/layout/InvestigationLayout";
import { SaveLoadModal } from "./components/SaveLoadModal";
import { SettingsModal } from "./components/SettingsModal";
import { MusicPlayer } from "./components/MusicPlayer";
import { SidebarPanel } from "./components/ui/SidebarPanel";
import { WitnessesModal } from "./components/WitnessesModal";
import { EvidenceListModal } from "./components/EvidenceListModal";
import { Modal } from "./components/ui/Modal";
import { Button } from "./components/ui/Button";
import { Toast } from "./components/ui/Toast";
import { useInvestigation } from "./hooks/useInvestigation";
import { useWitnessInterrogation } from "./hooks/useWitnessInterrogation";
import { useVerdictFlow } from "./hooks/useVerdictFlow";
import { useBriefing } from "./hooks/useBriefing";
import { useTomChat } from "./hooks/useTomChat";
import { useLocation } from "./hooks/useLocation";
import { useSaveSlots } from "./hooks/useSaveSlots";
import { useTheme } from "./context/useTheme";
import { getEvidenceDetails, resetCase } from "./api/client";
import { logSessionStart } from "./api/telemetry";
import { getOrCreatePlayerId } from "./utils/playerId";
import type { EvidenceDetails, Message } from "./types/investigation";

// ============================================
// Configuration
// ============================================

const CASE_ID = "case_001";
const PLAYER_ID = getOrCreatePlayerId();
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

  // Telemetry consent banner (auto-dismiss)
  const [showConsent, setShowConsent] = useState(
    () => !localStorage.getItem("telemetry_consent_shown"),
  );

  // Log session start once on mount + auto-dismiss consent
  useEffect(() => {
    logSessionStart();
    if (showConsent) {
      const timer = setTimeout(() => {
        localStorage.setItem("telemetry_consent_shown", "1");
        setShowConsent(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Active case ID (use selected or default)
  const activeCaseId = selectedCaseId ?? CASE_ID;

  // Save slots hook (Phase 5.3) - needed for landing page load
  const {
    slots,
    loading: saveSlotsLoading,
    error: saveSlotsError,
    loadFromSlot,
    refreshSlots,
  } = useSaveSlots(activeCaseId, PLAYER_ID);

  // Track loaded slot (used by useInvestigation to load from correct slot)
  const [loadedSlot, setLoadedSlot] = useState<string | null>("autosave");

  // Validation helpers for localStorage
  const validateCaseId = (caseId: string | null): string | null => {
    if (!caseId) return null;
    // Valid case IDs: case_001, case_002, etc.
    const CASE_ID_PATTERN = /^case_\d{3}$/;
    return CASE_ID_PATTERN.test(caseId) ? caseId : null;
  };

  const validateSlot = (slot: string | null): string => {
    if (!slot) return "autosave";
    const VALID_SLOTS = ["slot_1", "slot_2", "slot_3", "autosave", "default"];
    return VALID_SLOTS.includes(slot) ? slot : "autosave";
  };

  // Session persistence key
  const SESSION_KEY = "hp-detective-active-session";

  // Check on mount if we have an active session or just loaded a save
  useEffect(() => {
    // Request persistent storage to avoid browser eviction
    void navigator.storage?.persist();

    // First check for active session (page reload persistence)
    const activeSession = localStorage.getItem(SESSION_KEY);
    if (activeSession) {
      try {
        const session = JSON.parse(activeSession) as { caseId: string; slot: string };
        const validCaseId = validateCaseId(session.caseId);
        if (validCaseId) {
          setSelectedCaseId(validCaseId);
          setLoadedSlot(session.slot ?? "autosave");
          setCurrentGameState("game");
          return; // Session restored, skip other checks
        }
      } catch {
        // Invalid JSON, clear it
        localStorage.removeItem(SESSION_KEY);
      }
    }

    // Legacy: Check if we just loaded a save (after page reload)
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

  // Persist session when entering game
  useEffect(() => {
    if (currentGameState === "game" && selectedCaseId) {
      localStorage.setItem(
        SESSION_KEY,
        JSON.stringify({ caseId: selectedCaseId, slot: loadedSlot ?? "autosave" })
      );
    }
  }, [currentGameState, selectedCaseId, loadedSlot]);

  // Handler: Start or continue case from landing page
  const handleStartNewCase = useCallback(async (caseId: string) => {
    // Check if autosave exists — if so, resume without resetting
    const { loadState } = await import("./api/client");
    const existing = await loadState(caseId, PLAYER_ID, "autosave").catch(() => null);
    if (!existing) {
      // No autosave — reset to ensure clean state
      await resetCase(caseId, PLAYER_ID).catch(() => undefined);
    }
    setSelectedCaseId(caseId);
    setLoadedSlot("autosave");
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
        // Backend copies named slot → autosave on load, so always resume from autosave
        localStorage.setItem(
          SESSION_KEY,
          JSON.stringify({ caseId: loadedState.case_id, slot: "autosave" }),
        );
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
          onStartNewCase={(caseId) => void handleStartNewCase(caseId)}
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
          caseId={activeCaseId}
          playerId={PLAYER_ID}
          onImportSuccess={() => void refreshSlots()}
        />

        {/* Toast Notification */}
        {toastMessage && (
          <Toast
            message={toastMessage}
            variant={toastVariant}
            onClose={handleToastClose}
          />
        )}

        {showConsent && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 text-amber-200/40 text-xs z-50 animate-pulse">
            Anonymous data collected to improve the game
          </div>
        )}
      </>
    );
  }

  // ==========================================
  // Investigation View (currentGameState === 'game')
  // ==========================================
  return (
    <>
      {/* Background Music Player - at App level to persist across location changes */}
      <MusicPlayer caseId={activeCaseId} />

      <InvestigationView
        caseId={activeCaseId}
        playerId={PLAYER_ID}
        loadedSlot={loadedSlot}
        onExitToMainMenu={() => setShowExitConfirm(true)}
        showExitConfirm={showExitConfirm}
        onConfirmExit={() => {
          // Just exit to menu, don't reset case progress (Phase 5.4 fix)
          // Previously this called resetCase(activeCaseId) which wiped progress
          localStorage.removeItem("hp-detective-active-session");
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

      {/* Telemetry consent notice */}
      {showConsent && (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-amber-700/50 px-4 py-3 flex items-center justify-between z-50">
          <p className="text-amber-200/80 text-sm">
            Anonymous gameplay data is collected to improve the game.
          </p>
          <button
            onClick={() => {
              localStorage.setItem("telemetry_consent_shown", "1");
              setShowConsent(false);
            }}
            className="ml-4 px-4 py-1 text-sm bg-amber-700 hover:bg-amber-600 text-amber-100 rounded transition-colors whitespace-nowrap"
          >
            Got it
          </button>
        </div>
      )}
    </>
  );
}

// ============================================
// Investigation View Component
// ============================================

interface InvestigationViewProps {
  caseId: string;
  playerId: string;
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
  playerId,
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
    playerId: playerId,
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
    setNarratorVerbosity,
  } = useInvestigation({
    caseId: caseId,
    locationId: currentLocationId,
    playerId: playerId,
    slot: loadedSlot ?? "autosave",
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
    playerId: playerId,
    autoLoad: true,
  });

  // Verdict flow hook
  const {
    state: verdictState,
    submitVerdict,
    reset: resetVerdict,
    confirmConfrontation,
  } = useVerdictFlow({ caseId: caseId, playerId: playerId });

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
    playerId: playerId,
  });

  // Tom chat hook (Phase 4.1 - LLM-powered Tom conversation)
  const {
    checkAutoComment,
    sendMessage: sendTomMessage,
    loading: tomLoading,
  } = useTomChat({
    caseId: caseId,
    playerId: playerId,
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

  // Settings modal state (Phase 5.7)
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Hints state (persisted in localStorage)
  const [hintsEnabled, setHintsEnabled] = useState(() =>
    localStorage.getItem('hp-detective-hints-enabled') !== 'false'
  );

  // Sidebar modal states
  const [witnessesModalOpen, setWitnessesModalOpen] = useState(false);
  const [evidenceListModalOpen, setEvidenceListModalOpen] = useState(false);

  // Handbook trigger (incremented to open handbook from sidebar)
  const [handbookTrigger, setHandbookTrigger] = useState(0);

  // Save slots hook (Phase 5.3)
  const {
    slots,
    loading: saveSlotsLoading,
    error: saveSlotsError,
    saveToSlot,
    loadFromSlot,
    refreshSlots,
  } = useSaveSlots(caseId, playerId);

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
        const details = await getEvidenceDetails(evidenceId, caseId, playerId);
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
    [caseId, playerId],
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
      await resetCase(caseId, PLAYER_ID);
      // Clear session so reload goes back to landing/briefing
      localStorage.removeItem("hp-detective-active-session");
      window.location.reload();
    } catch (error) {
      console.error("Error resetting case:", error);
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

  // Settings handler (Phase 5.7)
  const handleMenuSettings = useCallback(() => {
    setMenuOpen(false);
    setSettingsOpen(true);
  }, []);

  const handleSaveToSlot = useCallback(
    async (slot: string) => {
      if (!state) {
        setToastVariant("error");
        setToastMessage("No game state to save");
        return;
      }

      // Save current state to the named slot via server API
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
        // Backend copies named slot → autosave on load, so always resume from autosave
        localStorage.setItem(
          "hp-detective-active-session",
          JSON.stringify({ caseId: loadedState.case_id, slot: "autosave" }),
        );
        window.location.reload();
      } else {
        setToastVariant("error");
        setToastMessage(saveSlotsError ?? "Load failed");
      }
    },
    [loadFromSlot, saveSlotsError, setToastVariant, setToastMessage],
  );

  // Auto-save handled by LocationView's updated_state from backend.
  // The stripped InvestigationState from useInvestigation doesn't include
  // conversation_history/witness_states, so we don't autosave it here.

  // Theme hook for dynamic styling
  const { theme } = useTheme();


  // Loading state
  if (loading) {
    return (
      <div className={`min-h-screen ${theme.colors.bg.primary} ${theme.colors.text.secondary} flex items-center justify-center`}>
        <div className="text-center">
          <div className={`animate-pulse ${theme.colors.text.secondary} ${theme.fonts.ui} text-xl mb-2`}>
            Initializing Investigation...
          </div>
          <div className={`${theme.colors.text.muted} text-sm ${theme.fonts.ui}`}>
            Loading case files...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme.colors.bg.primary} ${theme.colors.text.secondary}`}>
      {/* Full-width Header Bar — sticky top with scroll shadow */}
      <header className={`w-full py-4 px-6 sticky top-0 z-30 ${theme.colors.bg.primary}`}>
        <div className="flex items-center">
          {/* Logo — far left, opens system menu */}
          <button
            onClick={() => setMenuOpen(true)}
            className={`text-xl font-bold ${theme.colors.text.primary} ${theme.fonts.ui} tracking-widest shrink-0 mr-8 hover:opacity-80 transition-opacity cursor-pointer`}
            type="button"
            aria-label="Open system menu"
          >
            AUROR ACADEMY
          </button>

          {/* Location Tabs — fills center */}
          <div className="flex-1 min-w-0">
            <LocationHeaderBar
              locations={locations}
              currentLocationId={currentLocationId}
              locationData={location}
              onSelectLocation={(id) => void handleLocationChange(id)}
              changing={locationChanging}
              visitedLocations={visitedLocations}
              loading={locationLoading}
              error={locationError}
            />
          </div>

          {/* Action Buttons — far right */}
          <div className="flex items-center gap-2 shrink-0 ml-8">
            <button
              onClick={() => setSettingsOpen(true)}
              className={`w-10 h-10 rounded-full ${theme.colors.bg.hover} ${theme.colors.text.tertiary} hover:${theme.colors.text.primary} flex items-center justify-center transition-all hover:brightness-125`}
              type="button"
              aria-label="Open settings"
              title="Settings"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </button>
            <Button
              onClick={handleOpenVerdictModal}
              variant="terminal-primary"
              size="md"
            >
              Verdict
            </Button>
          </div>
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="max-w-6xl mx-auto px-4 mt-4">
          <div className={`p-3 ${theme.colors.state.error.bg} border ${theme.colors.state.error.border} rounded flex items-center justify-between`}>
            <span className={`${theme.colors.state.error.text} text-sm ${theme.fonts.ui}`}>{error}</span>
            <button
              onClick={clearError}
              className={`${theme.colors.state.error.text} hover:opacity-80 ${theme.fonts.ui} text-sm`}
              aria-label="Dismiss error"
            >
              [X]
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 pt-4 pb-2">
        <InvestigationLayout
          mainContent={
            <LocationView
              caseId={caseId}
              playerId={playerId}
              locationId={currentLocationId}
              locationData={location}
              onEvidenceDiscovered={(ids) =>
                void handleEvidenceDiscoveredWithTom(ids)
              }
              discoveredEvidence={[...(state?.discovered_evidence ?? [])]}
              inlineMessages={inlineMessages}
              onTomMessage={(msg) => void handleTomMessage(msg)}
              tomLoading={tomLoading}
              showLocationHeader={false}
              hintsEnabled={hintsEnabled}
              handbookTrigger={handbookTrigger}
            />
          }
          sidebar={
            <SidebarPanel
              locationId={currentLocationId}
              locationName={location?.name ?? ''}
              witnessCount={witnessState.witnesses.length}
              evidenceCount={state?.discovered_evidence?.length ?? 0}
              onOpenWitnesses={() => setWitnessesModalOpen(true)}
              onOpenEvidence={() => setEvidenceListModalOpen(true)}
              onOpenHandbook={() => setHandbookTrigger(t => t + 1)}
              hintsEnabled={hintsEnabled}
            />
          }
        />
      </main>


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
            discoveredEvidence={discoveredEvidenceWithNames}
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
        onBack={() => {
          handleEvidenceModalClose();
          setEvidenceListModalOpen(true);
        }}
        loading={evidenceLoading}
        error={evidenceError}
      />

      {/* Sidebar Witnesses Modal */}
      <WitnessesModal
        isOpen={witnessesModalOpen}
        onClose={() => setWitnessesModalOpen(false)}
        witnesses={witnessState.witnesses}
        loading={witnessState.loading}
        error={witnessState.error}
        onSelectWitness={(id) => void handleWitnessClick(id)}
      />

      {/* Sidebar Evidence List Modal */}
      <EvidenceListModal
        isOpen={evidenceListModalOpen}
        onClose={() => setEvidenceListModalOpen(false)}
        evidence={[...(state?.discovered_evidence ?? [])]}
        caseId={caseId}
        onEvidenceClick={(id) => void handleEvidenceClick(id)}
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
                  <div className={`mt-4 bg-gray-800 border border-red-700 rounded p-4 ${theme.fonts.ui}`}>
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
        onSettings={handleMenuSettings}
        onExitToMainMenu={() => {
          setMenuOpen(false);
          onExitToMainMenu();
        }}
        loading={restartLoading}
      />

      {/* Settings Modal (Phase 5.7) */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        caseId={caseId}
        playerId={playerId}
        narratorVerbosity={state?.narrator_verbosity ?? 'storyteller'}
        onVerbosityChange={setNarratorVerbosity}
        hintsEnabled={hintsEnabled}
        onHintsChange={(v) => {
          setHintsEnabled(v);
          localStorage.setItem('hp-detective-hints-enabled', String(v));
        }}
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
        caseId={caseId}
        playerId={playerId}
        onImportSuccess={() => void refreshSlots()}
      />

      <SaveLoadModal
        isOpen={loadModalOpen}
        onClose={() => setLoadModalOpen(false)}
        mode="load"
        onSave={handleSaveToSlot}
        onLoad={handleLoadFromSlotInGame}
        slots={slots}
        loading={saveSlotsLoading}
        caseId={caseId}
        playerId={playerId}
        onImportSuccess={() => void refreshSlots()}
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
