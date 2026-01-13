/**
 * Types for the Phase 1 Investigation API
 *
 * These types match the backend Pydantic models for type-safe
 * communication between frontend and backend.
 *
 * @module types/investigation
 * @since Phase 1
 */

// ============================================
// API Request Types
// ============================================

/**
 * Request payload for the /api/investigate endpoint
 */
export interface InvestigateRequest {
  /** Freeform player action (e.g., "I check under the desk") */
  player_input: string;
  /** Current case ID (defaults to "case_001") */
  case_id?: string;
  /** Current location ID (defaults to "library") */
  location_id?: string;
  /** Player identifier for state tracking (defaults to "default") */
  player_id?: string;
}

/**
 * Request payload for the /api/save endpoint
 */
export interface SaveStateRequest {
  /** Player identifier */
  player_id: string;
  /** Current player state to persist */
  state: InvestigationState;
}

// ============================================
// API Response Types
// ============================================

/**
 * Response from the /api/investigate endpoint
 */
export interface InvestigateResponse {
  /** LLM narrator response (2-4 sentences) */
  narrator_response: string;
  /** Array of newly discovered evidence IDs */
  new_evidence: string[];
  /** Whether the player attempted to examine already-discovered evidence */
  already_discovered: boolean;
}

/**
 * Response from the /api/save endpoint
 */
export interface SaveResponse {
  /** Whether the save was successful */
  success: boolean;
  /** Optional message (error details or confirmation) */
  message?: string;
}

/**
 * Conversation message from backend (for persistence)
 */
export interface ConversationMessage {
  /** Message type */
  type: 'player' | 'narrator' | 'tom';
  /** Message text content */
  text: string;
  /** Unix timestamp in milliseconds */
  timestamp: number;
}

/**
 * Response from the /api/load/{case_id} endpoint
 */
export interface LoadResponse {
  /** Case ID */
  case_id: string;
  /** Current location ID */
  current_location: string;
  /** Array of discovered evidence IDs */
  discovered_evidence: string[];
  /** Array of visited location IDs */
  visited_locations: string[];
  /** Conversation history (Phase 4.4 - persistence) */
  conversation_history?: ConversationMessage[];
}

/**
 * Response from the /api/evidence endpoint
 */
export interface EvidenceResponse {
  /** Case ID */
  case_id: string;
  /** Array of discovered evidence IDs */
  discovered_evidence: string[];
}

/**
 * Full evidence details from /api/evidence/{id}
 */
export interface EvidenceDetails {
  /** Evidence ID */
  id: string;
  /** Display name */
  name: string;
  /** Location where evidence was found */
  location_found: string;
  /** Full description of the evidence */
  description: string;
}

/**
 * Response from the /api/case/{case_id}/location/{location_id} endpoint
 */
export interface LocationResponse {
  /** Location ID */
  id: string;
  /** Display name for the location */
  name: string;
  /** Full description of the location */
  description: string;
  /** Array of always-visible elements in the location */
  surface_elements: string[];
}

// ============================================
// State Types
// ============================================

/**
 * Player investigation state (for persistence)
 */
export interface InvestigationState {
  /** Current case ID */
  case_id: string;
  /** Current location ID */
  current_location: string;
  /** Array of discovered evidence IDs */
  discovered_evidence: string[];
  /** Array of visited location IDs */
  visited_locations: string[];
}

/**
 * Conversation history item for displaying in LocationView
 */
export interface ConversationItem {
  /** Unique ID for React key */
  id: string;
  /** Player's action text */
  action: string;
  /** LLM narrator response */
  response: string;
  /** Evidence discovered during this interaction (if any) */
  evidence_discovered: string[];
  /** Timestamp of the interaction */
  timestamp: Date;
}

// ============================================
// Error Types
// ============================================

/**
 * API error response structure
 */
export interface ApiError {
  /** HTTP status code */
  status: number;
  /** Error message */
  message: string;
  /** Optional error details */
  details?: string;
}

/**
 * Type guard to check if an error is an ApiError
 */
export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    'message' in error
  );
}

// ============================================
// Phase 2: Witness Types
// ============================================

/**
 * Single conversation exchange with a witness
 */
export interface WitnessConversationItem {
  /** Player's question */
  question: string;
  /** Witness response */
  response: string;
  /** ISO timestamp of the exchange */
  timestamp: string;
  /** Trust change from this exchange */
  trust_delta?: number;
}

/**
 * Witness information from GET /api/witness/{id}
 */
export interface WitnessInfo {
  /** Witness identifier */
  id: string;
  /** Display name */
  name: string;
  /** Personality type (empathetic, nervous, etc.) */
  personality?: string;
  /** Current trust level (0-100) */
  trust: number;
  /** Conversation history with this witness */
  conversation_history?: WitnessConversationItem[];
  /** Secrets revealed by this witness */
  secrets_revealed: string[];
}

/**
 * Request payload for POST /api/interrogate
 */
export interface InterrogateRequest {
  /** Witness identifier */
  witness_id: string;
  /** Player's question */
  question: string;
  /** Case identifier */
  case_id?: string;
  /** Player identifier */
  player_id?: string;
}

/**
 * Response from POST /api/interrogate
 */
export interface InterrogateResponse {
  /** Witness response text */
  response: string;
  /** Current trust level (0-100) */
  trust: number;
  /** Trust change from this interaction */
  trust_delta?: number;
  /** Secrets revealed in this response */
  secrets_revealed?: string[];
  /** Maps secret_id to full text description (Phase 4.6) */
  secret_texts?: Record<string, string>;
}

/**
 * Request payload for POST /api/present-evidence
 */
export interface PresentEvidenceRequest {
  /** Witness identifier */
  witness_id: string;
  /** Evidence ID to present */
  evidence_id: string;
  /** Case identifier */
  case_id?: string;
  /** Player identifier */
  player_id?: string;
}

/**
 * Response from POST /api/present-evidence
 */
export interface PresentEvidenceResponse {
  /** Witness response text */
  response: string;
  /** Current trust level (0-100) */
  trust: number;
  /** Trust change from this interaction */
  trust_delta?: number;
  /** Secrets revealed in this response */
  secrets_revealed?: string[];
}

// ============================================
// Phase 3: Verdict Types
// ============================================

/**
 * Individual verdict attempt record
 */
export interface VerdictAttempt {
  /** Suspect ID that was accused */
  accused_suspect_id: string;
  /** Player's reasoning */
  reasoning: string;
  /** Evidence IDs cited */
  evidence_cited: string[];
  /** ISO timestamp of attempt */
  timestamp: string;
  /** Whether this attempt was correct */
  correct: boolean;
  /** Reasoning score (0-100) */
  score: number;
  /** Fallacies detected in reasoning */
  fallacies_detected: string[];
}

/**
 * Logical fallacy detected in reasoning
 */
export interface Fallacy {
  /** Fallacy name (e.g., "Confirmation Bias") */
  name: string;
  /** Description of the fallacy */
  description: string;
  /** Example from player's reasoning (if applicable) */
  example: string;
}

/**
 * Mentor feedback data structure
 */
export interface MentorFeedbackData {
  /** Analysis summary of player's reasoning */
  analysis: string;
  /** List of detected fallacies */
  fallacies_detected: Fallacy[];
  /** Reasoning score (0-100) */
  score: number;
  /** Quality label (excellent, good, fair, poor, failing) */
  quality: string;
  /** Critique of reasoning weaknesses */
  critique: string;
  /** Praise for reasoning strengths */
  praise: string;
  /** Adaptive hint (more specific as attempts decrease) */
  hint: string | null;
}

/**
 * Single line of dialogue in confrontation
 */
export interface DialogueLine {
  /** Speaker identifier (moody, player, suspect name) */
  speaker: string;
  /** Dialogue text */
  text: string;
  /** Emotional tone (defiant, remorseful, broken, angry, resigned) */
  tone?: string;
}

/**
 * Post-verdict confrontation dialogue data
 */
export interface ConfrontationDialogueData {
  /** Array of dialogue exchanges */
  dialogue: DialogueLine[];
  /** Aftermath text describing consequences */
  aftermath: string;
}

/**
 * Request payload for POST /api/submit-verdict
 */
export interface SubmitVerdictRequest {
  /** Case identifier */
  case_id?: string;
  /** Player identifier */
  player_id?: string;
  /** Suspect ID being accused */
  accused_suspect_id: string;
  /** Player's reasoning for accusation */
  reasoning: string;
  /** Evidence IDs the player cites as support */
  evidence_cited: string[];
}

/**
 * Response from POST /api/submit-verdict
 */
export interface SubmitVerdictResponse {
  /** Whether the verdict was correct */
  correct: boolean;
  /** Number of attempts remaining */
  attempts_remaining: number;
  /** Whether the case is now solved */
  case_solved: boolean;
  /** Mentor feedback on the verdict */
  mentor_feedback: MentorFeedbackData;
  /** Confrontation dialogue (only if correct or max attempts reached) */
  confrontation: ConfrontationDialogueData | null;
  /** Reveal message showing correct answer (only if max attempts reached) */
  reveal: string | null;
  /** Pre-written response for accusing wrong suspect */
  wrong_suspect_response: string | null;
}

// ============================================
// Phase 3.5: Briefing Types
// ============================================

/**
 * Single choice option for teaching question
 */
export interface TeachingChoice {
  /** Unique identifier for the choice */
  id: string;
  /** Display text for the choice */
  text: string;
  /** Moody's response when this choice is selected */
  response: string;
}

/**
 * Teaching question with multiple choice answers
 */
export interface TeachingQuestion {
  /** Question prompt text */
  prompt: string;
  /** Array of answer choices */
  choices: TeachingChoice[];
  /** Summary of the concept after answering */
  concept_summary: string;
}

/**
 * Briefing content loaded from case YAML
 */
export interface BriefingContent {
  /** Case identifier */
  case_id: string;
  /** Case assignment text (WHO, WHERE, WHEN, WHAT) */
  case_assignment: string;
  /** Teaching question with multiple choice (Phase 3.6) */
  teaching_question: TeachingQuestion;
  /** Rationality concept being taught (e.g., "base_rates") */
  rationality_concept: string;
  /** Brief description of the concept */
  concept_description: string;
  /** Transition text to display after Q&A (Phase 3.8) */
  transition?: string;
  /** Whether the briefing has been completed (backend-persisted) */
  briefing_completed: boolean;
}

/**
 * Single Q&A exchange in briefing conversation
 */
export interface BriefingConversation {
  /** Player's question */
  question: string;
  /** Moody's answer */
  answer: string;
}

/**
 * Briefing state tracking for persistence
 */
export interface BriefingState {
  /** Case identifier */
  case_id: string;
  /** Whether the briefing has been completed */
  briefing_completed: boolean;
  /** Q&A conversation history */
  conversation_history: BriefingConversation[];
  /** ISO timestamp when briefing was completed */
  completed_at: string | null;
}

/**
 * Response from POST /api/briefing/{case_id}/question
 */
export interface BriefingQuestionResponse {
  /** Moody's answer to the question */
  answer: string;
}

/**
 * Response from POST /api/briefing/{case_id}/complete
 */
export interface BriefingCompleteResponse {
  /** Whether the operation was successful */
  success: boolean;
}

// ============================================
// Phase 4: Tom's Inner Voice Types
// ============================================

/**
 * Tom trigger types for categorizing his messages
 */
export type TomTriggerType =
  | 'helpful'
  | 'misleading'
  | 'self_aware'
  | 'dark_humor'
  | 'emotional';

/**
 * Tom's inner voice trigger from backend
 */
export interface InnerVoiceTrigger {
  /** Unique trigger identifier */
  id: string;
  /** Tom's message text */
  text: string;
  /** Whether message is helpful or misleading */
  type: TomTriggerType;
  /** Evidence tier (1=early, 2=mid, 3=late) */
  tier: 1 | 2 | 3;
}

/**
 * Request payload for POST /api/case/{case_id}/inner-voice/check
 */
export interface InnerVoiceCheckRequest {
  /** Current evidence count */
  evidence_count: number;
}

/**
 * Message types for conversation display
 * Extends existing ConversationItem with inline message support
 * Added timestamp for unified message ordering (Phase 4.1)
 */
export type Message =
  | { type: 'player'; text: string; timestamp?: number }
  | { type: 'narrator'; text: string; timestamp?: number }
  | { type: 'tom_ghost'; text: string; tone?: 'helpful' | 'misleading'; mode?: string; trust_level?: number; timestamp?: number };

// ============================================
// Phase 4.1: Tom LLM Chat Types
// ============================================

/**
 * Response from Tom LLM endpoints (auto-comment and direct chat)
 */
export interface TomResponse {
  /** Tom's message text */
  text: string;
  /** Response mode: 'auto_helpful', 'auto_misleading', 'direct_chat_helpful', etc */
  mode: string;
  /** Current trust level (0-100) */
  trust_level: number;
}

/**
 * Request for Tom auto-comment
 */
export interface TomAutoCommentRequest {
  /** Force Tom to comment (bypasses 30% chance) */
  is_critical?: boolean;
  /** Evidence ID just discovered */
  last_evidence_id?: string;
}

/**
 * Request for direct Tom chat
 */
export interface TomChatRequest {
  /** Player's message to Tom */
  message: string;
}

// ============================================
// Phase 5.2: Location Management Types
// ============================================

/**
 * Location information from GET /api/case/{case_id}/locations
 */
export interface LocationInfo {
  /** Location identifier */
  id: string;
  /** Display name */
  name: string;
  /** Location type (micro, building, area) */
  type: string;
}

/**
 * Request payload for POST /api/case/{case_id}/change-location
 */
export interface ChangeLocationRequest {
  /** Target location ID */
  location_id: string;
  /** Player identifier */
  player_id?: string;
  /** Session identifier */
  session_id?: string;
}

/**
 * Response from POST /api/case/{case_id}/change-location
 */
export interface ChangeLocationResponse {
  /** Whether the location change was successful */
  success: boolean;
  /** New location data */
  location: {
    /** Location ID */
    id: string;
    /** Location name */
    name: string;
    /** Location description */
    description: string;
  };
  /** Status message */
  message?: string;
}

// ============================================
// Phase 5.3: Save/Load System Types
// ============================================

/**
 * Metadata for a single save slot
 * (Returned from /api/case/{case_id}/saves/list)
 */
export interface SaveSlotMetadata {
  /** Slot identifier (slot_1, slot_2, slot_3, autosave, default) */
  slot: string;
  /** Case identifier (e.g., case_001) */
  case_id: string;
  /** ISO timestamp of when save was created */
  timestamp: string;
  /** Current location ID */
  location: string;
  /** Number of evidence items collected */
  evidence_count: number;
  /** Save file version for migration */
  version: string;
}

/**
 * Response from /api/case/{case_id}/saves/list
 */
export interface SaveSlotsListResponse {
  /** Array of save slot metadata */
  saves: SaveSlotMetadata[];
}

/**
 * Enhanced save response with slot information
 */
export interface SaveSlotResponse {
  /** Whether the save was successful */
  success: boolean;
  /** Status message */
  message: string;
  /** Slot that was saved to */
  slot: string;
}

/**
 * Response from DELETE /api/case/{case_id}/saves/{slot}
 */
export interface DeleteSlotResponse {
  /** Whether deletion was successful */
  success: boolean;
  /** Status message */
  message: string;
}

// ============================================
// Phase 5.3.1: Landing Page Types
// ============================================

/**
 * Metadata for a case in the case list
 * Used by LandingPage to display available cases
 */
export interface CaseMetadata {
  /** Case identifier (e.g., "case_001") */
  id: string;
  /** Display name (e.g., "The Restricted Section") */
  name: string;
  /** Difficulty level */
  difficulty: 'Easy' | 'Medium' | 'Hard';
  /** Lock status (future: unlock progression) */
  status: 'locked' | 'unlocked';
  /** Brief case description */
  description: string;
}

/**
 * Response from GET /api/cases endpoint
 * (Future: backend endpoint for case listing)
 */
export interface CaseListResponse {
  /** Array of available cases */
  cases: CaseMetadata[];
}
