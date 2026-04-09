/**
 * useGameActions — centralizes all action handlers for InvestigationView.
 *
 * Extracts evidence inspection, witness interaction, Tom chat, verdict flow,
 * save/load, restart, and menu handlers out of the god component.
 *
 * @module hooks/useGameActions
 */

import { useState, useCallback, useEffect } from "react";
import { getEvidenceDetails, resetCase } from "../api/client";
import { getOrCreatePlayerId } from "../utils/playerId";
import type { EvidenceDetails, InvestigationState, Message } from "../types/investigation";
import type { useGameModals } from "./useGameModals";

// ---------- Toast interface (matches InvestigationView's inline toast) ----------

interface Toast {
  setToastMessage: (msg: string | null) => void;
  setToastVariant: (v: "success" | "error" | "info") => void;
}

// ---------- Param interfaces (duck-typed from hook returns) ----------

interface InvestigationSlice {
  state: InvestigationState | null;
  handleEvidenceDiscovered: (ids: string[]) => void;
  restoredMessages: Message[] | null;
}

interface WitnessSlice {
  selectWitness: (id: string) => Promise<void>;
  clearConversation: () => void;
}

interface VerdictSlice {
  reset: () => void;
  confirmConfrontation: () => void;
}

interface BriefingSlice {
  loadBriefing: () => Promise<{ briefing_completed?: boolean } | null>;
  markComplete: () => Promise<void>;
}

interface TomSlice {
  checkAutoComment: (isCritical: boolean) => Promise<Message | null>;
  sendMessage: (msg: string) => Promise<Message>;
}

interface SaveSlotsSlice {
  saveToSlot: (slot: string, state: InvestigationState) => Promise<boolean>;
  loadFromSlot: (slot: string) => Promise<{ case_id: string } | null>;
  refreshSlots: () => Promise<void>;
  error: string | null;
}

export interface UseGameActionsParams {
  caseId: string;
  playerId: string;
  modals: ReturnType<typeof useGameModals>;
  toast: Toast;
  investigation: InvestigationSlice;
  witnesses: WitnessSlice;
  verdict: VerdictSlice;
  briefing: BriefingSlice;
  tom: TomSlice;
  saveSlots: SaveSlotsSlice;
}

export function useGameActions({
  caseId,
  playerId,
  modals,
  toast,
  investigation,
  witnesses,
  verdict,
  briefing,
  tom,
  saveSlots,
}: UseGameActionsParams) {
  // ---- Evidence detail modal state ----
  const [selectedEvidence, setSelectedEvidence] =
    useState<EvidenceDetails | null>(null);
  const [evidenceLoading, setEvidenceLoading] = useState(false);
  const [evidenceError, setEvidenceError] = useState<string | null>(null);

  // ---- Inline messages (Tom ghost voice) ----
  const [inlineMessages, setInlineMessages] = useState<Message[]>([]);

  // ---- Restart loading ----
  const [restartLoading, setRestartLoading] = useState(false);

  // ---- Hints (persisted in localStorage) ----
  const [hintsEnabled, setHintsEnabled] = useState(() =>
    localStorage.getItem("hp-detective-hints-enabled") !== "false",
  );

  // Restore conversation messages on case load
  useEffect(() => {
    if (investigation.restoredMessages) {
      setInlineMessages(investigation.restoredMessages);
    } else {
      setInlineMessages([]);
    }
  }, [investigation.restoredMessages]);

  // Load briefing on mount
  useEffect(() => {
    const initBriefing = async () => {
      const content = await briefing.loadBriefing();
      if (content && !content.briefing_completed) {
        modals.setBriefingModalOpen(true);
      }
    };
    void initBriefing();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Briefing ----
  const handleBriefingComplete = useCallback(async () => {
    await briefing.markComplete();
    modals.setBriefingModalOpen(false);
  }, [briefing, modals]);

  // ---- Tom integration ----
  const handleEvidenceDiscoveredWithTom = useCallback(
    async (evidenceIds: string[]) => {
      investigation.handleEvidenceDiscovered(evidenceIds);
      try {
        const isCritical = evidenceIds.length > 1;
        const tomMessage = await tom.checkAutoComment(isCritical);
        if (tomMessage) {
          setInlineMessages((prev) => [...prev, tomMessage]);
        }
      } catch (error) {
        console.error("Tom auto-comment failed:", error);
      }
    },
    [investigation, tom],
  );

  const handleTomMessage = useCallback(
    async (message: string) => {
      const userMessage: Message = {
        type: "player",
        text: `Tom, ${message}`,
        timestamp: Date.now(),
      };
      setInlineMessages((prev) => [...prev, userMessage]);
      try {
        const tomResponse = await tom.sendMessage(message);
        setInlineMessages((prev) => [...prev, tomResponse]);
      } catch (error) {
        console.error("Tom chat error:", error);
        const errorMessage: Message = {
          type: "tom_ghost",
          text: "Tom seems distracted... he can't respond right now.",
          timestamp: Date.now(),
        };
        setInlineMessages((prev) => [...prev, errorMessage]);
      }
    },
    [tom],
  );

  // ---- Witness ----
  const handleWitnessClick = useCallback(
    async (witnessId: string) => {
      await witnesses.selectWitness(witnessId);
      modals.setWitnessModalOpen(true);
    },
    [witnesses, modals],
  );

  const handleWitnessModalClose = useCallback(() => {
    modals.setWitnessModalOpen(false);
    witnesses.clearConversation();
  }, [witnesses, modals]);

  // ---- Evidence detail ----
  const handleEvidenceClick = useCallback(
    async (evidenceId: string) => {
      setEvidenceLoading(true);
      setEvidenceError(null);
      try {
        const details = await getEvidenceDetails(evidenceId, caseId, playerId);
        setSelectedEvidence(details);
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Failed to load evidence details";
        setEvidenceError(msg);
      } finally {
        setEvidenceLoading(false);
      }
    },
    [caseId, playerId],
  );

  const handleEvidenceModalClose = useCallback(() => {
    setSelectedEvidence(null);
    setEvidenceError(null);
  }, []);

  // ---- Verdict ----
  const handleOpenVerdictModal = useCallback(() => {
    modals.setVerdictModalOpen(true);
  }, [modals]);

  const handleCloseVerdictModal = useCallback(() => {
    modals.setVerdictModalOpen(false);
  }, [modals]);

  const handleVerdictRetry = useCallback(() => {
    verdict.reset();
  }, [verdict]);

  const handleConfrontationClose = useCallback(() => {
    modals.setVerdictModalOpen(false);
    verdict.reset();
  }, [verdict, modals]);

  // ---- Restart ----
  const handleRestartCase = useCallback(async () => {
    setRestartLoading(true);
    try {
      await resetCase(caseId, getOrCreatePlayerId());
      window.location.reload();
    } catch (error) {
      console.error("Error resetting case:", error);
      modals.setShowRestartConfirm(false);
      setRestartLoading(false);
    }
  }, [caseId, modals]);

  // ---- Menu shortcuts ----
  const handleMenuRestart = useCallback(() => {
    modals.setMenuOpen(false);
    modals.setShowRestartConfirm(true);
  }, [modals]);

  const handleMenuSave = useCallback(() => {
    modals.setMenuOpen(false);
    modals.setSaveModalOpen(true);
    void saveSlots.refreshSlots();
  }, [modals, saveSlots]);

  const handleMenuLoad = useCallback(() => {
    modals.setMenuOpen(false);
    modals.setLoadModalOpen(true);
    void saveSlots.refreshSlots();
  }, [modals, saveSlots]);

  const handleMenuSettings = useCallback(() => {
    modals.setMenuOpen(false);
    modals.setSettingsOpen(true);
  }, [modals]);

  // ---- Save/Load ----
  const handleSaveToSlot = useCallback(
    async (slot: string) => {
      if (!investigation.state) {
        toast.setToastVariant("error");
        toast.setToastMessage("No game state to save");
        return;
      }
      const success = await saveSlots.saveToSlot(slot, investigation.state);
      if (success) {
        toast.setToastVariant("success");
        toast.setToastMessage(`Saved to ${slot.replace("_", " ")}`);
        modals.setSaveModalOpen(false);
      } else {
        toast.setToastVariant("error");
        toast.setToastMessage(saveSlots.error ?? "Save failed");
      }
    },
    [investigation.state, saveSlots, toast, modals],
  );

  const handleLoadFromSlotInGame = useCallback(
    async (slot: string) => {
      const loadedState = await saveSlots.loadFromSlot(slot);
      if (loadedState) {
        toast.setToastVariant("success");
        toast.setToastMessage(`Loaded from ${slot.replace("_", " ")}`);
        modals.setLoadModalOpen(false);
        window.location.reload();
      } else {
        toast.setToastVariant("error");
        toast.setToastMessage(saveSlots.error ?? "Load failed");
      }
    },
    [saveSlots, toast, modals],
  );

  // ---- Hints ----
  const handleHintsChange = useCallback((v: boolean) => {
    setHintsEnabled(v);
    localStorage.setItem("hp-detective-hints-enabled", String(v));
  }, []);

  return {
    // Evidence detail state
    selectedEvidence,
    evidenceLoading,
    evidenceError,
    // Inline messages
    inlineMessages,
    // Restart
    restartLoading,
    // Hints
    hintsEnabled,
    handleHintsChange,
    // Handlers
    handleBriefingComplete,
    handleEvidenceDiscoveredWithTom,
    handleTomMessage,
    handleWitnessClick,
    handleWitnessModalClose,
    handleEvidenceClick,
    handleEvidenceModalClose,
    handleOpenVerdictModal,
    handleCloseVerdictModal,
    handleVerdictRetry,
    handleConfrontationClose,
    handleRestartCase,
    handleMenuRestart,
    handleMenuSave,
    handleMenuLoad,
    handleMenuSettings,
    handleSaveToSlot,
    handleLoadFromSlotInGame,
  };
}
