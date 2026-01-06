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
  quality: 'excellent' | 'good' | 'fair' | 'poor' | 'failing' | string;
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
  tone?: 'defiant' | 'remorseful' | 'broken' | 'angry' | 'resigned' | string;
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
